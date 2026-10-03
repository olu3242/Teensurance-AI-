import {describe,it,expect} from 'vitest';
import {buildStateRuleDraft,validateStatePackageDraft,type StatePackageDraft} from './state-package-factory';

const california:StatePackageDraft={
 jurisdiction:'CA',stateName:'California',authorityLabel:'California DMV',
 sourceTitle:'California DMV teen driver source',sourceUrl:'https://www.dmv.ca.gov/',
 effectiveFrom:'2026-10-03',validUntil:'2027-01-03T00:00:00Z',reviewedAt:'2026-10-03T00:00:00Z',
 version:'2026-10-03.1',
 legalRequirements:[{id:'ca-example',kind:'review',label:'Source-backed requirement placeholder for review.'}],
 minimumAge:16,holdingMonths:6,totalMinutes:3000,nightMinutes:600,requiredEvidence:['documents','test']
};

describe('state package factory',()=>{
 it('builds a valid state package as draft only',()=>{
  const rule=buildStateRuleDraft(california);
  expect(rule.jurisdiction).toBe('CA');
  expect(rule.lifecycleStatus).toBe('draft');
  expect(rule.reviewedBy).toContain('Pending human');
 });
 it('rejects states outside the 50-state catalog',()=>{
  const result=validateStatePackageDraft({...california,jurisdiction:'OTHER',stateName:'Other'});
  expect(result.valid).toBe(false);
  expect(result.errors.join(' ')).toContain('50 supported');
 });
 it('rejects mismatched state identity and unsafe source metadata',()=>{
  const result=validateStatePackageDraft({...california,stateName:'Texas',sourceUrl:'http://example.com'});
  expect(result.valid).toBe(false);
  expect(result.errors).toContain('State name must match the jurisdiction catalog.');
  expect(result.errors).toContain('Official source URL must use HTTPS.');
 });
 it('rejects internally impossible practice requirements',()=>{
  const result=validateStatePackageDraft({...california,totalMinutes:300,nightMinutes:600});
  expect(result.valid).toBe(false);
  expect(result.errors).toContain('Night practice cannot exceed total practice.');
 });
});
