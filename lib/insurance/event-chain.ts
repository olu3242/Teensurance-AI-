import {randomUUID} from 'node:crypto';
import {all,put} from '../platform/db';
import {userById} from '../platform/auth';
import type {User} from '../platform/types';
import type {CarrierEvent,PolicyRecord,BindHandoff} from './bind';
import {realizedSavings} from './value';
import {generateInsuranceNotifications} from './notifications';
import {routeCarrierCommand,routeInsuranceCommand} from './runtime';

export type ChainStepState='COMPLETED'|'SKIPPED'|'FAILED';

export type InsuranceChainStep={
  name:'policy_runtime'|'realized_value'|'notifications'|'renewal_schedule';
  state:ChainStepState;
  detail:string;
};

export type InsuranceEventChain={
  id:string;
  householdId:string;
  ownerId:string;
  sourceEventId:string;
  carrierId:string;
  eventType:CarrierEvent['type'];
  status:'COMPLETED'|'PARTIAL'|'FAILED';
  steps:InsuranceChainStep[];
  createdAt:string;
  updatedAt:string;
};

export type ScheduledInsuranceTrigger={
  id:string;
  householdId:string;
  ownerId:string;
  action:'renewal.detect';
  subjectId:string;
  dueAt:string;
  sourceEventId:string;
  status:'SCHEDULED'|'EXECUTED'|'CANCELLED';
  createdAt:string;
};

function renewalTriggerAt(renewalAt:string){
  return new Date(Date.parse(renewalAt)-60*86400000).toISOString();
}

async function guardianUser(ownerId:string):Promise<User|undefined>{
  return userById(ownerId);
}

export async function processCarrierEventChain(
  event:CarrierEvent,
  context:{handoff?:BindHandoff;policy?:PolicyRecord}
):Promise<InsuranceEventChain>{
  const householdId=context.handoff?.householdId||context.policy?.householdId;
  const ownerId=context.policy?.ownerId||context.handoff?.ownerId;
  if(!householdId||!ownerId)throw new Error('Carrier event chain requires household and guardian ownership context.');

  const existing=(await all<InsuranceEventChain>('insurance_event_chain',householdId))
    .find(item=>item.sourceEventId===event.eventId&&item.carrierId===event.carrierId);
  if(existing)return existing;

  const createdAt=new Date().toISOString();
  const steps:InsuranceChainStep[]=[];

  try{
    const action=event.type==='policy.active'?'policy.active':
      event.type==='policy.bound'?'policy.bound':
      event.type==='policy.cancelled'?'policy.cancelled':
      event.type==='application.declined'?'application.declined':
      event.type==='application.failed'?'application.failed':'carrier.event';
    await routeCarrierCommand(event.carrierId,{action,householdId,source:'carrier',subjectId:event.externalReference});
    steps.push({name:'policy_runtime',state:'COMPLETED',detail:'Carrier event entered the governed insurance runtime.'});
  }catch(error){
    steps.push({name:'policy_runtime',state:'FAILED',detail:error instanceof Error?error.message:'Carrier runtime routing failed.'});
  }

  const guardian=await guardianUser(ownerId);
  if(event.type==='policy.active'&&context.policy&&guardian){
    try{
      await routeInsuranceCommand(guardian,{action:'value.realized',householdId,teenId:context.policy.teenId,source:'domain',subjectId:context.policy.id});
      await realizedSavings(guardian,householdId,context.policy.id);
      steps.push({name:'realized_value',state:'COMPLETED',detail:'SAVE created carrier-confirmed realized value evidence.'});
    }catch(error){
      steps.push({name:'realized_value',state:'SKIPPED',detail:error instanceof Error?error.message:'Realized value evidence was not available.'});
    }
  }else{
    steps.push({name:'realized_value',state:'SKIPPED',detail:'Realized value runs only after carrier-confirmed activation with guardian context.'});
  }

  if(guardian){
    try{
      await routeInsuranceCommand(guardian,{action:'notification.generate',householdId,source:'domain',subjectId:context.policy?.id||context.handoff?.id});
      const notices=await generateInsuranceNotifications(guardian,householdId);
      steps.push({name:'notifications',state:'COMPLETED',detail:`SIGNAL generated ${notices.created.length} new notification(s); dedupe suppressed ${notices.suppressed}.`});
    }catch(error){
      steps.push({name:'notifications',state:'FAILED',detail:error instanceof Error?error.message:'Notification generation failed.'});
    }
  }else{
    steps.push({name:'notifications',state:'SKIPPED',detail:'Guardian account context was unavailable.'});
  }

  if(event.renewalAt&&context.policy){
    const existingTrigger=(await all<ScheduledInsuranceTrigger>('insurance_scheduled_trigger',householdId))
      .find(item=>item.sourceEventId===event.eventId&&item.action==='renewal.detect');
    if(!existingTrigger){
      const trigger:ScheduledInsuranceTrigger={
        id:randomUUID(),householdId,ownerId,action:'renewal.detect',subjectId:context.policy.id,
        dueAt:renewalTriggerAt(event.renewalAt),sourceEventId:event.eventId,status:'SCHEDULED',createdAt
      };
      await put('insurance_scheduled_trigger',trigger);
    }
    steps.push({name:'renewal_schedule',state:'COMPLETED',detail:'RENEW scheduled a renewal-detection trigger 60 days before the carrier renewal date.'});
  }else{
    steps.push({name:'renewal_schedule',state:'SKIPPED',detail:'Carrier event did not include a renewal date.'});
  }

  const failures=steps.filter(step=>step.state==='FAILED').length;
  const completed=steps.filter(step=>step.state==='COMPLETED').length;
  const chain:InsuranceEventChain={
    id:randomUUID(),householdId,ownerId,sourceEventId:event.eventId,carrierId:event.carrierId,eventType:event.type,
    status:failures===0?'COMPLETED':completed>0?'PARTIAL':'FAILED',steps,createdAt,updatedAt:new Date().toISOString()
  };
  await put('insurance_event_chain',chain);
  return chain;
}
