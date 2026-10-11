# S0-1 — Complete and record the RLS / transaction-pinning spike

**Stage:** 0 (time-boxed: one week)
**Blocked by:** — (first ticket)
**Blocks:** F-1

## Goal

Prove, on the real providers, that the selected driver can run every protected
query inside a pinned transaction with transaction-local account context, and
that the runtime role cannot bypass RLS. Record the result so Stage 2 can build
on it. **If the proof fails, stop and revise the design before any user data is
stored.**

## Scope

- Finish the existing `spike/rls` harness (`docs/setup.md` §3, §5;
  `spike/rls/README.md`). It already models three roles, forced RLS,
  `set_config('app.user_id', $1, true)`, pooled reuse, maintenance reach, and the
  account-deletion cascade.
- Run it against a **throwaway Neon branch** with both the `pg` (node-postgres)
  and `@neondatabase/serverless` (`USE_NEON_SERVERLESS=1`) paths.
- Build the thin vertical Next.js skeleton: Clerk sign-in, one user-owned table,
  one protected read/write path, deployed to a Vercel **preview**.
- Record provider regions, cost, limits, and the accepted driver in the ADR.

## Deliverables

- `spike/rls` green locally, on Neon (`pg`), and on Neon (serverless pool).
- A preview deployment where the server derives the account ID **only** from the
  verified Clerk session and writes/reads one owner-scoped row through
  `set_config`.
- ADR 0001 updated from "Proposed" to the validated state, with chosen driver,
  Neon region, Vercel function region, and estimated monthly cost.
- A short results note (in the PR) listing pass/fail per security case.

## Acceptance (the spike "pass" gate)

- [x] Missing context is denied (default-deny).
- [x] A forged `app.user_id` cannot read or write another account's row.
- [x] Rollback leaves no context behind.
- [x] A pooled connection reused after commit/rollback does not carry the
      previous identity (the `nullif(current_setting(...), '')` case).
- [x] Runtime role is not table owner and not `BYPASSRLS`; maintenance role
      reaches only authorized/expired rows.
- [x] Clerk session verification yields the account ID server-side only.
- [x] Preview works; **no secret** appears in the repo or the client bundle.

## Fail path

If connection pinning, transaction-local context, Clerk verification, or the
budget cannot be proven in the time box: **stop feature work, revise the
provider/design decision, and repeat the spike.** Do not fall back to an
unrestricted connection or application-only filtering.

## References

- `docs/implementation-plan.md` Stage 0
- `docs/data-and-security.md` (Row-level isolation model, Database roles)
- `docs/setup.md` §3, §5, §9
- `docs/adr/0001-backend-providers.md`

## Progress

- ✅ Local RLS harness green: `spike/rls` 13/13 against local PostgreSQL 17.
- ✅ Vertical slice built and validated: `spike/web` (Clerk + Drizzle +
  `@neondatabase/serverless`) compiles, boots, protects `/`, and 307s to
  `/sign-in` when unauthenticated.
- ✅ Neon: 13/13 with node-postgres **and** with `USE_NEON_SERVERLESS=1`.
- ✅ Preview verified: two Clerk accounts isolated; account id derived only from
  the verified session; no secret in the client bundle.
- ✅ Results recorded in [`../../../spike/S0-RESULTS.md`](../../../spike/S0-RESULTS.md);
  ADR 0001 moved to **Accepted** with the driver, regions, and cost.

## Status

**Done** (2026-10-11). The Stage 0 gate passed; F-1 is unblocked.
