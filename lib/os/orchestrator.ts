import {randomUUID} from 'node:crypto';
import {guard,type State} from '@/lib/domain';
import {agentFor} from './agents';
import {resolveTrigger} from './triggers';
import {workflowForAction} from './workflows';
import type {DomainEvent,OrchestrationCommand,OrchestrationResult,WorkflowState} from './types';

function workflowState(state:State,action:string,decision:string):WorkflowState{
 if(decision==='DEFER')return'DEFERRED';
 if(decision==='REQUIRE_PARENT')return'REQUIRES_PARENT';
 if(decision==='REQUIRE_OFFICIAL_SOURCE')return'REQUIRES_OFFICIAL_SOURCE';
 if(decision!=='ALLOW')return'BLOCKED';
 if(action==='dispute')return'DISPUTED';
 if(['verify','correct'].includes(action))return'AWAITING_VERIFICATION';
 if(action==='log')return'AWAITING_VERIFICATION';
 if(action==='reflect')return'COMPLETED';
 return'IN_PROGRESS';
}

function apply(state:State,command:OrchestrationCommand,now:string):DomainEvent[]{
 const events:DomainEvent[]=[];
 if(command.action==='plan'){
  state.activePlan={id:randomUUID(),skill:String(command.skill),objective:String(command.objective),supervisor:String(command.supervisor),createdAt:now};
  events.push({type:'practice.plan.created',subjectId:state.activePlan.id});
 }
 if(command.action==='safety'){
  const topic=command.topic as State['safetyChecks'][number]['topic'];
  state.safetyChecks=state.safetyChecks.filter(x=>x.topic!==topic);state.safetyChecks.push({topic,completedBy:command.role,completedAt:now});
  events.push({type:'safety.setup.updated',metadata:{topic}});
 }
 if(command.action==='log'){
  const id=randomUUID();state.logs.unshift({id,date:String(command.date),minutes:Number(command.minutes),night:Boolean(command.night),skill:String(command.skill),supervisor:String(command.supervisor),note:String(command.note??''),status:'pending',createdAt:now});
  if(state.activePlan)state.activePlan.completedAt=now;events.push({type:'drive.logged',subjectId:id});
 }
 if(command.action==='reflect'){
  const logId=String(command.logId);state.reflections=state.reflections.filter(x=>x.logId!==logId);state.reflections.unshift({logId,confidence:command.confidence as State['reflections'][number]['confidence'],challenge:String(command.challenge??''),nextFocus:String(command.nextFocus),createdAt:now});
  events.push({type:'reflection.completed',subjectId:logId});
 }
 if(command.action==='verify'){
  const log=state.logs.find(x=>x.id===command.id)!;log.status='verified';log.verifiedAt=now;log.reviewedBy='parent';
  state.evidence.unshift({id:randomUUID(),kind:'supervisor_verification',subjectId:log.id,actor:'parent',createdAt:now,summary:'Parent verified the supervised practice entry.'});events.push({type:'drive.verified',subjectId:log.id});
 }
 if(command.action==='correct'){
  const log=state.logs.find(x=>x.id===command.id)!;const before={minutes:log.minutes,night:log.night,skill:log.skill,supervisor:log.supervisor,note:log.note};
  log.minutes=Number(command.minutes);log.status='pending';delete log.verifiedAt;delete log.reviewedBy;
  const after={minutes:log.minutes,night:log.night,skill:log.skill,supervisor:log.supervisor,note:log.note};
  state.corrections.unshift({id:randomUUID(),logId:log.id,actor:'parent',reason:String(command.reason),createdAt:now,before,after});
  state.evidence.unshift({id:randomUUID(),kind:'supervisor_correction',subjectId:log.id,actor:'parent',createdAt:now,summary:String(command.reason)});events.push({type:'drive.corrected',subjectId:log.id});
 }
 if(command.action==='dispute'){
  const log=state.logs.find(x=>x.id===command.id)!;log.status='disputed';log.disputedAt=now;log.disputeReason=String(command.reason);delete log.verifiedAt;delete log.reviewedBy;
  state.evidence.unshift({id:randomUUID(),kind:'supervisor_dispute',subjectId:log.id,actor:'parent',createdAt:now,summary:String(command.reason)});events.push({type:'drive.disputed',subjectId:log.id});
 }
 if(command.action==='jurisdiction'){state.jurisdiction={name:String(command.name),status:'unverified'};events.push({type:'jurisdiction.selected'});}
 if(command.action==='cover'){const item=String(command.item) as keyof State['cover'];if(item in state.cover)state.cover[item]=Boolean(command.complete);events.push({type:'coverage.preparation.updated'});}
 if(command.action==='goal'){state.goalHours=Number(command.hours);events.push({type:'family.goal.updated'});}
 return events;
}

export function orchestrate(state:State,command:OrchestrationCommand):OrchestrationResult{
 const trigger=resolveTrigger(state,command);const workflow=workflowForAction(command.action);const agent=agentFor(trigger.agent);
 const pre=guard(command.action,command.role,command.drivingState,state,command);
 const now=new Date().toISOString();
 state.audit.unshift({id:randomUUID(),at:now,action:command.action,actor:command.role,drivingState:command.drivingState,decision:pre.decision,reason:pre.reason});if(state.audit.length>300)state.audit.length=300;
 if(pre.decision!=='ALLOW')return{policy:pre,state,trace:{trigger:trigger.id,priority:trigger.priority,workflow:workflow.id,workflowState:workflowState(state,command.action,pre.decision),agent:agent.id,preGuard:pre.decision,postGuard:pre.decision,events:[]}};
 if(command.requestId&&state.processedRequestIds.includes(command.requestId))return{policy:{decision:'ALLOW',reason:'This request was already processed. No duplicate mutation was created.'},state,duplicate:true,trace:{trigger:trigger.id,priority:trigger.priority,workflow:workflow.id,workflowState:'COMPLETED',agent:agent.id,preGuard:'ALLOW',postGuard:'ALLOW',events:[]}};
 const events=apply(state,command,now);
 if(command.requestId){state.processedRequestIds.push(command.requestId);if(state.processedRequestIds.length>300)state.processedRequestIds.shift();}
 for(const event of events){state.events.unshift({id:randomUUID(),type:event.type,at:now,actor:command.role,subjectId:event.subjectId,metadata:event.metadata});}
 if(state.events.length>500)state.events.length=500;
 return{policy:pre,state,trace:{trigger:trigger.id,priority:trigger.priority,workflow:workflow.id,workflowState:workflowState(state,command.action,'ALLOW'),agent:agent.id,preGuard:'ALLOW',postGuard:'ALLOW',events:events.map(e=>e.type)}};
}
