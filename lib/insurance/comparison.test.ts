import {beforeEach,describe,expect,it,vi} from 'vitest';

const all=vi.fn();
const put=vi.fn(async (_kind:string,value:unknown)=>value);
const transaction=vi.fn(async (fn:()=>unknown)=>fn());
const audit=vi.fn();

vi.mock('../platform/db',()=>({all,put,transaction}));
vi.mock('../platform/service',()=>({audit}));

const user={id:'guardian-1',name:'Guardian',email:'guardian@example.com'};
const future=new Date(Date.now()+60*60*1000).toISOString();

const session={
  id:'session-1',
  householdId:'household-1',
  ownerId:'guardian-1',
  teenId:'teen-1',
  idempotencyKey:'request_key_123456789',
  fingerprint:'hash',
  normalizedRequest:{} as never,
  status:'completed' as const,
  createdAt:new Date().toISOString(),
  results:[
    {carrierId:'beta',status:'quoted' as const,quote:{carrierId:'beta',carrierDisplayName:'Beta',quoteId:'q-beta',monthlyPremiumCents:19000,sixMonthPremiumCents:114000,deductibleCents:100000,coverageLevel:'standard' as const,synthetic:true,bindable:false,expiresAt:future,disclosures:['sandbox']}},
    {carrierId:'alpha',status:'quoted' as const,quote:{carrierId:'alpha',carrierDisplayName:'Alpha',quoteId:'q-alpha',monthlyPremiumCents:17000,sixMonthPremiumCents:102000,deductibleCents:50000,coverageLevel:'standard' as const,synthetic:false,bindable:true,expiresAt:future,disclosures:['carrier disclosure']}},
    {carrierId:'gamma',status:'declined' as const,reason:'Outside appetite.'}
  ]
};

describe('insurance offer comparison and selection',()=>{
  beforeEach(()=>{
    vi.clearAllMocks();
    all.mockImplementation((kind:string)=>{
      if(kind==='member')return Promise.resolve([{id:'m1',householdId:'household-1',ownerId:'guardian-1',role:'guardian',name:'Guardian',active:true}]);
      if(kind==='insurance_quote_session')return Promise.resolve([session]);
      if(kind==='insurance_offer_selection')return Promise.resolve([]);
      return Promise.resolve([]);
    });
  });

  it('sorts neutrally by monthly premium without calling the first offer best',async()=>{
    const {compareOffers}=await import('./comparison');
    const result=await compareOffers(user,'household-1','session-1');
    expect(result.offers.map(offer=>offer.quoteId)).toEqual(['q-alpha','q-beta']);
    expect(result.sort).toBe('monthly_premium_ascending');
    expect(result.disclaimer).toContain('not a recommendation');
    expect(result.unavailable).toEqual([{carrierId:'gamma',status:'declined',reason:'Outside appetite.'}]);
  });

  it('requires disclosure acknowledgement before selection',async()=>{
    const {selectOffer}=await import('./comparison');
    await expect(selectOffer(user,'household-1','session-1','q-alpha',false))
      .rejects.toThrow('acknowledge');
    expect(put).not.toHaveBeenCalled();
  });

  it('allows a real bindable offer to create a carrier handoff record',async()=>{
    const {selectOffer}=await import('./comparison');
    const selected=await selectOffer(user,'household-1','session-1','q-alpha',true);
    expect(selected.bindHandoff.allowed).toBe(true);
    expect(selected.status).toBe('selected');
    expect(put).toHaveBeenCalledWith('insurance_offer_selection',expect.objectContaining({quoteId:'q-alpha'}));
  });

  it('blocks binding for sandbox offers',async()=>{
    const {selectOffer}=await import('./comparison');
    const selected=await selectOffer(user,'household-1','session-1','q-beta',true);
    expect(selected.bindHandoff.allowed).toBe(false);
    expect(selected.status).toBe('sandbox_selected');
  });
});
