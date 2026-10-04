import {all,put} from '../platform/db';
import {userById} from '../platform/auth';
import {renewalOpportunities} from './renewal';
import {routeDomainCommand} from './runtime';
import type {ScheduledInsuranceTrigger} from './event-chain';

export async function executeDueInsuranceTriggers(now=new Date()){
  const triggers=(await all<ScheduledInsuranceTrigger>('insurance_scheduled_trigger'))
    .filter(item=>item.status==='SCHEDULED'&&Date.parse(item.dueAt)<=now.getTime());
  const results=[];
  for(const trigger of triggers){
    const guardian=await userById(trigger.ownerId);
    if(!guardian){results.push({triggerId:trigger.id,status:'SKIPPED',reason:'Guardian account unavailable.'});continue}
    await routeDomainCommand(trigger.ownerId,{action:trigger.action,householdId:trigger.householdId,subjectId:trigger.subjectId,source:'time'});
    const opportunities=await renewalOpportunities(guardian,trigger.householdId,now);
    const updated={...trigger,status:'EXECUTED' as const};
    await put('insurance_scheduled_trigger',updated);
    results.push({triggerId:trigger.id,status:'EXECUTED',opportunities});
  }
  return results;
}
