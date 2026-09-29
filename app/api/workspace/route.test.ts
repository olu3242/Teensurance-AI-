import {beforeEach,afterEach,describe,it,expect} from 'vitest';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {register,createSession} from '@/lib/platform/auth';
import {closeDatabases} from '@/lib/platform/db';
import {GET,POST} from './route';
import {sameOrigin} from '@/lib/platform/http';
let dir:string;
beforeEach(()=>{dir=mkdtempSync(join(tmpdir(),'teensurance-http-'));process.env.TEENSURANCE_DB_PATH=join(dir,'http.sqlite')});
afterEach(async ()=>{(await closeDatabases());delete process.env.TEENSURANCE_DB_PATH;rmSync(dir,{recursive:true,force:true})});
describe('authenticated workspace HTTP boundary',()=>{
 it('accepts the real local Host when Next normalizes its internal URL',()=>{expect(()=>sameOrigin(new Request('http://localhost:3100/api/workspace',{headers:{host:'127.0.0.1:3100',origin:'http://127.0.0.1:3100','content-type':'application/json'}}))).not.toThrow();expect(()=>sameOrigin(new Request('http://localhost:3100/api/workspace',{headers:{host:'127.0.0.1:3100',origin:'https://evil.test','content-type':'application/json'}}))).toThrow()});
 it('rejects unauthenticated reads, cross-origin writes and injected roles',async()=>{
  expect((await GET(new Request('http://localhost/api/workspace'))).status).toBe(401);
  const user=(await register('http@example.test','long-password-123','HTTP User'));const token=(await createSession(user));
  const send=async (origin:string,body:unknown)=>(await POST(new Request('http://localhost/api/workspace',{method:'POST',headers:{origin,'content-type':'application/json',cookie:`teensurance_session=${token}`,'idempotency-key':randomUUID()},body:JSON.stringify(body)})));
  expect((await send('https://evil.test',{action:'household.create',name:'Family',adultAttestation:true})).status).toBe(403);
  expect((await send('http://localhost',{action:'household.create',name:'Family',adultAttestation:true,role:'guardian'})).status).toBe(400);
  const created=await send('http://localhost',{action:'household.create',name:'Family',adultAttestation:true});expect(created.status).toBe(200);
  const current=await GET(new Request('http://localhost/api/workspace',{headers:{cookie:`teensurance_session=${token}`}}));expect(current.status).toBe(200);expect((await current.json()).membership.role).toBe('guardian');
 });
});
