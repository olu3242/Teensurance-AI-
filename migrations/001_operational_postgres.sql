-- Draft W69 operational schema. Apply with the dedicated migration owner only.
-- No fixture/user rows are imported. No grants to browser or public API roles.
CREATE SCHEMA IF NOT EXISTS teensurance;
REVOKE ALL ON SCHEMA teensurance FROM PUBLIC;
SET LOCAL search_path = teensurance;
CREATE TABLE schema_version(version integer PRIMARY KEY);
INSERT INTO schema_version VALUES(1),(2),(3);
CREATE TABLE users(id text PRIMARY KEY,email text UNIQUE NOT NULL,password text NOT NULL,name text NOT NULL,created_at text NOT NULL);
CREATE TABLE sessions(hash text PRIMARY KEY,user_id text NOT NULL REFERENCES users(id),expires_at text NOT NULL);
CREATE INDEX session_expiry ON sessions(expires_at);
CREATE TABLE records(
 id text PRIMARY KEY,kind text NOT NULL,household_id text NOT NULL,owner_id text NOT NULL REFERENCES users(id),
 payload text NOT NULL,sequence bigint GENERATED ALWAYS AS IDENTITY,
 CHECK(jsonb_typeof(payload::jsonb)='object'),
 CHECK((payload::jsonb->>'id') IS NOT DISTINCT FROM id),
 CHECK((payload::jsonb->>'householdId') IS NOT DISTINCT FROM household_id),
 CHECK((payload::jsonb->>'ownerId') IS NOT DISTINCT FROM owner_id),
 CHECK(kind<>'member' OR (payload::jsonb->>'role' IN ('guardian','teen','supervisor') AND jsonb_typeof(payload::jsonb->'active')='boolean'))
);
CREATE INDEX records_scope ON records(kind,household_id,owner_id);
CREATE INDEX record_learner ON records(kind,household_id,((payload::jsonb)->>'teenId'));
CREATE INDEX active_drives ON records(((payload::jsonb)->>'teenId'),((payload::jsonb)->>'supervisorId')) WHERE kind='drive' AND payload::jsonb->>'status'='active';
CREATE UNIQUE INDEX member_identity ON records(household_id,owner_id) WHERE kind='member';
CREATE UNIQUE INDEX profile_identity ON records(household_id,owner_id) WHERE kind='profile';
CREATE TABLE audit(id text PRIMARY KEY,at text NOT NULL,actor_id text NOT NULL,household_id text NOT NULL,action text NOT NULL,decision text NOT NULL,reason text NOT NULL);
CREATE INDEX scoped_audit ON audit(household_id,actor_id,at DESC);
CREATE TABLE ledger(id text PRIMARY KEY,drive_id text NOT NULL REFERENCES records(id),revision integer NOT NULL,household_id text NOT NULL,teen_id text NOT NULL REFERENCES users(id),minutes integer NOT NULL,night_minutes integer NOT NULL,actor_id text NOT NULL REFERENCES users(id),reason text NOT NULL,at text NOT NULL,UNIQUE(drive_id,revision));
CREATE INDEX learner_ledger ON ledger(household_id,teen_id);
CREATE TABLE requests(user_id text NOT NULL REFERENCES users(id),key text NOT NULL,fingerprint text NOT NULL,result text NOT NULL,PRIMARY KEY(user_id,key));
CREATE TABLE rate_limits(key text PRIMARY KEY,count integer NOT NULL CHECK(count>0),reset_at bigint NOT NULL);
CREATE FUNCTION immutable_history() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog AS $$ BEGIN RAISE EXCEPTION 'Evidence and audit history are append only' USING ERRCODE='23514'; END $$;
CREATE TRIGGER audit_immutable BEFORE UPDATE OR DELETE ON audit FOR EACH ROW EXECUTE FUNCTION immutable_history();
CREATE TRIGGER ledger_immutable BEFORE UPDATE OR DELETE ON ledger FOR EACH ROW EXECUTE FUNCTION immutable_history();
CREATE FUNCTION protect_records() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog AS $$
BEGIN
 IF OLD.kind IN ('roadready_attempt','roadready_guardian','permit_attempt','content_review_event') THEN RAISE EXCEPTION 'Evidence is append only' USING ERRCODE='23514'; END IF;
 IF TG_OP='UPDATE' AND (NEW.id<>OLD.id OR NEW.kind<>OLD.kind OR NEW.household_id<>OLD.household_id OR NEW.owner_id<>OLD.owner_id) THEN RAISE EXCEPTION 'Record ownership is immutable' USING ERRCODE='23514'; END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF; RETURN NEW;
END $$;
CREATE TRIGGER record_provenance BEFORE UPDATE OR DELETE ON records FOR EACH ROW EXECUTE FUNCTION protect_records();
-- RLS deliberately has no policies/grants here. A separately reviewed runtime role
-- provisioning migration is required before the application can connect. Schema
-- owners bypass RLS; the migration credential must never be the runtime credential.
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE records ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON ALL TABLES IN SCHEMA teensurance FROM PUBLIC;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA teensurance FROM PUBLIC;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA teensurance FROM PUBLIC;
