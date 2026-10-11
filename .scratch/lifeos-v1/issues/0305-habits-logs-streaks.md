# P-5 — Habits, logs, pause/archive, streaks

**Stage:** 3 (slice 3)
**Blocked by:** I-6
**Blocks:** P-6, P-8

## Goal

Timezone-correct habit tracking with streaks that respect pause intervals and
the account's week start.

## Scope

- **Frequencies**: `DAILY`, `WEEKLY`, `SPECIFIC_DAYS`.
  - Weekly: target 1–7 logs per configured week.
  - `SPECIFIC_DAYS`: ≥1 selected weekday; due only those days.
- **Streaks** (pure): daily/specific-day streak = consecutive eligible days with
  a log; weekly streak = consecutive configured weeks meeting target. The
  current day/week is **not** missed until it ends in the user's timezone.
- **Pause** (intervals) and **archive**: paused periods do not break a streak
  and logging during a pause is allowed and counts; archived habits leave active
  views and accrue no streak.
- **Logs**: at most one per habit/date; no future logs; backfill from the habit's
  start date; unmark is an immediate toggle (not Trash).
- **Timezone rule**: changing the account timezone never rewrites stored
  `log_date`; "today" and streaks recompute from that moment forward.
- Show history, current/best streak, and weekly/monthly performance.
- `habit_pauses` with `end_date ≥ start_date`, no overlapping intervals.

## Deliverables

- `habits`, `habit_pauses`, `habit_logs` migrations + repositories + pure streak
  module.
- Habit UI with check-in (44px primary target), history, streak display, pause
  and archive controls.
- Unit tests across IANA zones, midnight, DST, and configured week boundaries;
  DB tests for one-log-per-day and non-overlapping pauses.

## Acceptance

- [ ] Streak is correct across a DST transition and a Sunday/Monday week start.
- [ ] Pausing does not break a streak; logging during a pause still counts.
- [ ] A duplicate log for the same date is rejected.
- [ ] Changing timezone does not rewrite `log_date`.

## References

- `docs/product-spec.md` (Habits)
- `docs/data-and-security.md` (habits, habit_pauses, habit_logs)
- `docs/testing.md` (User Day, habit targets/pause/archive/streaks)
