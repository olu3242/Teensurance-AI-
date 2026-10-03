import {describe,it,expect} from 'vitest';
import {jurisdictionRules,normalizeJurisdiction,ruleForJurisdiction} from './jurisdictions';

describe('national jurisdiction registry',()=>{
 it('normalizes state aliases without inventing unsupported rules',()=>{
  expect(normalizeJurisdiction('US-TX')).toBe('TX');
  expect(normalizeJurisdiction('pa')).toBe('PA');
  expect(ruleForJurisdiction('CA',jurisdictionRules,new Date('2026-10-03'))).toBeUndefined();
 });
 it('loads reviewed Texas and Pennsylvania adapters',()=>{
  const tx=ruleForJurisdiction('US-TX',jurisdictionRules,new Date('2026-10-03'))!;
  const pa=ruleForJurisdiction('PA',jurisdictionRules,new Date('2026-10-03'))!;
  expect(tx.totalMinutes).toBe(1800);
  expect(tx.nightMinutes).toBe(600);
  expect(pa.totalMinutes).toBe(3900);
  expect(pa.nightMinutes).toBe(600);
  expect(pa.weatherMinutes).toBe(300);
  expect(pa.sourceUrl).toContain('pa.gov');
 });
});
