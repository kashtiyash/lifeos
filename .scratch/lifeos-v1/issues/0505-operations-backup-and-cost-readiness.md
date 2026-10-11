# H-5 — Operations, backup, and cost readiness

**Stage:** 5
**Blocked by:** S-5
**Blocks:** —

## Goal

Close the release prerequisites in the operations runbook: ownership, backups,
alerts, and cost.

## Scope

- Assign a **named human owner** for production access, support escalation, and
  incident decisions.
- **Backups**: confirm the provider's current backup/PITR retention for the exact
  plan and region; record recovery window, RPO, RTO, and the authorized restorer.
  Perform a restore test to an isolated environment; verify RLS, ownership,
  counts, migration state, and a **separate** Blob object recovery check.
- **Alerts**: heartbeat monitor alerting configured; private reporting route in
  `SECURITY.md` current.
- **Cost/limits**: confirm monthly provider cost matches the approved budget;
  record storage/quota headroom and region placement.
- Confirm the `docs/decisions.md` remaining items are closed (Firewall rules,
  license/visibility, heartbeat).

## Deliverables

- Completed operations checklist with dates, owners, and measured numbers.
- Recorded backup/PITR facts and a passed restore drill.
- Final cost statement vs budget.

## Acceptance

- [ ] Named owner recorded; incident route live.
- [ ] Backup/PITR window and restore drill verified and recorded.
- [ ] Missed nightly job raises an alert.
- [ ] Monthly cost ≤ approved budget; headroom documented.

## References

- `docs/operations.md` (Backups and restore; incident response)
- `docs/implementation-plan.md` Stage 5 gate
- `docs/decisions.md` (Still open)
- `docs/github-and-ci.md` (Standalone repository setup)
