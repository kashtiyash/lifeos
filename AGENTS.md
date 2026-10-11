# Greenfield Project Instructions

This repository is a fresh LifeOS project. It imports nothing from any earlier
application.

## Source of truth

- Product requirements: [`docs/product-spec.md`](docs/product-spec.md)
- Architecture and providers: [`docs/architecture.md`](docs/architecture.md)
- Database and security: [`docs/data-and-security.md`](docs/data-and-security.md)
- UI guidelines: [`docs/ui-guidelines.md`](docs/ui-guidelines.md)
- Testing strategy: [`docs/testing.md`](docs/testing.md)
- Build stages: [`docs/implementation-plan.md`](docs/implementation-plan.md)
- Provider decision: [`docs/adr/0001-backend-providers.md`](docs/adr/0001-backend-providers.md)
- Operations and recovery: [`docs/operations.md`](docs/operations.md)
- GitHub and CI: [`docs/github-and-ci.md`](docs/github-and-ci.md)

## Non-negotiables

- No Supabase dependency, data migration, or reuse of old credentials.
- New Neon database, Clerk application, and private Blob store start empty.
- Verify Clerk identity on every protected server operation; never trust a
  client-supplied account ID.
- Enforce per-user ownership in server-side repositories, PostgreSQL RLS, and
  same-owner foreign keys. Do not weaken isolation to make a provider
  integration easier.
- Use three database roles: `lifeos_migrator` (migrations only),
  `lifeos_runtime` (app requests, RLS enforced) and `lifeos_maintenance` (cron and
  verified webhooks only). Never use one in place of another.
- Keep database, Clerk secret, Blob, and cron credentials server-only. Commit
  placeholders in `.env.example`, never real `.env*` values.
- Validate all external input with shared schemas on the server; add tests for
  behavior changes, database rules, and ownership.
- Business rules belong in pure domain modules, not UI components.
- Use the user's configured timezone for User Day, streaks, and weekly
  boundaries.
- All private file operations verify ownership. Markdown is sanitized before
  rendering.
- Every data view has loading, empty, error, and retry states.
- Measure query plans and application latency before adding indexes, caching,
  or background services.

## Before database implementation

Prove that the selected Neon driver and pool can run each protected query
inside a pinned transaction with transaction-local account context. The app
runtime role must not own tables or have `BYPASSRLS`. Test missing context,
forged IDs, rollback, and pooled connection reuse. If these guarantees are not
available, stop and revise the design before storing user data.

## Validation

Use the scripts in `package.json` as the command source of truth. The planned
release gates are lint, typecheck, unit tests, local PostgreSQL integration
and RLS tests, production build, and Playwright E2E tests. Keep production
credentials out of CI; use local test services or a dedicated test provider
instance.

## GitHub integration

The `.github/` folder holds the active workflows, review skills and
instructions. Before enabling required checks, confirm the check names shown by
GitHub match `.github/rulesets/main-protection.json`, and follow
[`docs/github-and-ci.md`](docs/github-and-ci.md) for CI roles, the
secret-free build, and bypass-actor setup.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
