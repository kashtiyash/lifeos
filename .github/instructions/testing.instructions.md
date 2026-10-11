---
applyTo: "tests/**/*.{ts,tsx},**/*.test.{ts,tsx},drizzle/**/*.sql"
---
- Unit-test business rules, including User Day/timezone and week boundaries.
- Integration-test migrations, constraints, RLS, and ownership against local
  PostgreSQL using the same transaction context as the application.
- Prove User B cannot read, update, delete, or reference User A's data.
- Test transaction rollback and pooled connection reuse for RLS context.
- E2E-test authentication, task lifecycle, Trash restore, reminder fallback,
  file privacy, and critical loading/empty/error paths as features land.
- Bug fixes include regression tests. Use synthetic test data only.
