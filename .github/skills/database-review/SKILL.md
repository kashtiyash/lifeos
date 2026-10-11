---
name: database-review
description: Review greenfield LifeOS PostgreSQL, Drizzle migrations, transaction-scoped Clerk identity, Neon usage, RLS policies, constraints, and query plans.
---

# Database Review

1. Read `docs/data-and-security.md` and all changed migrations.
2. Check ownership columns, RLS enabled/forced, least-privilege runtime role,
   same-owner foreign keys, constraints, and migration reversibility strategy.
3. Trace how verified Clerk identity is set and used in every database
   transaction. Check connection pinning, rollback, and pool reuse.
4. Check queries for bounded result sizes, required filters, selected columns,
   indexes backed by query plans, and transaction boundaries.
5. Verify integration tests prove cross-user denial, invalid identity denial,
   and normal owner access.

Report `Severity | migration/query | evidence | risk | recommendation`.
