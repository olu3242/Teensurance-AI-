# W30-W40 — Safety & Readiness Implementation

## Objective

Extend the local family pilot so safety is a product invariant rather than a feature. This batch deliberately does **not** add telematics, GPS surveillance, driving competition, streaks, licensing determinations, insurance scoring, or unsupported jurisdiction claims.

## Waves

| Wave | Implementation | Acceptance gate |
| --- | --- | --- |
| W30 | Safety Constitution reinforcement | Moving-vehicle actions are deferred; unsafe engagement patterns are explicitly denied. |
| W31 | Parked practice planning | Teen can define one skill, one objective and one supervisor before practice. |
| W32 | Teen safety setup evidence | Phone-away, seat-belt/seating and mirrors/controls checks are recorded while parked. |
| W33 | Guardian safety participation | Supervisor readiness and emergency-plan attestations require parent role. |
| W34 | Safety & Readiness Passport model | Passport reports evidence states only; no legal eligibility, risk, safety, or insurance score. |
| W35 | Backward-compatible state migration | Existing pilot JSON loads with new arrays defaulted without discarding logs. |
| W36 | API orchestration | Plan, safety and reflection writes pass through GUARD and audit. |
| W37 | Safety policy tests | In-drive writes, role boundaries and prohibited engagement mechanics have automated coverage. |
| W38 | Pre/post-drive UX | Preparation happens before driving; reflection happens after parking. |
| W39 | Passport UX | Teen/family can see evidence present, building, and not-started dimensions plus next safe step. |
| W40 | Certification boundary | Build/type/test must pass before merge; production readiness remains blocked on auth, durable DB, verified jurisdiction rules and real minor-data controls. |

## Safety invariants

1. While `drivingState=driving`, every state-changing pilot action returns `DEFER`.
2. Drive Mode contains no chat, reward, educational prompt, manual entry, marketing, leaderboard, or competitive mechanic.
3. The engagement policy denies speed scores, miles competition, drive-count streaks, leaderboards, trip-count rewards and in-drive prompts.
4. Practice quantity is not treated as proof of safe driving.
5. Family practice goals are clearly separated from legal requirements.
6. Passport evidence is descriptive. It never declares licensing eligibility or predicts driving safety.
7. Teen and guardian attestations remain separate so a user cannot self-confirm the other role's evidence.
8. Regulatory facts remain outside this batch until an official-source-backed jurisdiction record is verified.

## Passport dimensions

- **Safe setup habits** — three teen-owned parked safety checks.
- **Verified supervised practice** — at least one parent-verified practice session.
- **Post-drive reflection** — reflection linked to verified practice.
- **Guardian safety participation** — guardian attestations plus verified practice.

Statuses are `not_started`, `building`, or `evidence_present`. There is intentionally no numeric safety score.

## Production blockers intentionally retained

The role switch is a demo control, not authentication. Local JSON is not production persistence. The browser cannot reliably establish vehicle motion. No jurisdiction has been assumed or marked verified. Before real minors use the product, Teensurance still requires authenticated guardian relationships, consent/data-retention controls, tenant isolation/RLS, stronger driving-state strategy, sourced jurisdiction rules, privacy/security review, accessibility certification, and pilot review with safety/domain experts.
