import {describe,expect,it} from 'vitest';
import {insuranceGapRegistry,gapRegistrySummary} from './gap-registry';
import {insuranceAgentRegistry} from './agents';
import {insuranceWorkflowRegistry} from './workflows';
import {insuranceTriggerRegistry} from './triggers';

describe('insurance gap capability registry',()=>{
  it('maps every gap to an agent, trigger, workflow, evidence, KPI, and status',()=>{
    expect(insuranceGapRegistry).toHaveLength(14);
    for(const gap of insuranceGapRegistry){
      expect(insuranceAgentRegistry.some(agent=>agent.id===gap.ownerAgent),gap.id+' agent').toBe(true);
      expect(insuranceWorkflowRegistry.some(workflow=>workflow.id===gap.workflow),gap.id+' workflow').toBe(true);
      expect(gap.evidence.length,gap.id+' evidence').toBeGreaterThan(0);
      expect(gap.kpis.length,gap.id+' KPI').toBeGreaterThan(0);
      expect(gap.status,gap.id+' status').toBe('IMPLEMENTED');
    }
  });

  it('requires 100 percent validated-gap implementation coverage for release',()=>{
    const summary=gapRegistrySummary();
    expect(summary).toEqual({total:14,implemented:14,partial:0,planned:0,coveragePercent:100});
  });

  it('keeps implemented insurance triggers governed by a registered workflow and agent',()=>{
    for(const trigger of insuranceTriggerRegistry){
      expect(insuranceAgentRegistry.some(agent=>agent.id===trigger.agent),trigger.id+' agent').toBe(true);
      expect(insuranceWorkflowRegistry.some(workflow=>workflow.id===trigger.workflow),trigger.id+' workflow').toBe(true);
    }
  });
});
