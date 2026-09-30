import {Client} from 'pg';

const url=process.env.DATABASE_URL||process.env.DATABASE_MIGRATION_URL;
if(!url)throw new Error('DATABASE_URL or DATABASE_MIGRATION_URL is required.');

const client=new Client({connectionString:url,options:'-c search_path=teensurance -c statement_timeout=10000'});
try{
 await client.connect();
 const identity=await client.query('SELECT session_user,current_user');
 let runtimeRoleUsable=false;
 let runtimeRoleError='';
 try{
  await client.query('BEGIN');
  await client.query('SET LOCAL ROLE teensurance_runtime');
  await client.query('SELECT 1 FROM teensurance.waitlist_entries LIMIT 1');
  await client.query('ROLLBACK');
  runtimeRoleUsable=true;
 }catch(error){
  await client.query('ROLLBACK').catch(()=>{});
  runtimeRoleError=error instanceof Error?error.message:'unknown';
 }

 const state=await client.query(`
  SELECT
   to_regclass('teensurance.waitlist_entries') IS NOT NULL AS waitlist_entries,
   to_regclass('teensurance.waitlist_events') IS NOT NULL AS waitlist_events,
   to_regclass('teensurance.email_outbox') IS NOT NULL AS email_outbox,
   has_table_privilege('teensurance_runtime','teensurance.waitlist_entries','SELECT,INSERT,UPDATE') AS waitlist_runtime,
   has_table_privilege('teensurance_runtime','teensurance.email_outbox','SELECT,INSERT,UPDATE') AS email_runtime
 `);
 const result={...state.rows[0],session_user:identity.rows[0]?.session_user,current_user:identity.rows[0]?.current_user,runtime_role_usable:runtimeRoleUsable};
 console.log(JSON.stringify(result,null,2));
 if(!runtimeRoleUsable)console.error('BLOCKED: connection user cannot assume teensurance_runtime.',runtimeRoleError);
 if(!result.waitlist_entries||!result.waitlist_runtime||!runtimeRoleUsable){
  console.error('BLOCKED: hosted waitlist persistence is not runtime-ready.');
  process.exitCode=2;
 }else if(!result.email_outbox||!result.email_runtime){
  console.error('PARTIAL: waitlist persistence is ready, email outbox is not fully ready.');
 }
}finally{await client.end()}
