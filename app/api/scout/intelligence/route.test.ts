import {expect,it} from 'vitest';
import * as scout from './route';
import * as legacy from '../../roadready/intelligence/route';

it('keeps Scout and legacy intelligence authentication behavior aligned',async()=>{
  const headers={'x-role':'guardian','x-user-id':'forged',origin:'http://localhost','content-type':'application/json'};
  const scoutGet=await scout.GET(new Request('http://localhost/api/scout/intelligence?householdId=forged',{headers}));
  const legacyGet=await legacy.GET(new Request('http://localhost/api/roadready/intelligence?householdId=forged',{headers}));
  expect(scoutGet.status).toBe(legacyGet.status);
  expect(scoutGet.status).toBe(401);

  const scoutPost=await scout.POST(new Request('http://localhost/api/scout/intelligence',{method:'POST',headers,body:'{}'}));
  const legacyPost=await legacy.POST(new Request('http://localhost/api/roadready/intelligence',{method:'POST',headers,body:'{}'}));
  expect(scoutPost.status).toBe(legacyPost.status);
  expect(scoutPost.status).toBe(401);
});
