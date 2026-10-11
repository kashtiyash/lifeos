---
applyTo: "drizzle/**/*.ts,drizzle/**/*.sql,lib/data/**/*.ts,lib/repositories/**/*.ts"
---
- PostgreSQL schema changes use forward-only Drizzle SQL migrations.
- Every user-owned table has `user_id`, RLS, least-privilege grants, and
  same-owner foreign keys for references.
- Runtime connections use a non-owner role without `BYPASSRLS`.
- Derive account identity from a verified server-side Clerk session. Set
  transaction-local account context only inside a pinned transaction.
- Add ownership predicates in queries in addition to RLS.
- Test missing/forged identity, cross-user access, transaction rollback, and
  connection-pool context isolation.
- Never expose database URLs, Clerk secret keys, or Blob credentials to a
  browser.
- Add indexes based on representative query plans, not assumptions.
