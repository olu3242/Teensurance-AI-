# Teensurance MVP: end-to-end design

## Product promise

One family can see the next step in the driving journey, prepare a supervised session, log it after parking, have a parent review it, and see verified practice progress. The interface uses a single primary guide, T, with named specialist functions behind each step. GUARD evaluates every write.

## Experience map

| Screen | Primary job | State change |
| --- | --- | --- |
| Journey | See five milestones, directions, helper, and evidence needed | Select a step |
| Log a drive | Record date, duration, skill, supervisor, night flag, reflection | Pending supervised entry |
| Family review | Parent checks a pending entry and sets a family practice goal | Verified entry; goal update |
| Driving state | Remove distracting interactions | Returns only when user indicates parked |

## End-to-end flow

1. Teen opens Journey and selects Practice with a supervisor.
2. CRUZE presents a short plan to agree on while parked. During movement, the app displays only the driving screen.
3. After the drive, teen completes the MILES form. The server validates inputs, GUARD checks the action, and the record is stored as pending.
4. Parent opens Family review and verifies the entry. GUARD enforces the parent role at the domain boundary.
5. Verified time updates overall and night progress. Pending time does not count. Every attempted mutation produces a SafetyDecision audit entry, including denied attempts.

## Data and rules

`Log`: id, date, minutes, night flag, focus skill, supervisor name, note, pending/verified state, creation and verification timestamps.

`SafetyDecision`: id, timestamp, proposed action, actor role, reported driving state, decision, reason. GUARD currently returns ALLOW, DEFER, REQUIRE_PARENT, REQUIRE_VERIFICATION, or DENY. The domain contract allows official-source escalation later.

Validation: date must be real and no later than today; duration 1–240 minutes; required supervisor and skill; notes limited to 300 characters. No eligibility status is inferred from practice time.

## Production gates

This runnable pilot uses a role switch and a local JSON file. Before real family use, replace those with verified identities and relationships, consent for minors, server-owned authorization, transactional tenant-scoped persistence, data lifecycle controls, reviewed official jurisdiction rules with provenance and effective dates, and robust driving-state safeguards. Insurance decisions stay with the parent and licensed professionals. An actual supervisor attestation flow is also required; parent verification in this pilot is only a review acknowledgement.

## Release checks

- Teen can submit a valid entry while parked; invalid dates and durations fail.
- Teen cannot verify; parent can verify once; pending entries do not count.
- Actions in driving state defer; the UI hides all working controls.
- Refresh retains entries and progress in the local pilot.
- Build, types, unit safety checks, and API journey test pass.
