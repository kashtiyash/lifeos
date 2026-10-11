# H-3 — Performance budgets and Core Web Vitals

**Stage:** 5
**Blocked by:** P-8
**Blocks:** —

## Goal

Measure against the operations budgets at production-like sizes, and fix or
document every exception before launch.

## Scope

- Measure p50/p95/p99 for: server response time, DB query time, auth latency,
  task-list behaviour at representative account sizes, and Core Web Vitals.
- Targets (`docs/operations.md`): p95 server ≤ 500 ms, p95 DB query ≤ 100 ms,
  LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.2 (75th percentile).
- Use **query plans** and traces to decide indexes/caching; measure write
  overhead. Do not add broad indexes blindly.
- Verify lists are paginated and initial server data is not re-fetched on mount.
- Record: date, region, workload, sample size, and results.

## Deliverables

- A performance report with per-metric numbers and the workload definition.
- Index/caching changes justified by `EXPLAIN ANALYZE` where needed.
- Any exception documented with a follow-up owner.

## Acceptance

- [ ] Budgets met on production-like data, or exceptions recorded before launch.
- [ ] Cold-start and warm DB results reported separately.
- [ ] No private content in traces.

## References

- `docs/operations.md` (Service objectives; performance budgets)
- `docs/architecture.md` (regions; caching rules)
- `docs/implementation-plan.md` Stage 5
