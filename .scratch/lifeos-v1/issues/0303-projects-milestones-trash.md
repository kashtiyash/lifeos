# P-3 — Projects, milestones, and batch-scoped Trash

**Stage:** 3 (slice 2)
**Blocked by:** P-1
**Blocks:** P-4, P-7, P-8, S-1, S-3

## Goal

Projects with progress, milestones, and the **batch-scoped Trash / restore /
purge** model that recurring tasks and files depend on.

## Scope

- **Projects**: create/edit/archive/restore/Trash; statuses
  `PLANNED`/`ACTIVE`/`ON_HOLD`/`COMPLETED`/`ARCHIVED`; start ≤ due.
  - Archiving hides from active lists but keeps tasks.
  - Progress = completed ÷ non-cancelled tasks; no qualifying tasks → 0%.
  - Deleting confirms, then moves the project and its dependent records to Trash
    under **one `trash_batch_id`**; restore recovers the tree.
- **Milestones**: name, optional due date, completion flag; do **not** affect
  progress.
- **Trash model** (shared): one delete assigns one `trash_batch_id` to the root
  and every dependent row it moves; individually trashed rows get their own
  batch. Restore/purge act **only** on that batch and never revive an already-
  trashed child. Trash view hides items past 30 days (physical purge is S-3).
  Restore uses **version checks** to reject stale concurrent edits; restore is a
  **server-only** operation.
- Trashed records are excluded from normal lists, dashboards, progress, streaks,
  and analytics.

## Deliverables

- `projects`, `milestones` migrations; Trash fields + batch semantics across
  owned tables; project/milestone repositories and pure progress rule.
- Project list/detail, milestone UI, `ConfirmDialog` on delete, Trash view with
  restore.
- Tests: progress denominator (cancelled excluded); batch restore does not
  resurrect previously-trashed children; stale-version restore rejected;
  30-day hide boundary.

## Acceptance

- [ ] A project with only cancelled tasks reports 0%.
- [ ] Restoring a batch returns exactly that batch's rows.
- [ ] A child already in Trash stays trashed after restoring its former root.
- [ ] Trashed rows disappear from all active views.

## References

- `docs/product-spec.md` (Projects and milestones; Trash)
- `docs/data-and-security.md` (trash_batch_id semantics; restore/purge)
- `docs/testing.md` (batch-scoped Trash/restore/purge)
