import {afterEach,beforeEach,describe,expect,it} from 'vitest';
import {mkdtempSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {randomUUID} from 'node:crypto';
import {register} from './auth';
import {closeDatabases} from './db';
import {dashboard,execute} from './service';
import type {Drive,User} from './types';
import type {Command} from './commands';

let dir:string;
beforeEach(()=>{dir=mkdtempSync(join(tmpdir(),'teensurance-practice-'));process.env.TEENSURANCE_DB_PATH=join(dir,'test.sqlite')});
afterEach(async()=>{await closeDatabases();delete process.env.TEENSURANCE_DB_PATH;rmSync(dir,{recursive:true,force:true})});
const run=(u:User,c:Command)=>execute(u,c,randomUUID());

async function setup(jurisdiction:'TX'|'PA'){
 const parent=await register(`p-${jurisdiction}@example.test`,'long-password-123','Parent');
 const teen=await register(`t-${jurisdiction}@example.test`,'long-password-123','Teen');
 const h=await run(parent,{action:'household.create',name:'Family',adultAttestation:true}) as {result:{id:string}};
 const householdId=h.result.id;
 const invite=await run(parent,{action:'invite.create',householdId,role:'teen'}) as {result:{token:string}};
 await run(teen,{action:'invite.accept',token:invite.result.token});
 await run(teen,{action:'profile.save',householdId,teenId:teen.id,name:'Teen',birthDate:'2010-01-01',jurisdiction,stage:'permit',goalMinutes:jurisdiction==='PA'?3900:1800,permitDate:'2025-01-01',suspensionDays:0});
 await run(parent,{action:'consent.set',householdId,teenId:teen.id,granted:true});
 return {parent,teen,householdId};
}

describe('state-aware practice evidence e2e',()=>{
 it('counts poor-weather evidence only after supervisor verification',async()=>{
  const {parent,teen,householdId}=await setup('PA');
  const saved=await run(teen,{action:'drive.manual',householdId,teenId:teen.id,supervisorId:parent.id,skill:'Reduced visibility',startedAt:'2026-09-01T12:00:00.000Z',minutes:120,nightMinutes:0,weatherMinutes:120,note:'Rain practice',supervisorEligible:true}) as {result:Drive};
  let view=await dashboard(teen);
  expect(view.journeys[0].totals.weatherMinutes).toBe(0);
  expect(view.journeys[0].practice?.remaining.weatherMinutes).toBe(300);
  await run(parent,{action:'drive.review',householdId,id:saved.result.id,decision:'confirm',reason:'Observed full session'});
  view=await dashboard(teen);
  expect(view.journeys[0].totals.weatherMinutes).toBe(120);
  expect(view.journeys[0].practice?.remaining.weatherMinutes).toBe(180);
 });
 it('rejects impossible weather duration and removes corrected verified evidence until re-attested',async()=>{
  const {parent,teen,householdId}=await setup('PA');
  expect((await run(teen,{action:'drive.manual',householdId,teenId:teen.id,supervisorId:parent.id,skill:'Weather',startedAt:'2026-09-01T12:00:00.000Z',minutes:60,nightMinutes:0,weatherMinutes:90,note:'',supervisorEligible:true})).status).toBe(400);
  const saved=await run(teen,{action:'drive.manual',householdId,teenId:teen.id,supervisorId:parent.id,skill:'Weather',startedAt:'2026-09-02T12:00:00.000Z',minutes:60,nightMinutes:0,weatherMinutes:60,note:'',supervisorEligible:true}) as {result:Drive};
  await run(parent,{action:'drive.review',householdId,id:saved.result.id,decision:'confirm',reason:''});
  expect((await dashboard(teen)).journeys[0].totals.weatherMinutes).toBe(60);
  await run(teen,{action:'drive.correct',householdId,id:saved.result.id,minutes:45,nightMinutes:0,weatherMinutes:30,reason:'Correct weather duration'});
  expect((await dashboard(teen)).journeys[0].totals.weatherMinutes).toBe(0);
 });
 it('uses different Texas and Pennsylvania state projections',async()=>{
  const tx=await setup('TX');
  expect((await dashboard(tx.teen)).journeys[0].practice?.required).toEqual({verifiedMinutes:1800,nightMinutes:600,weatherMinutes:0});
  await closeDatabases();
  process.env.TEENSURANCE_DB_PATH=join(dir,'pa.sqlite');
  const pa=await setup('PA');
  expect((await dashboard(pa.teen)).journeys[0].practice?.required).toEqual({verifiedMinutes:3900,nightMinutes:600,weatherMinutes:300});
 });
});
