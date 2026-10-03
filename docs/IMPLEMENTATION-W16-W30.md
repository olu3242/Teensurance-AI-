# W16–W30: local persistent MVP

## Target and boundaries

User-selected target: local persistent MVP, Texas first. Node 24+, Next.js, SQLite on local disk. This is an application certification, not a legal, insurance, or driving certification. The local accounts authenticate credentials; adult identity, guardian relationships, and supervisor qualifications are self-attested through private invitations. They are not independently identity-verified.

The earlier JSON demo and its client-selected role API are retired. Existing `data/pilot.json` is intentionally not imported: it has no authenticated owner, household, or supervisor identity. The file is preserved for operator review.

## Implementation map

| Wave | Implementation | Acceptance evidence |
| --- | --- | --- |
| W16 Persistence | SQLite WAL, immediate transactions, schema version, immutable audit/ledger triggers, indexes, independent database path | Reopen database and recover records/session; correction transaction tests |
| W17 Authentication | Salted scrypt credentials, hashed opaque sessions, seven-day expiry, HttpOnly/SameSite cookie, HTTPS Secure flag, sign-out revocation, same-origin writes, rate limits | Auth/HTTP tests; independent browser accounts |
| W18 Household graph | Memberships plus driver-specific guardian/supervisor relationships, expiring one-use invitations, revocation, multiple drivers | Household isolation, invitation replay, supervisor scoping tests |
| W19 Driver profile | Birth date, jurisdiction, stage, permit date, suspension days, family goal; adult sharing opt-in | Onboarding flow, age boundary tests |
| W20 Hours ledger | Logged vs verified totals, exact night minutes, append-only credits/reversals, correction history | Confirm → correct → re-confirm; no duplicate credit |
| W21 Session lifecycle | Active → draft → pending → verified/disputed; cancellation domain action; server start/end timestamps, retained across refresh, manual entry, overlap validation | Active-drive refresh and lifecycle browser test |
| W22 Milestone engine | Dependency graph, evidence status, family practice goal, source freshness and age/date gates | Journey unit tests; evidence acceptance recomputes progress |
| W23 Jurisdiction rules | Versioned Texas DPS snapshot with source URL, checked date and review deadline; other jurisdictions blocked | Missing/stale source tests; current source inspected 2026-09-27 |
| W24 Personalized journey | Driver-scoped next action, guardian/teen views, verified totals, reasons and source link | Authenticated dashboard and browser workflow |
| W25 Milestone agents | Machine-readable contracts, reserved agent extension list, deterministic T explanation, persisted assignments and safety checks | Drive-mode denial, scoped explanation test |
| W26 Guardian approvals | Purpose-specific consent grant/revocation, evidence review, separate assigned-supervisor attestation | Teen cannot review its own drive; supervisor cannot grant guardian consent |
| W27 Evidence | Source links, self-reported provenance retained through family review, reviewer/time, pending/accepted/rejected | Pending evidence excluded; acceptance does not upgrade source strength |
| W28 Reminders | Private in-app schedule, pause, completion, suppression during driving; no external message delivery | Browser create/complete flow; active-drive response contains no reminders |
| W29 Dashboards | Journey, practice ledger, family, profile, evidence/approvals, reminders; shared navy/lime design | Desktop/mobile screenshots and overflow checks |
| W30 E2E certification | Isolated test server/database, two-account household journey, hostile requests, persistence and policy tests | `npm test`, `npm run test:e2e`, `npm run typecheck`, `npm run build:cert` |

## Running locally

1. Use Node 24 or newer; run `npm install`.
2. Run `npm run dev -- --port 3001`, then open `/pilot`.
3. Create a guardian account and household. In My family, create a teen invitation.
4. In a separate browser profile, create the teen account and accept the code.
5. Complete the driver profile. Sign in as the guardian to grant practice/journey consent.
6. The teen chooses a linked supervisor while parked and starts practice. After parking, finish, review the duration and night minutes, and submit.
7. The assigned supervisor signs in and attests or disputes. Only confirmed practice enters verified totals.

Default database: `data/teensurance.sqlite`; override using `TEENSURANCE_DB_PATH`. Protect the database and its WAL/SHM siblings with OS account permissions. It contains personal data and credential hashes. Do not check these files into Git. For backups, stop the application before copying the SQLite database files, or use SQLite's backup tooling. Do not copy only the main file while WAL writes are active.

Certification uses separate output directories and databases. `npm run build:cert` does not overwrite an active development server's `.next` cache. Browser tests write only synthetic fixture identities and records.

## Texas source provenance

Snapshot: `lib/platform/texas.ts`, version `2026-09-27.1`, checked September 27, 2026. The 90-day review deadline is an application content policy, not a legal expiration date. The effective-from field marks applicability of this application snapshot, not the legislation's effective date.

- [Texas DPS provisional license](https://www.dps.texas.gov/section/driver-license/texas-provisional-license-teen)
- [Texas DPS learner license](https://www.dps.texas.gov/section/driver-license/texas-learners-license-teen)

Family-reviewed evidence is not official evidence. The engine does not issue a license or certify eligibility. Exceptions, hardship pathways, out-of-state transfers, adult licensing, and official document verification require the relevant authority. The standard teen pathway is the only modeled Texas rule snapshot.

## Explicit limitations

- Local disk deployment only; not suitable for ephemeral serverless instances or distributed replicas without a database migration.
- No email verification, password-recovery email, MFA, or independent guardian identity verification. Invitations are copied manually; no messages are sent by the app.
- No GPS, movement sensor, automatic night classification, or continuous background tracking. Driving state is declared through the session lifecycle. Disconnected sessions retain their server start time; after reconnecting, the driver reviews duration before attestation.
- No document uploads or automated authenticity checks. Evidence is minimized to descriptions and HTTPS references.
- Reminders appear in the application only. No push/email scheduler is represented as implemented.
- T currently uses deterministic sourced explanations, not a model provider. It cannot execute arbitrary SQL or override domain rules.
- Official-source review must be repeated before the snapshot deadline. Licensing completion labels describe family workflow only.

## Consent and age transition

`practice-journey-v1` covers local storage of practice and journey evidence, not insurer sharing. When a driver reaches 18, linked adults lose access unless the driver opts into adult sharing. Revoking a relationship removes subsequent resource access; existing audit and ledger history remains attributable. Consent revocation stops new dependent actions but does not silently delete historical records.
