# Product Requirements Document — Teensurance AI

## 1. Product

**Name:** Teensurance AI
**Tagline:** Drive smarter. Go further.

**Core thesis:** Teensurance AI is an AI-native driving, insurance and financial-readiness platform that accompanies young people from learner permit toward independent driving while helping families understand and manage the journey.

**MVP is narrowed to:**
1. Young-driver journey guidance
2. Milestones
3. Step-by-step directions
4. Supervised driving-hour logging
5. Supervisor verification
6. Parent/family coordination
7. Safety-first AI orchestration
8. Permit/license requirement guidance
9. Insurance preparation at the appropriate lifecycle moment

Out of scope for MVP: the full long-term insurance platform (see `docs/MVP.md` §Scope Control).

**MVP question to prove:** Can Teensurance become the trusted guide that tells a family what comes next, helps them complete it safely, and remains useful through the transition toward licensing and insurance?

## 2. Fundamental experience

The atomic unit of the product is the **Next Best Step**. Every user should be able to answer: Where am I? What's next? Why does it matter? How do I do it? Who needs to help? What counts as completion? Has it been verified? What happens after this?

Product loop:

```
Current State → Determine Next Step → Assign Specialist Agent → Explain
→ Guide Action → Capture Evidence → Verify → Complete Milestone
→ Celebrate → Recalculate Journey → Assign Next Step
```

The product is not organized around dashboards. The primary teen surface is **My Journey**.

## 3. Users

- **Young driver:** pre-permit, permit holder, supervised learner, near-license, newly licensed.
- **Parent/guardian:** one or multiple young drivers, insurance decision maker, milestone verifier.
- **Supervisor:** parent, guardian, eligible relative, or other eligible supervising adult. Has a lightweight verification workflow and does **not** automatically receive household insurance access.
- **Internal admin/content operator:** owns jurisdictions, requirements, source verification, requirement versions, content, exceptions, and safety review.

## 4. Safety constitution (highest priority)

> No feature, agent, reward, notification, growth objective, or commercial objective may encourage behavior that increases driving risk. When the vehicle is moving, Teensurance gets out of the way.

Priority hierarchy (higher always overrides lower):

1. Life & physical safety
2. Legal/regulatory requirements
3. Privacy & minor protection
4. Parent/teen consent
5. Accuracy
6. Financial outcomes
7. Engagement
8. Rewards
9. Growth/revenue

Never optimize for: miles driven, unnecessary trips, speed, driving streaks, competition, leaderboards, or phone interaction while driving.

## 5. Drive Mode

- **Before drive:** select supervisor, select practice goal, review preparation, start session.
- **During drive:** minimal interface ("Eyes up. Phone down. We've got the log."). Disable/defer T conversations, achievements, rewards, insurance offers, educational interactions, unnecessary notifications, manual data entry, social features, marketing, interactive coaching.
- **After drive:** calculate duration, classify day/night where reliable, review practice categories, add optional notes, submit for supervisor verification, recalculate progress.
- Session logging is offline-tolerant; elapsed time does not require continuous connectivity.

## 6. T and T-Crew

Users interact with one assistant, **T**, which routes internally to specialist agents (VIBE, READY, ACE, MILES, CRUZE, GO, COVER) with **GUARD** as the safety kernel above all of them. Full contracts in `AGENTS.md`.

## 7. Journey Graph and Requirement Graph

The journey is modeled as a graph, not a hard-coded checklist, supporting parallel requirements, jurisdiction differences, exceptions, blocked paths, expiration, retry, and re-entry. Requirements are versioned and sourced (`Jurisdiction`, `Requirement`, `RequirementVersion`, `ApplicabilityRule`, `RequirementSource`); unverified data is explicitly marked `UNVERIFIED / DEMO DATA` and never silently invented. MVP launches in one verified jurisdiction before national expansion.

## 8. Family Graph and Family Command Center

Modeled as `Household`, `User`, `HouseholdMembership`, `Relationship`, `Guardian`, `YoungDriver`, `Supervisor` — not a flat `parent_id → teen_id`. Supports multiple young drivers per household from day one. Permissions attach to relationships/resources; a supervisor can verify a session without seeing insurance, other teens, household finances, or unrelated evidence.

## 9. Driving Log and Supervisor Verification

Driving Log is P0. Distinguishes **logged hours** from **verified hours**. Flow: teen logs drive → submits → supervisor reviews → confirm/edit/dispute → audit event → verified hours update → Journey Graph recalculates → VIBE determines next step. Corrections are never silent overwrites — they retain original value, corrected value, reason, actor, timestamp, and approval/dispute state.

## 10. Evidence, privacy and consent

Evidence carries provenance (`SELF_REPORTED` → `SUPERVISOR_CONFIRMED` → `DOCUMENT_VERIFIED` → `PROVIDER_VERIFIED` → `OFFICIAL_SOURCE_VERIFIED`) and is never silently upgraded in strength. Journey data is separated from insurance-rating/telematics data; sharing requires explicit purpose-specific consent (`Consent`, `ConsentVersion`, `ConsentGrant`, `ConsentRevocation`, `DataPurpose`). Turning 18 is a lifecycle/permissions event — guardian permissions are not assumed to persist unchanged.

## 11. Insurance MVP (COVER v1)

Not a carrier marketplace. COVER v1 provides family insurance preparation: a current-insurance snapshot, an explanation of the upcoming young-driver event, questions to ask an insurer/agent, possible eligibility categories, and a preparation checklist. It never guarantees savings, claims underwriting eligibility, binds insurance, fabricates quotes, or predicts premiums.

## 12. Information architecture

**Teen nav:** My Journey · Learn · Drive · T · Profile
**Parent nav:** Home · My Family · Journey · Insurance · T · Settings

Navigation stays clean; agent architecture is never exposed as navigation.

## 13. Required screens (by area)

Public (8), Onboarding (8), Teen (12), Parent (9), Supervisor (4), Internal/Admin (9) — 50 screens total. Full list maintained alongside the design system; see `docs/ARCHITECTURE.md` for how screens map to domain boundaries.

## 14. Design system

Palette: Midnight `#071329`, Electric Cyan `#00C8FF`, Pulse Violet `#7557FF`, Spark Pink `#F43EC8`, Volt `#C8FF4D`, Signal Green `#34D399`, Warm Amber `#FFB547`, Cloud `#F7F9FC`, Ink `#101828`. Signature gradient: Cyan → Violet → Pink, used sparingly. Volt is reserved for high-priority action states.

Tone split: 80% typography, whitespace, motion and clear hierarchy; 20% expressive personality (accent type, gradient, micro-celebration). Avoid manufactured youth via excessive slang, emoji, or meme UI.

## 15. Product copy guardrails

Never claim "guaranteed savings," "guaranteed safer driver," "best insurance," or "lowest rate." Core safety line: "Your drive comes first. Teensurance can wait."

## 16. Success metrics

Activation, guidance engagement, driving utility, verification rate, milestone completion, parent engagement, content accuracy, safety interventions (blocked/deferred), insurance-transition engagement, retention. Explicitly do not optimize for miles driven, drive count, or streaks.
