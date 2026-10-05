import {randomUUID} from 'node:crypto';
import {all,put} from '../platform/db';
import {AppError} from '../platform/auth';
import type {Member,User} from '../platform/types';
import {insuranceAgentFor,type InsuranceAgentId} from './agents';
import {insuranceTriggerFor} from './triggers';
import {insuranceWorkflowFor,type InsuranceWorkflowState} from './workflows';

export type InsuranceRuntimeCommand={
  action:string;
  householdId:string;
  teenId?:string;
  subjectId?:string;
  source?:'user'|'domain'|'time'|'carrier';
  metadata?:Record<string,string|number|boolean>;
};

export type InsuranceRuntimeTrace={
  id:string;
  householdId:string;
  ownerId:string;
  action:string;
  triggerId:string;
  priority:string;
  workflow:string;
  workflowState:InsuranceWorkflowState;
  agent:InsuranceAgentId;
  decision:'ALLOW'|'DENY'|'REQUIRE_GUARDIAN'|'REQUIRE_CARRIER';
  rationale:string;
  createdAt:string;
};

async function guardian(user:User,householdId:string){
  const member=(await all<Member>('member',householdId)).find(item=>item.ownerId===user.id&&item.active);
  return member?.role==='guardian';
}

export async function routeCarrierCommand(carrierId:string,command:InsuranceRuntimeCommand):Promise<InsuranceRuntimeTrace>{
  if(command.source!=='carrier')throw new AppError('Carrier runtime commands require carrier provenance.',403);
  const trigger=insuranceTriggerFor(command.action);
  const workflow=insuranceWorkflowFor(command.action);
  const trace:InsuranceRuntimeTrace={
    id:randomUUID(),householdId:command.householdId,ownerId:'carrier:'+carrierId,action:command.action,
    triggerId:trigger.id,priority:trigger.priority,workflow:workflow.id,
    workflowState:workflow.terminalActions.includes(command.action)?'COMPLETED':'IN_PROGRESS',
    agent:trigger.agent,decision:'ALLOW',rationale:'Authenticated carrier event entered the insurance runtime.',
    createdAt:new Date().toISOString()
  };
  await put('insurance_runtime_trace',trace);
  return trace;
}

export async function routeDomainCommand(ownerId:string,command:InsuranceRuntimeCommand):Promise<InsuranceRuntimeTrace>{
  if(command.source!=='domain'&&command.source!=='time')throw new AppError('Domain runtime commands require domain or time provenance.',403);
  const forbidden=['quote.request','offer.select','bind.prepare','renewal.reshop','renewal.decide'];
  if(forbidden.includes(command.action))throw new AppError('Automated runtime cannot perform guardian insurance purchase decisions.',403);
  const trigger=insuranceTriggerFor(command.action);
  const workflow=insuranceWorkflowFor(command.action);
  const trace:InsuranceRuntimeTrace={
    id:randomUUID(),householdId:command.householdId,ownerId:'system:'+ownerId,action:command.action,
    triggerId:trigger.id,priority:trigger.priority,workflow:workflow.id,
    workflowState:workflow.terminalActions.includes(command.action)?'COMPLETED':'IN_PROGRESS',
    agent:trigger.agent,decision:'ALLOW',
    rationale:'Governed domain event entered the insurance runtime without assuming a guardian purchase decision.',
    createdAt:new Date().toISOString()
  };
  await put('insurance_runtime_trace',trace);
  return trace;
}

export async function routeInsuranceCommand(user:User,command:InsuranceRuntimeCommand):Promise<InsuranceRuntimeTrace>{
  const trigger=insuranceTriggerFor(command.action);
  const workflow=insuranceWorkflowFor(command.action);
  const agent=insuranceAgentFor(trigger.agent);
  const isGuardian=await guardian(user,command.householdId);

  let decision:InsuranceRuntimeTrace['decision']='ALLOW';
  let rationale='Command is permitted within the insurance orchestration contract.';
  let workflowState:InsuranceWorkflowState='IN_PROGRESS';

  const guardianActions=['quote.request','quote.compare','offer.select','bind.prepare','policy.status.read','value.baseline','value.projected','value.realized','renewal.detect','renewal.reshop','renewal.decide','notification.generate','notification.read','notification.dismiss'];
  if(guardianActions.includes(command.action)&&!isGuardian){
    decision='REQUIRE_GUARDIAN';workflowState='BLOCKED';rationale='This insurance action requires an active guardian household role.';
  }
  if(['carrier.event','policy.active','policy.bound','policy.cancelled','renewal.nonrenewal'].includes(command.action)&&command.source!=='carrier'){
    decision='REQUIRE_CARRIER';workflowState='BLOCKED';rationale='Only a carrier-confirmed event may authoritatively change policy lifecycle state.';
  }

  if(decision==='ALLOW'&&workflow.terminalActions.includes(command.action))workflowState='COMPLETED';
  if(decision!=='ALLOW'&&agent.id!=='GUARD'){
    rationale='GUARD blocked specialist '+agent.id+': '+rationale;
  }

  const trace:InsuranceRuntimeTrace={
    id:randomUUID(),householdId:command.householdId,ownerId:user.id,action:command.action,
    triggerId:trigger.id,priority:trigger.priority,workflow:workflow.id,workflowState,
    agent:decision==='ALLOW'?agent.id:'GUARD',decision,rationale,createdAt:new Date().toISOString()
  };
  await put('insurance_runtime_trace',trace);
  if(decision!=='ALLOW')throw new AppError(rationale,403);
  return trace;
}
