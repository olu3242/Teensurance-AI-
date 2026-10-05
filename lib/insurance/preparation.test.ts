import {beforeEach,describe,expect,it,vi} from 'vitest';
const all=vi.fn();const put=vi.fn(async(_kind:string,value:unknown)=>value);
vi.mock('../platform/db',()=>({all,put}));
const guardian={id:'g',name:'Guardian',email:'g@example.com'};
describe('insurance preparation bridge',()=>{
 beforeEach(()=>{vi.clearAllMocks();all.mockImplementation((kind:string)=>{
  if(kind==='member')return Promise.resolve([{id:'gm',householdId:'h',ownerId:'g',role:'guardian',name:'G',active:true},{id:'tm',householdId:'h',ownerId:'t',role:'teen',name:'T',active:true}]);
  if(kind==='profile')return Promise.resolve([{id:'p',householdId:'h',ownerId:'t',name:'Teen',birthDate:'2010-01-01',jurisdiction:'TX',stage:'permit',goalMinutes:1000,permitDate:'2026-01-01',suspensionDays:0,consent:true,consentVersion:'v1',adultSharing:false}]);
  if(kind==='drive')return Promise.resolve([{id:'d',teenId:'t',status:'verified'}]);
  if(kind==='evidence')return Promise.resolve([]);
  if(kind==='roadready_mastery')return Promise.resolve([{teenId:'t',conceptId:'c',state:'demonstrated'}]);
  if(kind==='insurance_preparation_opportunity')return Promise.resolve([]);
  return Promise.resolve([]);
 })});
 it('creates a guardian preparation opportunity without creating an underwriting gate',async()=>{
  const {evaluateInsurancePreparation}=await import('./preparation');
  const result=await evaluateInsurancePreparation(guardian,'h','t');
  expect(result.state).toBe('PREPARE');
  expect(result.underwritingBoundary).toContain('do not determine insurance eligibility');
  expect(put).toHaveBeenCalledWith('insurance_preparation_opportunity',expect.objectContaining({teenId:'t'}));
 });
 it('treats licensed stage as shop optional regardless of readiness evidence',async()=>{
  all.mockImplementation((kind:string)=>{
   if(kind==='member')return Promise.resolve([{ownerId:'g',role:'guardian',active:true},{ownerId:'t',role:'teen',active:true}]);
   if(kind==='profile')return Promise.resolve([{ownerId:'t',stage:'licensed'}]);
   return Promise.resolve([]);
  });
  const {evaluateInsurancePreparation}=await import('./preparation');
  const result=await evaluateInsurancePreparation(guardian,'h','t');
  expect(result.state).toBe('SHOP_OPTIONAL');
 });
});
