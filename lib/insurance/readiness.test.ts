import {afterEach,beforeEach,expect,it} from 'vitest';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {closeDatabases,put} from '../platform/db';
import type {Member,Profile,Relationship,User} from '../platform/types';
import {deriveInsuranceReadiness,readInsuranceReadiness,saveInsuranceReadinessContext,type InsuranceReadinessContext} from './readiness';

let dir:string;
beforeEach(()=>{dir=mkdtempSync(join(tmpdir(),'insurance-readiness-'));process.env.TEENSURANCE_DB_PATH=join(dir,'test.sqlite')});
afterEach(async()=>{await closeDatabases();delete process.env.TEENSURANCE_DB_PATH;rmSync(dir,{recursive:true,force:true})});

async function setup(stage:Profile['stage']='permit',jurisdiction='TX'){
  const householdId=randomUUID();
  const parent:User={id:randomUUID(),name:'Parent',email:'parent@example.test'};
  const teen:User={id:randomUUID(),name:'Teen',email:'teen@example.test'};
  const stranger:User={id:randomUUID(),name:'Other',email:'other@example.test'};
  await put<Member>('member',{id:randomUUID(),householdId,ownerId:parent.id,role:'guardian',name:'Parent',active:true});
  await put<Member>('member',{id:randomUUID(),householdId,ownerId:teen.id,role:'teen',name:'Teen',active:true});
  await put<Relationship>('relationship',{id:randomUUID(),householdId,ownerId:parent.id,adultId:parent.id,teenId:teen.id,kind:'guardian',active:true,createdAt:new Date().toISOString()});
  const profile:Profile={id:randomUUID(),householdId,ownerId:teen.id,name:'Teen',birthDate:'2010-01-01',jurisdiction,stage,goalMinutes:1800,permitDate:'2026-01-01',suspensionDays:0,consent:true,consentVersion:'practice-journey-v1',adultSharing:false};
  await put('profile',profile);
  return {householdId,parent,teen,stranger,profile};
}

it('derives shopping-workflow states without a risk score',async()=>{
  const {householdId,parent,teen,profile}=await setup('permit');
  const context:InsuranceReadinessContext={id:'x',householdId,ownerId:parent.id,teenId:teen.id,jurisdiction:'TX',coverageStatus:'not_covered',coverageNeededBy:'2026-11-01',updatedAt:'2026-10-03T00:00:00.000Z'};
  const soon=deriveInsuranceReadiness(profile,context,new Date('2026-10-03T00:00:00.000Z'));
  expect(soon.status).toBe('SHOPPING_SOON');
  expect(soon).not.toHaveProperty('score');
  expect(soon.disclaimer).toContain('not legal eligibility');

  const future=deriveInsuranceReadiness(profile,{...context,coverageNeededBy:'2027-03-01'},new Date('2026-10-03T00:00:00.000Z'));
  expect(future.status).toBe('PREPARING');

  const covered=deriveInsuranceReadiness(profile,{...context,coverageStatus:'covered'},new Date('2026-10-03T00:00:00.000Z'));
  expect(covered.status).toBe('COVERED');
});

it('makes a licensed uncovered driver quote-ready but does not call that legal eligibility',async()=>{
  const {householdId,parent,teen,profile}=await setup('licensed');
  const context:InsuranceReadinessContext={id:'x',householdId,ownerId:parent.id,teenId:teen.id,jurisdiction:'TX',coverageStatus:'not_covered',updatedAt:'2026-10-03T00:00:00.000Z'};
  const result=deriveInsuranceReadiness(profile,context,new Date('2026-10-03T00:00:00.000Z'));
  expect(result.status).toBe('QUOTE_READY');
  expect(result.disclaimer).toContain('not legal eligibility');
});

it('fails closed when context or a current jurisdiction rule is unavailable',async()=>{
  const tx=await setup('pre-permit','TX');
  const noContext=deriveInsuranceReadiness(tx.profile,undefined,new Date('2026-10-03T00:00:00.000Z'));
  expect(noContext.status).toBe('NOT_READY');
  expect(noContext.blockers).toContain('INSURANCE_CONTEXT_REQUIRED');

  const unsupported=await setup('permit','CA');
  const context:InsuranceReadinessContext={id:'x',householdId:unsupported.householdId,ownerId:unsupported.parent.id,teenId:unsupported.teen.id,jurisdiction:'CA',coverageStatus:'not_covered',coverageNeededBy:'2026-10-20',updatedAt:'2026-10-03T00:00:00.000Z'};
  const result=deriveInsuranceReadiness(unsupported.profile,context,new Date('2026-10-03T00:00:00.000Z'));
  expect(result.status).toBe('NOT_READY');
  expect(result.blockers).toContain('CURRENT_JURISDICTION_RULE_REQUIRED');
});

it('allows only a linked guardian and rejects state tampering',async()=>{
  const {householdId,parent,teen,stranger}=await setup('permit');
  await expect(saveInsuranceReadinessContext(teen,{householdId,teenId:teen.id,jurisdiction:'TX',coverageStatus:'not_covered'})).rejects.toThrow('linked guardian');
  await expect(saveInsuranceReadinessContext(stranger,{householdId,teenId:teen.id,jurisdiction:'TX',coverageStatus:'not_covered'})).rejects.toThrow('linked guardian');
  await expect(saveInsuranceReadinessContext(parent,{householdId,teenId:teen.id,jurisdiction:'PA',coverageStatus:'not_covered'})).rejects.toThrow('must match');

  const saved=await saveInsuranceReadinessContext(parent,{householdId,teenId:teen.id,jurisdiction:'TX',coverageStatus:'not_covered',coverageNeededBy:'2026-11-01'});
  expect(saved.status).toBe(200);
  const read=await readInsuranceReadiness(parent,householdId,teen.id);
  expect(read.result.jurisdiction).toBe('TX');
});
