-- W81-W88 waitlist persistence. Server-only access; no browser/public database grants.
SET LOCAL search_path = teensurance;
CREATE TABLE waitlist_entries(id text PRIMARY KEY,email text UNIQUE NOT NULL,parent_name text NOT NULL,teen_count integer NOT NULL CHECK(teen_count BETWEEN 1 AND 10),region text NOT NULL,referral_source text NOT NULL DEFAULT '',status text NOT NULL CHECK(status IN ('NEW','CONTACTED','INVITED','ENROLLED','DECLINED')),notes text NOT NULL DEFAULT '',created_at text NOT NULL,updated_at text NOT NULL);
CREATE INDEX waitlist_status_created ON waitlist_entries(status,created_at DESC);
CREATE TABLE waitlist_events(id text PRIMARY KEY,entry_id text NOT NULL REFERENCES waitlist_entries(id),actor_id text NOT NULL REFERENCES users(id),from_status text NOT NULL,to_status text NOT NULL,note text NOT NULL DEFAULT '',at text NOT NULL);
CREATE INDEX waitlist_event_entry ON waitlist_events(entry_id,at DESC);
ALTER TABLE waitlist_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist_events ENABLE ROW LEVEL SECURITY;
GRANT SELECT,INSERT,UPDATE ON waitlist_entries TO teensurance_runtime;
GRANT SELECT,INSERT ON waitlist_events TO teensurance_runtime;
CREATE POLICY runtime_waitlist_entries ON waitlist_entries TO teensurance_runtime USING(true) WITH CHECK(true);
CREATE POLICY runtime_waitlist_events_read ON waitlist_events FOR SELECT TO teensurance_runtime USING(true);
CREATE POLICY runtime_waitlist_events_append ON waitlist_events FOR INSERT TO teensurance_runtime WITH CHECK(true);
REVOKE ALL ON waitlist_entries,waitlist_events FROM PUBLIC;
