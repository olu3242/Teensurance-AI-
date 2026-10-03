import {readFileSync} from 'node:fs';

const globals=readFileSync(new URL('../app/globals.css',import.meta.url),'utf8');
const landing=readFileSync(new URL('../app/landing.css',import.meta.url),'utf8');
const workspace=readFileSync(new URL('../app/pilot/workspace.css',import.meta.url),'utf8');

const checks=[
  ['canonical token',globals.includes('--brand-lime: #ceff59;')],
  ['global brand mark',/\.brandMark, \.driveMark[^}]*background: var\(--brand-lime\)/.test(globals)],
  ['shared logo mark',/\.brandLogoMark,\.brandLoaderMark[^}]*background:var\(--brand-lime\)/.test(globals)],
  ['inverse shared logo mark',/\.brandLogoInverse \.brandLogoMark\{background:var\(--brand-lime\)\}/.test(globals)],
  ['brand loader mark',/\.brandLoaderMark\{[^}]*background:var\(--brand-lime\)/.test(globals)],
  ['landing mark',/\.landing-mark[^}]*background: var\(--brand-lime\)/.test(landing)],
  ['pilot onboarding mark',/\.onboarding \.brandMark\{background:var\(--brand-lime\)\}/.test(workspace)]
];

const failed=checks.filter(([,ok])=>!ok);
if(failed.length){
  console.error('Brand certification failed:',failed.map(([name])=>name).join(', '));
  process.exit(1);
}
console.log('Brand certification passed: every Teensurance logo mark resolves to --brand-lime (#ceff59).');
