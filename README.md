# Teensurance pilot MVP

A working local pilot for the family driving journey. It implements T's five guided steps (READY, ACE, MILES, GO, COVER), CRUZE pre-drive coaching, supervised session logging, parent review, family practice goal, and GUARD safety decisions with an audit trail. VIBE is the journey view. No generative AI or regulatory determination is used in this pilot.

## Run

Requires Node 20 or later.

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. Choose **Teen view**, log a supervised drive after parking, switch to **Parent view**, verify the entry, and see the verified time update. Use **I’m driving now** to enter the distraction-free screen. Data persists to `data/pilot.json` on the local server. To reset, stop the server and delete that file.

```bash
npm test
npm run typecheck
npm run build
```

## Scope and boundaries

- This is a **single-family demo**. The role switch is deliberately visible and is **not authentication**. Do not deploy it for real minors or real driving records.
- Practice goal is a family target, **not a legal minimum**. Permit, graduated license, supervisor, insurance, and hour requirements must be sourced and validated for each jurisdiction before showing eligibility or next-step completion.
- The server validates input and GUARD evaluates every write, including denied writes, then records concise decisions. It blocks writes while the caller reports driving. A web app cannot reliably detect vehicle motion; production requires a stronger driving-state strategy and must never encourage phone use while driving.
- JSON file persistence is suitable for a local demo only. Production needs authenticated teen/guardian relationships, consent and data retention controls, a transactional database with tenant isolation, authorization from server-held identity rather than request body, verified rules and provenance, and end-to-end accessibility/security review.

## MVP extension path

1. Add signed-in family accounts and parent/guardian verification with consent, server-derived roles and row-level access.
2. Replace local JSON storage with durable transactional storage and scoped audit records.
3. Add jurisdiction selection and official-source-backed requirement records with effective dates, human review, and expiration.
4. Add evidence for permits, license milestones, supervisor confirmation, and insurance handoff; never infer official eligibility from logged time alone.
5. Test with families and safety experts before handling real youth data.

## W40-W50 MVP loop

The pilot now models the complete safety-first practice loop: parked preparation, GUARD-mediated safety checks, supervised practice logging, parent verification/correction/dispute, post-drive reflection, deterministic next-best-step guidance, Safety & Readiness Passport evidence, and a bounded COVER education handoff.

Jurisdiction remains deliberately unverified until an official source is reviewed. COVER does not quote, bind, score, or recommend an insurer. Disputed practice does not count toward verified totals. Corrections retain provenance.

See `docs/W40-W50_MVP_REPORT.md` for the wave gates and remaining blockers before any real-minor pilot.

## Operational MVP implementation

The harmonized MVP also retains the local W16-W30 operational platform layer, including workspace services, authorization scaffolding, rules services, Playwright E2E coverage, and build certification tooling.

See docs/IMPLEMENTATION-W16-W30.md for the preserved operational implementation details.

## Scout Learning local pilot

Set `ROADREADY_LEARNING_ENABLED=true` in the local environment and open
`/teen/roadready`. The default is disabled. Scout Learning uses the existing local
platform account API, household relationships, consent, SQLite records and audit
trail. It does not use demo role selectors as authorization. Guardians can create
an invitation and consent to learning through Family learning access.

Five modes share one challenge service: Sign Snap, Symbol Match, Road Markings,
Signal Sense and What Would You Do? The initial US-TX pack contains 54 concepts.
Three distinct observations at least 24 hours apart establish demonstrated
understanding; later evidence or guardian parked practice can reinforce it.

Run `npm run test:roadready`, `npm run test:roadready:e2e`, or the mandatory gate
aggregator `npm run roadready:certify`. The aggregator reports failure for any
missing/failing gate. See [execution evidence](docs/ROADREADY_W51_W60_REPORT.md)
for the actual certification status and existing merge/regression limitations.\n\n### Competitive independence and evidence boundary\n\nSupervised-driving logging is a supporting evidence subsystem, not the Teensurance product category. Practice evidence feeds readiness, jurisdiction progress, the Safety & Readiness Passport, and insurance readiness; it must not independently establish legal eligibility, safe-driver status, insurance eligibility, premium amounts, or discount entitlement.\n\nCustomer-facing branding must use Teensurance-owned names. The existing `roadready` route/code namespace is a legacy technical identifier and must not be extended with new identifiers. New development should use Teensurance-owned namespaces, with the legacy namespace migrated through a compatibility-preserving refactor. Competitor products may be researched for market context but must not be used as source code, design, copy, content, workflow, or rule specifications. See `docs/IP_PROVENANCE_POLICY.md`.
