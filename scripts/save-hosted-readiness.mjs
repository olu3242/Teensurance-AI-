const checks=[
 ['Neon/PostgreSQL','DATABASE_URL',Boolean(process.env.DATABASE_URL)],
 ['Scheduled operations','CRON_SECRET',Boolean(process.env.CRON_SECRET)],
 ['Email provider','RESEND_API_KEY + EMAIL_FROM',Boolean(process.env.RESEND_API_KEY&&process.env.EMAIL_FROM)],
 ['Carrier adapters','TEENSURANCE_CARRIER_ADAPTERS',Boolean(process.env.TEENSURANCE_CARRIER_ADAPTERS)]
];

console.log('SAVE hosted readiness');
for(const [name,key,ok] of checks)console.log((ok?'READY ':'BLOCKED ')+name+' ['+key+']');

if(process.env.TEENSURANCE_CARRIER_ADAPTERS){
 try{
  const parsed=JSON.parse(process.env.TEENSURANCE_CARRIER_ADAPTERS);
  if(!Array.isArray(parsed))throw new Error('not array');
  console.log('READY carrier adapter configuration parses as an array ('+parsed.length+' configured)');
 }catch{
  console.error('BLOCKED TEENSURANCE_CARRIER_ADAPTERS is not valid adapter JSON');
  process.exitCode=1;
 }
}

console.log('Readiness is configuration visibility only. This script never prints secret values and never performs destructive hosted database operations.');
