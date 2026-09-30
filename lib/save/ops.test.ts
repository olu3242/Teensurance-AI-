import {describe,expect,it} from 'vitest';
import {evaluateRenewalWatch} from './renewal';

describe('SAVE operations',()=>{
 it('does not notify outside the renewal window',()=>{
  const r=evaluateRenewalWatch({householdId:'h',renewalDate:'2027-03-01',drivers:2,vehicles:1,currentDiscounts:[],source:'manual',capturedAt:'2026-09-29'},new Date('2026-09-29T12:00:00Z'));
  expect(r.shouldNotify).toBe(false);
 });
 it('creates a renewal trigger inside sixty days',()=>{
  const r=evaluateRenewalWatch({householdId:'h',renewalDate:'2026-11-15',drivers:2,vehicles:1,currentDiscounts:[],source:'manual',capturedAt:'2026-09-29'},new Date('2026-09-29T12:00:00Z'));
  expect(r.shouldNotify).toBe(true);expect(r.event?.type).toBe('policy.renewal_60_days');
 });
});
