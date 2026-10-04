import {describe,expect,it} from 'vitest';
import {insuranceGapRegistry,gapRegistrySummary} from './gap-registry';
describe('insurance gap capability registry',()=>{
 it('maps every gap to an agent, trigger, workflow, evidence, KPI, and status',()=>{
  expect(insuranceGapRegistry.length).toBeGreaterThan(10);
  for(const gap of insuranceGapRegistry){expect(gap.ownerAgent).toBeTruthy();expect(gap.trigger).toBeTruthy();expect(gap.workflow).toBeTruthy();expect(gap.evidence.length).toBeGreaterThan(0);expect(gap.kpis.length).toBeGreaterThan(0);expect(gap.status).toBeTruthy()}
 });
 it('reports measurable implementation coverage',()=>{const summary=gapRegistrySummary();expect(summary.total).toBe(insuranceGapRegistry.length);expect(summary.coveragePercent).toBeGreaterThan(70)});
});
