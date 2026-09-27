# W91-W100 — Dashboards, Time Calculator, Admin & Driving Lessons

## W91-W92 — Practice time calculator + customization
- Family-goal time calculator based only on verified practice.
- Remaining time, optional night-practice planning, sessions/week, minutes/session and estimated weeks.
- Explicitly distinguishes a customizable family goal from a legal requirement.
- Reusable dashboard preference model and per-browser widget visibility customization.

## W93-W96 — E2E driving lessons and scenarios
The MVP now includes an educational progression:
1. Before the car moves
2. Smooth starts, stops and turns
3. Intersections and gap judgment
4. Parking and low-speed maneuvering
5. Highway merging
6. Night driving
7. Rain and reduced traction
8. Breakdown and crash response

Lessons have prerequisites, practice focus and parent debrief guidance. Interactive parked-only scenarios provide immediate safety feedback. Lesson/scenario attempts are persisted in MVP state and visible to dashboards.

The lesson engine is educational. It does not replace driver education, supervised instruction, or official jurisdiction requirements.

## W94-W95 — Teen and Parent dashboards
Teen dashboard:
- VIBE next safe step
- practice time calculator
- Passport evidence
- recent practice
- lesson progression

Parent dashboard:
- review queue
- family practice calculator
- family/Passport progress
- safety + lesson evidence
- COVER preparation

Both dashboards are customizable by widget visibility. Production personalization should later persist per authenticated user rather than browser localStorage.

## W97 — Platform admin console
Read-only local-MVP console exposes:
- system boundary
- operational counts
- workflow instances
- human-review/exception/source counts
- recent events

It intentionally has no privileged mutations. Production admin access requires a separately authenticated platform-admin role and cannot reuse the Teen/Parent demo switch.

## W98-W99 — Responsive UX + tests
- Responsive dashboard/lesson/admin layout.
- Global navigation connects to lessons.
- Time calculator and lesson progression unit tests.

## W100 boundary
The feature layer is implemented, but production certification remains blocked by the dedicated Teensurance Supabase project, authenticated household/admin roles, durable persistence, verified jurisdiction content, and executable browser/CI certification.
