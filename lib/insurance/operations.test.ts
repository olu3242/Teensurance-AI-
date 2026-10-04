import {describe,expect,it,vi} from 'vitest';
const all=vi.fn();const put=vi.fn(async(_k:string,v:unknown)=>v);const requireAdmin=vi.fn();
vi.mock('../platform/db',()=>({all,put}));vi.mock('../platform/admin',()=>({requireAdmin}));
describe('insurance operations',()=>{
 it('summarizes runtime health and dead letters',async()=>{
  all.mockImplementation((kind:string)=>{
   if(kind==='insurance_runtime_trace')return Promise.resolve([{agent:'QUOTE',workflow:'quote_marketplace'}]);
   if(kind==='insurance_runtime_failure')return Promise.resolve([{id:'f',status:'DEAD_LETTER'}]);
   if(kind==='insurance_event_chain')return Promise.resolve([{status:'PARTIAL'}]);
   if(kind==='insurance_scheduled_trigger')return Promise.resolve([{id:'t',status:'DEAD_LETTER'}]);
   return Promise.resolve([]);
  });
  const {insuranceOperations}=await import('./operations');const result=await insuranceOperations({id:'a',name:'A',email:'a@example.com'});
  expect(result.health).toMatchObject({runtimeTraces:1,eventChains:1,deadLetters:1,partialChains:1});
  expect(result.byAgent.QUOTE).toBe(1);
 });
 it('only requeues dead letters',async()=>{
  all.mockResolvedValue([{id:'t',householdId:'h',ownerId:'g',action:'renewal.detect',status:'DEAD_LETTER',attempts:3}]);
  const {replayInsuranceTrigger}=await import('./operations');const result=await replayInsuranceTrigger({id:'a',name:'A',email:'a@example.com'},'t');
  expect(result.status).toBe('RETRY');expect(result.attempts).toBe(0);
 });
});
