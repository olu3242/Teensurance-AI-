import {createRequire} from 'node:module';
import {mkdirSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {randomBytes,scryptSync} from 'node:crypto';

const path=resolve(process.env.SAVE_BROWSER_DB||'data/save-browser.sqlite');
const id=process.env.SAVE_E2E_ADMIN_ID||'00000000-0000-4000-8000-000000000001';
const email=process.env.SAVE_E2E_ADMIN_EMAIL||'save-admin@example.test';
const password=process.env.SAVE_E2E_ADMIN_PASSWORD||'admin-password-123';

mkdirSync(dirname(path),{recursive:true});
const {DatabaseSync}=createRequire(import.meta.url)('node:sqlite');
const db=new DatabaseSync(path);
db.exec('CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,email TEXT UNIQUE NOT NULL,password TEXT NOT NULL,name TEXT NOT NULL,created_at TEXT NOT NULL)');
const salt=randomBytes(16).toString('hex');
const digest=scryptSync(password,salt,64).toString('hex');
db.prepare('INSERT INTO users(id,email,password,name,created_at) VALUES(?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET email=excluded.email,password=excluded.password,name=excluded.name').run(id,email,salt+':'+digest,'SAVE Platform Admin',new Date().toISOString());
db.close();
console.log('Seeded SAVE E2E platform admin.');
