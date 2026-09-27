# W81-W90 — Global UX, Brand, Loading, Help & FAQ

## Delivered
- Shared Teensurance logo component and global color/token usage.
- Responsive shared public navigation with working teen, parent, How it works, FAQ, Join family and Log in routes.
- Shared footer with working navigation and GUARD safety messaging.
- Branded logo loading state for application data fetches.
- Landing FAQ with six MVP-relevant questions.
- "Ask T" contextual help chat on landing, auth/join and parked application views.
- Help backend is bounded to Teensurance navigation/product/safety guidance; it does not make licensing eligibility, legal or insurance decisions.
- Chat is not rendered in Drive Mode.
- Auth and Join pages now use the same brand identity as landing/application.
- Responsive behavior and reduced-motion handling are included.

## MVP boundary
The help chat is deterministic and grounded in the current product rules rather than an external generative model. This makes the feature functional now without introducing an unconfigured AI provider or unsupported regulatory advice. A model-backed assistant can later replace/augment this layer behind the same safety boundary.

## Verification gate
Repository changes are implemented, but full browser visual/E2E certification remains dependent on an executable deployment/CI environment. Google OAuth and live Supabase-backed family flows remain dependent on the dedicated Teensurance Supabase project identified in W71-W80.
