import {afterEach,beforeEach,expect,it} from 'vitest';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import * as scout from './route';
import * as legacy from '../roadready/route';
import {closeDatabases} from '@/lib/platform/db';

let dir:string;
beforeEach(()=>{
  dir=mkdtempSync(join(tmpdir(),'scout-http-'));
  process.env.TEENSURANCE_DB_PATH=join(dir,'test.sqlite');
  process.env.SCOUT_LEARNING_ENABLED='true';
});
afterEach(()=>{
  closeDatabases();
  delete process.env.TEENSURANCE_DB_PATH;
  delete process.env.SCOUT_LEARNING_ENABLED;
  rmSync(dir,{recursive:true,force:true});
});

it('matches the legacy authentication boundary for reads',async()=>{
  const scoutResponse=await scout.GET(new Request('http://localhost/api/scout?role=guardian&teenId=someone'));
  const legacyResponse=await legacy.GET(new Request('http://localhost/api/roadready?role=guardian&teenId=someone'));
  expect(scoutResponse.status).toBe(legacyResponse.status);
  expect(scoutResponse.status).toBe(401);
  expect(scoutResponse.headers.get('cache-control')).toBe('no-store');
});

it('matches the legacy invalid-command boundary for writes',async()=>{
  const headers={origin:'http://localhost','content-type':'application/json'};
  const scoutResponse=await scout.POST(new Request('http://localhost/api/scout',{method:'POST',headers,body:'{}'}));
  const legacyResponse=await legacy.POST(new Request('http://localhost/api/roadready',{method:'POST',headers,body:'{}'}));
  expect(scoutResponse.status).toBe(legacyResponse.status);
  expect(scoutResponse.status).toBe(401);
});
