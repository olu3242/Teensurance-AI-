import {spawnSync} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
const cli=process.env.npm_execpath;if(!cli)throw new Error('Run with npm run insurance:certify');
const gates=[['typecheck'],['lint'],['test','--','lib/insurance'],['insurance:architecture:certify'],['build:cert'],['test:insurance:e2e']];
const results=[];
for(const [script,...args] of gates){const start=Date.now();const result=spawnSync(process.execPath,[cli,'run',script,...args],{stdio:'inherit',env:process.env});results.push({script,exitCode:result.status,error:result.error?.message,durationMs:Date.now()-start});if(result.status!==0)break}
mkdirSync('docs',{recursive:true});const passed=results.length===gates.length&&results.every(r=>r.exitCode===0);writeFileSync('docs/INSURANCE_CERTIFICATION.json',JSON.stringify({at:new Date().toISOString(),scope:'AI-native insurance production certification: 14/14 gap controls, agent/runtime/workflow/trigger architecture, quote, comparison, guardian selection, carrier-controlled bind and lifecycle, value evidence, notifications, recovery, renewal, authorization, replay protection, build and E2E.',status:passed?'AUTOMATED_GATES_PASSED':'BLOCKED',gates:results},null,2));process.exitCode=passed?0:1;
