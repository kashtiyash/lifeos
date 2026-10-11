# P-4 — Recurring tasks

**Stage:** 3 (slice 2, after Trash)
**Blocked by:** P-3
**Blocks:** —

## Goal

Implement ADR 0002: one open instance per series, generated on completion/skip
from a pure `nextOccurrence` function.

## Scope

- `task_series` table (`freq`, `interval` 1–99, `by_weekday`, `by_month_day`,
  `mode` `FIXED`/`AFTER_COMPLETION`, `anchor_date`, `ends_on`/`remaining_count`,
  `status`, `template_*`, standard RLS/Trash conventions).
- `tasks`: add `series_id`, `occurrence_date`; composite same-owner FK;
  unique `(series_id, occurrence_date)`; **partial unique index** for at most one
  open, non-trashed instance per series; check that a series instance has a due
  date.
- Pure **`nextOccurrence(rule, after)`** per ADR 0002 (FIXED vs AFTER_COMPLETION,
  month-end clamp, leap year, ISO-week intervals from `anchor`, end conditions).
- Actions (one RLS transaction): **Complete**, **Skip** (→ `CANCELLED`),
  **Delete this occurrence**, **Delete series** (one batch), **Undo** (reopen +
  delete the generated next **only if untouched**, else reject), **Edit**
  "this only" / "this and future" (the latter updates `template_*`).
- Views show only the single open instance; calendar shows **projected** future
  occurrences (capped at 366) computed by the same pure function, read-only.
- Copy tags from the completed instance; **do not** copy subtasks/attachments;
  reminders not cloned (document the limitation).

## Deliverables

- Series migration + generation service + recurrence picker UI
  (`ResponsiveDialog`), repeat icon + plain-language summary, `UndoToast`
  ("Done. Next: …· Undo").
- Unit/property tests for `nextOccurrence`; integration tests for concurrency and
  uniqueness; E2E for complete/skip/delete/edit.

## Acceptance

- [ ] Two concurrent completions create exactly one next instance.
- [ ] Never more than one open instance per series (DB-enforced).
- [ ] Property: result is always after the input and monotonic; month-end never
      drifts.
- [ ] Undo is rejected once the next instance was edited.
- [ ] Cancelled instances are excluded from completion rate and progress.

## References

- `docs/adr/0002-recurring-tasks.md`
- `docs/product-spec.md` (Recurring tasks)
- `docs/data-and-security.md` (task_series; tasks changes)
- `docs/testing.md` (Recurring tasks coverage)
