# LifeOS Greenfield Architecture

**Status:** Proposed architecture for a new build; no Supabase dependency.

## System outline

```text
Browser
  ├── Clerk session / sign-in UI
  ├── Next.js Server Components and Server Actions
  └── Direct upload using a narrowly scoped, server-issued Blob token
            │
            ▼
Vercel Next.js Node.js Functions
  ├── Verify Clerk identity on every protected operation
  ├── Validate inputs and enforce ownership
  ├── Set transaction-scoped database identity
  ├── Drizzle repositories and domain use cases
  ├── Private Blob authorization and upload callbacks
  └── Protected Vercel Cron endpoint
            │
            ├── Neon PostgreSQL (Drizzle migrations, RLS)
            ├── Vercel Blob (private files)
            └── Clerk (identity, sessions, verification, OAuth, reset email)

GitHub Actions ── lint, typecheck, unit/integration tests, build ──► Vercel
```

## Service choices

### Runtime and web application

- Keep Next.js App Router, TypeScript strict mode, React, Tailwind, shadcn/ui,
  and Lucide unless a separate product decision changes them.
- Configure security headers centrally, including a restrictive Content
  Security Policy. Allow only the exact Clerk and Blob origins required by the
  deployed app; test the policy in report-only mode before enforcing it.
- Deploy on Vercel. Use Node.js Functions for authenticated database and file
  operations; do not run user-specific database queries at the edge by
  default.
- Choose the Vercel Function region to be near the Neon database region.
  Record both values and measure round-trip latency before launch.
- Use Server Components for initial private page data and client components
  only for interactions. Never fetch the same initial dataset again on mount.
- Do not cache user-specific data in shared CDN/framework caches. Any later
  private cache must key by authenticated account and prove isolation and
  invalidation.

### Database and access layer

- Use Neon PostgreSQL, provisioned as a third-party Marketplace integration.
- Use Drizzle ORM/Drizzle Kit with SQL migrations committed to the new project.
- Use a pooled runtime connection for ordinary queries and a migration-only
  direct connection as supported by the provider. Keep credentials
  server-only.
- All domain queries live in server-only repositories under `lib/data/` or
  `lib/repositories/`; domain rules remain pure and independent of Drizzle,
  Clerk, and HTTP.
- Bound and paginate every growing collection; select only fields needed by
  the view. Determine indexes from representative query plans.

### Identity, sessions, and authorization

- Use Clerk's official Next.js integration for email/password, email
  verification, password reset, Google OAuth, and session management.
- Obtain the account ID only from a verified Clerk server session. Never
  trust a user ID submitted in form data, query parameters, client state, or
  Blob metadata.
- Keep a local `app_users` row keyed by the opaque Clerk user ID. Provision it
  idempotently inside an authenticated transaction after verifying the session;
  an insert RLS policy must restrict the new row to the verified identity.
  Profile preferences live there. Do not require a webhook for initial profile
  creation.
- Each protected server operation verifies identity, validates its request,
  and performs ownership-scoped repository operations. Route protection in a
  proxy/layout is only a UX layer, not the sole security boundary.
- Preserve defense in depth with Postgres RLS and same-owner foreign keys. For
  RLS, the database connection must use a non-owner, non-`BYPASSRLS` runtime
  role. A repository transaction must set transaction-local account context
  using parameterized `set_config('app.user_id', value, true)`, derived only
  from the verified Clerk session. Every protected query must run in that
  transaction. Integration tests must prove context cannot leak across pooled
  connections.
- Use three separately credentialed non-superuser roles: a migration-only
  table owner, a restricted runtime role, and a restricted maintenance role.
  The maintenance role may only process explicitly authorized jobs and expired
  Trash rows under restrictive RLS policies; it is not a general RLS bypass.
- If Clerk webhooks are enabled, verify signatures and enqueue accepted events.
  A webhook is not an authenticated user session and must not run as the
  runtime role with absent or forged account context.
- Do not issue database credentials, Clerk secret keys, or Blob read/write
  tokens to browser bundles. The Clerk publishable key is the only public
  provider key in this design.

### Private files

- Use Vercel Blob with a **private** store for attachment objects. The store
  mode is an initial provisioning choice; do not create a public store for
  LifeOS user files. Profile images remain provider-owned by Clerk.
- Store Blob object paths and validated metadata in PostgreSQL. Keep object
  paths opaque and generated by the server; never use user-supplied paths as
  authorization.
- Before upload, authenticate the user, verify the owning task/project, check
  remaining quota and allowed size/type, then issue a narrowly scoped upload
  token for the exact path and constraints. Minimize its exposure lifetime
  using the provider's supported controls.
- Do not expose arbitrary Blob reads. Serve downloads through an authenticated
  server route that checks metadata ownership before fetching the private
  object, or use another officially supported private delivery flow with the
  same authorization guarantee. Set `Content-Disposition: attachment` and
  `X-Content-Type-Options: nosniff`.
- Validate uploads beyond filename/MIME claims. Keep new objects unavailable
  until server-side metadata validation completes. If true content inspection
  or malware scanning is required, design that as a separate, explicitly
  budgeted feature before enabling uploads.
- Database and Blob do not share a transaction. Use a cleanup/outbox state
  machine with retries and idempotent operations for failed uploads, Trash
  purge, and object deletion.

### Email, scheduled jobs, observability

- Configure Clerk's supported email delivery for verification and password
  recovery, and verify sender, domain, and plan requirements. Add Resend only
  if LifeOS needs application-owned product emails; it is not necessary for
  the first build by default.
- Use the nightly Vercel Cron Function declared in `vercel.json` for expired
  Trash and deletion-job cleanup. Validate
  `Authorization: Bearer $CRON_SECRET` using a timing-safe comparison and make
  each purge step safe to retry. Confirm the current plan supports the schedule
  and tolerance in production.
- After each successful maintenance run, ping `HEARTBEAT_URL` (a free heartbeat
  monitor) so a missed or failing nightly job raises an alert.
- Use Vercel's request/function logs and Speed Insights/Analytics to observe
  latency and Core Web Vitals. Add Sentry only if error tracking needs exceed
  those facilities; if enabled, configure its CI source-map token from the
  secret manager. Do not log tokens, file contents, private notes, or
  unnecessary personal data.
- Enforce the p95 server and database latency budgets in
  [`operations.md`](./operations.md). Apply Vercel Firewall rate-limit rules to
  auth, mutation, upload and download routes (see `data-and-security.md`), and
  use optimistic concurrency on edits.
- No Redis, queue, Realtime, or workflow service is required for v1. Reminders
  are app-open-only; add durable background services only when a product
  requirement needs them.

## Request flows

### Authenticated page read

1. Resolve and verify the Clerk session on the server.
2. Parse URL filters with the shared schema and derive the account ID from
   Clerk's verified identity.
3. Start a transaction through the chosen RLS-capable runtime driver; set
   transaction-local account context with parameterized `set_config`.
4. Execute bounded, ownership-filtered repository queries under RLS.
5. Return only minimal serializable page data. Do not follow this with an
   identical client-side fetch on first render.

### Mutation

1. Verify session; parse and validate server-side input.
2. Start an RLS-scoped transaction and check each referenced project, tag,
   habit, or other ID belongs to the same account.
3. Apply the business operation with database constraints as a backstop.
4. Return an explicit result; invalidate only the affected user-scoped view.
5. Emit privacy-safe operational diagnostics for failures.

### Upload and download

1. Verify session, ownership, quota, and constraints before issuing upload
   authorization.
2. Upload directly to the private Blob store using only a constrained token;
   minimize its exposure lifetime using supported provider controls.
3. Validate completion and persist owner-scoped metadata before making the
   file available through the application.
4. For download/delete, resolve the path from owned metadata and authorize the
   user before accessing Blob.

## Provider sources

- [Backend-provider decision](./adr/0001-backend-providers.md)
- [Neon on Vercel](https://vercel.com/docs/postgres)
- [Clerk Next.js quickstart](https://clerk.com/docs/nextjs/getting-started/quickstart)
- [Next.js authentication guide](https://nextjs.org/docs/app/guides/authentication)
- [Drizzle ORM documentation](https://orm.drizzle.team/docs/overview)
- [Vercel Blob](https://vercel.com/docs/vercel-blob) and
  [Blob security](https://vercel.com/docs/vercel-blob/security)
- [Vercel Function regions](https://vercel.com/docs/functions/configuring-functions/region)
- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)

Provider capabilities, pricing, and plan limits change. Re-check these
official docs before provisioning production resources.

## Account export and deletion

- An export verifies the active Clerk session and streams only the requesting
  account's application data (JSON plus an attachment manifest) under the
  user's RLS context. File bytes are fetched individually through the normal
  authenticated download route.
- A deletion request requires recent authentication, creates a `deletion_jobs`
  row, immediately marks the account unavailable to normal app routes, and
  revokes active Clerk sessions.
- Preserve Blob paths and cleanup state in a durable deletion job before
  removing database metadata. A maintenance worker retries Blob deletion and
  final database cleanup until complete; retries are idempotent and failures
  remain visible to operators.
- Verify Clerk webhook signatures before enqueueing provider-initiated account
  deletions; deduplicate on the event ID in `webhook_events`. The webhook
  handler uses the maintenance role to insert only into `webhook_events` and
  `deletion_jobs`. Do not rely on webhook delivery as the sole deletion trigger.
- Final step of any deletion job: delete the Clerk user through the Backend API
  after database and Blob cleanup (treat "not found" as success).
