import {afterEach,beforeEach,expect,it} from 'vitest';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {closeDatabases} from '@/lib/platform/db';
import * as route from './route';

let dir:string;
beforeEach(()=>{dir=mkdtempSync(join(tmpdir(),'insurance-impact-http-'));process.env.TEENSURANCE_DB_PATH=join(dir,'test.sqlite')});
afterEach(async()=>{await closeDatabases();delete process.env.TEENSURANCE_DB_PATH;rmSync(dir,{recursive:true,force:true})});

it('requires authentication for insurance-impact reads and writes',async()=>{
  const getResponse=await route.GET(new Request('http://localhost/api/insurance/impact?householdId=x&teenId=y'));
  expect(getResponse.status).toBe(401);
  const postResponse=await route.POST(new Request('http://localhost/api/insurance/impact',{method:'POST',headers:{origin:'http://localhost','content-type':'application/json'},body:'{}'}));
  expect(postResponse.status).toBe(401);
  expect(getResponse.headers.get('cache-control')).toBe('no-store');
});
