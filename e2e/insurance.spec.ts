import {test,expect,type Browser,type BrowserContext} from '@playwright/test';
import type {CarrierQuoteResult} from '../lib/insurance/types';

type WorkspaceCreateResponse={result:{id:string}};
type InviteResponse={result:{token:string}};
type WorkspaceResponse={user:{id:string}};
type QuoteResponse={session:{id:string;results:CarrierQuoteResult[]}};
type SelectionResponse={selection:{id:string}};
type BindResponse={handoff:{state:string}};
type InsuranceStatusResponse={policies:unknown[]};
type SavingsResponse={savings:{kind:'projected'|'realized'}};
type ValueDashboardResponse={teens:Array<{projectedAnnualizedValueCents?:number}>};
type NotificationsResponse={created:unknown[];notifications:unknown[]};

async function register(ctx:BrowserContext,name:string,email:string){
  const r=await ctx.request.post('/api/auth',{headers:{origin:'http://127.0.0.1:3100'},data:{action:'register',email,password:'Certification-password-123',name}});
  expect(r.status()).toBe(200);
}
async function workspace(ctx:BrowserContext,payload:unknown){
  return ctx.request.post('/api/workspace',{headers:{origin:'http://127.0.0.1:3100','idempotency-key':crypto.randomUUID()},data:payload});
}
async function setup(browser:Browser){
  const guardian=await browser.newContext();
  const teen=await browser.newContext();
  const stamp=Date.now();
  await register(guardian,'Guardian','insurance-g-'+stamp+'@example.test');
  const created=await (await workspace(guardian,{action:'household.create',name:'Insurance household',adultAttestation:true})).json() as WorkspaceCreateResponse;
  const householdId=created.result.id;
  const invitation=await (await workspace(guardian,{action:'invite.create',householdId,role:'teen'})).json() as InviteResponse;
  await register(teen,'Teen','insurance-t-'+stamp+'@example.test');
  await workspace(teen,{action:'invite.accept',token:invitation.result.token});
  const ws=await (await teen.request.get('/api/workspace')).json() as WorkspaceResponse;
  const teenId=ws.user.id;
  await workspace(teen,{action:'profile.save',householdId,teenId,name:'Teen',birthDate:'2010-01-01',jurisdiction:'TX',stage:'permit',goalMinutes:1800,permitDate:'2026-01-01',suspensionDays:0});
  await workspace(guardian,{action:'consent.set',householdId,teenId,granted:true});
  return {guardian,teen,householdId,teenId};
}

test('guardian quote -> compare -> certification bind handoff preserves carrier activation boundary',async({browser})=>{
  const {guardian,teen,householdId,teenId}=await setup(browser);
  const quote=await guardian.request.post('/api/insurance/quotes',{headers:{origin:'http://127.0.0.1:3100','idempotency-key':crypto.randomUUID()},data:{householdId,teenId,intent:'compare_current',coverageLevel:'standard',vehicles:[{year:2025,make:'Honda',model:'Civic',primaryUse:'school'}],currentPolicy:{carrierName:'Current Carrier',teenAlreadyListed:false},shareReadinessEvidence:false}});
  expect(quote.status()).toBe(201);
  const {session}=await quote.json() as QuoteResponse;
  const certification=session.results.find(result=>result.status==='quoted'&&result.carrierId==='certification-carrier');
  const sandbox=session.results.find(result=>result.status==='quoted'&&result.carrierId==='sandbox-alpha');
  expect(certification?.status).toBe('quoted');
  expect(sandbox?.status).toBe('quoted');
  if(!certification||certification.status!=='quoted'||!sandbox||sandbox.status!=='quoted')throw new Error('Expected certification and sandbox quotes.');

  const sandboxSelection=await guardian.request.post('/api/insurance/offers',{headers:{origin:'http://127.0.0.1:3100'},data:{householdId,sessionId:session.id,quoteId:sandbox.quote.quoteId,disclosuresAcknowledged:true}});
  expect(sandboxSelection.status()).toBe(201);
  const sandboxSelectionBody=await sandboxSelection.json() as SelectionResponse;
  const sandboxBind=await guardian.request.post('/api/insurance/bind',{headers:{origin:'http://127.0.0.1:3100'},data:{householdId,selectionId:sandboxSelectionBody.selection.id}});
  expect(sandboxBind.status()).toBe(409);

  const selected=await guardian.request.post('/api/insurance/offers',{headers:{origin:'http://127.0.0.1:3100'},data:{householdId,sessionId:session.id,quoteId:certification.quote.quoteId,disclosuresAcknowledged:true}});
  expect(selected.status()).toBe(201);
  const selection=(await selected.json() as SelectionResponse).selection;
  expect((await teen.request.post('/api/insurance/bind',{headers:{origin:'http://127.0.0.1:3100'},data:{householdId,selectionId:selection.id}})).status()).toBe(403);

  const bind=await guardian.request.post('/api/insurance/bind',{headers:{origin:'http://127.0.0.1:3100'},data:{householdId,selectionId:selection.id}});
  expect(bind.status()).toBe(201);
  const handoff=(await bind.json() as BindResponse).handoff;
  expect(handoff.state).toBe('HANDOFF_READY');

  const status=await (await guardian.request.get('/api/insurance/bind?householdId='+householdId)).json() as InsuranceStatusResponse;
  expect(status.policies).toHaveLength(0);
  await guardian.close();await teen.close();
});

test('value evidence and notification generation stay guardian-only and deduplicated',async({browser})=>{
  const {guardian,teen,householdId,teenId}=await setup(browser);
  const baseline=await guardian.request.post('/api/insurance/value',{headers:{origin:'http://127.0.0.1:3100'},data:{action:'baseline',householdId,teenId,amountCents:30000,period:'monthly',referenceId:'cert-current-policy'}});
  expect(baseline.status()).toBe(201);

  const quote=await guardian.request.post('/api/insurance/quotes',{headers:{origin:'http://127.0.0.1:3100','idempotency-key':crypto.randomUUID()},data:{householdId,teenId,intent:'compare_current',coverageLevel:'standard',vehicles:[{year:2025,make:'Honda',model:'Civic',primaryUse:'school'}],currentPolicy:{carrierName:'Current Carrier',teenAlreadyListed:false},shareReadinessEvidence:false}});
  const {session}=await quote.json() as QuoteResponse;
  const offer=session.results.find(result=>result.status==='quoted'&&result.carrierId==='certification-carrier');
  if(!offer||offer.status!=='quoted')throw new Error('Expected certification quote.');

  const projected=await guardian.request.post('/api/insurance/value',{headers:{origin:'http://127.0.0.1:3100'},data:{action:'projected',householdId,teenId,quoteSessionId:session.id,quoteId:offer.quote.quoteId}});
  expect(projected.status()).toBe(200);
  expect((await projected.json() as SavingsResponse).savings.kind).toBe('projected');

  expect((await teen.request.get('/api/insurance/value-dashboard?householdId='+householdId)).status()).toBe(403);
  const value=await (await guardian.request.get('/api/insurance/value-dashboard?householdId='+householdId)).json() as ValueDashboardResponse;
  expect(value.teens[0]?.projectedAnnualizedValueCents).toBeGreaterThan(0);

  const first=await (await guardian.request.get('/api/insurance/notifications?householdId='+householdId)).json() as NotificationsResponse;
  const second=await (await guardian.request.get('/api/insurance/notifications?householdId='+householdId)).json() as NotificationsResponse;
  expect(second.created).toHaveLength(0);
  expect(second.notifications.length).toBe(first.notifications.length);
  await guardian.close();await teen.close();
});
