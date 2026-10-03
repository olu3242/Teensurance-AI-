import {describe,it,expect} from 'vitest';
import {stateRolloutManifest,stateRolloutSummary} from './state-rollout';

describe('state rollout manifest',()=>{
 it('reports all 50 selectable states while separating legal readiness',()=>{
  const items=stateRolloutManifest([],new Date('2026-10-03T12:00:00Z'));
  expect(items).toHaveLength(50);
  expect(items.every(x=>x.selectable)).toBe(true);
  expect(items.find(x=>x.code==='TX')?.legalGuidanceReady).toBe(true);
  expect(items.find(x=>x.code==='PA')?.legalGuidanceReady).toBe(true);
  expect(items.find(x=>x.code==='CA')).toMatchObject({status:'pending',legalGuidanceReady:false});
 });
 it('summarizes governed legal coverage rather than selector coverage',()=>{
  const summary=stateRolloutSummary(stateRolloutManifest([],new Date('2026-10-03T12:00:00Z')));
  expect(summary).toEqual({total:50,published:2,pending:48,needsAttention:0,coveragePercent:4});
 });
 it('flags expired reviewed packages as needing attention',()=>{
  const items=stateRolloutManifest([],new Date('2027-01-02T12:00:00Z'));
  expect(items.find(x=>x.code==='TX')?.status).toBe('stale');
  expect(items.find(x=>x.code==='PA')?.status).toBe('stale');
  expect(stateRolloutSummary(items).needsAttention).toBe(2);
 });
});
