# P-1 — Tasks: CRUD, views, filters, ordering

**Stage:** 3 (slice 1)
**Blocked by:** I-5, I-6
**Blocks:** P-2, P-3, P-6, P-8

## Goal

The first user-facing vertical slice: tasks with real business rules, ordering,
and every view.

## Scope

- Fields: title (required), description, status
  (`TODO`/`IN_PROGRESS`/`BLOCKED`/`COMPLETED`/`CANCELLED`), priority
  (`LOW`/`MEDIUM`/`HIGH`/`URGENT`), start date, due date, optional project,
  `completed_at`, fractional-index `position`, `version`.
- Actions: create, edit, complete, reopen, move to Trash, reorder.
- **Reopen** sets `TODO` and clears `completed_at`.
- Constraints: start ≤ due; explicit fractional-index `position` scoped per
  status/list; **optimistic concurrency** on edit (stale version → conflict).
- **Views** (pure domain predicates): Inbox (open, no project, no due date),
  Today (open, due ≤ user's current day; overdue flagged), Upcoming (open, due
  after today), Overdue (open, due before today), Completed, List, Kanban.
  - Start date does **not** place a task in Today. Cancelled only in List when
    explicitly included.
- **List filters**: status, priority, project, tag, due date; bounded/paginated.
- **Kanban**: columns are statuses; status change works without drag-and-drop;
  reorder within a status (keyboard/tap alternative to drag).
- Every view has loading/empty/error/retry states; use shared components.
- UI: `QuickAdd`, `ConfirmDialog` before Trash, `UndoToast` for completion.

## Deliverables

- `tasks` migration (with `version`, Trash fields, indexes per Data doc) +
  repository + pure view/filter/order domain module.
- List + Kanban UI, task form, filters (sheet on mobile).
- Unit tests for view/filter predicates and ordering; DB tests for version
  conflicts and start ≤ due; Playwright for create/complete/reopen/trash/filter.

## Acceptance

- [ ] All seven views return the correct set for boundary dates.
- [ ] Stale-version edit is rejected, not silently applied.
- [ ] Reorder rewrites one row; order is stable across reload.
- [ ] Cross-user access to a task is denied (extends I-6 suite).
- [ ] Queries are bounded/paginated; representative sizes stay in budget.

## References

- `docs/product-spec.md` (Tasks)
- `docs/data-and-security.md` (tasks row; positioned ordering; indexes)
- `docs/ui-guidelines.md` (Kanban on phones; states)
- `docs/testing.md` (task ordering/status, stale version)
