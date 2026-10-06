# SAVE implementation

SAVE is the guardian-facing insurance cost strategy layer.

## Phase 1 — persistence
SAVE persists policy baselines, opportunities, decisions, comparable quotes and verified savings ledger entries through the existing household-scoped persistence abstraction. Hosted mode therefore uses the configured PostgreSQL/Neon database; local development continues to use SQLite.

## Phase 2 — service and API
`/api/save` supports authenticated guardian-scoped baseline capture, opportunity evaluation, quote capture and verified-savings recording. Same-origin checks and rate limits apply to writes.

## Phase 3 — parent dashboard
The parent dashboard contains a SAVE card that distinguishes opportunities from verified outcomes. It never displays an estimated opportunity as verified savings.

## Phase 4 — certification invariants
Verified savings require:
1. a recorded prior annual premium;
2. a normalized coverage fingerprint;
3. a carrier or quote result;
4. the same coverage fingerprint before and after.

A lower premium with materially different coverage is not verified savings. A higher comparable premium produces zero savings rather than a negative savings claim.

## Agent boundaries
SAVE may detect, prioritize, explain and prepare comparisons. It may not bind or cancel insurance, automatically reduce coverage, invent premium or discount amounts, or create an underwriting/risk score. Parent consent remains required before marketplace data sharing or other consequential insurance actions.
