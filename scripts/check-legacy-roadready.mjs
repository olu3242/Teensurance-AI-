import {readFileSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {join} from 'node:path';

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
  // Integrated persistence compatibility: existing evidence kinds, migration
  // tests and historical certification paths must retain their identifiers.
  // See docs/SCOUT_PERSISTENCE_COMPATIBILITY.md for the bounded exceptions.
  '.github/workflows/w30-w40-certify.yml',
  'docs/HOSTED_PERSISTENCE_ARCHITECTURE.md',
  'docs/SCOUT_TEST_RESULTS.json',
  'docs/SCOUT_CERTIFICATION.json',
  'next-env.d.ts', // Generated route-type reference may name a legacy test build directory.
  'lib/platform/operations.ts',
  'validation/content-review.test.ts',
  'validation/persistence.test.ts',
  'vitest.postgres.config.ts',
  'lib/scout/review-service.ts',
  'app/admin/scout/page.tsx',

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

const violations=[];
function isAllowed(rel){return allowedExact.has(rel)||allowedPatterns.some(pattern=>pattern.test(rel))}
// Check tracked and new source files; exclude ignored build artifacts and local data.
const files=execFileSync('git',['ls-files','--cached','--others','--exclude-standard','-z'],{encoding:'utf8'}).split('\0').filter(Boolean);
for(const rel of new Set(files)){
 if(isAllowed(rel)||! /\.(ts|tsx|js|mjs|cjs|json|md|yml|yaml|css)$/.test(rel))continue;
 const full=join(root,rel);if(!existsSync(full))continue;
 if(/RoadReady|roadready|ROADREADY/.test(readFileSync(full,'utf8')))violations.push(rel);
}

if(violations.length){
  console.error('Legacy RoadReady identifiers found outside the approved migration baseline:');
  for(const file of violations)console.error(`- ${file}`);
  console.error('Use Scout-owned naming for new code. Extend the baseline only for a documented compatibility requirement.');
  process.exit(1);
}

console.log('Legacy RoadReady namespace guard passed.');
