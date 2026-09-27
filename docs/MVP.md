# MVP Scope, Delivery Waves & Definition of Done — Teensurance AI

## Scope control — do NOT implement yet

Full carrier marketplace, carrier binding, MGA functionality, proprietary premium scoring, advanced telematics, continuous GPS surveillance, social feed, driving leaderboards or competition, large rewards marketplace, vehicle marketplace, nationwide unsupported requirements, carrier SaaS, public developer API, college lifecycle, independent-policy lifecycle.

Create extension points where sensible. Do not overengineer beyond what the MVP needs.

## Delivery waves

Implementation proceeds wave-by-wave, with a verification/acceptance gate before moving to the next wave. Do not attempt all waves in a single pass.

| Wave | Focus |
|---|---|
| **W0** | Repository discovery — inspect repo, document current architecture, identify reusable assets and gaps. Do not mutate code. |
| **W1** | Foundation — domain model, auth, household boundaries, roles, consent, audit. |
| **W2** | Requirement + Journey Graph — jurisdictions, requirement versions, journey graph, next-best-step engine, admin requirement tooling. |
| **W3** | T + T-Crew + GUARD — agent contracts, assignment, state machine, safety policy engine, structured orchestration. |
| **W4** | Teen experience — onboarding, My Journey, milestone detail, directions, Learn, T. |
| **W5** | MILES / Drive Log — pre-drive, Drive Mode, offline-aware timing, post-drive, history. |
| **W6** | Supervisor + Evidence — verification, correction, dispute, evidence provenance. |
| **W7** | Family Command Center — multi-teen household, parent actions, journey visibility, notifications. |
| **W8** | COVER MVP — insurance preparation, policy snapshot, educational guidance, transition triggers. |
| **W9** | Public brand — logo, landing page, teen/parent funnels, responsive system, SEO/accessibility. |
| **W10** | Exceptions + hardening — recovery, security, RLS, privacy, accessibility, resilience. |
| **W11** | Testing + certification — unit, integration, E2E, authorization, GUARD, journey, evidence. |
| **W12** | Pilot readiness — analytics, admin, seeded/demo journey, documentation, operational checklist. |

**W0 always runs first**, before any code is added or modified: inspect the repository, report current architecture, identify reusable components, map the existing implementation against `docs/PRD.md`, produce a proposed implementation plan, then proceed wave-by-wave with verification gates.

## Definition of done (MVP)

The MVP is not done because screens render. It is done when:

1. A teen can create/join a household.
2. Their stage can be established.
3. A personalized Journey can be generated.
4. They can clearly see their Next Best Step.
5. They can open directions for completing it.
6. They can safely start a supervised driving session.
7. GUARD suppresses inappropriate interactions during Drive Mode.
8. The session can be completed without continuous connectivity.
9. It can be submitted to the correct supervisor.
10. Supervisor can confirm/edit/dispute it.
11. Verified totals recalculate correctly.
12. Journey progress recalculates.
13. VIBE identifies the next step.
14. Parent can manage multiple young drivers.
15. Household boundaries are enforced server-side.
16. Requirements are versioned and sourced.
17. T does not invent regulatory requirements.
18. Evidence retains provenance.
19. Corrections retain audit history.
20. COVER activates at the appropriate journey stage.
21. Accessibility checks pass.
22. Critical security tests pass.
23. Critical GUARD tests pass.
24. E2E happy path passes.
25. Important recovery paths pass.
26. No unsupported insurance or regulatory claims are exposed.
27. No public page exposes proprietary architecture.

## Execution rules

- Inspect before changing. Preserve working functionality.
- Do not rewrite working architecture merely for stylistic preference.
- Do not fabricate regulatory data or insurance integrations.
- Do not expose secrets or commit environment credentials.
- Do not weaken security to make tests pass; do not remove tests to achieve green status.
- Do not bypass GUARD or use fake production claims.
- Do not expose internal architecture publicly.
- Do not implement unsafe driving engagement (streaks, leaderboards, in-drive interaction).
- Do not perform remote destructive operations without explicit authorization.
- Do not deploy or push unless explicitly instructed.

Where credentials or external services are unavailable: implement the boundary correctly, mock only at the infrastructure boundary, document what remains, and keep domain behavior testable.

## Required documentation set

`README.md`, plus under `docs/`: `PRD.md`, `BRD.md`, `MVP.md`, `AI_STRATEGY.md`, `ARCHITECTURE.md`, and (as the product matures) `JOURNEY_GRAPH.md`, `REQUIREMENTS_MODEL.md`, `T_CREW.md` (see `AGENTS.md`), `GUARD_SAFETY.md`, `FAMILY_PERMISSIONS.md`, `DRIVING_LOG.md`, `EVIDENCE_MODEL.md`, `INSURANCE_BOUNDARIES.md`, `PRIVACY_CONSENT.md`, `ACCESSIBILITY.md`, `SECURITY.md`, `TEST_STRATEGY.md`, `PILOT_READINESS.md`.

## Required final report (per wave / at completion)

Repository baseline; architecture discovered vs. implemented; files created/modified; database changes and migrations; Journey and Requirement model status; T-Crew and GUARD implementation status; Driving Log, Family Command Center, Supervisor workflow, Evidence architecture, COVER status; public site status; accessibility and security controls; tests executed and results; remaining gaps; deferred scope; pilot-readiness status; exact commands required for local execution. Do not claim something is implemented unless verified in the repository.
