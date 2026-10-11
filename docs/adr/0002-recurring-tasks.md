# ADR 0002: Recurring tasks

- **Status:** Accepted (decisions below, 2026-10-11). Recurring tasks are in v1
  scope; the spec, schema and tests reference this ADR.
- **Date:** 2026-10-11
- **Depends on:** Tasks, subtasks, tags, and batch-scoped Trash
  (Stage 3, slices 1 and 2).

## Context

Recurring tasks (chores, bills, reviews) are the most-requested feature in any
task app. They touch the Today, Upcoming and Overdue rules, Trash, analytics,
and the schema, so the model must be fixed before the task tables are built.
LifeOS tasks have a calendar due date (`date`) and no time of day.

## Options considered

| Option | How it works | Verdict |
|---|---|---|
| A. Generate next on completion | One open task per series. Completing it creates the next. | **Chosen.** Existing views work unchanged, row count is bounded, history is real completed tasks, RLS stays simple. |
| B. Materialize occurrences ahead | A job creates the next N occurrences. | Rejected. Needs a scheduler, creates clutter in Upcoming, and rule edits must rewrite future rows. |
| C. Virtual occurrences with exceptions | Compute occurrences on the fly and store only exceptions. | Rejected for tasks. Every view would need expansion logic. Used only for the calendar preview (see Calendar). |

## Decision

Use **A**, with a read-only projection of future dates in the calendar.

### Data model

New table `task_series` (user-owned; `id`, `user_id`, `version`, timestamps,
`deleted_at`, `trash_batch_id`; unique `(user_id, id)`):

| Column | Meaning |
|---|---|
| `freq` | `DAILY`, `WEEKDAYS`, `WEEKLY`, `MONTHLY`, `YEARLY` |
| `interval` | Integer 1–99. "Every N units." `WEEKDAYS` ignores it. |
| `by_weekday` | `smallint[]` 1–7 (Mon–Sun). Required for `WEEKLY`, null otherwise. |
| `by_month_day` | 1–31, or -1 for last day. Required for `MONTHLY`. |
| `mode` | `FIXED` (keep the calendar schedule) or `AFTER_COMPLETION` (count from the day it was done). `AFTER_COMPLETION` allows only `DAILY`, `WEEKLY` (no weekday list), `MONTHLY`, `YEARLY` with an interval. |
| `anchor_date` | First scheduled occurrence. Anchors "every 2 weeks" and "every 2 months". |
| `ends_on` / `remaining_count` | Optional end date or occurrence count. Both null means never. |
| `status` | `ACTIVE`, `ENDED` |
| `template_*` | `title`, `description`, `priority`, `project_id` (same-owner FK) copied onto each new instance. |

Changes to `tasks`:

- `series_id uuid null` with composite FK `(user_id, series_id)`.
- `occurrence_date date null`: the **scheduled** date, separate from the
  editable `due_date`.
- Unique `(series_id, occurrence_date)`: makes generation idempotent.
- Partial unique index on `(series_id)` where status is open and
  `deleted_at is null`: **at most one open instance per series**, enforced by
  the database.
- Check: `series_id is not null` requires `due_date is not null` and
  `occurrence_date is not null`.

Tags are copied from the completed instance. Subtasks, attachments and
notes are not copied, and reminders are not copied in the first release
(document the limitation; a recurring reminder preset already covers most
needs).

### Next-date rule (pure domain function)

`nextOccurrence(rule, after: date): date | null`, with no database or timezone
dependency (dates are calendar dates).

- **FIXED:** next = first scheduled date strictly after
  `max(occurrence_date, completion_local_date)`.
  - Completed late: skips the missed ones. A daily task overdue by 3 days
    yields tomorrow, not three catch-up tasks.
  - Completed early: next is after the current occurrence, not the next day.
  - Editing one instance's `due_date` never shifts the series, because the
    rule reads `occurrence_date`.
- **AFTER_COMPLETION:** next = `completion_local_date` + interval.
- **Month end:** `by_month_day = 31` clamps to the last day of shorter months
  and never drifts, because it is computed from the rule, not the previous
  date. Yearly Feb 29 becomes Feb 28 in non-leap years.
- **Multi-week intervals** count weeks from `anchor_date` using Monday-based
  ISO weeks, so changing the user's week-start setting never moves the series.
- **Start date:** if the task has one, keep the same offset from the new due
  date.
- **Ending:** if `ends_on` has passed or `remaining_count` reaches zero, no
  instance is created and the series becomes `ENDED`.

### Actions

| Action | Effect (one transaction under the user's RLS context) |
|---|---|
| Complete | Set the instance completed; compute next; insert next instance (tags copied); decrement `remaining_count`; bump versions. A second device completing the same instance hits the unique constraints, creates nothing, and returns the existing next instance. |
| Skip | Mark the instance `CANCELLED`; generate next as for Complete. Cancelled instances are excluded from completion rate and project progress, as already specified. |
| Delete this occurrence | Trash the instance and generate the next, so the series never stalls. |
| Delete series | Trash the series and its open instance under one `trash_batch_id`. Completed and cancelled instances stay as ordinary history without the repeat badge. Restore brings back the series and open instance. |
| Reopen | Not allowed on recurring instances. Instead, **Undo** (see below). |
| Edit | Prompt "This task only" or "This and future". "This and future" also updates `template_*`. Changing the rule re-anchors at the open instance's date and takes effect on the next generation. |

**Undo** (the toast shown after Complete or Skip) calls a server operation that
reopens the instance and deletes the generated next instance, but only if that
next instance is still untouched (`version = 1`, open, not trashed). Otherwise
it is rejected with a clear message.

### Views and analytics

- Today, Upcoming, Overdue and Inbox show only the single open instance, so
  existing query rules are unchanged.
- The calendar shows **projected** future occurrences computed with the same
  pure function for the visible range (capped at 366), styled as read-only
  previews. They are not stored.
- Completion rate counts real instances only, with `CANCELLED` excluded from
  both numerator and denominator. A recurring-task streak is out of scope;
  consistency tracking belongs to habits.
- Growth is one row per completion (about 365 a year for a daily task). Lists
  are already paginated; revisit archiving old completed instances only if
  measured.

## UX

- Recurrence picker in `ResponsiveDialog`: presets (Daily, Weekdays, Weekly on…,
  Monthly on…, Yearly), custom "every N…", the FIXED / AFTER_COMPLETION toggle
  ("repeat from due date" / "repeat from when I finish"), and an end option.
- Task rows show a repeat icon and a plain-language summary ("Every Mon, Thu").
- Completing shows `UndoToast`: "Done. Next: Fri 17 Oct · Undo". Swipe-to-complete
  uses the same path; a visible button remains the primary route.
- Never present a recurring task as completable without the next date being
  shown or computed on the server.

## Schema, RLS and tests

- `task_series` follows the standard conventions: same-owner FKs, RLS enabled
  and forced, `version`, Trash fields. The maintenance role needs no new
  grants beyond the expired-Trash policy.
- Unit and property tests for `nextOccurrence`: month end (28/29/30/31), leap
  years, interval 2+, multiple weekdays, early and late completion, end date
  and count, AFTER_COMPLETION, and "result is always after the input and
  monotonic".
- Integration tests: two concurrent completions create exactly one next
  instance; open-instance uniqueness; wrong-owner `series_id` rejected;
  series Trash/restore by batch; Undo rejected after the next instance is
  edited.
- E2E: create, complete with Undo, skip, delete occurrence vs delete series,
  edit "this and future".

## Decisions

1. **`AFTER_COMPLETION` ships in the first release** alongside `FIXED`.
2. **No "2nd Tuesday" rules** in the first release; `by_set_pos` is not part of
   the model and can be added later without breaking stored rules.
3. **Subtasks are not copied** to the next instance in the first release.
4. **Reminders are not cloned**; use a recurring reminder preset instead.

## Consequences

- Adds one table and three `tasks` columns, so build it with the task schema
  rather than as a later migration.
- Business logic stays in a pure, heavily tested module, consistent with the
  rule that domain logic is independent of the UI and the database.
- Rule changes never rewrite stored future rows because none exist.
