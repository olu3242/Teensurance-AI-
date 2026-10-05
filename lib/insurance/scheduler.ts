import {randomUUID} from 'node:crypto';
import {all,put} from '../platform/db';
import {userById} from '../platform/auth';
import {renewalOpportunities} from './renewal';
import {generateInsuranceNotifications} from './notifications';
import {routeDomainCommand} from './runtime';
import type {ScheduledInsuranceTrigger} from './event-chain';

export type RecoverableInsuranceTrigger=ScheduledInsuranceTrigger&{
  attempts?:number;nextAttemptAt?:string;lastError?:string;correlationId?:string;
  status:'SCHEDULED'|'EXECUTED'|'CANCELLED'|'RETRY'|'DEAD_LETTER';
};

const MAX_ATTEMPTS=3;
const backoffMinutes=[5,30,120];

function nextAttempt(now:Date,attempt:number){
  return new Date(now.getTime()+backoffMinutes[Math.min(attempt-1,backoffMinutes.length-1)]*60000).toISOString();
}

export async function executeDueInsuranceTriggers(now=new Date()){
  const triggers=(await all<RecoverableInsuranceTrigger>('insurance_scheduled_trigger'))
    .filter(item=>['SCHEDULED','RETRY'].includes(item.status))
    .filter(item=>Date.parse(item.nextAttemptAt||item.dueAt)<=now.getTime());
  const results=[];
  for(const trigger of triggers){
    const attempts=(trigger.attempts||0)+1;
    const correlationId=trigger.correlationId||randomUUID();
    try{
      const guardian=await userById(trigger.ownerId);
      if(!guardian)throw new Error('Guardian account unavailable.');
      await routeDomainCommand(trigger.ownerId,{action:trigger.action,householdId:trigger.householdId,subjectId:trigger.subjectId,source:'time',metadata:{correlationId,attempt:attempts}});
      const opportunities=await renewalOpportunities(guardian,trigger.householdId,now);
      await generateInsuranceNotifications(guardian,trigger.householdId,now);
      const updated={...trigger,status:'EXECUTED' as const,attempts,correlationId,lastError:undefined,nextAttemptAt:undefined};
      await put('insurance_scheduled_trigger',updated);
      results.push({triggerId:trigger.id,status:'EXECUTED',correlationId,opportunities});
    }catch(error){
      const message=error instanceof Error?error.message:'Scheduled insurance trigger failed.';
      const dead=attempts>=MAX_ATTEMPTS;
      const updated={...trigger,status:dead?'DEAD_LETTER' as const:'RETRY' as const,attempts,correlationId,lastError:message,nextAttemptAt:dead?undefined:nextAttempt(now,attempts)};
      await put('insurance_scheduled_trigger',updated);
      await put('insurance_runtime_failure',{id:randomUUID(),householdId:trigger.householdId,ownerId:trigger.ownerId,triggerId:trigger.id,correlationId,attempt:attempts,status:updated.status,error:message,createdAt:now.toISOString()});
      results.push({triggerId:trigger.id,status:updated.status,correlationId,error:message});
    }
  }
  return results;
}
