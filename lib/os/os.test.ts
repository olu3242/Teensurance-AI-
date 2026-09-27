import {describe,expect,it} from 'vitest';
import {initialState} from '../domain';
import {agentFor} from './agents';
import {buildContext} from './context';
import {orchestrate} from './orchestrator';
import {resolveTrigger} from './triggers';\nimport {notificationPolicy} from './notifications';\nimport {operationalInbox} from './reviews';
import {workflowRegistry} from './workflows';

const teen={role:'teen' as const,drivingState:'parked' as const};

describe('Teensurance Workflow OS',()=>{
 it('requires teen consent before journey-data mutation',()=>{
  const state=initialState();
  const blocked=orchestrate(state,{action:'plan',role:'teen',drivingState:'parked',skill:'Turns',objective:'Scan',supervisor:'Adult'});
  expect(blocked.policy.decision).toBe('REQUIRE_CONSENT');
  orchestrate(state,{action:'consent_teen',role:'teen',drivingState:'parked'});
  expect(state.consent.teenAcknowledged).toBe(true);
  expect(orchestrate(state,{action:'plan',role:'teen',drivingState:'parked',skill:'Turns',objective:'Scan',supervisor:'Adult'}).policy.decision).toBe('ALLOW');
 });
 it('routes requirement sources to human review rather than auto-verifying them',()=>{
  const state=initialState();
  const result=orchestrate(state,{action:'requirement_source',role:'parent',drivingState:'parked',jurisdiction:'Example',url:'https://example.gov/rules',title:'Official driver rules'});
  expect(result.policy.decision).toBe('REQUIRES_HUMAN_REVIEW');
  expect(state.requirementSources).toHaveLength(0);
 });
 it('defers notifications while driving and suppresses unconsented delivery',()=>{
  const state=initialState();
  expect(notificationPolicy(state,'driving',{kind:'reflection',recipient:'teen',reason:'Reflect'}).status).toBe('deferred');
  expect(notificationPolicy(state,'parked',{kind:'reflection',recipient:'teen',reason:'Reflect'}).status).toBe('suppressed');
 });
 it('projects the human review and exception inbox',()=>{
  const state=initialState();state.reviewQueue.push({id:'r',kind:'safety',status:'open',reason:'Review',createdAt:'x'});
  expect(operationalInbox(state).openReviews).toHaveLength(1);
 });
 it('uses GUARD as P0 and blocks every state mutation while driving',()=>{
  const state=initialState();
  const result=orchestrate(state,{action:'plan',role:'teen',drivingState:'driving',skill:'Turns',objective:'Scan intersections',supervisor:'Adult'});
  expect(result.policy.decision).toBe('DEFER');
  expect(result.trace).toMatchObject({priority:'P0',agent:'GUARD',workflowState:'DEFERRED'});
  expect(state.activePlan).toBeUndefined();
  expect(state.events).toHaveLength(0);
 });
 it('routes commands through specialist agents and emits domain events',()=>{
  const state=initialState();
  state.consent.teenAcknowledged=true;\n  const result=orchestrate(state,{action:'plan',...teen,skill:'Turns',objective:'Scan intersections',supervisor:'Adult'});
  expect(result.trace.agent).toBe('CRUZE');
  expect(result.trace.events).toEqual(['practice.plan.created']);
  expect(state.events[0].type).toBe('practice.plan.created');
 });
 it('is idempotent for retried commands',()=>{
  const state=initialState();const requestId='8b75b7ea-8f2c-4e7f-96bb-5c28a60e2ac7';
  state.consent.teenAcknowledged=true;\n  const command={action:'plan' as const,...teen,requestId,skill:'Parking',objective:'Reference points',supervisor:'Adult'};
  orchestrate(state,command);const count=state.events.length;const again=orchestrate(state,command);
  expect(again.duplicate).toBe(true);expect(state.events).toHaveLength(count);
 });
 it('makes supervisor verification an evidence-producing workflow',()=>{
  const state=initialState();
  state.consent.teenAcknowledged=true;state.consent.guardianAcknowledged=true;\n  const logged=orchestrate(state,{action:'log',...teen,date:'2026-09-01',minutes:30,night:false,skill:'Turns',supervisor:'Adult',note:''});
  const id=logged.state.logs[0].id;
  const verified=orchestrate(state,{action:'verify',role:'parent',drivingState:'parked',id});
  expect(verified.trace).toMatchObject({workflow:'verification',agent:'MILES'});
  expect(state.logs[0].status).toBe('verified');
  expect(state.evidence[0].kind).toBe('supervisor_verification');
 });
 it('keeps jurisdiction selection non-authoritative',()=>{
  const state=initialState();
  const result=orchestrate(state,{action:'jurisdiction',role:'parent',drivingState:'parked',name:'Example jurisdiction'});
  expect(result.policy.decision).toBe('ALLOW');
  expect(state.jurisdiction).toEqual({name:'Example jurisdiction',status:'unverified'});
  expect(buildContext(state).jurisdiction.status).toBe('unverified');
 });
 it('does not let agent contracts bypass driving safety',()=>{
  for(const id of ['T','VIBE','READY','ACE','MILES','CRUZE','GO','COVER'] as const)expect(agentFor(id).prohibitedWhileDriving).toBe(true);
 });
 it('has a versioned registry with no direct unknown workflow',()=>{
  expect(workflowRegistry.length).toBeGreaterThanOrEqual(8);
  expect(workflowRegistry.every(w=>w.version>=1)).toBe(true);
 });
 it('prioritizes safety trigger over normal user trigger',()=>{
  const state=initialState();
  const trigger=resolveTrigger(state,{action:'log',role:'teen',drivingState:'driving'});
  expect(trigger).toMatchObject({priority:'P0',agent:'GUARD'});
 });
});
