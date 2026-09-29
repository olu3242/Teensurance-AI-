import type {Database} from '../db';
export async function migrateIntelligence(database:Database){
 if(database.dialect==='postgres'){if(!(await database.prepare('SELECT version FROM schema_version WHERE version=?').get(3)))throw new Error('Required hosted migration missing');return;}

 if((await database.prepare('SELECT version FROM schema_version WHERE version=3').get()))return;
 (await database.exec(`CREATE INDEX IF NOT EXISTS learner_record_owner ON records(kind,household_id,owner_id);
 CREATE TRIGGER IF NOT EXISTS intelligence_evidence_no_update BEFORE UPDATE ON records WHEN OLD.kind='permit_attempt' BEGIN SELECT RAISE(ABORT,'Practice evidence is append only'); END;
 CREATE TRIGGER IF NOT EXISTS intelligence_evidence_no_delete BEFORE DELETE ON records WHEN OLD.kind='permit_attempt' BEGIN SELECT RAISE(ABORT,'Practice evidence is append only'); END;
 INSERT INTO schema_version VALUES(3);`));
}
