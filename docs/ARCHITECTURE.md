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
