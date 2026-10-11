# I-3 — `app_users` provisioning and insert policy

**Stage:** 2
**Blocked by:** F-3 (and F-1 for the schema toolchain; may land with I-4)
**Blocks:** —

## Goal

Create the local profile row keyed by Clerk's opaque user ID, provisioned
idempotently inside a verified, RLS-scoped transaction — with no webhook
required for first creation.

## Scope

- `app_users`: `clerk_user_id text primary key`, display name (optional),
  timezone (IANA, default `UTC`), week start (default Monday), `deletion_state`
  (`none`/`pending`), `deletion_requested_at`, timestamps. Email and profile
  image stay provider-owned.
- **Idempotent provisioning** on first authenticated request: inside a
  transaction with `app.user_id` set, insert the profile row if absent.
- RLS **insert policy** for the runtime role permitting only a row whose
  `clerk_user_id` equals the transaction-local context (`nullif(..., '')` so an
  empty setting never matches).
- A settings surface to edit display name, timezone, and week start (shares the
  `FormField` component).

## Deliverables

- Migration for `app_users` + RLS policy; repository + provisioning call.
- Settings UI reading/writing preferences under RLS.
- Tests: provisioning is idempotent; insert with missing/forged context is denied.

## Acceptance

- [ ] First sign-in creates exactly one row; repeated requests do not duplicate.
- [ ] Insert under absent context fails; insert for another ID fails.
- [ ] Timezone/week-start persist and drive later User-Day logic.

## References

- `docs/data-and-security.md` (app_users row; initial app_users creation)
- `docs/architecture.md` (Keep a local app_users row)
- `docs/product-spec.md` (Accounts and settings)
