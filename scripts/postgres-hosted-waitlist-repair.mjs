import {Client} from 'pg';
import {readFileSync} from 'node:fs';

const url=process.env.DATABASE_MIGRATION_URL;
if(!url)throw new Error('DATABASE_MIGRATION_URL must be configured for the intended hosted Neon target.');

const parsed=new URL(url);
if(['127.0.0.1','localhost','::1'].includes(parsed.hostname))throw new Error('Hosted repair runner requires an explicit non-local PostgreSQL target.');

const client=new Client({connectionString:url});
try{
 await client.connect();
 await client.query('BEGIN');
 await client.query('SELECT pg_advisory_xact_lock(72697272)');
 const sql=readFileSync(new URL('../migrations/006_waitlist_hosted_repair.sql',import.meta.url),'utf8');
 await client.query(sql);
 const state=await client.query(`
  SELECT
   to_regclass('teensurance.waitlist_entries') IS NOT NULL AS waitlist_entries,
   to_regclass('teensurance.waitlist_events') IS NOT NULL AS waitlist_events,
   to_regclass('teensurance.email_outbox') IS NOT NULL AS email_outbox,
   has_table_privilege('teensurance_runtime','teensurance.waitlist_entries','SELECT,INSERT,UPDATE') AS waitlist_runtime,
   has_table_privilege('teensurance_runtime','teensurance.email_outbox','SELECT,INSERT,UPDATE') AS email_runtime
 `);
 await client.query('COMMIT');
 console.log(JSON.stringify({target:parsed.hostname,...state.rows[0]},null,2));
}catch(error){
 await client.query('ROLLBACK').catch(()=>{});
 console.error('Hosted waitlist repair failed; transaction rolled back.',error instanceof Error?error.message:'unknown');
 process.exitCode=1;
}finally{await client.end()}
