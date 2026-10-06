import {afterEach,beforeEach,describe,expect,it} from 'vitest';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {register} from '@/lib/platform/auth';
import {closeDatabases,put} from '@/lib/platform/db';
import {saveAdminOperations} from './admin-ops';

let dir:string;

beforeEach(()=>{
 dir=mkdtempSync(join(tmpdir(),'save-admin-'));
 process.env.TEENSURANCE_DB_PATH=join(dir,'db.sqlite');
});

afterEach(async()=>{
 await closeDatabases();
 delete process.env.TEENSURANCE_DB_PATH;
 delete process.env.TEENSURANCE_ADMIN_USER_IDS;
 rmSync(dir,{recursive:true,force:true});
});

describe('SAVE platform admin operations',()=>{
 it('rejects non-admin and returns redacted household operations to configured admin',async()=>{
  const admin=await register('save-admin-unit@example.test','long-password-123','SAVE Admin');
  const owner=await register('save-owner-unit@example.test','long-password-123','SAVE Owner');

  await expect(saveAdminOperations(admin)).rejects.toThrow('Administrator');

  process.env.TEENSURANCE_ADMIN_USER_IDS=admin.id;
  const householdId='household-save-admin-test';

  await put('save_policy_baseline',{
   id:'baseline-1',householdId,ownerId:owner.id,carrierName:'Carrier A',annualPremium:2400,
   renewalDate:'2026-12-15',coverageFingerprint:'same-coverage',deductible:500,drivers:2,vehicles:1,
   currentDiscounts:[],source:'manual',capturedAt:'2026-10-01T00:00:00.000Z'
  });
  await put('save_quote',{
   id:'quote-1',householdId,ownerId:owner.id,provider:'Carrier B',annualPremium:1800,
   coverageFingerprint:'same-coverage',source:'quote',capturedAt:'2026-10-02T00:00:00.000Z'
  });
  await put('save_ledger',{
   id:'ledger-1',householdId,ownerId:owner.id,baselineId:'baseline-1',quoteId:'quote-1',
   previousAnnualPremium:2400,newAnnualPremium:1800,annualSavings:600,
   coverageFingerprint:'same-coverage',status:'verified',verifiedAt:'2026-10-02T00:00:00.000Z'
  });
  await put('save_consent',{
   id:'consent-1',householdId,ownerId:owner.id,type:'marketplace',granted:true,
   version:'save-consent-v1',recordedAt:'2026-10-01T00:00:00.000Z'
  });
  await put('save_vehicle',{
   id:'vehicle-1',householdId,ownerId:owner.id,vin:'1HGCM82633A123456',
   make:'Example',model:'Sedan',modelYear:2024
  });
  await put('save_policy_extraction',{
   id:'extract-1',householdId,ownerId:owner.id,status:'REQUIRES_REVIEW',
   createdAt:'2026-10-01T00:00:00.000Z',
   extraction:{rawText:'sensitive policy text',policyNumber:'SECRET-123'}
  });

  const summary=await saveAdminOperations(admin);
  expect(summary.mode).toBe('summary');
  if(summary.mode!=='summary')throw new Error('Expected summary');
  expect(summary.households).toHaveLength(1);
  expect(summary.households[0]).toMatchObject({householdId,verifiedAnnualSavings:600,policyReviewPending:true});

  const detail=await saveAdminOperations(admin,householdId);
  expect(detail.mode).toBe('household');
  if(detail.mode!=='household')throw new Error('Expected household');
  expect(detail.verifiedAnnualSavings).toBe(600);
  expect(detail.vehicles[0].vin).toBe('••••3456');
  expect(JSON.stringify(detail.policyExtractions)).not.toContain('sensitive policy text');
  expect(JSON.stringify(detail.policyExtractions)).not.toContain('SECRET-123');
 });
});
