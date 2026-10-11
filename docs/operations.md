# Operations Runbook

This runbook is a release prerequisite. Assign a named human owner for
production access, support escalation, and incident decisions before launch.
Keep operational credentials in provider secret stores, never in this file.

## Service objectives and performance budgets

Measure on production-like data and record the test date, region, workload,
sample size, and p50/p95/p99:

- **Authenticated application latency:** p95 server processing time ≤ 500 ms
  for common reads and mutations, excluding browser rendering, streamed
  response completion, and third-party Blob transfer.
- **Database latency:** p95 ≤ 100 ms for critical user-scoped queries at the
  application boundary, excluding connection establishment and unrelated
  provider calls. Report cold-start and warm results separately.
- **Web Vitals:** LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.2 at the 75th percentile.

These are launch targets, not a claim that a free-tier provider meets them.
Investigate failures with query plans and traces before adding indexes,
caching, or background infrastructure. Never include note contents, tokens,
or unnecessary personal data in traces.

## Backups and restore

Before production launch, verify the database provider's current backup and
point-in-time restore retention for the exact plan and region. Record the
confirmed recovery window, recovery point objective, recovery time objective,
and the person authorized to restore. If provider retention is insufficient,
stop launch and select an approved backup approach.

At least quarterly, and after material schema/storage changes:

1. Restore a backup to an isolated non-production database.
2. Apply only the documented recovery steps; do not connect the restored
   environment to production Clerk or Blob credentials.
3. Verify RLS, ownership, record counts, migration state, and a sample of
   synthetic user records.
4. Verify private Blob object recovery separately; database backups do not
   restore Blob objects.
5. Record elapsed recovery time, gaps, and follow-up actions without retaining
   production user content in the test environment.

## Scheduled cleanup and deletion

- `vercel.json` invokes `/api/cron/maintenance` nightly at 03:00 UTC.
- Require `Authorization: Bearer $CRON_SECRET`; compare secrets without
  timing-sensitive string operations. Reject missing/invalid credentials.
- Run database work as `lifeos_maintenance`, never as a superuser, table
  owner, or runtime role with broad permissions.
- Select only expired Trash batches and durable upload/account-deletion
  cleanup jobs. Keep each step idempotent and record attempts, last error,
  next retry time, and completion state without sensitive payloads.
- Ping `HEARTBEAT_URL` only after a fully successful run and configure the
  monitor to alert when the ping is overdue. Vercel Cron does not alert on
  failures by itself. Do not report a purge/deletion complete while private
  Blob objects remain.
- A manual rerun must use the same authorization and role constraints as the
  scheduled execution.

## Incident response

For suspected account-isolation, credential, or private-file exposure:

1. Contain access: disable the affected route/key/job or rotate the exposed
   credential. Preserve relevant audit metadata; do not copy private payloads.
2. Identify affected accounts and time window using access logs and database
   metadata with least privilege.
3. Notify the security owner and follow applicable legal/customer notification
   timelines. Do not make unverified statements about impact.
4. Recover affected services, rotate related credentials, and verify RLS,
   role grants, and private Blob authorization.
5. Record a post-incident review, root cause, impact, and preventive tests.

Maintain a current private reporting route in [`SECURITY.md`](../SECURITY.md).
Do not put incident secrets or personal data in this runbook.
