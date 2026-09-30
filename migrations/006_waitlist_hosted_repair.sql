-- Hosted repair for waitlist + transactional email persistence.
-- Idempotent by design so it can repair partial 005/006 rollout safely.
SET search_path = teensurance;

CREATE TABLE IF NOT EXISTS waitlist_entries(
 id text PRIMARY KEY,
 email text UNIQUE NOT NULL,
 parent_name text NOT NULL,
 teen_count integer NOT NULL CHECK(teen_count BETWEEN 1 AND 10),
 region text NOT NULL,
 referral_source text NOT NULL DEFAULT '',
 status text NOT NULL CHECK(status IN ('NEW','CONTACTED','INVITED','ENROLLED','DECLINED')),
 notes text NOT NULL DEFAULT '',
 created_at text NOT NULL,
 updated_at text NOT NULL
);
CREATE INDEX IF NOT EXISTS waitlist_status_created ON waitlist_entries(status,created_at DESC);

CREATE TABLE IF NOT EXISTS waitlist_events(
 id text PRIMARY KEY,
 entry_id text NOT NULL REFERENCES waitlist_entries(id),
 actor_id text NOT NULL REFERENCES users(id),
 from_status text NOT NULL,
 to_status text NOT NULL,
 note text NOT NULL DEFAULT '',
 at text NOT NULL
);
CREATE INDEX IF NOT EXISTS waitlist_event_entry ON waitlist_events(entry_id,at DESC);

CREATE TABLE IF NOT EXISTS email_outbox(
 id text PRIMARY KEY,
 event_type text NOT NULL,
 recipient text NOT NULL,
 subject text NOT NULL,
 text_body text NOT NULL,
 html_body text NOT NULL,
 status text NOT NULL CHECK(status IN ('PENDING','SENT')),
 attempts integer NOT NULL DEFAULT 0,
 created_at text NOT NULL,
 updated_at text NOT NULL,
 last_error text NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS email_outbox_status_created ON email_outbox(status,created_at);

ALTER TABLE waitlist_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_outbox ENABLE ROW LEVEL SECURITY;

GRANT SELECT,INSERT,UPDATE ON waitlist_entries TO teensurance_runtime;
GRANT SELECT,INSERT ON waitlist_events TO teensurance_runtime;
GRANT SELECT,INSERT,UPDATE ON email_outbox TO teensurance_runtime;

DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='teensurance' AND tablename='waitlist_entries' AND policyname='runtime_waitlist_entries') THEN
  CREATE POLICY runtime_waitlist_entries ON waitlist_entries TO teensurance_runtime USING(true) WITH CHECK(true);
 END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='teensurance' AND tablename='waitlist_events' AND policyname='runtime_waitlist_events_read') THEN
  CREATE POLICY runtime_waitlist_events_read ON waitlist_events FOR SELECT TO teensurance_runtime USING(true);
 END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='teensurance' AND tablename='waitlist_events' AND policyname='runtime_waitlist_events_append') THEN
  CREATE POLICY runtime_waitlist_events_append ON waitlist_events FOR INSERT TO teensurance_runtime WITH CHECK(true);
 END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='teensurance' AND tablename='email_outbox' AND policyname='runtime_email_outbox') THEN
  CREATE POLICY runtime_email_outbox ON email_outbox TO teensurance_runtime USING(true) WITH CHECK(true);
 END IF;
END $$;

REVOKE ALL ON waitlist_entries,waitlist_events,email_outbox FROM PUBLIC;
