# I-5 — Repository layer with transaction-local account context

**Stage:** 2
**Blocked by:** I-2, I-4
**Blocks:** I-6, P-1

## Goal

Every protected query runs on a **single pinned connection** inside a
transaction whose local `app.user_id` comes only from the verified session.

## Scope

- A transaction helper that opens one connection, runs
  `select set_config('app.user_id', $1, true)` with a parameter, executes the
  callback, then commits/rolls back before returning the connection to the pool.
- Server-only repositories under `lib/data/` or `lib/repositories/`; **all**
  reads/updates/deletes include `user_id` in the predicate **even with RLS**.
- Verify ownership of every referenced ID in the same transaction.
- Keep domain rules pure and free of Drizzle/Clerk/HTTP imports.
- Bound and paginate every growing collection; select only needed fields.

## Deliverables

- `withUserTransaction(userId, fn)` helper + base repository pattern.
- One example repository implementing list/get/create/update with versioning.
- Unit/DB tests proving context is set locally and never leaks.

## Acceptance

- [ ] A query outside the helper fails to satisfy RLS (default-deny).
- [ ] Context is transaction-local; it is gone after commit and rollback.
- [ ] Repositories never read the account ID from request input.
- [ ] Collections are paginated; queries select only view fields.

## References

- `docs/architecture.md` (request flows; repository guidance)
- `docs/data-and-security.md` (RLS steps; application checks)
- `docs/testing.md` (connection reuse, forged identity)
