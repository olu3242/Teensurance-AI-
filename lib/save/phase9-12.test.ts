import {describe,expect,it} from 'vitest';
import {runSavingsScenario} from './scenario';
import {evaluateRenewalWatch} from './renewal';
import {configuredCarrierAdapters} from './carriers';
import {renewalNotice,savingsOpportunityNotice} from './notification-content';

describe('SAVE phases 9-12',()=>{
 it('keeps what-if scenarios unverified',()=>{
  const result=runSavingsScenario({baseline:{householdId:'h',annualPremium:5000,deductible:1000,coverageFingerprint:'same',drivers:3,vehicles:2,currentDiscounts:[],source:'document',capturedAt:'2026-09-01'},proposed:{annualPremium:4400,coverageFingerprint:'same'},source:'estimate'});
  expect(result.projectedDifference).toBe(600);expect(result.verified).toBe(false);
 });
 it('marks changed coverage non-comparable',()=>{
  const result=runSavingsScenario({baseline:{householdId:'h',annualPremium:5000,coverageFingerprint:'a',drivers:3,vehicles:2,currentDiscounts:[],source:'document',capturedAt:'2026-09-01'},proposed:{annualPremium:4000,coverageFingerprint:'b'},source:'quote'});
  expect(result.comparable).toBe(false);
 });
 it('creates a 30-day renewal event',()=>{
  const watch=evaluateRenewalWatch({householdId:'h',renewalDate:'2026-10-20',drivers:3,vehicles:2,currentDiscounts:[],source:'document',capturedAt:'2026-09-01'},new Date('2026-09-29T12:00:00Z'));
  expect(watch.event?.type).toBe('policy.renewal_30_days');expect(watch.shouldNotify).toBe(true);
 });
 it('requires explicit carrier adapter configuration',()=>expect(configuredCarrierAdapters([])).toHaveLength(0));
 it('labels opportunity notices without guaranteeing savings',()=>expect(savingsOpportunityNotice('Evidence changed.','Review it.').message).toContain('not a guaranteed discount'));
 it('keeps renewal action with the family',()=>expect(renewalNotice(30).message).toContain('remains your decision'));
});
