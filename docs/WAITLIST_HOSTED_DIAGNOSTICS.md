# Waitlist hosted diagnostics

The public waitlist depends on two hosted PostgreSQL migrations:

- `005_waitlist.sql` — `waitlist_entries` and `waitlist_events`
- `006_email_outbox.sql` — transactional confirmation email outbox

## Safe hosted check

Run:

`npm run waitlist:hosted:check`

with the same read-capable `DATABASE_URL` used by the hosted application.

The checker is read-only. It verifies:
- required tables exist;
- the `teensurance_runtime` role has expected table privileges;
- migration history contains 005/006 when migration history is available.

It never inserts, updates, deletes, or applies migrations.

## Runtime behavior

Waitlist enrollment is the primary transaction. Confirmation email is secondary and must not cause an otherwise successful enrollment to return HTTP 500.

If `waitlist_entries` is missing or runtime privileges are absent, enrollment remains blocked until the reviewed hosted migration is applied.
