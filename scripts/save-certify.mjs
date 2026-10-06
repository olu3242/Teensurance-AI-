import {spawnSync} from 'node:child_process';

const steps=[
 ['typecheck','npm',['run','typecheck']],
 ['save-tests','npx',['vitest','run','lib/save']]
];
let failed=false;
for(const [name,cmd,args] of steps){
 console.log('\n=== '+name+' ===');
 const result=spawnSync(cmd,args,{stdio:'inherit',shell:process.platform==='win32'});
 if(result.status!==0){failed=true;break}
}
const hosted={
 databaseUrl:Boolean(process.env.DATABASE_URL),
 cronSecret:Boolean(process.env.CRON_SECRET),
 emailProvider:Boolean(process.env.RESEND_API_KEY&&process.env.EMAIL_FROM),
 carrierAdapters:Boolean(process.env.TEENSURANCE_CARRIER_ADAPTERS)
};
console.log('\n=== hosted readiness ===');
console.log(JSON.stringify(hosted,null,2));
if(!hosted.databaseUrl)console.log('BLOCKED: hosted Neon/PostgreSQL certification requires DATABASE_URL.');
if(!hosted.carrierAdapters)console.log('BLOCKED: live quote certification requires TEENSURANCE_CARRIER_ADAPTERS plus provider credentials.');
if(!hosted.emailProvider)console.log('BLOCKED: live SAVE email delivery requires RESEND_API_KEY and EMAIL_FROM.');
if(!hosted.cronSecret)console.log('BLOCKED: hosted cron execution requires CRON_SECRET.');
process.exit(failed?1:0);
