# SAVE operational certification

## Phase 21 — scheduled renewal automation
Vercel calls `/api/internal/save` daily. The route requires `CRON_SECRET`, scans persisted policy baselines, applies the 60/30/approaching renewal windows, and deduplicates notices by household, renewal date and trigger.

## Phase 22 — event-driven opportunity notifications
SAVE persists opportunity/renewal notices separately from underwriting or quote data. Opportunity notifications describe the evidence-backed next action and never promise a discount. Renewal notices tell the guardian when the recorded renewal enters a review window.

## Phase 23 — integration observability
`/api/admin/save-health` is admin-only and reports:
- carrier adapter configuration validity/count;
- SAVE persistence record counts;
- PostgreSQL configuration presence;
- transactional email configuration presence;
- cron-secret configuration presence.

It reports configuration state only and never returns credentials.

## Phase 24 — certification
Run:

`npm run save:certify`

The command runs TypeScript validation and all `lib/save` tests, then reports hosted dependency readiness.

### Hosted certification requirements
- `DATABASE_URL` for Neon/PostgreSQL persistence;
- `CRON_SECRET` for scheduled SAVE operations;
- `RESEND_API_KEY` + `EMAIL_FROM` for live email delivery;
- `TEENSURANCE_CARRIER_ADAPTERS` and each adapter's referenced secret for live quote testing.

Missing hosted configuration is a **BLOCKED external dependency**, not a local certification success.

## Non-negotiable boundary
SAVE may monitor, notify, compare, prepare and audit. It may not bind or cancel coverage, authorize payment, silently lower coverage, or treat educational/readiness evidence as an underwriting score.
