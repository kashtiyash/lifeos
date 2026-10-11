# Setup checklist

Work top to bottom. Commands are shown for bash and PowerShell where they differ.
Vendor limits, prices and terms change: confirm each against the provider's
current documentation before relying on this list. Never commit real keys.

> **Stage 0 is complete** (2026-10-11) and the throwaway `spike/` tree has since
> been removed. The spike-verification steps below are kept as a historical
> record; [ADR 0001](adr/0001-backend-providers.md) holds the recorded results.

## 1. Tools on your computer

- [ ] Git, and Node 24 (`.nvmrc`). Use nvm-windows or fnm on Windows.
- [ ] Docker Desktop (for a local PostgreSQL 17 identical to CI), or a local Postgres install.
- [ ] GitHub CLI (`gh`) and Vercel CLI: `npm i -g vercel`.

```bash
node -v        # v24.x
docker --version
gh auth login
vercel login
```

## 2. Local database for tests

```bash
docker run --name lifeos-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=lifeos_test \
  -p 5432:5432 -d postgres:17
```

## 3. Stage 0 RLS proof (completed)

The throwaway RLS harness ran against the local database above: 13/13 tests
passed under the three production-style roles, including default-deny, forged
identity, pooled-connection reuse, rollback, and the account-deletion cascade.
The harness has since been removed; [ADR 0001](adr/0001-backend-providers.md)
records the result. The local database from step 2 still backs the integration
and RLS tests.

## 4. GitHub (done 2026-10-11)

- [x] Decide visibility: **public**. Rulesets, CodeQL, Dependency Review and
      secret scanning require a public repo or a paid plan on private repos.
- [x] Create and push:

```bash
gh repo create lifeos --public --source=. --push
gh api user --jq .id        # numeric ID, for the ruleset bypass actor
```

- [x] Test PR produced every check name; they match `.github/rulesets/main-protection.json`.
- [x] Imported `main-protection`, added the maintainer as a pull-request-only bypass actor, enforced on the default branch.
- [x] Enabled private vulnerability reporting, secret scanning, push protection, and Dependabot alerts/security updates.
- [x] Added repository secrets `CLERK_TEST_PUBLISHABLE_KEY` and `CLERK_TEST_SECRET_KEY` from a **separate** Clerk test instance.
- [x] Added `LICENSE` (MIT) and `.github/CODEOWNERS`.

## 5. Neon (database)

- [ ] Create a project (via Vercel Marketplace or neon.com). Pick the region you will also use for Vercel functions. Record it.
- [ ] Note two connection strings: pooled host (runtime, maintenance) and direct host (bootstrap, migrations).
- [ ] Stage 0 already verified the design on a **throwaway branch** (13/13 on both
      drivers). Before any later verification run, create a fresh throwaway branch
      and never point it at production.

The migration role owns migrated objects; the runtime role has no ownership,
superuser, role-creation, or `BYPASSRLS` privileges; the maintenance role has
only the grants and restrictive RLS policies needed for expired Trash and
cleanup queues. Credentials for each are distinct (see `.env.example`).

## 6. Clerk (development instance)

- [ ] Create an application. Enable email + password, **require email verification**, enable Google.
- [ ] Copy the publishable key and secret key into `.env.local` (never commit).
- [ ] Skip webhooks until the account-deletion slice.

## 7. Next.js app skeleton (done in F-1)

The repo root was not empty, so the scaffold was generated elsewhere and merged,
keeping `docs/`, `.github/`, and root config files. Retained for reference:

```bash
npx create-next-app@latest ../lifeos-app --ts --tailwind --eslint --app --src-dir=false
# copy the generated app/, public/, package.json, tsconfig.json, next.config.*, etc. into the repo root
npm i @clerk/nextjs drizzle-orm pg zod
npm i -D drizzle-kit vitest @playwright/test
npx shadcn@latest init
```

The `package.json` scripts the CI expects (`lint`, `typecheck`, `test`,
`db:migrate`, `test:integration`, `build`, `test:e2e`) and a committed
`package-lock.json` are now in place.

## 8. Vercel

- [ ] `vercel link`, then set the **function region** next to Neon.
- [ ] Add environment variables per environment (see `.env.example`); generate `CRON_SECRET` with `openssl rand -hex 32` (PowerShell: `-join ((48..57)+(97..102) | Get-Random -Count 64 | % {[char]$_})`).
- [ ] `vercel env pull .env.local` to sync locally.
- [ ] Check the plan's terms for a public product, cron limits, and Blob limits.
- [ ] Deploy a preview; record Neon region, Vercel region and estimated monthly cost.

## 9. Stage 0 pass checklist (completed)

- [x] 13 RLS tests pass locally, on Neon (node-postgres), and on Neon (serverless pool)
- [x] Clerk sign-in works; the server derives the user ID from the verified session only
- [x] One protected read/write page works on a Vercel preview with identity set via `set_config`
- [x] Regions and estimated cost recorded in the ADR
- [x] No secrets in the repo or the client bundle

## 10. Later

Heartbeat monitor (for `HEARTBEAT_URL`), Vercel Firewall rate-limit rules, Blob store,
Resend, Sentry. See `docs/decisions.md` for open items.
