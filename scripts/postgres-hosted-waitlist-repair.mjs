import {Client} from 'pg';
import {readFileSync} from 'node:fs';

const url=process.env.DATABASE_MIGRATION_URL;
if(!url)throw new Error('DATABASE_MIGRATION_URL must be configured for the intended hosted Neon target.');

const parsed=new URL(url);
if(['127.0.0.1','localhost','::1'].includes(parsed.hostname))throw new Error('Hosted repair runner requires an explicit non-local PostgreSQL target.');

const client=new Client({connectionString:url});

async function exists(regclass){
 const r=await client.query('SELECT to_regclass($1) AS value',[regclass]);
 return Boolean(r.rows[0]?.value);
}

try{
 await client.connect();
 await client.query('BEGIN');
 await client.query('SELECT pg_advisory_xact_lock(72697272)');

 const schemaState=await client.query(`
  SELECT
   EXISTS(SELECT 1 FROM pg_namespace WHERE nspname='teensurance') AS schema_exists,
   EXISTS(SELECT 1 FROM pg_roles WHERE rolname='teensurance_runtime') AS runtime_role_exists
 `);
 let {schema_exists: schemaExists,runtime_role_exists: runtimeRoleExists}=schemaState.rows[0];

 if(!schemaExists){
  console.log('Teensurance schema is absent. Applying reviewed foundation migration 001.');
  await client.query(readFileSync(new URL('../migrations/001_operational_postgres.sql',import.meta.url),'utf8'));
  schemaExists=true;
 }else{
  const required=['teensurance.users','teensurance.records','teensurance.sessions'];
  const missing=[];
  for(const name of required)if(!(await exists(name)))missing.push(name);
  if(missing.length)throw new Error('Existing teensurance schema is incomplete ('+missing.join(', ')+'). Refusing automatic foundation repair; review schema drift first.');
 }

 if(!runtimeRoleExists){
  console.log('teensurance_runtime role is absent. Applying reviewed runtime-role migration 002.');
  await client.query(readFileSync(new URL('../migrations/002_runtime_role.sql',import.meta.url),'utf8'));
  runtimeRoleExists=true;
 }

 const appRole='teensurance_app';
 const appRoleState=await client.query('SELECT EXISTS(SELECT 1 FROM pg_roles WHERE rolname=$1) AS exists',[appRole]);
 if(appRoleState.rows[0]?.exists){
  console.log('Authorizing dedicated application login to assume teensurance_runtime.');
  await client.query('GRANT teensurance_runtime TO teensurance_app');
 }else{
  console.log('Dedicated application login teensurance_app is not present; runtime membership not changed.');
 }

 console.log('Applying idempotent waitlist repair.');
 await client.query(readFileSync(new URL('../migrations/006_waitlist_hosted_repair.sql',import.meta.url),'utf8'));

 const state=await client.query(`
  SELECT
   to_regclass('teensurance.waitlist_entries') IS NOT NULL AS waitlist_entries,
   to_regclass('teensurance.waitlist_events') IS NOT NULL AS waitlist_events,
   to_regclass('teensurance.email_outbox') IS NOT NULL AS email_outbox,
   has_table_privilege('teensurance_runtime','teensurance.waitlist_entries','SELECT,INSERT,UPDATE') AS waitlist_runtime,
   has_table_privilege('teensurance_runtime','teensurance.email_outbox','SELECT,INSERT,UPDATE') AS email_runtime
 `);

 await client.query('COMMIT');
 console.log(JSON.stringify({target:parsed.hostname,schemaExists,runtimeRoleExists,...state.rows[0]},null,2));
}catch(error){
 await client.query('ROLLBACK').catch(()=>{});
 console.error('Hosted waitlist repair failed; transaction rolled back.',error instanceof Error?error.message:'unknown');
 process.exitCode=1;
}finally{
 await client.end();
}
