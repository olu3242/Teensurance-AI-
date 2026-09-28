import type {Database} from '../db';
/** Local SQLite migration 2. No new datastore or hosted schema is introduced.
 * Rollback intentionally retains evidence protections; never delete learner history. */
export function migrateRoadReady(database:Database){
 if(database.prepare('SELECT version FROM schema_version WHERE version=2').get())return;
 database.exec(`CREATE TRIGGER IF NOT EXISTS roadready_evidence_no_update BEFORE UPDATE ON records
 WHEN OLD.kind IN ('roadready_attempt','roadready_guardian') BEGIN SELECT RAISE(ABORT,'RoadReady evidence is append only'); END;
 CREATE TRIGGER IF NOT EXISTS roadready_evidence_no_delete BEFORE DELETE ON records
 WHEN OLD.kind IN ('roadready_attempt','roadready_guardian') BEGIN SELECT RAISE(ABORT,'RoadReady evidence is append only'); END;
 INSERT OR IGNORE INTO schema_version VALUES(2);`);
}
