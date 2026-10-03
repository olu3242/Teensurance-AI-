# Architecture Overview — Teensurance AI

See `architecture-diagram.mmd` for the diagram source (Mermaid).

## Layering

```
/domain          Core entities and business rules (Journey, Requirement, Family, Driving, Evidence, Insurance)
/application      Use cases / orchestration that domain services expose
/infrastructure   DB, auth, external integrations
/agents           T and T-Crew agent contracts, state machines
/safety           GUARD policy engine and SafetyDecision records
/journey          Journey Graph engine, next-best-step computation
/requirements     Requirement Graph, jurisdictions, sourcing, versioning
/family           Household, guardianship, supervisor permissions
/driving          Drive Log, Drive Mode, sessions, corrections
/evidence         Evidence Graph, provenance, verification
/insurance        COVER — insurance preparation boundaries
/auth             Authentication, authorization, RLS-style boundaries
/ui               Presentation layer only — no domain logic
```

Domain logic is never buried inside UI components.

## Core domain models

- **Identity/Family:** `User`, `Profile`, `Household`, `HouseholdMembership`, `Relationship`, `Guardian`, `YoungDriver`, `Supervisor`
- **Requirements:** `Jurisdiction`, `Requirement`, `RequirementVersion`, `RequirementSource`, `ApplicabilityRule`
- **Journey:** `Journey`, `JourneyNode`, `JourneyEdge`, `Milestone`, `Step`, `JourneyProgress`
- **Driving:** `DrivingSession`, `DrivingSegment`, `DrivingPracticeCategory`, `SupervisorVerification`, `DrivingSessionCorrection`
- **Evidence:** `Evidence`, `EvidenceSource`, `Verification`
- **Consent:** `Consent`, `ConsentVersion`, `ConsentGrant`, `ConsentRevocation`, `DataPurpose`
- **Vehicle/Insurance:** `Vehicle`, `InsuranceProfile`, `PolicySnapshot`
- **Agents/Safety:** `AgentDefinition`, `AgentAssignment`, `AgentState`, `AgentAction`, `SafetyPolicy`, `SafetyDecision`
- **Operational:** `Notification`, `NotificationPolicy`, `ExceptionCase`, `AuditEvent`

Every entity carries IDs, timestamps, soft deletion where appropriate, provenance, versioning where relevant, and explicit tenancy/household boundaries.

## Request/action flow (AI-mediated actions)

```
User → T → Intent/Context → GUARD → Specialist Agent
     → Domain Service / Tool → Deterministic Rules → Result
     → GUARD → T Explanation
```

## Supervisor verification flow

```
Teen logs drive → submit for verification → supervisor receives request
→ review → CONFIRM / EDIT / DISPUTE → audit event
→ verified hours update → Journey Graph recalculates → VIBE determines next step
```

## Security posture

- Authentication and authorization on every request; no client-side-only role checks.
- Household isolation enforced server-side; Row-Level Security (or equivalent) when using Postgres/Supabase.
- Least-privilege access; secure, expiring supervisor tokens for lightweight verification flows.
- Input validation, rate limiting boundaries, audit logging, and consent checks on sensitive operations.
- Sensitive-data minimization by default (see `docs/AI_STRATEGY.md` for the AI-specific privacy posture).

## Resilience

- Drive logging tolerates network interruption, app backgrounding (where the platform allows), retry, duplicate submission, and clock/session reconciliation.
- Idempotency is used to prevent duplicate sessions from inflating logged hours.

## Technical stack (default, adapt to existing repo)

Next.js, TypeScript, PostgreSQL/Supabase, server-side authorization, schema validation (e.g., Zod), a componentized design system, and a modern testing stack (unit + integration + E2E). If a repository already exists, its conventions take precedence — see `.claude/CLAUDE.md`.

## RoadReady local integration

`lib/roadready` adds jurisdiction content, a deterministic evidence projection,
Scout's machine-readable contract and an authenticated service. `/api/roadready`
reuses `lib/platform` authentication, transactions, records, idempotency and audit.
It creates no second datastore. `roadready_attempt` and `roadready_guardian` records
are append-only through SQLite triggers. Session and mastery projections are mutable;
Passport linkage retains immutable evidence IDs. Every request rechecks household,
guardian relation, consent, adult sharing and active drives before replay or execution.

The local records database has no RLS facility. Authorization is enforced in the
service; SQL tests verify immutable evidence. This is not a hosted PostgreSQL/RLS
certification. The initial pack is US-TX only; unsupported jurisdictions fail closed.
The current demo pilot and staged authenticated platform remain separate baseline
paths; RoadReady explicitly uses authenticated local accounts.


## W62 legacy learning authorization

Legacy dashboards and lessons now use the existing platform session rather than
shared `data/pilot.json`. `authorizeLearner` is shared by RoadReady and legacy
learning: authenticated user -> persisted active membership -> own learner or
active guardian relationship -> scoped profile/progress. Private lesson progress
uses `records(kind=lesson_progress)` with household and owner SQL predicates.
Public definitions are available separately at `/api/lessons/catalog`.

`/api/pilot` is an authenticated read projection; its mutations remain retired.
`/api/os/status` and the global admin projection are retired until explicit admin
authorization exists. No legacy JSON history is silently assigned to an account.
`security:certify` runs negative service/API authorization tests and is a mandatory
step of `roadready:certify`. Hosted RLS and persistence require separate W63 checks.
