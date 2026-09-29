import {Client} from 'pg';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const url=process.env.DATABASE_MIGRATION_URL;
if(!url)throw new Error('DATABASE_MIGRATION_URL must identify the intended migration target.');
const parsed=new URL(url);
const local=['127.0.0.1','localhost','::1'].includes(parsed.hostname);
if(!local)throw new Error('Draft migration runner is restricted to local dry runs until runtime authorization and migration review are complete.');
const client=new Client({connectionString:url});
try{await client.connect();await client.query('BEGIN');await client.query('SELECT pg_advisory_xact_lock(72697272)');
 await client.query('CREATE SCHEMA IF NOT EXISTS teensurance_migrations');
 await client.query('REVOKE ALL ON SCHEMA teensurance_migrations FROM PUBLIC');
 await client.query('CREATE TABLE IF NOT EXISTS teensurance_migrations.history(id text PRIMARY KEY,checksum text NOT NULL,applied_at timestamptz NOT NULL DEFAULT now())');
 for(const id of ['001_operational_postgres','002_runtime_role','003_legacy_membership_lockdown','004_operational_errors']){
 const sql=readFileSync(new URL(`../migrations/${id}.sql`,import.meta.url),'utf8');const checksum=createHash('sha256').update(sql).digest('hex');
 const prior=await client.query('SELECT checksum FROM teensurance_migrations.history WHERE id=$1',[id]);
 if(prior.rows.length){if(prior.rows[0].checksum!==checksum)throw new Error('Applied migration checksum differs; forward migration required.');console.log(`${id} already applied; checksum verified.`);}
 else{await client.query(sql);await client.query('INSERT INTO teensurance_migrations.history(id,checksum) VALUES($1,$2)',[id,checksum]);console.log(`${id} applied.`);}
 }
 await client.query('COMMIT');
 const state=await client.query("SELECT tablename,rowsecurity FROM pg_tables WHERE schemaname='teensurance' ORDER BY tablename");console.log(JSON.stringify({target:local?'local-disposable-postgres':'explicit-neon-target',tables:state.rows}));
}catch(error){await client.query('ROLLBACK').catch(()=>{});console.error('Migration failed; transaction rolled back.',error.code||'MIGRATION_ERROR');process.exitCode=1}finally{await client.end()}
