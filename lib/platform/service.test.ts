import {beforeEach,afterEach,describe,it,expect} from 'vitest';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {closeDatabases,db,all,put} from './db';
import {register,login,createSession,authenticate,logout} from './auth';
import {execute,dashboard} from './service';
import type {Command} from './commands';
import type {Drive,User,Invite,Profile,Relationship} from './types';
let dir:string;
beforeEach(()=>{dir=mkdtempSync(join(tmpdir(),'teensurance-platform-'));process.env.TEENSURANCE_DB_PATH=join(dir,'test.sqlite')});
afterEach(async ()=>{(await closeDatabases());delete process.env.TEENSURANCE_DB_PATH;rmSync(dir,{recursive:true,force:true})});
const run=async (u:User,c:Command,key=randomUUID())=>(await execute(u,c,key));
async function setup(){
 const parent=(await register('parent@example.test','long-password-123','Parent'));const teen=(await register('teen@example.test','long-password-123','Teen'));const stranger=(await register('other@example.test','long-password-123','Other'));
 const created=(await run(parent,{action:'household.create',name:'Test family',adultAttestation:true})) as {result:{id:string}};const householdId=created.result.id;
 const invite=(await run(parent,{action:'invite.create',householdId,role:'teen'})) as {result:{token:string}};
 expect((await run(teen,{action:'invite.accept',token:invite.result.token})).status).toBe(200);
 expect((await run(teen,{action:'profile.save',householdId,teenId:teen.id,name:'Teen',birthDate:'2010-01-01',jurisdiction:'TX',stage:'permit',goalMinutes:1800,permitDate:'2025-01-01',suspensionDays:0})).status).toBe(200);
 return {parent,teen,stranger,householdId};
}
describe('local platform certification',()=>{
 it('expires invitations, rejects overlapping time and preserves consent boundaries',async ()=>{
  const {parent,teen,stranger,householdId}=(await setup());
  const invite=(await run(parent,{action:'invite.create',householdId,role:'supervisor',teenId:teen.id})) as {result:{token:string}};
  const invitation=(await all<Invite>('invite')).find(i=>i.role==='supervisor')!;(await put('invite',{...invitation,expiresAt:'2020-01-01T00:00:00Z'}));
  expect((await run(stranger,{action:'invite.accept',token:invite.result.token,adultAttestation:true})).status).toBe(400);
  (await run(parent,{action:'consent.set',householdId,teenId:teen.id,granted:true}));
  const entry:Command={action:'drive.manual',householdId,teenId:teen.id,supervisorId:parent.id,skill:'Turns',startedAt:'2026-01-02T12:00:00.000Z',minutes:60,nightMinutes:0,note:'',supervisorEligible:true};
  const key=randomUUID();expect((await run(teen,entry,key)).status).toBe(200);expect((await run(teen,{...entry,minutes:45},key)).status).toBe(409);expect((await run(teen,{...entry,startedAt:'2026-01-02T12:30:00.000Z'})).status).toBe(409);
  expect((await run(teen,{...entry,startedAt:'2026-01-03T12:00:00.000Z',nightMinutes:90})).status).toBe(400);
  (await run(parent,{action:'consent.set',householdId,teenId:teen.id,granted:false}));expect((await run(teen,{action:'evidence.add',householdId,teenId:teen.id,milestone:'learn',description:'Read road signs',sourceUrl:''})).status).toBe(403);
 });
 it('requires renewed adult sharing and revokes relationship access',async ()=>{
  const {parent,teen,householdId}=(await setup());const p=(await all<Profile>('profile'))[0];(await put('profile',{...p,birthDate:'2007-01-01'}));
  expect((await dashboard(parent)).profiles).toEqual([]);expect((await run(parent,{action:'consent.set',householdId,teenId:teen.id,granted:true})).status).toBe(403);
  expect((await run(teen,{action:'sharing.set',householdId,teenId:teen.id,granted:true})).status).toBe(200);expect((await dashboard(parent)).profiles).toHaveLength(1);
  const relationship=(await all<Relationship>('relationship'))[0];expect((await run(parent,{action:'relationship.revoke',householdId,id:relationship.id})).status).toBe(200);expect((await dashboard(parent)).profiles).toEqual([]);
 });
 it('hashes credentials, expires/revokes sessions, persists after reopening',async ()=>{const user=(await register('a@example.test','long-password-123','Alice'));expect((await login('A@example.test','long-password-123')).id).toBe(user.id);await expect((async()=>(await login('a@example.test','wrong')))()).rejects.toThrow();const token=(await createSession(user));expect((await authenticate(token)).id).toBe(user.id);(await closeDatabases());expect((await authenticate(token)).id).toBe(user.id);(await logout(token));await expect((async()=>(await authenticate(token)))()).rejects.toThrow();expect(JSON.stringify((await db().prepare('SELECT * FROM users').all()))).not.toContain('long-password-123')});
 it('enforces household isolation, consent, supervisor attestation, corrections and idempotency',async ()=>{
  const {parent,teen,stranger,householdId}=(await setup());const command:Command={action:'drive.manual',householdId,teenId:teen.id,supervisorId:parent.id,skill:'Turns',startedAt:'2026-01-02T12:00:00.000Z',minutes:60,nightMinutes:20,note:'',supervisorEligible:true};
  expect((await run(teen,command)).status).toBe(403);await expect((async()=>(await dashboard(stranger,householdId)))()).rejects.toThrow();
  expect((await run(parent,{action:'consent.set',householdId,teenId:teen.id,granted:true})).status).toBe(200);
  const key=randomUUID();const saved=(await run(teen,command,key)) as {result:Drive};expect((await run(teen,command,key))).toEqual(saved);const id=saved.result.id;
  expect((await dashboard(teen)).journeys[0].totals.verifiedMinutes).toBe(0);
  expect((await run(teen,{action:'drive.review',householdId,id,decision:'confirm',reason:''})).status).toBe(403);
  expect((await run(stranger,{action:'drive.review',householdId,id,decision:'confirm',reason:''})).status).toBe(403);
  expect((await run(parent,{action:'drive.review',householdId,id,decision:'confirm',reason:''})).status).toBe(200);
  expect((await run(parent,{action:'drive.review',householdId,id,decision:'confirm',reason:''})).status).toBe(409);
  expect((await dashboard(teen)).journeys[0].totals).toMatchObject({verifiedMinutes:60,nightMinutes:20});
  expect((await run(teen,{action:'drive.correct',householdId,id,minutes:45,nightMinutes:10,reason:'Correcting recorded duration'})).status).toBe(200);
  expect((await dashboard(teen)).journeys[0].totals.verifiedMinutes).toBe(0);
  expect((await run(parent,{action:'drive.review',householdId,id,decision:'confirm',reason:''})).status).toBe(200);
  expect((await dashboard(teen)).journeys[0].totals.verifiedMinutes).toBe(45);expect((await db().prepare('SELECT * FROM ledger').all())).toHaveLength(3);
  await expect((async()=>(await db().prepare('DELETE FROM ledger').run()))()).rejects.toThrow(/append only|permission denied/);await expect((async()=>(await db().prepare('DELETE FROM audit').run()))()).rejects.toThrow(/append only|permission denied/);
  (await closeDatabases());expect((await dashboard(teen)).journeys[0].totals.verifiedMinutes).toBe(45);
 });
 it('suppresses nonessential activity while driving and restores draft after refresh',async ()=>{
  const {parent,teen,householdId}=(await setup());(await run(parent,{action:'consent.set',householdId,teenId:teen.id,granted:true}));
  const started=(await run(teen,{action:'drive.start',householdId,teenId:teen.id,supervisorId:parent.id,skill:'Parking',supervisorEligible:true})) as {result:Drive};
  expect((await dashboard(teen)).activeDrive?.id).toBe(started.result.id);expect((await dashboard(parent)).profiles).toEqual([]);
  expect((await run(teen,{action:'agent.explain',householdId,teenId:teen.id})).status).toBe(403);
  (await closeDatabases());expect((await dashboard(teen)).activeDrive?.id).toBe(started.result.id);
  expect((await run(teen,{action:'drive.end',householdId,id:started.result.id,parked:true})).status).toBe(200);
  expect((await dashboard(teen)).activeDrive).toBeUndefined();expect((await all<Drive>('drive'))[0].status).toBe('draft');
 });
 it('limits supervisor visibility and makes invites one-use',async ()=>{const {parent,teen,stranger,householdId}=(await setup());const inv=(await run(parent,{action:'invite.create',householdId,role:'supervisor',teenId:teen.id})) as {result:{token:string}};expect((await run(stranger,{action:'invite.accept',token:inv.result.token,adultAttestation:true})).status).toBe(200);expect((await run(stranger,{action:'invite.accept',token:inv.result.token,adultAttestation:true})).status).toBe(400);const view=(await dashboard(stranger));expect(view.evidence).toEqual([]);expect(view.journeys).toEqual([]);expect(view.profiles).toEqual([]);expect((await run(stranger,{action:'consent.set',householdId,teenId:teen.id,granted:true})).status).toBe(403)});
});
