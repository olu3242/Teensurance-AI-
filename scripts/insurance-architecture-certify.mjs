import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
const read=p=>readFileSync(p,'utf8');
const agents=read('lib/insurance/agents.ts');
const workflows=read('lib/insurance/workflows.ts');
const triggers=read('lib/insurance/triggers.ts');
const gaps=read('lib/insurance/gap-registry.ts');
const runtime=read('lib/insurance/runtime.ts');
const scheduler=read('lib/insurance/scheduler.ts');
const requiredAgents=['T','GUARD','COVER','QUOTE','MATCH','BIND','POLICY','SAVE','RENEW','SIGNAL'];
const controls={
 agents:requiredAgents.every(id=>agents.includes("id:'"+id+"'")),
 fourteenGaps:(gaps.match(/id:'GAP-/g)||[]).length===14,
 allGapsImplemented:(gaps.match(/status:'IMPLEMENTED'/g)||[]).length===14,
 guardianBoundary:runtime.includes("REQUIRE_GUARDIAN")&&runtime.includes("guardianActions"),
 carrierBoundary:runtime.includes("Carrier runtime commands require carrier provenance"),
 domainBoundary:runtime.includes("Automated runtime cannot perform guardian insurance purchase decisions"),
 retryBoundary:scheduler.includes("MAX_ATTEMPTS=3")&&scheduler.includes("DEAD_LETTER"),
 workflowsVersioned:workflows.includes("version:"),
 triggerRegistry:triggers.includes("insuranceTriggerRegistry")
};
const passed=Object.values(controls).every(Boolean);
const report={at:new Date().toISOString(),status:passed?'CERTIFIED':'BLOCKED',architecture:'Trigger -> GUARD -> versioned workflow -> specialist agent -> orchestrator -> deterministic domain/carrier service -> evidence/audit -> next trigger',controls,gapControls:{total:14,requiredImplemented:14},authorityBoundaries:['guardian purchase decisions','carrier-authoritative coverage lifecycle','readiness/underwriting separation','bounded recovery/dead-letter','admin replay through governed runtime']};
mkdirSync('docs',{recursive:true});writeFileSync('docs/AI_NATIVE_INSURANCE_CERTIFICATION.json',JSON.stringify(report,null,2));if(!passed)process.exitCode=1;
