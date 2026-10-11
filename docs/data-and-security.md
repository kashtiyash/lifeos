# LifeOS Greenfield Data and Security Specification

**Status:** Proposed database contract for a new project; not a migration.

## PostgreSQL conventions

- Use PostgreSQL as the source of truth and version all schema changes as
  forward-only Drizzle SQL migrations in `drizzle/` (or the selected Drizzle
  migration directory).
- Use UUID primary keys for domain records. Use Clerk's opaque user ID as
  `app_users.clerk_user_id text primary key`; do not assume it is a UUID.
- Every user-owned table (except the job/queue tables below, which deliberately
  have no user FK) includes `user_id text not null references
  app_users(clerk_user_id) on delete cascade`, `created_at`, `updated_at`, and
  `version integer not null default 1` for optimistic concurrency. Trash-managed
  entities also include nullable `deleted_at` and `trash_batch_id uuid`.
- Create unique composite keys on parent `(user_id, id)` pairs, and use
  composite foreign keys so cross-account references cannot be stored.
- Use `date` for calendar days and `timestamptz` for instants. Convert and
  format using the user's configured timezone at the application boundary.
- Use constraints for enums, required values, date ordering, uniqueness, and
  allowed recurrence values. Prefer partial indexes where appropriate and
  verify every performance index against representative `EXPLAIN ANALYZE`
  plans.

## Proposed entity inventory

| Entity | Principal fields and constraints |
|---|---|
| `app_users` | `clerk_user_id` primary key; display name; timezone (IANA ID, default UTC); week start (default Monday); `deletion_state` (`none` or `pending`) and `deletion_requested_at`; timestamps. Email and profile image remain provider-owned and are not authorization sources. |
| `projects` | `id`, `user_id`, required name, description, status, priority, start/due dates, lifecycle timestamps, `version`, `deleted_at`, and `trash_batch_id`; unique `(user_id, id)`. |
| `tasks` | `id`, `user_id`, required title, description, status, priority, start/due dates, optional project ID, optional `series_id` and `occurrence_date`, `completed_at`, `position`, timestamps, `version`, `deleted_at`, and `trash_batch_id`; same-user project and series FKs; start ≤ due; a series instance requires a due date. At most one open, non-trashed instance per series (partial unique index) and unique `(series_id, occurrence_date)`. |
| `task_series` | `id`, `user_id`, `freq` (`DAILY`, `WEEKDAYS`, `WEEKLY`, `MONTHLY`, `YEARLY`), `interval` (1–99), `by_weekday`, `by_month_day`, `mode` (`FIXED` or `AFTER_COMPLETION`), `anchor_date`, optional `ends_on` / `remaining_count`, `status` (`ACTIVE`, `ENDED`), template title/description/priority/project ID, timestamps, `version`, `deleted_at`, `trash_batch_id`; unique `(user_id, id)`. See ADR 0002. |
| `subtasks` | `id`, `user_id`, task ID, title, `completed`, `position`, timestamps, `version`, `deleted_at`, and `trash_batch_id`; same-user task FK. |
| `tags` | `id`, `user_id`, required normalized name, timestamps, `version`, `deleted_at`, and `trash_batch_id`; unique active `(user_id, lower(name))`. |
| `task_tags` | `user_id`, `task_id`, `tag_id`, created timestamp; primary key `(user_id, task_id, tag_id)` and same-user FKs. Removing a link is an immediate delete. |
| `milestones` | `id`, `user_id`, project ID, name, optional due date, completed flag, timestamps, `version`, `deleted_at`, and `trash_batch_id`; same-user project FK. |
| `habits` | `id`, `user_id`, name, frequency, weekly target, selected weekdays, start date, active/archived state, timestamps, `version`, `deleted_at`, and `trash_batch_id`. |
| `habit_pauses` | `id`, `user_id`, habit ID, `start_date`, nullable `end_date` (open = currently paused); `end_date >= start_date`; same-user habit FK; no overlapping intervals per habit. Not Trash-managed; cascades with the habit. |
| `habit_logs` | `id`, `user_id`, habit ID, `log_date`, created timestamp; unique `(habit_id, log_date)` and same-user FK. Logs are toggle records, not Trash records. |
| `reminders` | `id`, `user_id`, title, `remind_at`, recurrence preset, status/snooze/dismiss fields, nullable `task_id`, `habit_id`, `project_id`, and `event_id`, timestamps, `version`, `deleted_at`, and `trash_batch_id`. Use same-owner composite FKs and `CHECK (num_nonnulls(task_id, habit_id, project_id, event_id) <= 1)`; all-null means standalone. |
| `calendar_events` | `id`, `user_id`, title, timed start/end or all-day dates, description, timestamps, `version`, `deleted_at`, and `trash_batch_id`; end cannot precede start. Events do not recur in v1. |
| `notes` | `id`, `user_id`, title, Markdown body, optional project ID, timestamps, `version`, `deleted_at`, and `trash_batch_id`; same-user project FK. |
| `attachments` | `id`, `user_id`, exactly one task/project owner, opaque Blob path, display name, detected media type, size, upload state, timestamps, `version`, `deleted_at`, and `trash_batch_id`; same-user owner FKs and unique Blob path. |
| `deletion_jobs` | `id`, `user_id text` (**no FK**, so it survives the account cascade), state (`requested`, `blobs_deleted`, `clerk_deleted`, `complete`, `failed`), attempt count, last error code (no payloads), next retry time, timestamps. |
| `blob_cleanup_queue` | `id`, opaque Blob path, reason (`trash_purge`, `account_deletion`, `failed_upload`), state, attempt count, next retry time, timestamps. **No user FK and no user content.** Rows are inserted *before* the metadata row is removed. |
| `webhook_events` | provider event ID (`svix-id`) as primary key, event type, received/processed timestamps. Used for idempotency; stores no payload. |

Apply `position` to every manually ordered entity as a lexicographically
sortable fractional-index text key, so a reorder rewrites one row instead of a
whole list. Include the ordering scope (such as `(user_id, status, position)`)
in updates and queries. A single
delete operation assigns one new `trash_batch_id` to the root and every
dependent row it moves to Trash. Individually trashed rows get their own batch.
Restore and purge operate only on that batch; never restore a previously
trashed child merely because it is related to the restored root.

## Row-level isolation model

RLS must be enabled and forced on every user-owned table. The runtime role
must not own tables and must not have `BYPASSRLS`. Migrations run under a
separate owner role unavailable to the app runtime.

Because Clerk is not the database, do not use Supabase's `auth.uid()` or
assume Clerk JWT claims automatically reach Postgres. For each authenticated
database request:

1. Verify the Clerk session on the server.
2. Start a database transaction on a single pinned connection.
3. Set transaction-local custom Postgres context (for example,
   `SELECT set_config('app.user_id', $1, true)`), using only the verified
   Clerk user ID. The third argument makes the setting local to the transaction.
4. Run every protected query within that transaction.
5. Commit/rollback before returning the connection to the pool.

RLS policies compare each row's `user_id` to that transaction-local setting,
read through a helper such as `app_user_id()` defined as
`nullif(current_setting('app.user_id', true), '')`. The `nullif` is required: on a
reused connection the setting reads back as an empty string, not NULL, and without
it an empty identity could satisfy a policy such as an `app_users` insert check
(the Stage 0 RLS harness proved this). Note that `FORCE ROW LEVEL SECURITY`
also applies to the migration owner, so migrations that backfill data need an
explicit plan (a temporary policy or the admin role); tests seed fixtures with
the bootstrap/admin connection.

RLS stops wrong queries, not code running as the runtime role (which can call
`set_config` itself), so parameterized queries and repository ownership checks
still apply.
The setting is not authorization by itself: only trusted server code may set
it, so no request parameter may control it. RLS tests must attempt forged
identity, omitted context, error/rollback, and connection reuse cases.

If the selected Neon driver cannot guarantee transaction pinning and
transaction-local settings, block implementation and choose a compatible
driver/access strategy before creating protected data. Do not silently fall
back to an unrestricted connection or trust application filtering alone.

Use application checks and database constraints in addition to RLS:

- Validate all inputs using shared Zod schemas on the server.
- Add `user_id` to every read, update, and delete predicate even with RLS.
- Verify the owner of every referenced ID in the same transaction.
- Use composite same-owner foreign keys for project/task/tag/habit relations.
- Make Trash restore a server-only operation. Only the maintenance role
  hard-deletes Trash-managed rows; the Trash view simply hides rows past the
  30-day window until the nightly job removes them.
- Use least-privilege grants and `SECURITY INVOKER` functions by default.
- Create the initial `app_users` profile row from a verified Clerk session in
  a transaction with `app.user_id` set; its insert policy must permit only a
  row whose `clerk_user_id` equals that context. Provisioning must be
  idempotent.
- If Clerk webhooks are used, verify the signature before accepting events.
  Do not run them as the app runtime or trust webhook payload identity as a
  session. Enqueue verified events for a narrowly scoped server-side handler.

For example, the `app_users` insert policy is scoped to the runtime role and
allows only `clerk_user_id = current_setting('app.user_id', true)`; a missing
setting evaluates to no match. For each Trash-managed table, give the
maintenance role separate `SELECT` and `DELETE` policies whose `USING`
condition requires `deleted_at < now() - interval '30 days'`. Add equivalent
restrictive policies for cleanup queues based on eligible state. Account deletion
uses the same role: the maintenance role has `SELECT`/`UPDATE` on
`deletion_jobs`, and `SELECT`/`DELETE` on `app_users` only where a matching job
is in state `blobs_deleted`. Deleting the `app_users` row removes all owned rows
through `ON DELETE CASCADE` (referential-integrity actions run as the table owner
and are not subject to RLS), so the maintenance role never needs grants on the
child tables. `blob_cleanup_queue`: runtime `INSERT` only; maintenance
`SELECT`/`UPDATE`/`DELETE`. `webhook_events` and `deletion_jobs`: maintenance
`INSERT` so a signature-verified webhook can enqueue work without user context.
Apply these
policies per table; do not grant a broad maintenance bypass or rely on a
caller-supplied user ID. Purge a batch explicitly in dependency order and test
that unexpired rows, unrelated batches, and non-eligible jobs remain
inaccessible.

### Database roles and maintenance

Use three separately credentialed roles, plus the provider's administrative
bootstrap identity:

- `lifeos_migrator` is a non-superuser schema/table owner used only by
  migrations. It is never available to application functions.
- `lifeos_runtime` is a non-owner, non-superuser role without `BYPASSRLS`.
  Grant only the CRUD operations and schema usage needed by the application.
- `lifeos_maintenance` is a non-owner, non-superuser role without `BYPASSRLS`.
  It receives only the select/delete/update privileges needed for maintenance
  queues, expired Trash rows, and the account-deletion path above. Policies limit Trash access to rows whose
  `deleted_at` is older than the retention period; it cannot read ordinary
  user data or perform general user queries.

Provision role identities from [`../db-roles.sql`](../db-roles.sql), then set
credentials through the database provider's secret mechanism. RLS must remain
enabled and forced for every owned table. Test role grants and policies against
the production-style roles, including expired and unexpired Trash, rows from
multiple owners, and maintenance queue retries. Never grant maintenance or
runtime membership in the migrator role.

## Blob authorization and lifecycle

- Provision a private Vercel Blob store. Never place private LifeOS data in a
  public store or expose a read/write Blob token to the browser.
- Generate opaque server-owned paths, such as
  `users/{clerk-user-id}/attachments/{random-id}`. Do not place names or
  sensitive content in paths.
- Authorize against the `attachments`/profile metadata row and owning parent
  before issuing upload, download, overwrite, or delete capability.
- Serve private downloads with `Content-Disposition: attachment` and
  `X-Content-Type-Options: nosniff`; do not inline uploaded HTML or arbitrary
  active content.
- Enforce file allowlist, maximum 5 MB size, and 25 MB per-user attachment
  quota server-side. Reserve quota transactionally before issuing upload
  authorization; reconcile failed/abandoned uploads and concurrent requests.
- Validate content after upload before making the object available. Filename
  and browser MIME type are untrusted. Treat signature inspection and malware
  scanning as explicit requirements if the risk assessment requires them.
- Represent upload lifecycle explicitly (for example, pending, available,
  delete_pending, failed). Blob and Postgres are not one transaction; cleanup
  must be retryable and idempotent.
- Trash keeps bytes available for restore. A permanent purge removes metadata
  and Blob objects consistently, records failures for retry, and never reports
  successful purge while private objects remain.
- Account deletion immediately revokes application access, then retries Blob
  deletion and database cleanup from a durable `deletion_jobs` record. Copy every
  Blob path into `blob_cleanup_queue` before the `app_users` row is deleted;
  the cascade must never be the only copy of a path. Order: mark account
  pending and revoke Clerk sessions, queue paths, delete Blobs, delete the
  `app_users` row (cascade), delete the Clerk user through the Backend API
  (treat 404 as success), then mark the job complete. Every step is idempotent.
- Exports use a documented versioned JSON format, are streamed table by table
  from an authenticated request under the user's RLS context, and include a
  manifest of attachments with authenticated per-file download links. They do
  not bundle file bytes (a zip of every file cannot reliably be built inside a
  serverless request). A "download everything" archive is a later, separate job.

## Application security controls

- Set a restrictive Content Security Policy and security headers centrally.
  Start from `default-src 'self'`; add only the Clerk, Blob, and other exact
  origins required by the deployed app. Avoid broad wildcards and unsafe
  inline/eval directives; test the policy in report-only mode before
  enforcement.
- Sanitize note Markdown with `rehype-sanitize` and an explicit schema before
  rendering. Do not permit raw HTML by default.
- Rate limits are applied at the edge with Vercel Firewall rate-limiting rules
  (per IP and route: sign-in and sign-up routes, mutation endpoints, upload
  authorization, export and download). Verify rule count and availability on
  your plan. Return `429` with a retry hint. Edge rules cannot see the
  account, so per-account fairness is enforced in the database and code:
  the attachment quota, a cap on pending uploads per account, and sane
  maximums on per-account row counts for the unbounded tables. Revisit a
  shared counter store (for example Upstash) only if measured abuse requires it.
- Mutable records carry an integer `version`. Updates include the version
  observed by the client and increment it atomically. A stale version returns
  a conflict rather than silently overwriting a concurrent edit.

## Migrations and indexes

Use ordered, reviewed, forward-only migrations. The initial schema should be
built from an empty Postgres database and applied in CI. Do not manually edit
production schema.

Evaluate indexes for:

- `(user_id, due_date)` and `(user_id, status)` on tasks, plus task/project
  relation indexes used by measured queries.
- `(user_id, status)` and `(user_id, due_date)` on projects if queried.
- `(user_id, task_id)` on subtasks; `(user_id, tag_id)` on task-tag links.
- Unique `(habit_id, log_date)` and `(user_id, log_date)` on habit logs.
- `(user_id, deleted_at)` for authorized Trash/purge queries where plans
  justify it.
- Attachment owner and purge-state indexes, as supported by real query plans.

Do not add a broad index to every column. Measure query plans and write
overhead.

## Security references

- [PostgreSQL row security policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
  documents default-deny behavior, table-owner bypass, and `FORCE ROW LEVEL
  SECURITY`.
- [PostgreSQL configuration settings](https://www.postgresql.org/docs/current/functions-admin.html)
  documents `set_config` and transaction-local settings.
- [Drizzle transactions](https://orm.drizzle.team/docs/transactions) documents
  transaction support; verify the selected Neon driver/dialect and pooling
  mode preserve one connection for the complete transaction.
- [Vercel Blob security](https://vercel.com/docs/vercel-blob/security)
  documents private-store access expectations.
- [Vercel Blob client uploads](https://vercel.com/docs/vercel-blob/client-upload)
  documents the server route and token-generation lifecycle used for
  direct-to-Blob uploads.

These references support the proposed design; they do not replace testing the
chosen driver, provider plan, and actual account-level isolation behavior.

## Environment variables

Create `.env.example` with placeholders only. Actual secrets belong in local
`.env.local` (ignored by Git) or the correct Vercel environment.

| Variable | Exposure | Purpose |
|---|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Public | Clerk browser SDK configuration. |
| `CLERK_SECRET_KEY` | Server only | Clerk server-side auth/session verification. |
| `CLERK_WEBHOOK_SIGNING_SECRET` | Server only, optional | Verify Clerk webhooks if the design uses them. |
| `DATABASE_URL` | Server only | Runtime Neon pooled connection (`lifeos_runtime`); exact name may be mapped from the Marketplace integration. |
| `DATABASE_URL_UNPOOLED` | CI/deploy secret | Direct migration connection (`lifeos_migrator`). Migrations only; never available to application functions. |
| `MAINTENANCE_DATABASE_URL` | Server only | Connection for `lifeos_maintenance`; used only by the cron route and signature-verified webhook handler. |
| `BLOB_READ_WRITE_TOKEN` | Server only | Private Blob operations and constrained upload-token generation. |
| `CRON_SECRET` | Server only | Authenticate scheduled purge invocation. |
| `HEARTBEAT_URL` | Server only, optional | Heartbeat monitor pinged after each successful maintenance run. |
| `NEXT_PUBLIC_APP_URL` | Public | Canonical application origin for redirects and links. |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Public | Clerk sign-in route, normally `/sign-in`. |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Public | Clerk sign-up route, normally `/sign-up`. |
| `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` | Public | Post-authentication destination (verify name in current Clerk docs). |
| `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL` | Public | Post-registration destination (verify name in current Clerk docs). |
| `RESEND_API_KEY` | Server only, optional | Only if LifeOS adds Resend-owned email. |
| `SENTRY_AUTH_TOKEN` | CI only, optional | Only if Sentry release/source-map upload is adopted. |
| `SENTRY_ORG` | CI only, optional | Sentry organization for source-map upload. |
| `SENTRY_PROJECT` | CI only, optional | Sentry project for source-map upload. |

Use distinct dev, preview, and production resources/credentials. Confirm the
Marketplace-generated environment variable names and redeploy after changing
Vercel environment configuration.
