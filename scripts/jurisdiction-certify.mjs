import {spawnSync} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
const cli=process.env.npm_execpath;if(!cli)throw new Error('Run with npm run jurisdiction:certify');
const gates=[
 ['typecheck'],
 ['lint'],
 ['test','--','lib/platform/jurisdictions.test.ts','lib/platform/legal-rule-lifecycle.test.ts','lib/platform/state-experience.test.ts','lib/platform/state-package-factory.test.ts','lib/platform/state-rollout.test.ts','lib/platform/legal-source-queue.test.ts','lib/platform/practice.test.ts','lib/platform/practice-e2e.test.ts','lib/platform/journey.test.ts','lib/platform/service.test.ts','lib/roadready/intelligence.test.ts','app/api/scout/intelligence/route.test.ts'],
 ['build'],
 ['test:roadready:e2e'],
];
const results=[];
for(const [name,...args] of gates){
 const start=Date.now();const env=name==='build'?{...process.env,NEXT_DIST_DIR:'.next-jurisdiction-cert'}:process.env;
 const runEnv=name==='test:roadready:e2e'?{...env,ROADREADY_E2E_DB_PATH:`${process.cwd()}/test-results/jurisdiction-browser-${Date.now()}.sqlite`}:env;
 const r=spawnSync(process.execPath,[cli,'run',name,...args],{stdio:'inherit',env:runEnv});
 results.push({name,exitCode:r.status,error:r.error?.message,durationMs:Date.now()-start});
 if(r.status!==0)break;
}
mkdirSync('docs',{recursive:true});
const passed=results.length===gates.length&&results.every(r=>r.exitCode===0);
writeFileSync('docs/JURISDICTION_CERTIFICATION.json',JSON.stringify({at:new Date().toISOString(),scope:'50-state selectable jurisdiction catalog with fail-closed legal guidance; Texas and Pennsylvania reviewed rule packages; verified practice evidence, Passport projection, Scout guidance, authorization regressions, and browser journeys. Pending states never receive invented legal requirements. New state packages must pass the draft factory before human review and lifecycle publication. Legal/human review remains separate.',status:passed?'AUTOMATED_GATES_PASSED':'BLOCKED',gates:results},null,2));
process.exitCode=passed?0:1;
