# Testing Strategy

Tests protect LifeOS business rules, account isolation, file privacy, and
user-observable behavior. Use synthetic fixtures and disposable local services;
never run tests against production user data.

## Test layers

| Layer | Purpose |
|---|---|
| Unit (Vitest) | Pure domain rules, schemas, timezone behavior, and formatting. |
| Database integration (Vitest + local PostgreSQL) | Drizzle migrations, constraints, repositories, RLS, transaction-local Clerk identity, and error mapping. |
| End-to-end (Playwright) | Browser flows through the local Next.js app and local test database; use a dedicated Clerk test instance for provider-controlled auth flows. |
| Accessibility | axe-core plus keyboard, focus, zoom, theme, and responsive checks. |
| Security | CI secret scan, dependency audit, applicable dependency review/CodeQL, and focused security review. |

## Required coverage

- User Day across IANA zones, midnight, daylight-saving changes, and configured
  week boundaries.
- Task ordering/status transitions and stale-version conflicts, project
  progress, habit targets/pause/archive/streaks, analytics denominators,
  reminders, and batch-scoped Trash/restore/purge.
- Invalid and cross-field-invalid request values; ownership of every
  referenced project, tag, habit, or file owner.
- A clean database applying all migrations.
- User A can access their own records; User B cannot read, update, delete, or
  reference User A's records.
- RLS default-deny without identity context; attempts at forged identities;
  connection-pool reuse after commit and rollback.
- Runtime role is not table owner, superuser, or `BYPASSRLS`; migration role is
  separate from runtime role. Maintenance role is separately credentialed and
  can access only authorized maintenance rows and expired Trash.
- Initial `app_users` creation succeeds only for the verified identity under
  RLS; webhook processing rejects invalid signatures.
- Private file wrong-owner upload/download/delete, invalid type/size, quota
  races, failed uploads, retry, and Trash restore/purge.
- Download response headers, CSP/security headers, mutation/upload rate limits,
  and account export/deletion including retry after Blob failures.
- Auth sign-up/verification, password reset, protected-route redirects, and
  sign-out. Keep Google sign-in/account-linking on a manual provider checklist
  unless a safe automated provider test is available.
- Recurring tasks: `nextOccurrence` unit and property tests (month end, leap
  year, intervals, weekday sets, early/late completion, end conditions,
  AFTER_COMPLETION); concurrent completion creates exactly one next instance;
  one open instance per series; series Trash/restore by batch; Undo rejected
  after the next instance is edited.
- Maintenance role: cannot read live user rows; can delete only expired Trash
  and `app_users` rows with a `blobs_deleted` job; cascade removes every child
  row; webhook replays are ignored via `webhook_events`.
- Account export completeness, deletion authorization, immediate access
  revocation, and retryable Blob/database cleanup.
- Loading, empty, error/retry, keyboard, reduced-motion, and responsive
  behavior on critical routes.

## CI scripts

Once the new package manifest is created, keep it as the source of truth for
these scripts:

```text
npm run lint
npm run typecheck
npm run test
npm run db:migrate
npm run test:integration
npm run build
npm run test:e2e
```

The GitHub workflow should provision disposable PostgreSQL. Its service bootstrap
account is used only to create roles; migrations run as a non-superuser
migration owner, and application tests use a separate non-superuser runtime
role. Keep a dedicated Clerk test instance for provider-controlled auth tests;
never place production credentials in Actions secrets. Builds use a
well-formed, nonfunctional test publishable key and do not need Clerk secrets.
The Playwright configuration must start/stop the app and collect bounded
failure artifacts.

Pull requests gate on PR title, lint/typecheck, unit tests, database/RLS
tests, build, and secret scan. Keep E2E advisory until it can run without
exposing provider secrets to fork or Dependabot code. Dependency Review and
CodeQL are enabled only when repository visibility or GitHub licensing
supports them; npm audit remains an additional security check. Document the
required/advisory status in branch protection.
