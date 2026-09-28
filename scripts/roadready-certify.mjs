import {spawnSync} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
const cli=process.env.npm_execpath;
if(!cli)throw new Error('Run with npm run roadready:certify');
const gates=[['security:certify'],['typecheck'],['lint'],['test','--','--reporter=json','--outputFile=docs/ROADREADY_TEST_RESULTS.json'],['build'],['test:roadready:e2e'],['test:e2e','--','household.spec.ts']];
const results=[];
for(const [script,...args] of gates){const start=Date.now();const result=spawnSync(process.execPath,[cli,'run',script,...args],{stdio:'inherit',env:script==='build'?{...process.env,NEXT_DIST_DIR:'.next-cert-build'}:process.env});results.push({script,exitCode:result.status,error:result.error?.message,durationMs:Date.now()-start});}
mkdirSync('docs',{recursive:true});writeFileSync('docs/ROADREADY_CERTIFICATION.json',JSON.stringify({at:new Date().toISOString(),scope:'Automated checks only; separate security review and hosted release gates are required',status:results.every(r=>r.exitCode===0)?'AUTOMATED_GATES_PASSED':'BLOCKED',gates:results},null,2));
process.exitCode=results.every(r=>r.exitCode===0)?0:1;
