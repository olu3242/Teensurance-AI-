import {afterEach,beforeEach,describe,expect,it} from 'vitest';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {register} from '@/lib/platform/auth';
import {all,closeDatabases,put} from '@/lib/platform/db';
import {coverAdminOverview,createCoverIncident,updateCoverIncident} from './cover-admin';

let dir:string;

beforeEach(()=>{
 dir=mkdtempSync(join(tmpdir(),'cover-admin-'));
 process.env.TEENSURANCE_DB_PATH=join(dir,'db.sqlite');
});

afterEach(async()=>{
 await closeDatabases();
 delete process.env.TEENSURANCE_DB_PATH;
 delete process.env.TEENSURANCE_ADMIN_USER_IDS;
 rmSync(dir,{recursive:true,force:true});
});

describe('COVER admin operations',()=>{
 it('triages operational incidents without changing guardian-owned handoff state',async()=>{
  const admin=await register('cover-admin@example.test','long-password-123','Cover Admin');
  const owner=await register('cover-owner@example.test','long-password-123','Cover Owner');
  const householdId='cover-household-1';
  const handoffId='handoff-1';

  await put('save_cover_handoff',{
   id:handoffId,householdId,ownerId:owner.id,quoteId:'quote-1',provider:'Carrier Example',
   annualPremium:1800,coverageFingerprint:'same-coverage',status:'prepared',
   createdAt:'2026-10-01T00:00:00.000Z',updatedAt:'2026-10-01T00:00:00.000Z',
   disclaimer:'Guardian/licensed-channel decision only.'
  });

  await expect(coverAdminOverview(admin)).rejects.toThrow('Administrator');

  process.env.TEENSURANCE_ADMIN_USER_IDS=admin.id;
  const incident=await createCoverIncident(admin,{
   householdId,handoffId,category:'stuck_handoff',severity:'warning',
   summary:'Prepared handoff requires operational review.'
  });
  const duplicate=await createCoverIncident(admin,{
   householdId,handoffId,category:'stuck_handoff',severity:'warning',
   summary:'Duplicate request should be suppressed.'
  });
  expect(duplicate.id).toBe(incident.id);

  const acknowledged=await updateCoverIncident(admin,{householdId,incidentId:incident.id,action:'acknowledge'});
  expect(acknowledged.status).toBe('acknowledged');

  const resolved=await updateCoverIncident(admin,{householdId,incidentId:incident.id,action:'resolve'});
  expect(resolved.status).toBe('resolved');

  const overview=await coverAdminOverview(admin,householdId);
  expect(overview.summary.total).toBe(1);
  expect(overview.summary.openIncidents).toBe(0);
  expect(overview.incidents[0].status).toBe('resolved');

  const handoff=(await all<{id:string;status:string;ownerId:string}>('save_cover_handoff',householdId))[0];
  expect(handoff).toMatchObject({id:handoffId,status:'prepared',ownerId:owner.id});
 });
});
