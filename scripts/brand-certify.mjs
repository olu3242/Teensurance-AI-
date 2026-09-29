import {readFileSync,readdirSync,statSync} from 'node:fs';
import {join} from 'node:path';

const root=new URL('..',import.meta.url).pathname;
const globals=readFileSync(join(root,'app/globals.css'),'utf8');
const mark=readFileSync(join(root,'components/BrandMark.tsx'),'utf8');
const logo=readFileSync(join(root,'components/BrandLogo.tsx'),'utf8');
const loader=readFileSync(join(root,'components/BrandLoader.tsx'),'utf8');

function walk(dir){
 return readdirSync(dir).flatMap(name=>{
  const p=join(dir,name);return statSync(p).isDirectory()?walk(p):[p];
 });
}
const pages=walk(join(root,'app')).filter(p=>p.endsWith('page.tsx'));
const renderedPages=pages.filter(p=>!readFileSync(p,'utf8').includes("redirect('/teen/scout')"));
const missing=renderedPages.filter(p=>{
 const s=readFileSync(p,'utf8');
 return !/BrandLogo|BrandMark|SiteHeader|ScoutLearning/.test(s);
});

const checks=[
 ['canonical token',globals.includes('--brand-lime: #ceff59;')],
 ['canonical data mark',mark.includes('data-teensurance-brand-mark')],
 ['global forced lime',globals.includes('background:var(--brand-lime)!important')],
 ['shared logo uses canonical mark',logo.includes('<BrandMark className="brandLogoMark" />')],
 ['loader uses canonical mark',loader.includes('<BrandMark className="brandLoaderMark" size="large" />')],
 ['all rendered pages expose shared branding',missing.length===0]
];

const failed=checks.filter(([,ok])=>!ok);
if(failed.length){
 console.error('Brand certification failed:',failed.map(([name])=>name).join(', '));
 if(missing.length)console.error('Pages missing shared branding:',missing.map(p=>p.replace(root,'')).join(', '));
 process.exit(1);
}
console.log('Brand certification passed: canonical lime #ceff59 is enforced and every rendered page uses the shared Teensurance brand system.');
