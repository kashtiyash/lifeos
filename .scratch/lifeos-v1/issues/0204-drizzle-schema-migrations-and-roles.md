# I-4 — Drizzle schema, migrations, roles, and RLS helpers

**Stage:** 2
**Blocked by:** F-3 (and F-1)
**Blocks:** I-5, I-7

## Goal

Establish the migration pipeline, the role model, and the RLS helper every
owned table builds on — before any product table exists.

## Scope

- Drizzle Kit + SQL **forward-only migrations** in `drizzle/`; runtime uses the
  pooled `@neondatabase/serverless` connection, migrations use the direct
  migration connection (`lifeos_migrator`).
- `db-roles.sql` (idempotent) provisions the three roles; verify runtime is
  non-owner, non-`BYPASSRLS`.
- `app_user_id()` helper: `nullif(current_setting('app.user_id', true), '')`.
- Conventions baked in for every owned table: UUID PKs, `user_id text not null
  references app_users(clerk_user_id) on delete cascade`, `created_at`,
  `updated_at`, `version integer not null default 1`; Trash-managed tables add
  `deleted_at`, `trash_batch_id uuid`.
- Unique composite `(user_id, id)` keys enabling **same-owner composite FKs**.
- **Enable and FORCE RLS** on every owned table; a documented pattern for
  migrations that backfill under forced RLS (temporary policy or admin role).
- Grant the runtime role only the CRUD/schema usage it needs; `SECURITY INVOKER`
  functions by default.

## Deliverables

- Migration runner wired to `db:migrate` (migrator role).
- Role provisioning + RLS helper migration.
- A documented table template and composite-FK convention for later tickets.

## Acceptance

- [ ] `npm run db:migrate` applies cleanly to an empty database as the migrator.
- [ ] Runtime role owns nothing and lacks `BYPASSRLS`.
- [ ] RLS is enabled **and forced** on owned tables.
- [ ] A cross-account composite FK insert is rejected by the database.

## References

- `docs/data-and-security.md` (PostgreSQL conventions, RLS model, roles)
- `docs/architecture.md` (Database and access layer)
- `docs/testing.md` (Database integration layer)
