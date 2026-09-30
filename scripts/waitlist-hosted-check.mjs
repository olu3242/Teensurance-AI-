import {Client} from 'pg';

const url=process.env.DATABASE_URL;
if(!url)throw new Error('DATABASE_URL is required for the read-only waitlist hosted check.');

const client=new Client({connectionString:url,options:'-c search_path=teensurance -c statement_timeout=10000'});
try{
 await client.connect();
 const checks=await client.query(`
  SELECT
    to_regclass('teensurance.waitlist_entries') IS NOT NULL AS waitlist_entries,
    to_regclass('teensurance.waitlist_events') IS NOT NULL AS waitlist_events,
    to_regclass('teensurance.email_outbox') IS NOT NULL AS email_outbox
 `);
 const perms=await client.query(`
  SELECT
    has_table_privilege('teensurance_runtime','teensurance.waitlist_entries','SELECT,INSERT,UPDATE') AS waitlist_runtime,
    has_table_privilege('teensurance_runtime','teensurance.email_outbox','SELECT,INSERT,UPDATE') AS email_runtime
 `).catch(()=>({rows:[{waitlist_runtime:false,email_runtime:false}]}));
 const migrations=await client.query(`
  SELECT id FROM teensurance_migrations.history
  WHERE id IN ('005_waitlist','006_email_outbox')
  ORDER BY id
 `).catch(()=>({rows:[]}));
 const result={...checks.rows[0],...perms.rows[0],migrations:migrations.rows.map(r=>r.id)};
 console.log(JSON.stringify(result,null,2));
 if(!result.waitlist_entries||!result.waitlist_runtime){
  console.error('BLOCKED: hosted waitlist persistence is not ready.');
  process.exitCode=2;
 }else if(!result.email_outbox||!result.email_runtime){
  console.error('PARTIAL: waitlist can persist, but confirmation email outbox is not ready.');
 }
}finally{await client.end()}
