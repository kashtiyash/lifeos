# I-6 — Cross-user / forged / connection-reuse isolation suite

**Stage:** 2
**Blocked by:** I-5
**Blocks:** I-7, P-1, P-5, H-2

## Goal

Prove account isolation as an executable suite that stays green for the rest of
the project. This is the gate before any user-facing feature.

## Scope

Run against the **production-style roles** and a local PostgreSQL:

- **Default-deny**: no identity context → no rows.
- **Forged identity**: `set_config` to another user's ID, and attempts to
  reference another user's ID in a FK/query.
- **Rollback** leaves no context behind; **pooled connection reuse** after
  commit and after rollback carries no previous identity
  (empty-string `nullif` case).
- **Role assertions**: runtime is not owner/superuser/`BYPASSRLS`; migrator ≠
  runtime; maintenance reaches only authorized maintenance rows and expired
  Trash.
- User A can do everything with their own rows; User B can **read, update,
  delete, or reference** none of A's.

## Deliverables

- `test:integration` suite covering the above, runnable in CI as a required
  check.
- A small fixture/bootstrap seeder using the admin connection.
- Report template for the Stage 2 gate.

## Acceptance

- [ ] Every case above passes on local PostgreSQL **and** on Neon
      (serverless pool).
- [ ] Tests seed fixtures without weakening RLS.
- [ ] Suite is deterministic and fast enough for PR CI.

## References

- `docs/testing.md` (Required coverage — isolation)
- `docs/data-and-security.md` (RLS tests; roles)
- `docs/implementation-plan.md` Stage 2 gate
