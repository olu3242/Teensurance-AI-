# W51-W60 — Teensurance Workflow / Orchestration OS

## Objective

Turn the MVP from screen-driven mutations into a deterministic, event-driven workflow runtime. Safety remains the kernel: GUARD evaluates every state-changing command before a specialist agent/domain capability can execute.

## Architecture

```
User / system command
        |
        v
 Trigger Registry ---- priority P0..P9
        |
        v
      GUARD
        |
        v
 Workflow Registry ---- versioned state/completion/blockers
        |
        v
 Agent Contract ------- T / VIBE / READY / ACE / MILES / CRUZE / GO / COVER
        |
        v
 Orchestrator --------- only mutation path
        |
        v
 Domain state + Evidence + Audit
        |
        v
 Domain Events
        |
        v
 Context / Journey projection / next-best-step
```

## Waves

| Wave | Implementation |
| --- | --- |
| W51 | Stabilize W40-W50 domain contracts and migration fields. |
| W52 | Shared OS command, workflow, trigger, event, trace and agent types. |
| W53 | Versioned workflow registry for onboarding, permit, learning, practice, verification, reflection, licensing and coverage. |
| W54 | Trigger registry with P0-P9 priorities and P0 driving-safety supersession. |
| W55 | Explicit T-Crew agent contracts. Agents declare capabilities; GUARD remains the kernel. |
| W56 | GUARD-first orchestration runtime and event emission. |
| W57 | Structured context builder projecting journey, passport, jurisdiction, workflows, analytics and recent events. |
| W58 | Pilot API mutations routed through the orchestrator plus inspectable `/api/os/status`. |
| W59 | OS unit tests for safety priority, routing, events, evidence, idempotency and regulatory boundaries. |
| W60 | Certification boundary and architecture documentation. |

## Command/event rule

Agents and UI issue commands. They do not write state. The orchestrator validates the command through GUARD, resolves trigger/workflow/agent, executes the deterministic domain mutation, records audit/evidence, and emits events.

Examples:

- `plan` -> `practice.plan.created`
- `log` -> `drive.logged`
- `verify` -> `drive.verified`
- `correct` -> `drive.corrected`
- `dispute` -> `drive.disputed`
- `reflect` -> `reflection.completed`
- `jurisdiction` -> `jurisdiction.selected`

## Safety priority

A command with `drivingState=driving` resolves to the P0 `driving.interaction.requested` trigger. GUARD returns `DEFER` before mutation. No specialist agent executes and no domain event is emitted.

## Agent boundaries

- **T** — sole conversational/user-facing explanation surface.
- **VIBE** — journey/next-step projection; does not invent regulatory facts.
- **READY** — permit/pre-driving preparation.
- **ACE** — learning; current MVP has no autonomous completion authority.
- **MILES** — practice records and parent review.
- **CRUZE** — parked planning and post-drive reflection; never in-drive coaching.
- **GO** — licensing guidance only when requirements are verified.
- **COVER** — parent insurance preparation only; no quote/bind/eligibility.
- **GUARD** — deterministic safety authority over every command.

## MVP boundary

The OS is deliberately in-process for the MVP. It does not add Kafka/queues, background agent swarms, autonomous LLM decisions, telematics, GPS, insurer integrations, public APIs or a nationwide regulatory engine. The contracts are structured so those can later be implemented behind adapters without changing the safety model.

## W60 certification status

Implementation is complete on the feature branch. Certification remains pending until repository CI can execute `npm test`, `npm run typecheck`, `npm run build`, and browser E2E. Do not merge or call W60 certified until those gates are green.
