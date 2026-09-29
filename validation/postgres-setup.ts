import {beforeEach,afterAll} from 'vitest';
import {Pool} from 'pg';
const url=process.env.PERSISTENCE_TEST_URL;
if(!url||!['127.0.0.1','localhost','::1'].includes(new URL(url).hostname))throw new Error('Disposable local PostgreSQL is required.');
process.env.TEENSURANCE_PERSISTENCE='postgres';process.env.DATABASE_URL=url;
const pool=new Pool({connectionString:url});
beforeEach(async()=>{await pool.query('TRUNCATE teensurance.operational_errors,teensurance.requests,teensurance.rate_limits,teensurance.ledger,teensurance.audit,teensurance.sessions,teensurance.records,teensurance.users RESTART IDENTITY CASCADE')});
afterAll(async()=>{await pool.end()});
