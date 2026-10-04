import {beforeEach,describe,expect,it,vi} from 'vitest';

const all=vi.fn();
const put=vi.fn(async (_kind:string,value:unknown)=>value);
const transaction=vi.fn(async (fn:()=>unknown)=>fn());
const audit=vi.fn();

vi.mock('../platform/db',()=>({all,put,transaction}));
vi.mock('../platform/service',()=>({audit}));

const user={id:'guardian-1',name:'Guardian',email:'guardian@example.com'};
const selection={
  id:'selection-1',
  householdId:'household-1',
  ownerId:'guardian-1',
  teenId:'teen-1',
  sessionId:'session-1',
  carrierId:'carrier-real',
  quoteId:'quote-1',
  selectedAt:'2026-10-04T12:00:00.000Z',
  disclosureAcknowledgedAt:'2026-10-04T12:00:00.000Z',
  status:'selected' as const,
  bindHandoff:{allowed:true,reason:'carrier'}
};

const handoff={
  id:'handoff-1',
  householdId:'household-1',
  ownerId:'guardian-1',
  teenId:'teen-1',
  selectionId:'selection-1',
  carrierId:'carrier-real',
  quoteId:'quote-1',
  state:'HANDOFF_STARTED' as const,
  externalReference:'external-1',
  createdAt:'2026-10-04T12:01:00.000Z',
  updatedAt:'2026-10-04T12:01:00.000Z'
};

describe('insurance bind handoff',()=>{
  beforeEach(()=>{
    vi.clearAllMocks();
    all.mockImplementation((kind:string)=>{
      if(kind==='member')return Promise.resolve([{id:'m1',householdId:'household-1',ownerId:'guardian-1',role:'guardian',name:'Guardian',active:true}]);
      if(kind==='insurance_offer_selection')return Promise.resolve([selection]);
      if(kind==='insurance_bind_handoff')return Promise.resolve([]);
      if(kind==='insurance_carrier_event')return Promise.resolve([]);
      if(kind==='insurance_policy')return Promise.resolve([]);
      return Promise.resolve([]);
    });
  });

  it('creates a handoff but does not activate coverage',async()=>{
    const {startBindHandoff}=await import('./bind');
    const result=await startBindHandoff(user,'household-1','selection-1');
    expect(result.state).toBe('HANDOFF_READY');
    expect(put).toHaveBeenCalledWith('insurance_bind_handoff',expect.objectContaining({state:'HANDOFF_READY'}));
    expect(put).not.toHaveBeenCalledWith('insurance_policy',expect.anything());
  });

  it('rejects non-bindable sandbox selections',async()=>{
    all.mockImplementation((kind:string)=>{
      if(kind==='member')return Promise.resolve([{id:'m1',householdId:'household-1',ownerId:'guardian-1',role:'guardian',name:'Guardian',active:true}]);
      if(kind==='insurance_offer_selection')return Promise.resolve([{...selection,status:'sandbox_selected',bindHandoff:{allowed:false,reason:'sandbox'}}]);
      return Promise.resolve([]);
    });
    const {startBindHandoff}=await import('./bind');
    await expect(startBindHandoff(user,'household-1','selection-1')).rejects.toThrow('cannot start');
  });

  it('creates a policy only from carrier-confirmed bound event',async()=>{
    all.mockImplementation((kind:string)=>{
      if(kind==='insurance_bind_handoff')return Promise.resolve([handoff]);
      if(kind==='insurance_carrier_event'||kind==='insurance_policy')return Promise.resolve([]);
      return Promise.resolve([]);
    });
    const {applyCarrierEvent}=await import('./bind');
    const result=await applyCarrierEvent({
      eventId:'event-1',
      carrierId:'carrier-real',
      externalReference:'external-1',
      type:'policy.bound',
      occurredAt:'2026-10-04T12:05:00.000Z',
      externalPolicyId:'policy-external-1'
    });
    expect(result.policy?.status).toBe('BOUND');
    expect(put).toHaveBeenCalledWith('insurance_policy',expect.objectContaining({externalPolicyId:'policy-external-1',status:'BOUND'}));
  });

  it('prevents an invalid jump from started directly to active',async()=>{
    all.mockImplementation((kind:string)=>{
      if(kind==='insurance_bind_handoff')return Promise.resolve([handoff]);
      if(kind==='insurance_carrier_event'||kind==='insurance_policy')return Promise.resolve([]);
      return Promise.resolve([]);
    });
    const {applyCarrierEvent}=await import('./bind');
    await expect(applyCarrierEvent({
      eventId:'event-2',
      carrierId:'carrier-real',
      externalReference:'external-1',
      type:'policy.active',
      occurredAt:'2026-10-04T12:06:00.000Z',
      externalPolicyId:'policy-external-1'
    })).rejects.toThrow('Invalid insurance state transition');
  });

  it('verifies signed carrier webhook payloads',async()=>{
    const {createHmac}=await import('node:crypto');
    const {verifyCarrierSignature}=await import('./bind');
    const body='{"eventId":"event-1"}';
    const secret='test-secret';
    const signature=createHmac('sha256',secret).update(body).digest('hex');
    expect(verifyCarrierSignature(body,signature,secret)).toBe(true);
    expect(verifyCarrierSignature(body,'0'.repeat(64),secret)).toBe(false);
  });
});
