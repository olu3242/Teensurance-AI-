import {describe,expect,it,vi} from 'vitest';

const all=vi.fn();
const put=vi.fn(async(_kind:string,value:unknown)=>value);
const userById=vi.fn();
vi.mock('../platform/db',()=>({all,put}));
vi.mock('../platform/auth',()=>({userById,AppError:class AppError extends Error{status:number;constructor(message:string,status:number){super(message);this.status=status}}}));
vi.mock('./value',()=>({realizedSavings:vi.fn(async()=>({id:'s'}))}));
vi.mock('./notifications',()=>({generateInsuranceNotifications:vi.fn(async()=>({created:[{id:'n'}],notifications:[],suppressed:0}))}));
vi.mock('./runtime',()=>({routeCarrierCommand:vi.fn(async()=>({id:'carrier-trace'})),routeDomainCommand:vi.fn(async()=>({id:'domain-trace'}))}));

describe('insurance event chain',()=>{
  it('chains active carrier policy into value, signal, and renewal schedule',async()=>{
    all.mockImplementation((kind:string)=>{
      if(kind==='insurance_event_chain'||kind==='insurance_scheduled_trigger')return Promise.resolve([]);
      return Promise.resolve([]);
    });
    userById.mockResolvedValue({id:'g',name:'Guardian',email:'g@example.com'});
    const {processCarrierEventChain}=await import('./event-chain');
    const chain=await processCarrierEventChain(
      {eventId:'evt1',carrierId:'c',externalReference:'ext',type:'policy.active',occurredAt:'2026-10-04T00:00:00Z',externalPolicyId:'p',renewalAt:'2027-04-04T00:00:00Z'},
      {handoff:{id:'h1',householdId:'hh',ownerId:'g',teenId:'t',selectionId:'s',carrierId:'c',quoteId:'q',state:'ACTIVE',externalReference:'ext',createdAt:'x',updatedAt:'x'},policy:{id:'p1',householdId:'hh',ownerId:'g',teenId:'t',handoffId:'h1',carrierId:'c',externalPolicyId:'p',status:'ACTIVE',confirmedAt:'x'}}
    );
    expect(chain.status).toBe('COMPLETED');
    expect(chain.steps.map(step=>step.name)).toEqual(['policy_runtime','realized_value','notifications','renewal_schedule']);
    expect(put).toHaveBeenCalledWith('insurance_scheduled_trigger',expect.objectContaining({action:'renewal.detect',status:'SCHEDULED'}));
  });
});
