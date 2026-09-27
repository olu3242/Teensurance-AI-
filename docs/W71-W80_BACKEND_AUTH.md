# W71-W80 — Backend/Auth/Invitation/Referral Integration

## Implemented in code

- Supabase SSR browser/server clients using publishable-key configuration.
- Google OAuth login entry and PKCE callback route.
- Auth-first landing and invitation entry points.
- Cryptographically random invitation codes: `INV-XXXXXXXX`.
- Cryptographically random referral codes: `REF-XXXXXXXX`.
- Separate namespaces and validation tests for invite/referral codes.
- Authenticated invitation-generation API with guardian RLS enforcement.
- Authenticated referral-code generation/reuse API.
- Supabase schema for profiles, households, memberships, invitations, referral codes and referral attribution.
- RLS enabled on every public table plus explicit Data API grants.
- No authorization decision uses Google/Supabase `user_metadata`.
- Node 22 runtime contract for current Supabase client support.

## Deliberate security boundary

Invitation **generation** is wired. Invitation **redemption** is not allowed to query the invitation table broadly from the browser. Redemption needs an atomic, reviewed server/RPC path that validates expiry/revocation/use count and inserts membership without exposing valid invite codes. That must be implemented and tested against the actual Teensurance Supabase project.

Referral codes are attribution only. They never grant household access, roles, rewards, licensing status or insurance benefit.

## Google Auth activation status

The application code is ready for Supabase Google OAuth, but provider activation is **BLOCKED** because the connected Supabase account currently exposes only:

- Velocity Field Service OS
- Velocity Staging

No Teensurance Supabase project is available. Teensurance was intentionally not connected to either unrelated project.

To activate Google sign-in, create/connect the dedicated Teensurance Supabase project, set its project URL and publishable key, configure the Google provider credentials in Supabase Auth, add the Supabase callback URL to Google, and allow the application `/auth/callback` redirect URLs in Supabase.

## Verification status

Static code/tests are committed, but dependency lock regeneration, database migration/advisors, OAuth handshake, invite generation against RLS, referral persistence and browser E2E require the dedicated Teensurance Supabase project and executable CI.
