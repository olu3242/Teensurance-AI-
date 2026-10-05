import {beforeEach,describe,expect,it,vi} from 'vitest';
import type {CarrierAdapter} from './adapters';
import type {NormalizedQuoteRequest} from './types';

const all=vi.fn();
const put=vi.fn(async (_kind:string,value:unknown)=>value);
const transaction=vi.fn(async (fn:()=>unknown)=>fn());
const audit=vi.fn();
const ruleForJurisdiction=vi.fn();
const normalizeJurisdiction=vi.fn((value:string)=>value.replace(/^US-/,''));

vi.mock('../platform/db',()=>({all,put,transaction}));
vi.mock('../platform/service',()=>({audit}));
vi.mock('../platform/jurisdictions',()=>({ruleForJurisdiction,normalizeJurisdiction}));
vi.mock('../platform/auth',async()=>{
  const actual=await vi.importActual<typeof import('../platform/auth')>('../platform/auth');
  return {...actual,hash:(value:string)=>`hash:${value}`};
});

const user={id:'guardian-1',name:'Guardian',email:'guardian@example.com'};
const input={
  householdId:'household-1',
  teenId:'teen-1',
  intent:'compare_current' as const,
  coverageLevel:'standard' as const,
  vehicles:[{year:2024,make:'Test',model:'Car',primaryUse:'school' as const}],
  shareReadinessEvidence:true
};

function records(kind:string){
  if(kind==='member')return [
    {id:'m1',householdId:'household-1',ownerId:'guardian-1',role:'guardian',name:'Guardian',active:true},
    {id:'m2',householdId:'household-1',ownerId:'teen-1',role:'teen',name:'Teen',active:true}
  ];
  if(kind==='relationship')return [{id:'r1',householdId:'household-1',ownerId:'guardian-1',adultId:'guardian-1',teenId:'teen-1',kind:'guardian',active:true,createdAt:'2026-01-01'}];
  if(kind==='profile')return [{id:'p1',householdId:'household-1',ownerId:'teen-1',name:'Teen',birthDate:'2010-01-01',jurisdiction:'TX',stage:'permit',goalMinutes:3600,permitDate:'2026-01-01',suspensionDays:0,consent:true,consentVersion:'v1',adultSharing:false}];
  if(kind==='evidence')return [{id:'e1',householdId:'household-1',ownerId:'guardian-1',teenId:'teen-1',milestone:'practice',description:'x',sourceUrl:'',provenance:'SELF_REPORTED',status:'accepted',createdAt:'2026-01-01'}];
  if(kind==='drive')return [{id:'d1',householdId:'household-1',ownerId:'teen-1',teenId:'teen-1',supervisorId:'guardian-1',skill:'turns',status:'verified',startedAt:'2026-01-01',minutes:30,nightMinutes:0,weatherMinutes:0,note:'',revision:1,corrections:[]}];
  if(kind==='insurance_quote_session')return [];
  return [];
}

describe('insurance quote normalization',()=>{
  beforeEach(()=>{
    vi.clearAllMocks();
    all.mockImplementation((kind:string)=>Promise.resolve(records(kind)));
    ruleForJurisdiction.mockReturnValue({id:'tx-rule',version:'2026.1',sourceUrl:'https://example.gov',reviewedAt:'2026-09-01'});
  });

  it('requires a linked guardian and keeps readiness evidence separate',async()=>{
    const adapter:CarrierAdapter={
      id:'test-carrier',
      displayName:'Test Carrier',
      supportedJurisdictions:['TX'],
      async quote(request:NormalizedQuoteRequest){
        expect(request.readiness?.verifiedPracticeSessions).toBe(1);
        expect(request.readiness?.acceptedMilestoneEvidence).toBe(1);
        return {carrierId:'test-carrier',status:'declined',reason:'Test-only response.'};
      }
    };
    const {createQuoteSession}=await import('./service');
    const session=await createQuoteSession(user,input,'request_key_123456789',[adapter]);
    expect(session.normalizedRequest.jurisdiction).toBe('TX');
    expect(session.normalizedRequest.guardianId).toBe('guardian-1');
    expect(session.results[0]?.status).toBe('declined');
    expect(put).toHaveBeenCalledWith('insurance_quote_session',expect.objectContaining({status:'no_market'}));
  });

  it('fails closed when the jurisdiction rule is not currently verified',async()=>{
    ruleForJurisdiction.mockReturnValue(undefined);
    const {createQuoteSession}=await import('./service');
    await expect(createQuoteSession(user,input,'request_key_123456789',[]))
      .rejects.toThrow('currently verified official-source rule');
    expect(audit).toHaveBeenCalledWith('guardian-1','household-1','insurance.quote','REQUIRE_OFFICIAL_SOURCE',expect.any(String));
  });

  it('does not attach readiness evidence without explicit sharing',async()=>{
    const adapter:CarrierAdapter={
      id:'test-carrier',
      displayName:'Test Carrier',
      supportedJurisdictions:['TX'],
      async quote(request:NormalizedQuoteRequest){
        expect(request.readiness).toBeUndefined();
        return {carrierId:'test-carrier',status:'unavailable',reason:'Test-only response.'};
      }
    };
    const {createQuoteSession}=await import('./service');
    await createQuoteSession(user,{...input,shareReadinessEvidence:false},'request_key_123456789',[adapter]);
  });
});
