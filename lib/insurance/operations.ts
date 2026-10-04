import {all,put} from '../platform/db';
import {requireAdmin} from '../platform/admin';
import type {User} from '../platform/types';
import type {InsuranceRuntimeTrace} from './runtime';
import type {InsuranceEventChain,ScheduledInsuranceTrigger} from './event-chain';

type Failure={id:string;householdId:string;ownerId:string;triggerId:string;correlationId:string;attempt:number;status:'RETRY'|'DEAD_LETTER';error:string;createdAt:string};

export async function insuranceOperations(user:User){
  requireAdmin(user);
  const traces=await all<InsuranceRuntimeTrace>('insurance_runtime_trace');
  const failures=await all<Failure>('insurance_runtime_failure');
  const chains=await all<InsuranceEventChain>('insurance_event_chain');
  const triggers=await all<(ScheduledInsuranceTrigger&{attempts?:number;nextAttemptAt?:string;lastError?:string;correlationId?:string;status:'SCHEDULED'|'EXECUTED'|'CANCELLED'|'RETRY'|'DEAD_LETTER'})>('insurance_scheduled_trigger');
  const byAgent=Object.fromEntries([...new Set(traces.map(t=>t.agent))].map(agent=>[agent,traces.filter(t=>t.agent===agent).length]));
  const byWorkflow=Object.fromEntries([...new Set(traces.map(t=>t.workflow))].map(workflow=>[workflow,traces.filter(t=>t.workflow===workflow).length]));
  return {
    health:{
      runtimeTraces:traces.length,
      eventChains:chains.length,
      scheduled:triggers.filter(t=>t.status==='SCHEDULED').length,
      retries:triggers.filter(t=>t.status==='RETRY').length,
      deadLetters:triggers.filter(t=>t.status==='DEAD_LETTER').length,
      partialChains:chains.filter(c=>c.status==='PARTIAL'||c.status==='FAILED').length
    },
    byAgent,byWorkflow,
    recentTraces:traces.slice(-50).reverse(),
    failures:failures.slice(-50).reverse(),
    deadLetters:triggers.filter(t=>t.status==='DEAD_LETTER').slice(-50).reverse(),
    chains:chains.slice(-30).reverse()
  };
}

export async function replayInsuranceTrigger(user:User,triggerId:string){
  requireAdmin(user);
  const trigger=(await all<(ScheduledInsuranceTrigger&{attempts?:number;lastError?:string;correlationId?:string;status:string})>('insurance_scheduled_trigger')).find(t=>t.id===triggerId);
  if(!trigger)throw new Error('Insurance trigger not found.');
  if(trigger.status!=='DEAD_LETTER')throw new Error('Only dead-letter triggers can be replayed.');
  const updated={...trigger,status:'RETRY' as const,attempts:0,nextAttemptAt:new Date().toISOString(),lastError:undefined};
  await put('insurance_scheduled_trigger',updated);
  return updated;
}
