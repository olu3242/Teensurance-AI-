import {describe,it,expect,beforeAll,afterAll} from 'vitest';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {GET,POST} from './route';
let oldCwd:string;let dir:string;
beforeAll(async()=>{oldCwd=process.cwd();dir=await mkdtemp(join(tmpdir(),'teensurance-test-'));process.chdir(dir)});
afterAll(async()=>{process.chdir(oldCwd);await rm(dir,{recursive:true,force:true})});
async function send(body:Record<string,unknown>){return POST(new Request('http://localhost/api/pilot',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}))}
describe('pilot journey API',()=>{
 it('persists a supervised entry, rejects teen review, then counts parent verification',async()=>{
  const logged=await send({action:'log',role:'teen',drivingState:'parked',date:'2026-09-01',minutes:60,night:true,skill:'Turns',supervisor:'Parent',note:'Practice'});
  expect(logged.status).toBe(200);
  const saved=await logged.json();expect(saved.progress.verifiedMinutes).toBe(0);expect(saved.progress.pending).toBe(1);
  const id=saved.state.logs[0].id;
  const denied=await send({action:'verify',role:'teen',drivingState:'parked',id});expect(denied.status).toBe(403);expect((await denied.json()).policy.decision).toBe('REQUIRE_PARENT');
  const deferred=await send({action:'verify',role:'parent',drivingState:'driving',id});expect(deferred.status).toBe(403);
  const approved=await send({action:'verify',role:'parent',drivingState:'parked',id});expect(approved.status).toBe(200);
  const current=await (await GET()).json();expect(current.progress).toMatchObject({verifiedMinutes:60,nightMinutes:60,pending:0,percent:5});
  expect(current.state.audit.map((a:{decision:string})=>a.decision)).toEqual(['ALLOW','DEFER','REQUIRE_PARENT','ALLOW']);
 });
});
