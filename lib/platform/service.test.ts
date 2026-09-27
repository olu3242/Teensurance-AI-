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
afterEach(()=>{closeDatabases();delete process.env.TEENSURANCE_DB_PATH;rmSync(dir,{recursive:true,force:true})});
const run=(u:User,c:Command,key=randomUUID())=>execute(u,c,key);
function setup(){
 const parent=register('parent@example.test','long-password-123','Parent');const teen=register('teen@example.test','long-password-123','Teen');const stranger=register('other@example.test','long-password-123','Other');
 const created=run(parent,{action:'household.create',name:'Test family',adultAttestation:true}) as {result:{id:string}};const householdId=created.result.id;
 const invite=run(parent,{action:'invite.create',householdId,role:'teen'}) as {result:{token:string}};
 expect(run(teen,{action:'invite.accept',token:invite.result.token}).status).toBe(200);
 expect(run(teen,{action:'profile.save',householdId,teenId:teen.id,name:'Teen',birthDate:'2010-01-01',jurisdiction:'TX',stage:'permit',goalMinutes:1800,permitDate:'2025-01-01',suspensionDays:0}).status).toBe(200);
 return {parent,teen,stranger,householdId};
}
describe('local platform certification',()=>{
 it('expires invitations, rejects overlapping time and preserves consent boundaries',()=>{
  const {parent,teen,stranger,householdId}=setup();
  const invite=run(parent,{action:'invite.create',householdId,role:'supervisor',teenId:teen.id}) as {result:{token:string}};
  const invitation=all<Invite>('invite').find(i=>i.role==='supervisor')!;put('invite',{...invitation,expiresAt:'2020-01-01T00:00:00Z'});
  expect(run(stranger,{action:'invite.accept',token:invite.result.token,adultAttestation:true}).status).toBe(400);
  run(parent,{action:'consent.set',householdId,teenId:teen.id,granted:true});
  const entry:Command={action:'drive.manual',householdId,teenId:teen.id,supervisorId:parent.id,skill:'Turns',startedAt:'2026-01-02T12:00:00.000Z',minutes:60,nightMinutes:0,note:'',supervisorEligible:true};
  const key=randomUUID();expect(run(teen,entry,key).status).toBe(200);expect(run(teen,{...entry,minutes:45},key).status).toBe(409);expect(run(teen,{...entry,startedAt:'2026-01-02T12:30:00.000Z'}).status).toBe(409);
  expect(run(teen,{...entry,startedAt:'2026-01-03T12:00:00.000Z',nightMinutes:90}).status).toBe(400);
  run(parent,{action:'consent.set',householdId,teenId:teen.id,granted:false});expect(run(teen,{action:'evidence.add',householdId,teenId:teen.id,milestone:'learn',description:'Read road signs',sourceUrl:''}).status).toBe(403);
 });
 it('requires renewed adult sharing and revokes relationship access',()=>{
  const {parent,teen,householdId}=setup();const p=all<Profile>('profile')[0];put('profile',{...p,birthDate:'2007-01-01'});
  expect(dashboard(parent).profiles).toEqual([]);expect(run(parent,{action:'consent.set',householdId,teenId:teen.id,granted:true}).status).toBe(403);
  expect(run(teen,{action:'sharing.set',householdId,teenId:teen.id,granted:true}).status).toBe(200);expect(dashboard(parent).profiles).toHaveLength(1);
  const relationship=all<Relationship>('relationship')[0];expect(run(parent,{action:'relationship.revoke',householdId,id:relationship.id}).status).toBe(200);expect(dashboard(parent).profiles).toEqual([]);
 });
 it('hashes credentials, expires/revokes sessions, persists after reopening',()=>{const user=register('a@example.test','long-password-123','Alice');expect(login('A@example.test','long-password-123').id).toBe(user.id);expect(()=>login('a@example.test','wrong')).toThrow();const token=createSession(user);expect(authenticate(token).id).toBe(user.id);closeDatabases();expect(authenticate(token).id).toBe(user.id);logout(token);expect(()=>authenticate(token)).toThrow();expect(JSON.stringify(db().prepare('SELECT * FROM users').all())).not.toContain('long-password-123')});
 it('enforces household isolation, consent, supervisor attestation, corrections and idempotency',()=>{
  const {parent,teen,stranger,householdId}=setup();const command:Command={action:'drive.manual',householdId,teenId:teen.id,supervisorId:parent.id,skill:'Turns',startedAt:'2026-01-02T12:00:00.000Z',minutes:60,nightMinutes:20,note:'',supervisorEligible:true};
  expect(run(teen,command).status).toBe(403);expect(()=>dashboard(stranger,householdId)).toThrow();
  expect(run(parent,{action:'consent.set',householdId,teenId:teen.id,granted:true}).status).toBe(200);
  const key=randomUUID();const saved=run(teen,command,key) as {result:Drive};expect(run(teen,command,key)).toEqual(saved);const id=saved.result.id;
  expect(dashboard(teen).journeys[0].totals.verifiedMinutes).toBe(0);
  expect(run(teen,{action:'drive.review',householdId,id,decision:'confirm',reason:''}).status).toBe(403);
  expect(run(stranger,{action:'drive.review',householdId,id,decision:'confirm',reason:''}).status).toBe(403);
  expect(run(parent,{action:'drive.review',householdId,id,decision:'confirm',reason:''}).status).toBe(200);
  expect(run(parent,{action:'drive.review',householdId,id,decision:'confirm',reason:''}).status).toBe(409);
  expect(dashboard(teen).journeys[0].totals).toMatchObject({verifiedMinutes:60,nightMinutes:20});
  expect(run(teen,{action:'drive.correct',householdId,id,minutes:45,nightMinutes:10,reason:'Correcting recorded duration'}).status).toBe(200);
  expect(dashboard(teen).journeys[0].totals.verifiedMinutes).toBe(0);
  expect(run(parent,{action:'drive.review',householdId,id,decision:'confirm',reason:''}).status).toBe(200);
  expect(dashboard(teen).journeys[0].totals.verifiedMinutes).toBe(45);expect(db().prepare('SELECT * FROM ledger').all()).toHaveLength(3);
  expect(()=>db().prepare('DELETE FROM ledger').run()).toThrow('append only');expect(()=>db().prepare('DELETE FROM audit').run()).toThrow('append only');
  closeDatabases();expect(dashboard(teen).journeys[0].totals.verifiedMinutes).toBe(45);
 });
 it('suppresses nonessential activity while driving and restores draft after refresh',()=>{
  const {parent,teen,householdId}=setup();run(parent,{action:'consent.set',householdId,teenId:teen.id,granted:true});
  const started=run(teen,{action:'drive.start',householdId,teenId:teen.id,supervisorId:parent.id,skill:'Parking',supervisorEligible:true}) as {result:Drive};
  expect(dashboard(teen).activeDrive?.id).toBe(started.result.id);expect(dashboard(parent).profiles).toEqual([]);
  expect(run(teen,{action:'agent.explain',householdId,teenId:teen.id}).status).toBe(403);
  closeDatabases();expect(dashboard(teen).activeDrive?.id).toBe(started.result.id);
  expect(run(teen,{action:'drive.end',householdId,id:started.result.id,parked:true}).status).toBe(200);
  expect(dashboard(teen).activeDrive).toBeUndefined();expect(all<Drive>('drive')[0].status).toBe('draft');
 });
 it('limits supervisor visibility and makes invites one-use',()=>{const {parent,teen,stranger,householdId}=setup();const inv=run(parent,{action:'invite.create',householdId,role:'supervisor',teenId:teen.id}) as {result:{token:string}};expect(run(stranger,{action:'invite.accept',token:inv.result.token,adultAttestation:true}).status).toBe(200);expect(run(stranger,{action:'invite.accept',token:inv.result.token,adultAttestation:true}).status).toBe(400);const view=dashboard(stranger);expect(view.evidence).toEqual([]);expect(view.journeys).toEqual([]);expect(view.profiles).toEqual([]);expect(run(stranger,{action:'consent.set',householdId,teenId:teen.id,granted:true}).status).toBe(403)});
});
