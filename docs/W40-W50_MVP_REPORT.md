# W40-W50 — MVP Completion & Pilot Hardening

This batch continues the existing family pilot. It does not expand Teensurance into telematics, insurance quoting, social driving, a carrier marketplace, or unsupported regulatory automation.

| Wave | MVP focus | Implemented gate |
| --- | --- | --- |
| W40 | Certification carry-forward | Existing W30-W40 safety invariants remain mandatory; merge stays gated on executable checks. |
| W41 | VIBE next-best-step | Deterministic next action is derived from evidence state; no generative regulatory advice. |
| W42 | Supervisor exceptions | Parent can verify, correct, or dispute a practice record; disputed records do not count. |
| W43 | Evidence provenance | Corrections preserve old/new minutes, actor, reason and timestamp; verification records reviewer role. |
| W44 | Recovery/idempotency | Optional request IDs prevent duplicate state mutation on safe retries. |
| W45 | Jurisdiction boundary | Family may record a jurisdiction name, but it remains unverified until an authoritative source is reviewed. |
| W46 | COVER MVP boundary | COVER becomes an educational parent handoff only; no quote, premium, eligibility or binding claim. |
| W47 | Audit/operational visibility | New writes remain GUARD-mediated and audited; aggregate pilot metrics are available without teen ranking. |
| W48 | Critical tests | Next-step, dispute/correction, jurisdiction and COVER boundaries have unit coverage. |
| W49 | Accessibility/security hardening | Existing keyboard/focus semantics retained; server validates payloads; no secrets, raw location or new minor-data collection added. |
| W50 | Pilot-readiness decision | MVP is functionally broader, but real-minor pilot remains BLOCKED until auth/guardian identity, durable tenant-isolated storage, consent/privacy controls, verified jurisdiction content and browser E2E are certified. |

## MVP user loop

1. Teen prepares while parked and records safety setup.
2. VIBE identifies the next safe action.
3. Teen creates one supervised practice plan.
4. Drive Mode disengages the app while moving.
5. Teen logs the session after parking.
6. Parent verifies, corrects or disputes the record.
7. Verified totals and the Safety & Readiness Passport recalculate.
8. Teen reflects and receives the next deterministic practice action.
9. COVER may surface educational preparation for the parent after basic evidence exists.
10. Regulatory eligibility remains outside the pilot until sourced rules are implemented.

## Explicit MVP exclusions

No continuous GPS, advanced telematics, speed scoring, streaks, driving leaderboards, social feed, rewards marketplace, insurer quoting/binding, premium scoring, public API, nationwide rules database, or autonomous licensing determination.

## W50 release status

**LOCAL/DEMO MVP: implementation advanced, certification pending.**

**REAL-MINOR PILOT: BLOCKED.** The visible teen/parent switch is not authentication. JSON persistence is not production storage. No jurisdiction has been verified. The app cannot reliably establish real vehicle motion. Those are safety/security boundaries, not polish items.

Do not merge or describe W50 as certified until automated test/typecheck/build and browser E2E evidence are green.
