import {writeFileSync,mkdirSync} from 'node:fs';
import {insuranceAgentRegistry} from '../lib/insurance/agents';
import {insuranceWorkflowRegistry} from '../lib/insurance/workflows';
import {insuranceTriggerRegistry} from '../lib/insurance/triggers';
import {insuranceGapRegistry,gapRegistrySummary} from '../lib/insurance/gap-registry';

const requiredAgents=['T','GUARD','COVER','QUOTE','MATCH','BIND','POLICY','SAVE','RENEW','SIGNAL'];
const requiredControls=[
  'guardian-controlled quote/select/bind decisions',
  'carrier provenance for authoritative coverage lifecycle',
  'readiness evidence separated from underwriting',
  'bounded retry and dead-letter recovery',
  'admin replay without purchase authority'
];
const missingAgents=requiredAgents.filter(id=>!insuranceAgentRegistry.some(agent=>agent.id===id));
const gapSummary=gapRegistrySummary();
const orphanTriggers=insuranceTriggerRegistry.filter(trigger=>!insuranceWorkflowRegistry.some(workflow=>workflow.id===trigger.workflow)||!insuranceAgentRegistry.some(agent=>agent.id===trigger.agent));
const failedGaps=insuranceGapRegistry.filter(gap=>gap.status!=='IMPLEMENTED');
const passed=missingAgents.length===0&&orphanTriggers.length===0&&failedGaps.length===0&&gapSummary.total===14&&gapSummary.coveragePercent===100;
const report={
  at:new Date().toISOString(),
  status:passed?'CERTIFIED':'BLOCKED',
  architecture:'Trigger -> GUARD -> versioned workflow -> specialist agent -> orchestrator -> deterministic domain/carrier service -> evidence/audit -> next trigger',
  agents:insuranceAgentRegistry.map(agent=>({id:agent.id,name:agent.name,authority:agent.authority})),
  workflows:insuranceWorkflowRegistry.map(workflow=>({id:workflow.id,version:workflow.version})),
  triggers:insuranceTriggerRegistry.map(trigger=>({id:trigger.id,priority:trigger.priority,agent:trigger.agent,workflow:trigger.workflow})),
  gapControls:{...gapSummary,failed:failedGaps.map(gap=>gap.id)},
  authorityControls:requiredControls,
  findings:{missingAgents,orphanTriggers:orphanTriggers.map(trigger=>trigger.id)}
};
mkdirSync('docs',{recursive:true});
writeFileSync('docs/AI_NATIVE_INSURANCE_CERTIFICATION.json',JSON.stringify(report,null,2));
if(!passed)process.exitCode=1;
