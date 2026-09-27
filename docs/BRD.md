# Business Requirements Document — Teensurance AI

## 1. Business opportunity

Every year, millions of teens move through learner's permit, supervised practice, and licensing — a process families widely experience as confusing, fragmented across state DMV sites, driving schools, and insurers, and stressful to track. Insurance for a newly licensed teen is typically the single largest premium increase a family will see, often without warning or preparation.

Teensurance AI positions itself at the intersection of **guided compliance** (getting a teen safely and correctly to a license) and **insurance readiness** (preparing the family for what licensing means financially), rather than competing directly as either a driving-school product or an insurance marketplace on day one.

## 2. Business objectives

- Become the trusted, AI-guided companion for the permit-to-license journey in at least one verified jurisdiction.
- Establish durable household relationships (parent + one or more teens) that persist through the multi-year licensing journey.
- Build the foundation (Journey Graph, Requirement Graph, Family Graph, Evidence Graph) that a future, licensed insurance distribution business can be built on — without prematurely acting as an insurer, MGA, or carrier.
- Prove supervisor-verified, auditable driving-hour tracking as a trust primitive that is valuable independent of any insurance transaction.

## 3. Target customers

- **Primary:** parents/guardians of a pre-permit or permit-holding teen, who are the economic buyer and the insurance decision-maker.
- **Secondary:** the teen driver, who is the primary daily user of the journey and driving-log experience.
- **Tertiary:** supervisors (often a second parent, relative, or other eligible adult) who verify supervised practice.

## 4. Value proposition

- **For teens:** one place that always answers "what's next," turns a legal/regulatory process into a clear guided journey, and safely logs supervised practice without adding friction or distraction while driving.
- **For parents:** visibility into progress across one or more teens, a lightweight way to verify supervised hours, and early, honest preparation for the insurance decision that's coming — without sales pressure or fabricated savings claims.

## 5. Business model boundaries (MVP)

Teensurance AI MVP is **not** an insurance carrier, MGA, or broker of record, and does not bind coverage, generate binding quotes, or guarantee premium outcomes. Revenue and monetization strategy for insurance distribution is deliberately deferred past the MVP; the MVP's business objective is trust, data quality, and household retention, not insurance transaction volume. Architecture should create clean extension points for a future licensed distribution model without assuming its shape today.

## 6. Constraints

- Regulatory/licensing requirements vary by jurisdiction and change over time; the business cannot claim national coverage until requirements are sourced and verified jurisdiction by jurisdiction.
- The product handles minors' data, which imposes privacy, consent, and data-minimization obligations that constrain what can be collected, retained, or shared (see `docs/PRIVACY_CONSENT` boundaries referenced in the PRD).
- Any future insurance distribution work is subject to state-by-state insurance licensing requirements not addressed by this MVP.

## 7. Success criteria (business-level)

- Families complete household/teen onboarding and receive a personalized journey.
- A meaningful share of eligible users log and get supervisor-verified supervised-driving sessions.
- Parents engage with COVER (insurance preparation) as teens approach licensing, without the product having made unsupported claims.
- Requirement content in the pilot jurisdiction is accurate and sourced, with errors tracked and low.
- The system demonstrates it can safely defer or deny unsafe agent behavior (GUARD interventions) without needing to be manually policed post hoc.

## 8. Risks

- **Regulatory risk:** publishing incorrect permit/licensing requirements. Mitigated by explicit `UNVERIFIED / DEMO DATA` marking and a sourced Requirement Graph rather than freeform AI-generated requirement text.
- **Safety/liability risk:** any feature that could plausibly encourage unsafe driving behavior (streaks, leaderboards, in-drive engagement). Mitigated by the Safety Constitution and GUARD as a deterministic layer, not a prompt-only control.
- **Trust risk:** parents distrust a product that appears to be a thin lead-gen funnel for insurance. Mitigated by keeping COVER strictly educational in the MVP and never fabricating quotes or savings.
- **Data risk:** handling minors' data and driving-behavior data without adequate consent and minimization. Mitigated by the Consent model and the explicit separation of journey data from insurance-rating/telematics data.

## 9. Out of scope (business-level, MVP)

Carrier marketplace, carrier binding, MGA functionality, proprietary premium scoring, advanced telematics, continuous GPS surveillance, social/competitive features, large rewards marketplace, vehicle marketplace, nationwide unsupported requirement claims, public developer API, and lifecycle stages beyond initial licensing (college, independent-policy lifecycle).
