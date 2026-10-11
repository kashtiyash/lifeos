# GitHub and CI

This project includes portable GitHub configuration under `.github/`. GitHub
Actions activates workflows only from the root `.github/workflows/` of the
repository containing this project. This repository is now extracted into a
standalone repository with its ruleset enforced; verify paths, branch names,
secrets, and status checks whenever the template is reused elsewhere.

## Current configuration (this repository)

- Visibility: **public**. Rulesets, CodeQL, Dependency Review, secret scanning
  and private vulnerability reporting require a public repository or a paid
  plan.
- The `main-protection` ruleset is active on the default branch. Required
  checks: **PR Title, Lint & Typecheck, Unit Tests, Database/RLS Integration
  Tests, Build, Secret Scan**. Advisory (not required): Dependency Review,
  CodeQL, NPM Audit, E2E Tests, Clerk E2E.
- The maintainer is a pull-request-mode bypass actor, identified by numeric
  GitHub account ID (the checked-in example cannot guess it).
- Secret scanning, push protection, private vulnerability reporting, Dependabot
  alerts and Dependabot security updates are enabled.
- `LICENSE` (MIT) and `.github/CODEOWNERS` (the maintainer's real handle) are
  committed.

## Configuration inventory

- GitHub Actions templates: CI, secret scanning, dependency review, npm audit,
  and CodeQL.
- Pull request template, PR-title validation, Dependabot updates, and a
  branch-protection ruleset example.
- Project-scoped database, Next.js, UI, test, and workflow instructions and
  review skills.

The repository now contains the Next.js app scaffold and `package.json`
(introduced by F-1). Before enabling application checks, verify these package
scripts:

```text
lint
typecheck
test
db:migrate
test:integration
build
test:e2e
```

Do not make an absent/skipped app job a required merge check. Confirm the
displayed check names after the workflows have run in the destination
repository.

## Database roles in CI

- The PostgreSQL service's bootstrap account is a disposable superuser used
  only to create the CI roles and database.
- Create a separate non-superuser migration role that owns migrated objects.
  Use it for `db:migrate`; do not use the service superuser as the migration
  identity.
- Create a separate runtime role with no ownership, superuser, role-creation,
  or `BYPASSRLS` privileges. Integration and application E2E processes use
  only this role.
- Create a separate maintenance role with only the grants and restrictive RLS
  policies needed for expired Trash and cleanup queues.
- Test missing/forged identity, cross-user access, rollback, pooled connection
  reuse, and maintenance access against these roles.
- Keep database credentials disposable and local to CI. Never use a production
  database URL.

## Clerk and untrusted pull requests

- Build must not depend on repository secrets. Supply a well-formed,
  nonfunctional Clerk test publishable key for build-time validation and do
  not supply a Clerk secret key to the build job unless a verified build step
  requires it.
- Dependabot and fork pull requests do not receive repository secrets. Do not
  attempt to solve this by exposing credentials through `pull_request_target`
  or by running untrusted code with secrets.
- The required `PR Title` check exempts Dependabot authors
  (`if: github.actor != 'dependabot[bot]'`): Dependabot titles follow their own
  convention and would otherwise fail the emoji/type rule. The job still runs
  and reports success for those PRs.
- Run general E2E coverage with an isolated test-auth adapter that needs no
  provider secrets (`E2E_TEST_AUTH=1`, see [`testing.md`](./testing.md#test-auth-adapter)).
  Playwright starts its own server on a dedicated port and `.next-e2e` build
  directory, so the run never collides with a local dev server. The adapter is
  disabled outside production and can only mint its registered test users.
  Keep tests against the actual Clerk test instance in a
  trusted workflow/environment with restricted access; do not make a
  secret-dependent job a required check until all contribution paths have a
  safe, deterministic strategy.
- Automate supported Clerk test email/password flows. Keep Google OAuth and
  account-linking verification on a manual release checklist unless a safe,
  supported provider test flow is available.

## Security workflow availability

Gitleaks and npm audit do not require paid Code Security features. Dependency
Review and CodeQL require a public repository or a paid plan: on a **private**
repository they are unavailable on the free plan. Keep those jobs advisory or
conditionally disabled unless the repository is public or its plan includes the
required features. Do not mark them as required checks when the provider will
reject their execution. Branch rulesets and branch protection are likewise a
paid feature on private repositories and free on public repositories.

`NPM Audit` runs `npm audit --omit=dev --audit-level=high`, gating runtime
dependencies only. The build/lint toolchain (for example `shadcn` and
`eslint-config-next`) pulls `braces <= 3.0.3`, which has no patched release
(GHSA-vfj7-8cjw-p6xm); Dependabot and Dependency Review still surface dev-only
advisories. Findings for intentionally non-functional placeholder keys are
suppressed inline with `# gitleaks:allow`.

Check each pinned action SHA against its stated release using Dependabot or a
dedicated pinned-action verifier before activating the workflow. Review SHA
updates rather than replacing immutable pins with floating tags.

## Branch protection and repository ownership

After confirming CI check names, enable pull-request review, stale approval
dismissal, branch deletion/force-push protection, up-to-date checks, and the
smallest reliable set of required checks. Do not require dependency review,
CodeQL, or secret-dependent E2E unless they run successfully for every
permitted contribution path.

For a solo-maintained repository, configure the actual maintainer as a
ruleset bypass actor in GitHub using their numeric account ID and an
appropriately narrow bypass mode (prefer pull-request-only bypass). The
checked-in example cannot safely guess that ID. Verify the bypass works before
enabling enforcement; do not leave the maintainer unable to merge or recover
from a failed check.

This repository ships `LICENSE` (MIT) and `.github/CODEOWNERS` mapped to the
maintainer's real handle. Choose the repository's license before making the
source public. Configure `CODEOWNERS` with actual GitHub users or teams; do not
commit placeholder owners as if they were enforceable policy.

## Standalone repository setup

Before first release, verify the repository contains and correctly configures:

1. `.nvmrc` matches the Node version in CI and `.editorconfig` documents shared
   formatting defaults.
2. `CLAUDE.md` contains `@AGENTS.md` if Claude Code is supported.
3. `SECURITY.md` points to a monitored private vulnerability-reporting path.
4. `vercel.json` declares the nightly maintenance endpoint and the handler
   validates the `CRON_SECRET` bearer authorization.
5. `db-roles.sql` (idempotent) provisions roles; CI runs it as the service bootstrap user, then sets passwords with `ALTER ROLE`. See
   [data and security](./data-and-security.md).
6. Select a license and add the appropriate full license text; do not use a
   placeholder.
7. `.env.example` contains only non-secret placeholders, including Sentry
   source-map settings if Sentry is enabled.
8. Repository secrets `CLERK_TEST_PUBLISHABLE_KEY` and `CLERK_TEST_SECRET_KEY` (a Clerk *test* instance only) are used solely by the trusted `Clerk E2E` job on pushes to `main`.
9. Review the [operations runbook](./operations.md) and complete the privacy,
   backup, restore, and incident exercises.
