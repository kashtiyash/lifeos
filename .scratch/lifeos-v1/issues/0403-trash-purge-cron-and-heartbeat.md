# S-3 — Trash purge cron and heartbeat

**Stage:** 4
**Blocked by:** P-3, F-4
**Blocks:** S-5

## Goal

Physically purge expired Trash and queued Blob cleanup on a schedule, safely and
observably, as the maintenance role only.

## Scope

- `vercel.json` declares `/api/cron/maintenance` nightly at **03:00 UTC**.
- Require `Authorization: Bearer $CRON_SECRET` with a **timing-safe** compare;
  reject missing/invalid.
- Run DB work as **`lifeos_maintenance`** only: select expired Trash batches
  (`deleted_at < now() - interval '30 days'`) and durable cleanup jobs; purge in
  dependency order; each step **idempotent**; record attempts, last error code
  (no payloads), next retry time, completion state.
- Copy every Blob path into `blob_cleanup_queue` **before** removing metadata;
  retry Blob deletion separately. Never report a purge complete while private
  objects remain.
- Ping **`HEARTBEAT_URL`** (Healthchecks.io) **only** after a fully successful
  run; configure the monitor to alert when overdue.
- A manual rerun uses the **same** authorization and role constraints.
- Vercel Firewall rate-limit rules applied to auth, mutation, upload, and
  download routes; return `429` with a retry hint.

## Deliverables

- Cron route + `vercel.json` schedule; maintenance repositories/policies.
- `blob_cleanup_queue` retry loop; heartbeat integration.
- Tests: cron without secret rejected; unexpired/unrelated batches remain
  untouched; retry after Blob failure converges; heartbeat fires only on success.

## Acceptance

- [ ] A request without the correct bearer secret is rejected.
- [ ] Only rows older than 30 days and in-scope jobs are touched.
- [ ] Blob failures queue for retry without losing the path.
- [ ] Missing/failed nightly run raises an alert via the heartbeat monitor.

## References

- `docs/operations.md` (Scheduled cleanup and deletion)
- `docs/data-and-security.md` (maintenance role; blob_cleanup_queue)
- `docs/architecture.md` (Email, scheduled jobs, observability)
- `docs/implementation-plan.md` Stage 4
