import {readdirSync,readFileSync,statSync} from 'node:fs';
import {join,relative} from 'node:path';

const root=process.cwd();
const allowed=[
  /^lib\/roadready\//,
  /^app\/api\/roadready\//,
  /^app\/teen\/roadready\//,
  /^app\/admin\/roadready\//,
  /^public\/roadready\//,
  /^docs\/ROADREADY_/,
  /^docs\/screenshots\/roadready-/,
  /^e2e\/roadready\.spec\.ts$/,
  /^playwright\.roadready\.config\.ts$/,
  /^scripts\/roadready-/,
  /^components\/RoadReady/,
  /^lib\/platform\/migrations\/002-roadready\.ts$/,
  /^docs\/IP_PROVENANCE_POLICY\.md$/,
  /^package\.json$/,
  /^README\.md$/,
  /^\.env\.example$/,
];
const ignored=new Set(['.git','node_modules','.next','.next-cert-build']);
const violations=[];
function walk(dir){
  for(const name of readdirSync(dir)){
    if(ignored.has(name))continue;
    const full=join(dir,name);
    const rel=relative(root,full).replaceAll('\\','/');
    const st=statSync(full);
    if(st.isDirectory()){walk(full);continue}
    if(allowed.some(p=>p.test(rel)))continue;
    if(!/\.(ts|tsx|js|mjs|cjs|json|md|yml|yaml|css)$/.test(rel))continue;
    const text=readFileSync(full,'utf8');
    if(/RoadReady|roadready|ROADREADY/.test(text))violations.push(rel);
  }
}
walk(root);
if(violations.length){
  console.error('Legacy RoadReady identifiers found outside approved compatibility/persistence locations:');
  for(const file of violations)console.error(`- ${file}`);
  process.exit(1);
}
console.log('Legacy RoadReady namespace guard passed.');
