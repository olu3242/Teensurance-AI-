import {afterEach,beforeEach,expect,it} from 'vitest';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {all,closeDatabases,put} from '../platform/db';
import type {Member,Profile,Relationship,User} from '../platform/types';
import {createInsuranceImpactEstimate,latestInsuranceImpactEstimate} from './service';
import type {InsuranceImpactEstimate} from './types';

let dir:string;
beforeEach(()=>{dir=mkdtempSync(join(tmpdir(),'insurance-impact-'));process.env.TEENSURANCE_DB_PATH=join(dir,'test.sqlite')});
afterEach(async()=>{await closeDatabases();delete process.env.TEENSURANCE_DB_PATH;rmSync(dir,{recursive:true,force:true})});

async function setup(){
  const householdId=randomUUID();
  const parent:User={id:randomUUID(),name:'Parent',email:'parent@example.test'};
  const teen:User={id:randomUUID(),name:'Teen',email:'teen@example.test'};
  const stranger:User={id:randomUUID(),name:'Other',email:'other@example.test'};
  await put<Member>('member',{id:randomUUID(),householdId,ownerId:parent.id,role:'guardian',name:'Parent',active:true});
  await put<Member>('member',{id:randomUUID(),householdId,ownerId:teen.id,role:'teen',name:'Teen',active:true});
  await put<Relationship>('relationship',{id:randomUUID(),householdId,ownerId:parent.id,adultId:parent.id,teenId:teen.id,kind:'guardian',active:true,createdAt:new Date().toISOString()});
  await put<Profile>('profile',{id:randomUUID(),householdId,ownerId:teen.id,name:'Teen',birthDate:'2010-01-01',jurisdiction:'TX',stage:'permit',goalMinutes:1800,permitDate:'2026-01-01',suspensionDays:0,consent:true,consentVersion:'practice-journey-v1',adultSharing:false});
  return {householdId,parent,teen,stranger};
}

it('creates a versioned Texas planning estimate without presenting it as a quote',async()=>{
  const {householdId,parent,teen}=await setup();
  const response=await createInsuranceImpactEstimate(parent,{householdId,teenId:teen.id,jurisdiction:'TX',currentAnnualPremium:2600});
  expect(response.status).toBe(200);
  expect(response.result).toMatchObject({jurisdiction:'TX',estimateType:'planning_proxy',estimatedIncrementLow:2430,estimatedIncrementHigh:3644,projectedAnnualPremiumLow:5030,projectedAnnualPremiumHigh:6244});
  expect(response.result.basis).toMatchObject({version:'1.0.0',annualIncrementBenchmark:3037,stateSpecific:false,benchmarkJurisdiction:'US'});
  expect(response.result.disclaimer).toContain('not a quote');
  expect((await all<InsuranceImpactEstimate>('insurance_impact_estimate',householdId))).toHaveLength(1);
  expect((await latestInsuranceImpactEstimate(parent,householdId,teen.id)).result?.id).toBe(response.result.id);
});

it('denies teen, stranger, state tampering and unsupported-state estimates',async()=>{
  const {householdId,parent,teen,stranger}=await setup();
  await expect(createInsuranceImpactEstimate(teen,{householdId,teenId:teen.id,jurisdiction:'TX'})).rejects.toThrow('linked guardian');
  await expect(createInsuranceImpactEstimate(stranger,{householdId,teenId:teen.id,jurisdiction:'TX'})).rejects.toThrow('linked guardian');
  await expect(createInsuranceImpactEstimate(parent,{householdId,teenId:teen.id,jurisdiction:'PA'})).rejects.toThrow('must match');
  const profile=(await all<Profile>('profile',householdId))[0];
  await put('profile',{...profile,jurisdiction:'PA'});
  await expect(createInsuranceImpactEstimate(parent,{householdId,teenId:teen.id,jurisdiction:'PA'})).rejects.toThrow('not yet available');
});

it('rejects unreasonable premium inputs rather than coercing them',async()=>{
  const {householdId,parent,teen}=await setup();
  await expect(createInsuranceImpactEstimate(parent,{householdId,teenId:teen.id,jurisdiction:'TX',currentAnnualPremium:-1})).rejects.toThrow('Invalid insurance impact request');
  await expect(createInsuranceImpactEstimate(parent,{householdId,teenId:teen.id,jurisdiction:'TX',currentAnnualPremium:100001})).rejects.toThrow('Invalid insurance impact request');
});
