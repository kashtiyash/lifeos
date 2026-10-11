# LifeOS Greenfield Implementation Plan

**Status:** Proposed work sequence
**Project type:** Fresh build; no imported data, accounts, or credentials.

## Explicitly not part of this plan

- No Supabase-to-Neon database dump, restore, replication, or dual-write.
- No import of Supabase Auth accounts, password hashes, sessions, or user IDs.
- No copy of Supabase Storage objects or attachment metadata.
- No requirement to preserve existing URLs, UUIDs, or database history.
- No in-place replacement of another running application.

The new deployment has a new empty database, new Clerk accounts, and new
private Blob objects.

## Stage 0 — time-boxed architecture spike

Time-box this stage to one week. Build only a thin vertical skeleton: Clerk
sign-in, one user-owned table, one protected read/write path, and a preview
deployment.

- Run each protected query with the selected Neon driver inside a pinned
  transaction and set identity with parameterized
  `set_config('app.user_id', value, true)`.
- Use a non-owner runtime role without `BYPASSRLS`; prove missing context,
  forged identities, rollback, and pooled connection reuse are denied.
- Demonstrate a verified Clerk server identity and one-owner row visibility
  in preview.
- Record provider regions, cost, limits, and the selected architecture in ADRs.
- Decisions already made are in [`decisions.md`](./decisions.md). Still open: the
  heartbeat monitor service for the nightly job, and confirmation that Vercel
  Firewall rate-limit rules are available on the chosen plan.

**Pass:** all security cases pass repeatedly, preview deployment works, and
provider regions and estimated cost fit approved requirements.

**Fail:** connection pinning, transaction-local context, Clerk session
verification, or budget cannot be proven within the time box. Stop feature
work, revise the provider/design decision, and repeat the spike before storing
user data.

## Stage 1 — create the independent project foundation

- Create the new GitHub repository/project and Vercel project.
- Scaffold Next.js App Router, strict TypeScript, the shadcn/ui conventions in `ui-guidelines.md`,
  lint/typecheck/test/build scripts, GitHub Actions, and preview deployments.
- Provision separate Neon development/preview/production databases, Clerk
  development/production instances, and private Blob stores/environments.
- Agree the export format, account deletion timeline, retention policy, and
  privacy/legal review before public launch.
- Add `.env.example` with placeholders and configure secrets in local
  environment/Vercel; verify `.env*` secrets are ignored.
- Use local PostgreSQL for deterministic schema/integration tests.
- Add privacy-safe request IDs, structured errors, and baseline performance
  measurement before feature development.

**Gate:** empty app deploys to preview; CI passes; no secrets in repository or
client bundle; connection regions and resource costs are documented.

## Stage 2 — identity, schema, and isolation before product features

- Implement Clerk sign-up, login, logout, email verification, reset, Google
  OAuth, and safe same-person account linking.
- Implement protected server routes and a local `app_users` profile row keyed
  by the verified Clerk subject.
- Add Drizzle schema and first migrations: users/preferences, RLS helper
  policy, then foundational user-owned entities and same-owner FKs.
- Implement server-only repository access that verifies Clerk identity and
  establishes transaction-local account context for each protected operation.
- Prove RLS under the actual production-style runtime role and pooled driver.
- Add idempotent account-row provisioning through the verified session and a
  matching RLS insert policy. Verify account-deletion webhook signatures
  before they can enqueue work.

**Gate:** User A cannot read, update, delete, or reference User B's records
through app endpoints or direct database connections. Test missing/forged
identity and connection reuse. Auth E2E tests pass.

## Stage 3 — core product, one vertical slice at a time

Recommended order:

1. Tasks, views, filters, completion/reopen, subtasks, and tags.
2. Projects, milestones, archive/progress, and batch-scoped Trash/restore.
   Then recurring tasks ([ADR 0002](./adr/0002-recurring-tasks.md)); they
   depend on Trash batches and are cheapest to build alongside the task schema.
3. Habits, logs, pause/archive, timezone/week calculations, and streaks.
4. Reminders, missed list, browser-open delivery, and calendar.
5. Notes with `rehype-sanitize`.
6. Private attachments only after Blob quota, ownership, download headers,
   and failure/retry behavior are tested.
7. Account export and deletion, including durable Blob cleanup.
8. Dashboard and analytics after their source features are stable.

For every slice: schema migration; validation and domain logic; repository;
server-side ownership checks; RLS/constraint tests; UI loading/empty/error
states; unit and relevant Playwright coverage; documentation. Keep all
queries bounded and measure the real page path.

**Gate:** business rule tests pass, cross-user isolation remains green, and
representative data sizes do not breach the measured performance budget.

## Stage 4 — file storage and scheduled maintenance

- Create private Blob resources separately for preview and production.
- Implement constrained upload authorization, account/owner validation,
  per-user quota reservation, post-upload verification, and safe downloads.
- Test wrong-owner upload/download/delete, oversized/unsupported content,
  concurrent quota attempts, abandoned uploads, and Blob/API failures.
- Implement Trash purge as idempotent database state transitions plus Blob
  deletion retries. Never assume the DB and Blob share a transaction.
- Add a protected Vercel Cron endpoint declared in `vercel.json`; validate
  `Authorization: Bearer $CRON_SECRET` and verify plan timing/precision.
- Implement the account-deletion path (`deletion_jobs`, `blob_cleanup_queue`,
  cascade delete, Clerk user deletion) and test it with the maintenance role.

**Gate:** expired records and objects are consistently purged or explicitly
queued for retry; restored records/files remain usable within the 30-day
window; cron endpoint rejects requests without the secret.

## Stage 5 — reliability, privacy, and performance

- Run security review for auth/session handling, RLS, server actions, file
  access, Markdown rendering, secrets, and dependency exposure.
- Run tests against a clean local Postgres database with all migrations
  applied. Do not use production data in tests.
- Measure p50/p95 server response and database query latency, auth latency,
  task-list behavior at representative account sizes, and Core Web Vitals.
- Meet p95 server response ≤ 500 ms and p95 database query ≤ 100 ms for the
  representative workload defined in `operations.md`; investigate and record
  exceptions before launch.
- Verify LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.2 on production-like pages.
- Test 320px/360px phone, 768px tablet, and 1440px desktop, light/dark theme,
  keyboard operation, and WCAG 2.1 AA critical flows.
- Confirm provider cost, storage/quota headroom, backup/recovery, logs/alerts,
  region placement, and operational ownership.

**Gate:** all release checks pass and the monthly provider cost matches the
approved budget.

## Required CI commands

Adapt script names to the newly scaffolded project and document exact results
in each release PR:

```text
npm run lint
npm run typecheck
npm run test
npm run test:integration
npm run test:e2e
npm run build
```

Integration checks must create a clean test database, apply all migrations,
run ownership/RLS/constraint tests, then clean up. Never run destructive
migrations against production as part of pull-request CI.

## Initial backlog to create in the new project

1. **Greenfield architecture decision** — approve providers, regions, and
   free-tier budget.
2. **Foundation and CI** — app scaffold, local PostgreSQL, Vercel preview,
   environment templates, and health/performance instrumentation.
3. **Clerk authentication and account profile** — full email/OAuth/reset flow
   and protected routing.
4. **Neon/Drizzle data layer and RLS** — schema, migrations, transaction
   context, composite ownership constraints, and cross-user isolation suite.
5. **Tasks, subtasks, tags** — first user-facing vertical slice and bounded
   query/pagination behavior.
6. **Projects, milestones, Trash** — same-owner relationships, restore, and
   purge state model.
7. **Habits, reminders, and calendar** — timezone/week correctness and app-open
   reminder UX.
8. **Notes and private Blob files** — `rehype-sanitize`, uploads, quota,
   authorized download, and storage cleanup.
9. **Dashboard and analytics** — aggregate views with production-like query
   budgets.
10. **Release hardening** — security, accessibility, E2E, backups, provider
    cost, and Core Web Vitals acceptance.
