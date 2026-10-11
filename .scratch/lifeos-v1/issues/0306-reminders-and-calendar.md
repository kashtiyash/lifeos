# P-6 — Reminders and calendar

**Stage:** 3 (slice 4)
**Blocked by:** P-1, P-5
**Blocks:** P-8

## Goal

App-open reminders with a Missed list, plus month/week/day calendar views that
combine tasks, habits, reminders, events, and project deadlines.

## Scope

- **Reminders**: standalone or linked to **one** owned task/habit/project/event
  via nullable same-owner FKs + `CHECK (num_nonnulls(...) <= 1)`. Support dismiss
  and snooze. Recurrence presets: daily, weekly, monthly, weekdays.
- **Browser notifications only while the app is open**; an in-app fallback and a
  **Missed** list (time passed and neither delivered-while-open nor
  dismissed/snoozed). **Never** request notification permission on page load.
- **Calendar events**: `calendar_events` with timed start/end or all-day dates;
  end not before start; **no recurrence** in v1.
- **Calendar views**: month, week, day; show tasks by due date, habits on
  scheduled days, reminders, events, project deadlines. All "today"/streak/week
  math uses the account timezone + week start.
- Mobile: default to an agenda list with a compact month strip.

## Deliverables

- `reminders`, `calendar_events` migrations + repositories.
- Reminder dialog, Missed list, permission-prompt-on-action flow, calendar views
  (product components, not shadcn Calendar).
- Tests: single-link check constraint; missed determination; timezone/week math;
  event end ≥ start.

## Acceptance

- [ ] A reminder links to at most one record; two links are rejected by the DB.
- [ ] Permission is requested only on an explicit user action.
- [ ] A past, undelivered, undismissed reminder appears in Missed.
- [ ] Calendar places items on the correct day in the user's timezone.

## References

- `docs/product-spec.md` (Reminders and calendar)
- `docs/data-and-security.md` (reminders; calendar_events)
- `docs/ui-guidelines.md` (calendar on phones)
