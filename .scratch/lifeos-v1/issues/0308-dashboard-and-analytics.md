# P-8 — Dashboard and analytics

**Stage:** 3 (slice 8, after sources are stable)
**Blocked by:** P-1, P-3, P-5, P-6
**Blocks:** H-3, H-4

## Goal

A Today-first home and analytics, built only from stable source features, with a
hard query budget.

## Scope

- **Dashboard**: today's tasks and completion, active projects, today's habits
  and streaks, upcoming reminders/events, productivity statistics. Every widget
  has **loading, empty, and error** states.
- **Analytics**:
  - Task completion, overdue, **completion rate**, weekly productivity.
    Completion rate = tasks due in the period that were completed by the end of
    the period ÷ tasks due in the period.
  - Habit completion/streak/consistency.
  - Project progress and deadlines.
  - Default range: last 7 days; productivity charts cover 8 weeks.
- Exclude trashed/cancelled records per the spec.
- Charts via shadcn charts (Recharts); tabular numerals for values.
- Mobile: **Home is Today**, not a generic dashboard.

## Deliverables

- Aggregation repositories with bounded, indexed queries + pure metric functions.
- Dashboard widgets and analytics views with all states.
- Tests: completion-rate denominator, empty ranges, timezone boundaries; latency
  measurement against representative account sizes.

## Acceptance

- [ ] Completion rate is correct for partially-completed periods.
- [ ] Trashed/cancelled rows do not affect any metric.
- [ ] Widgets render loading/empty/error correctly.
- [ ] Analytics queries meet the operations p95 budget at representative sizes.

## References

- `docs/product-spec.md` (Notes, files, Trash, and analytics; dashboard)
- `docs/operations.md` (performance budgets)
- `docs/ui-guidelines.md` (Mobile experience — Home is Today)
