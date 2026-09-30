import {it,expect} from 'vitest';
import {randomUUID} from 'node:crypto';
import {postgres} from '../lib/platform/persistence/postgres';

const url=process.env.PERSISTENCE_TEST_URL;
if(!url||!['127.0.0.1','localhost','::1'].includes(new URL(url).hostname))throw new Error('Disposable local PostgreSQL is required.');

it('PostgreSQL persists SAVE household records through the canonical records table',async()=>{
 const pg=postgres(url,null);const acquired=await pg.acquire();const db=acquired.database;
 const user=randomUUID(),household=randomUUID(),id=randomUUID();
 try{
  await db.exec('BEGIN');
  await db.prepare('INSERT INTO users VALUES(?,?,?,?,?)').run(user,user+'@example.test','fixture-only','Fixture',new Date().toISOString());
  const payload={id,householdId:household,ownerId:user,annualPremium:5000,coverageFingerprint:'100-300-100|1000',source:'manual',drivers:2,vehicles:1,currentDiscounts:[],capturedAt:new Date().toISOString()};
  await db.prepare('INSERT INTO records(id,kind,household_id,owner_id,payload) VALUES(?,?,?,?,?)').run(id,'save_policy_baseline',household,user,JSON.stringify(payload));
  const row=await db.prepare('SELECT payload FROM records WHERE kind=? AND household_id=? AND owner_id=?').get('save_policy_baseline',household,user);
  expect(JSON.parse(String(row?.payload))).toEqual(payload);
  expect(await db.prepare('SELECT payload FROM records WHERE kind=? AND household_id=?').all('save_policy_baseline','other-household')).toEqual([]);
 }finally{await db.exec('ROLLBACK').catch(()=>{});acquired.release();await pg.database.close()}
});
