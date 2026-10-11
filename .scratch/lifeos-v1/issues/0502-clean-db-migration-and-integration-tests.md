# H-2 — Clean-database migration and integration tests

**Stage:** 5
**Blocked by:** I-6
**Blocks:** —

## Goal

Prove the full schema applies from empty and that constraints/RLS hold, without
ever touching production data.

## Scope

- Stand up a **clean local PostgreSQL**, apply **all** migrations as the
  migration role, run the complete integration suite as the runtime and
  maintenance roles.
- Cover every constraint/enum/date-ordering/uniqueness rule and every
  same-owner FK across all slices (tasks, series, subtasks, tags, projects,
  milestones, habits, logs, reminders, events, notes, attachments, jobs, queues).
- Maintenance-path tests: cannot read live user rows; deletes only expired Trash
  and `app_users` with a `blobs_deleted` job; cascade removes every child; webhook
  replays ignored.
- Wire this as the required `test:integration` CI check; cleanup after run.

## Deliverables

- Integration suite green from an empty database, in CI.
- A documented "clean DB" local recipe.

## Acceptance

- [ ] All migrations apply in order to an empty database.
- [ ] Every constraint/FK test passes; isolation suite remains green.
- [ ] Maintenance role reaches only authorized rows.
- [ ] CI runs the suite and tears down cleanly; no production credentials.

## References

- `docs/testing.md` (Database integration; CI scripts)
- `docs/data-and-security.md` (Migrations and indexes; roles)
- `docs/implementation-plan.md` Stage 5 + Required CI commands
