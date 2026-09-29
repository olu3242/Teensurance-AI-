import {it,expect} from 'vitest';
import {randomUUID} from 'node:crypto';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {sqlite} from '../lib/platform/persistence/sqlite';
import {postgres} from '../lib/platform/persistence/postgres';
import type {Database} from '../lib/platform/persistence/types';
const url=process.env.PERSISTENCE_TEST_URL;
if(!url||!['127.0.0.1','localhost','::1'].includes(new URL(url).hostname))throw new Error('Provide a disposable local PostgreSQL PERSISTENCE_TEST_URL; this suite never targets hosted data.');
for(const kind of ['sqlite','postgres'] as const){
 it(`${kind}: parameter binding, scoped persistence, transactions and ownership`,async()=>{
  const dir=mkdtempSync(join(tmpdir(),'teensurance-parity-'));const pg=kind==='postgres'?postgres(url,null):undefined;const acquired=await pg?.acquire();const db:Database=acquired?.database||sqlite(join(dir,'db.sqlite'));
  const user=randomUUID(),household=randomUUID(),other=randomUUID(),id=randomUUID();
  try{await db.exec('BEGIN');await db.prepare('INSERT INTO users VALUES(?,?,?,?,?)').run(user,`${user}@example.test`,'fixture-only','Fixture',new Date().toISOString());
   const record={id,householdId:household,ownerId:user,teenId:user,answerId:"quote' and ? stay data",kind:'learning',correct:true};
   await db.prepare('INSERT INTO records(id,kind,household_id,owner_id,payload) VALUES(?,?,?,?,?)').run(id,'roadready_attempt',household,user,JSON.stringify(record));
   expect(await db.prepare('SELECT payload FROM records WHERE kind=? AND household_id=? AND owner_id=?').all('roadready_attempt',other,user)).toEqual([]);
   expect(JSON.parse(String((await db.prepare('SELECT payload FROM records WHERE kind=? AND household_id=? AND owner_id=?').get('roadready_attempt',household,user))!.payload))).toEqual(record);
   await db.exec('SAVEPOINT parity');await db.prepare('INSERT INTO requests VALUES(?,?,?,?)').run(user,'request','hash','{}');await db.exec('ROLLBACK TO parity; RELEASE parity');
   expect(await db.prepare('SELECT * FROM requests WHERE user_id=? AND key=?').get(user,'request')).toBeUndefined();
   await db.exec('ROLLBACK');expect(await db.prepare('SELECT id FROM users WHERE id=?').get(user)).toBeUndefined();
  }finally{await db.exec('ROLLBACK').catch(()=>{});acquired?.release();await (pg?.database||db).close();rmSync(dir,{recursive:true,force:true})}
 });
}
it('PostgreSQL immutable evidence, foreign keys, ownership consistency and migration state',async()=>{
 const pg=postgres(url,null);const a=await pg.acquire();const db=a.database;const user=randomUUID(),id=randomUUID();
 try{await db.exec('BEGIN');await db.prepare('INSERT INTO users VALUES(?,?,?,?,?)').run(user,`${user}@example.test`,'fixture-only','Fixture',new Date().toISOString());
  await db.prepare('INSERT INTO records(id,kind,household_id,owner_id,payload) VALUES(?,?,?,?,?)').run(id,'permit_attempt','h',user,JSON.stringify({id,householdId:'h',ownerId:user}));
  for(const sql of ["DELETE FROM records WHERE id=?","UPDATE records SET payload=payload WHERE id=?"]){await db.exec('SAVEPOINT denied');await expect(db.prepare(sql).run(id)).rejects.toThrow('append only');await db.exec('ROLLBACK TO denied; RELEASE denied')}
  await db.exec('SAVEPOINT invalid');await expect(db.prepare('INSERT INTO sessions VALUES(?,?,?)').run('fake',randomUUID(),'future')).rejects.toThrow();await db.exec('ROLLBACK TO invalid; RELEASE invalid');
  await db.exec('SAVEPOINT mismatch');await expect(db.prepare('INSERT INTO records(id,kind,household_id,owner_id,payload) VALUES(?,?,?,?,?)').run(randomUUID(),'member','h',user,'{}')).rejects.toThrow();await db.exec('ROLLBACK TO mismatch; RELEASE mismatch');
  const version=await db.prepare('SELECT version FROM schema_version WHERE version=?').get(3);expect(version?.version).toBe(3);
 }finally{await db.exec('ROLLBACK');a.release();await pg.database.close()}
});

it('PostgreSQL unprivileged role cannot insert memberships or read private records even with table grants',async()=>{
 const pg=postgres(url,null);const a=await pg.acquire();const db=a.database;const role='contract_'+randomUUID().replaceAll('-','');
 try{await db.exec('BEGIN');await db.exec(`CREATE ROLE ${role} NOLOGIN; GRANT USAGE ON SCHEMA teensurance TO ${role}; GRANT SELECT,INSERT ON teensurance.records TO ${role}; GRANT USAGE ON ALL SEQUENCES IN SCHEMA teensurance TO ${role}`);
  await db.exec('SAVEPOINT attacker');await db.exec(`SET LOCAL ROLE ${role}`);
  expect(await db.prepare('SELECT payload FROM records').all()).toEqual([]);
  await expect(db.prepare('INSERT INTO records(id,kind,household_id,owner_id,payload) VALUES(?,?,?,?,?)').run('forged','member','other','attacker',JSON.stringify({id:'forged',householdId:'other',ownerId:'attacker',role:'guardian',active:true}))).rejects.toThrow('row-level security');
  await db.exec('ROLLBACK TO attacker; RELEASE attacker');
 }finally{await db.exec('ROLLBACK');a.release();await pg.database.close()}
});
