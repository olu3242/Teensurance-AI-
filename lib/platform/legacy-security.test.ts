import {beforeEach,afterEach,it,expect} from 'vitest';
import {mkdtempSync,rmSync,readFileSync,readdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {register,createSession} from './auth';
import {closeDatabases,all,put} from './db';
import {execute} from './service';
import {readLegacyLearning,writeLegacyLearning} from './legacy-learning';
import type {User,Profile,Relationship} from './types';
import {GET as pilot,POST as retiredMutation} from '@/app/api/pilot/route';
import {GET as lessons,POST as submit} from '@/app/api/lessons/route';
import {GET as catalog} from '@/app/api/lessons/catalog/route';
import {GET as operations} from '@/app/api/os/status/route';
import {drivingLessons} from '../driving-lessons';
let dir:string;
beforeEach(()=>{dir=mkdtempSync(join(tmpdir(),'legacy-security-'));process.env.TEENSURANCE_DB_PATH=join(dir,'security.sqlite')});
afterEach(()=>{closeDatabases();delete process.env.TEENSURANCE_DB_PATH;rmSync(dir,{recursive:true,force:true})});
function family(label:string){
 const parent=register(`${label}p@example.test`,'long-password-123','Parent');const teen=register(`${label}t@example.test`,'long-password-123','Teen');
 const created=execute(parent,{action:'household.create',name:'Family',adultAttestation:true},randomUUID()) as {result:{id:string}};const householdId=created.result.id;
 const invite=execute(parent,{action:'invite.create',householdId,role:'teen'},randomUUID()) as {result:{token:string}};
 execute(teen,{action:'invite.accept',token:invite.result.token},randomUUID());
 execute(teen,{action:'profile.save',householdId,teenId:teen.id,name:'Teen',birthDate:'2010-01-01',jurisdiction:'TX',stage:'permit',goalMinutes:1800,permitDate:'2025-01-01',suspensionDays:0},randomUUID());
 execute(parent,{action:'consent.set',householdId,teenId:teen.id,granted:true},randomUUID());return {parent,teen,householdId};
}
function request(path:string,user?:User,payload?:unknown,headers:Record<string,string>={}){return new Request(`http://localhost${path}`,{method:payload?'POST':'GET',headers:{...(user?{cookie:`teensurance_session=${createSession(user)}`} : {}),origin:'http://localhost','content-type':'application/json',...headers},...(payload?{body:JSON.stringify(payload)}:{})})}
const action=()=>({lessonId:drivingLessons[0].id,complete:true});
it.each([['pilot',pilot],['lessons',lessons]] as const)('%s denies unauthenticated and forged identity headers',async(path,get)=>{const response=get(request(`/api/${path}`,undefined,undefined,{'x-user-id':randomUUID(),'x-role':'guardian','x-household-id':randomUUID()}));expect(response.status).toBe(401);expect(await response.json()).not.toHaveProperty('state')});
it('denies unauthenticated lesson writes and retires legacy mutations',async()=>{expect((await submit(request('/api/lessons',undefined,action()))).status).toBe(401);expect(retiredMutation().status).toBe(410)});
it('retires global operations without exposing private projections',async()=>{expect(operations().status).toBe(410);expect(Object.keys(await operations().json())).toEqual(['error'])});
it('serves only stable public lesson definitions',async()=>{const data=await catalog().json();expect(Object.keys(data)).toEqual(['lessons']);expect(data.lessons.length).toBeGreaterThan(0)});
it('persists only own progress and allows linked guardian reads',()=>{const a=family('a');const b=family('b');writeLegacyLearning(a.teen,action());expect(readLegacyLearning(a.teen).state.lessonAttempts).toHaveLength(1);expect(readLegacyLearning(a.parent).state.lessonAttempts).toHaveLength(1);expect(readLegacyLearning(b.teen).state.lessonAttempts).toEqual([]);closeDatabases();expect(readLegacyLearning(a.teen).state.lessonAttempts).toHaveLength(1)});
it.each(['pilot','lessons'])('%s denies cross-household and cross-teen query selection',async(path)=>{const a=family('a');const b=family('b');const get=path==='pilot'?pilot:lessons;for(const user of [a.parent,a.teen]){for(const query of [`householdId=${b.householdId}&teenId=${b.teen.id}`,`householdId=${a.householdId}&teenId=${b.teen.id}`])expect(get(request(`/api/${path}?${query}`,user)).status).toBe(403)}expect(get(request(`/api/${path}?householdId=${a.householdId}&teenId=${a.teen.id}`,a.parent)).status).toBe(200)});
it('service boundary rejects cross-household and unrelated IDs directly',()=>{const a=family('a');const b=family('b');for(const user of [a.parent,a.teen]){expect(()=>readLegacyLearning(user,{householdId:b.householdId,teenId:b.teen.id})).toThrow('access denied');expect(()=>writeLegacyLearning(user,{...action(),householdId:b.householdId,teenId:b.teen.id})).toThrow('access denied')}expect(all('lesson_progress')).toEqual([])});
it.each(['role','guardianId','userId','id'])('rejects injected %s in body and query',async(field)=>{const a=family('a');expect((await submit(request('/api/lessons',a.teen,{...action(),[field]:'guardian'}))).status).toBe(400);expect(pilot(request(`/api/pilot?${field}=guardian`,a.teen)).status).toBe(400);expect(all('lesson_progress')).toEqual([])});
it('does not let forged headers override authenticated identity',async()=>{const a=family('a');const b=family('b');const response=await submit(request('/api/lessons',a.teen,{...action(),householdId:b.householdId,teenId:b.teen.id},{'x-user-id':b.teen.id,'x-role':'guardian'}));expect(response.status).toBe(403);expect(all('lesson_progress')).toEqual([])});
it('denies guardian answer impersonation and cross-origin writes',async()=>{const a=family('a');expect((await submit(request('/api/lessons',a.parent,action()))).status).toBe(403);expect((await submit(request('/api/lessons',a.teen,action(),{origin:'https://evil.test'}))).status).toBe(403)});
it('denies revoked guardian relationships, consent and adult sharing',()=>{const a=family('a');const profile=all<Profile>('profile')[0];put('profile',{...profile,consent:false});expect(()=>readLegacyLearning(a.teen)).toThrow('consent');put('profile',{...profile,birthDate:'2000-01-01',adultSharing:false});expect(()=>readLegacyLearning(a.parent)).toThrow('access denied');put('profile',profile);const relationship=all<Relationship>('relationship')[0];put('relationship',{...relationship,active:false});expect(()=>readLegacyLearning(a.parent,{householdId:a.householdId,teenId:a.teen.id})).toThrow('access denied')});
it('denies lesson interactions while an authenticated drive is active',()=>{const a=family('a');execute(a.teen,{action:'drive.start',householdId:a.householdId,teenId:a.teen.id,supervisorId:a.parent.id,skill:'Parking',supervisorEligible:true},randomUUID());expect(()=>writeLegacyLearning(a.teen,action())).toThrow('parking');expect(()=>readLegacyLearning(a.parent)).toThrow('parking')});
it('no API imports the shared JSON store',()=>{function walk(path:string):string[]{return readdirSync(path,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(join(path,e.name)):[join(path,e.name)])}for(const path of walk('app/api').filter(p=>p.endsWith('route.ts')))expect(readFileSync(path,'utf8'),path).not.toMatch(/(?:from|import).*['"](?:@\/lib\/store|[^'"]*\/store)['"]/) });

it('denies a sibling in the same household and unlinked guardians',()=>{const a=family('a');const sibling=register('sibling@example.test','long-password-123','Sibling');const invite=execute(a.parent,{action:'invite.create',householdId:a.householdId,role:'teen'},randomUUID()) as {result:{token:string}};execute(sibling,{action:'invite.accept',token:invite.result.token},randomUUID());expect(()=>readLegacyLearning(sibling,{householdId:a.householdId,teenId:a.teen.id})).toThrow('access denied');const b=family('b');expect(()=>readLegacyLearning(b.parent,{householdId:a.householdId,teenId:a.teen.id})).toThrow('access denied')});
it('preserves mixed night-minute progress in the authenticated projection',()=>{const a=family('a');const d=execute(a.teen,{action:'drive.manual',householdId:a.householdId,teenId:a.teen.id,supervisorId:a.parent.id,skill:'Parking',supervisorEligible:true,startedAt:'2026-01-01T12:00:00.000Z',minutes:30,nightMinutes:10,note:''},randomUUID()) as {result:{id:string}};execute(a.parent,{action:'drive.review',householdId:a.householdId,id:d.result.id,decision:'confirm',reason:''},randomUUID());expect(readLegacyLearning(a.teen).state.logs[0]).toMatchObject({minutes:30,nightMinutes:10,status:'verified'})});
