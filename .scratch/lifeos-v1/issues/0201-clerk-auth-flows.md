# I-1 — Clerk authentication flows

**Stage:** 2
**Blocked by:** F-1, F-3
**Blocks:** I-2

## Goal

Deliver the full identity surface with Clerk so no product route exists without a
verified account.

## Scope

- **Email/password**: register, log in, log out, **required email verification**,
  password reset.
- **Google OAuth**: enabled, with **safe same-person account linking** for
  verified matching emails per the Clerk configuration.
- Mount Clerk's `clerkMiddleware`/provider; keep route protection in a
  proxy/layout **as UX only** (the security boundary is server-side, per I-2).
- Configure the Clerk env vars from `.env.example`
  (`NEXT_PUBLIC_CLERK_*`, sign-in/up URLs, fallback redirects — verify exact
  current names in Clerk docs).
- Auth E2E for supported email/password flows against the **Clerk test
  instance**; keep Google + account linking on a manual release checklist unless
  a safe automated flow exists.

## Deliverables

- Sign-up, sign-in, verify, reset, sign-out routes working in preview.
- Manual checklist entry for Google sign-in / account linking.
- No account ID accepted from form data, query, or client state.

## Acceptance

- [ ] Unverified email cannot reach the app.
- [ ] Reset flow works end-to-end in preview.
- [ ] Sign-out clears the session; back-navigation cannot reach private data.
- [ ] Automated email/password E2E passes; Google flagged manual.

## References

- `docs/product-spec.md` (Accounts and settings)
- `docs/architecture.md` (Identity, sessions, authorization)
- `docs/testing.md` (Auth coverage; CI Clerk test instance)
- `docs/github-and-ci.md` (Clerk and untrusted pull requests)
