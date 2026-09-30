import {Client} from 'pg';

const url=process.env.DATABASE_URL||process.env.DATABASE_MIGRATION_URL;
if(!url)throw new Error('DATABASE_URL or DATABASE_MIGRATION_URL is required.');

const client=new Client({connectionString:url,options:'-c search_path=teensurance -c statement_timeout=10000'});
try{
 await client.connect();
 const state=await client.query(`
  SELECT
   to_regclass('teensurance.waitlist_entries') IS NOT NULL AS waitlist_entries,
   to_regclass('teensurance.waitlist_events') IS NOT NULL AS waitlist_events,
   to_regclass('teensurance.email_outbox') IS NOT NULL AS email_outbox,
   has_table_privilege('teensurance_runtime','teensurance.waitlist_entries','SELECT,INSERT,UPDATE') AS waitlist_runtime,
   has_table_privilege('teensurance_runtime','teensurance.email_outbox','SELECT,INSERT,UPDATE') AS email_runtime
 `);
 const result=state.rows[0];
 console.log(JSON.stringify(result,null,2));
 if(!result.waitlist_entries||!result.waitlist_runtime){
  console.error('BLOCKED: hosted waitlist persistence is not ready.');
  process.exitCode=2;
 }else if(!result.email_outbox||!result.email_runtime){
  console.error('PARTIAL: waitlist persistence is ready, email outbox is not fully ready.');
 }
}finally{await client.end()}
