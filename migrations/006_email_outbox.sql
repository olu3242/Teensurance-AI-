-- W89 notification outbox for transactional email events.
SET LOCAL search_path = teensurance;
CREATE TABLE email_outbox(
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
CREATE INDEX email_outbox_status_created ON email_outbox(status,created_at);
ALTER TABLE email_outbox ENABLE ROW LEVEL SECURITY;
GRANT SELECT,INSERT,UPDATE ON email_outbox TO teensurance_runtime;
CREATE POLICY runtime_email_outbox ON email_outbox TO teensurance_runtime USING(true) WITH CHECK(true);
REVOKE ALL ON email_outbox FROM PUBLIC;
