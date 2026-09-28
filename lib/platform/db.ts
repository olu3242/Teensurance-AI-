import {createRequire} from 'node:module';
import {mkdirSync} from 'node:fs';
import {dirname,resolve} from 'node:path';

type Statement = {run(...args:unknown[]):unknown;get(...args:unknown[]):Record<string,unknown>|undefined;all(...args:unknown[]):Record<string,unknown>[]};
export type Database = {exec(sql:string):void;prepare(sql:string):Statement;close():void};
const databases = new Map<string,Database>();
export function db():Database {
  const path=resolve(process.env.TEENSURANCE_DB_PATH || 'data/teensurance.sqlite');
  const existing=databases.get(path);if(existing)return existing;
  mkdirSync(dirname(path),{recursive:true});
  const {DatabaseSync}=createRequire(import.meta.url)('node:sqlite') as {DatabaseSync:new(path:string)=>Database};
  const database=new DatabaseSync(path);
  database.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS schema_version(version INTEGER PRIMARY KEY);
    INSERT OR IGNORE INTO schema_version VALUES(1);
    CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,email TEXT UNIQUE NOT NULL,password TEXT NOT NULL,name TEXT NOT NULL,created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions(hash TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),expires_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS records(id TEXT PRIMARY KEY,kind TEXT NOT NULL,household_id TEXT NOT NULL,owner_id TEXT NOT NULL,payload TEXT NOT NULL CHECK(json_valid(payload)));
    CREATE INDEX IF NOT EXISTS records_scope ON records(kind,household_id,owner_id);
    CREATE TABLE IF NOT EXISTS audit(id TEXT PRIMARY KEY,at TEXT NOT NULL,actor_id TEXT NOT NULL,household_id TEXT NOT NULL,action TEXT NOT NULL,decision TEXT NOT NULL,reason TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS ledger(id TEXT PRIMARY KEY,drive_id TEXT NOT NULL,revision INTEGER NOT NULL,household_id TEXT NOT NULL,teen_id TEXT NOT NULL,minutes INTEGER NOT NULL,night_minutes INTEGER NOT NULL,actor_id TEXT NOT NULL,reason TEXT NOT NULL,at TEXT NOT NULL,UNIQUE(drive_id,revision));
    CREATE TABLE IF NOT EXISTS requests(user_id TEXT NOT NULL,key TEXT NOT NULL,fingerprint TEXT NOT NULL,result TEXT NOT NULL,PRIMARY KEY(user_id,key));
    CREATE TABLE IF NOT EXISTS rate_limits(key TEXT PRIMARY KEY,count INTEGER NOT NULL,reset_at INTEGER NOT NULL);
    CREATE TRIGGER IF NOT EXISTS audit_no_update BEFORE UPDATE ON audit BEGIN SELECT RAISE(ABORT,'Audit is append only'); END;
    CREATE TRIGGER IF NOT EXISTS audit_no_delete BEFORE DELETE ON audit BEGIN SELECT RAISE(ABORT,'Audit is append only'); END;
    CREATE TRIGGER IF NOT EXISTS ledger_no_update BEFORE UPDATE ON ledger BEGIN SELECT RAISE(ABORT,'Ledger is append only'); END;
    CREATE TRIGGER IF NOT EXISTS ledger_no_delete BEFORE DELETE ON ledger BEGIN SELECT RAISE(ABORT,'Ledger is append only'); END;`);
  databases.set(path,database);return database;
}
export function transaction<T>(fn:()=>T):T {const database=db();database.exec('BEGIN IMMEDIATE');try{const result=fn();database.exec('COMMIT');return result}catch(error){database.exec('ROLLBACK');throw error}}
export type RecordBase={id:string;householdId:string;ownerId:string};
export function put<T extends RecordBase>(kind:string,value:T){db().prepare('INSERT INTO records VALUES(?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload').run(value.id,kind,value.householdId,value.ownerId,JSON.stringify(value));return value}
export function get<T>(kind:string,id:string):T|undefined{const row=db().prepare('SELECT payload FROM records WHERE kind=? AND id=?').get(kind,id);return row?JSON.parse(String(row.payload)) as T:undefined}
export function all<T>(kind:string,householdId?:string):T[]{const rows=householdId===undefined?db().prepare('SELECT payload FROM records WHERE kind=?').all(kind):db().prepare('SELECT payload FROM records WHERE kind=? AND household_id=?').all(kind,householdId);return rows.map(row=>JSON.parse(String(row.payload)) as T)}
export function closeDatabases(){for(const database of databases.values())database.close();databases.clear()}

// Apply ownership in SQL before materializing private learner records.
export function owned<T>(kind:string,householdId:string,ownerId:string):T[]{return db().prepare('SELECT payload FROM records WHERE kind=? AND household_id=? AND owner_id=?').all(kind,householdId,ownerId).map(row=>JSON.parse(String(row.payload)) as T)}
