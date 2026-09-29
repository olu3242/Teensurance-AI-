import {readdirSync,readFileSync,statSync} from 'node:fs';
import {join,relative} from 'node:path';

const root=process.cwd();

// Grandfathered legacy locations plus exact compatibility references required
// during the Scout strangler migration. New files are not implicitly allowed.
const allowedPatterns=[
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
];

const allowedExact=new Set([
  '.env.example',
  '.github/workflows/scout-certify.yml',
  'AGENTS.md',
  'README.md',
  'app/admin/page.tsx',
  'app/api/scout/intelligence/route.test.ts',
  'app/api/scout/route.test.ts',
  'app/teen/scout/page.tsx',
  'components/ScoutIntelligence.tsx',
  'components/ScoutLearning.tsx',
  'docs/AI_STRATEGY.md',
  'docs/ARCHITECTURE.md',
  'docs/BRD.md',
  'docs/IP_PROVENANCE_POLICY.md',
  'lib/platform/agents.ts',
  'lib/scout/intelligence-service.ts',
  'lib/scout/service.ts',
  'package.json',
  'playwright.config.ts',
  'scripts/check-legacy-roadready.mjs',
  'tsconfig.json',
]);

const ignored=new Set(['.git','node_modules','.next','.next-cert-build']);
const violations=[];

function isAllowed(rel){
  return allowedExact.has(rel)||allowedPatterns.some(pattern=>pattern.test(rel));
}

function walk(dir){
  for(const name of readdirSync(dir)){
    if(ignored.has(name))continue;
    const full=join(dir,name);
    const rel=relative(root,full).replaceAll('\\','/');
    const st=statSync(full);
    if(st.isDirectory()){walk(full);continue}
    if(isAllowed(rel))continue;
    if(!/\.(ts|tsx|js|mjs|cjs|json|md|yml|yaml|css)$/.test(rel))continue;
    const source=readFileSync(full,'utf8');
    if(/RoadReady|roadready|ROADREADY/.test(source))violations.push(rel);
  }
}

walk(root);

if(violations.length){
  console.error('Legacy RoadReady identifiers found outside the approved migration baseline:');
  for(const file of violations)console.error(`- ${file}`);
  console.error('Use Scout-owned naming for new code. Extend the baseline only for a documented compatibility requirement.');
  process.exit(1);
}

console.log('Legacy RoadReady namespace guard passed.');
