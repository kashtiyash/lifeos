# Provider provisioning runbook (F-3)

Create the empty, isolated **development**, **preview** and **production**
resources for LifeOS and wire every credential through a secret store. Nothing
is imported from any earlier application, and no real key is ever committed.

This is the detailed companion to [`setup.md`](./setup.md) §5, §6 and §8 and to
[`0103-provision-provider-resources.md`](../.scratch/lifeos-v1/issues/0103-provision-provider-resources.md).

> Provider UIs, quotas, terms and prices change. Confirm each step against the
> provider's current documentation. Recorded target facts ([ADR 0001](./adr/0001-backend-providers.md)):

| Fact | Value |
|---|---|
| Neon region | `aws-us-east-2` (AWS US East 2, Ohio) |
| Vercel function region | `cle1` (Cleveland) |
| Blob access | **private** stores, one per environment |
| Target monthly cost | **$0** (free tiers) at v1 scale |

## 0. Lock these decisions first

- **Regions:** Neon `aws-us-east-2`, Vercel functions `cle1`. Keep them adjacent.
- **Naming:** prefix everything `lifeos` — Neon project `lifeos`, Vercel project
  `lifeos`, Clerk applications `LifeOS` (dev + prod instances) and `LifeOS Test`.
- **Environments:** `development`, `preview`, `production`.
- **Neon branches:** `production` (default), `preview`, `development`.
- **Roles in every environment:** `lifeos_migrator`, `lifeos_runtime`,
  `lifeos_maintenance` — distinct credentials, never interchangeable.

## 1. Do the steps in this order

1. Neon project + branches (§2)
2. Roles + grants on every branch (§3)
3. Clerk instances (§4)
4. Vercel project, region and environment variables (§5)
5. Private Blob stores (§6)
6. GitHub secrets and local `.env.local` (§7)
7. Record and verify (§8)

## 2. Neon (database)

1. Create a Neon project `lifeos` in **`aws-us-east-2`**. One project with
   three branches is enough for v1 and fits the free tier.
2. Create branches `production` (make it the default), `preview`, and
   `development`. Keep `development` for local work, `preview` for Vercel
   Preview deployments, `production` for the live site.
3. For each branch, open **Connection Details** and note two hosts:
   - **pooled** — contains `-pooler`; used by runtime and maintenance.
   - **direct** — no `-pooler`; used by migrations and role bootstrap.
4. The Neon owner role (for example `neondb_owner`) is the **bootstrap**
   connection. It is used only in §3 and by migrations-runbook setup — never by
   the running application.

> **Do not** point the app at the Vercel Marketplace integration's
> auto-injected `DATABASE_URL`. That string uses the owner role and breaks the
> three-role least-privilege model. You may use the integration to create the
> database, but override the app variables with the role-scoped URLs from §3.

## 3. Roles and grants (every branch)

Run the idempotent role script as the Neon **owner** for each branch, then set
distinct passwords. This mirrors the CI job exactly.

```bash
# Bootstrap connection = Neon owner (pooled or direct; direct is fine).
export NEON_OWNER_URL='postgresql://<owner>:<pw>@<host>/<db>?sslmode=require'

psql "$NEON_OWNER_URL" -v ON_ERROR_STOP=1 -f db-roles.sql
psql "$NEON_OWNER_URL" -v ON_ERROR_STOP=1 \
  -c "ALTER ROLE lifeos_migrator PASSWORD '<migrator-pw>'" \
  -c "ALTER ROLE lifeos_runtime PASSWORD '<runtime-pw>'" \
  -c "ALTER ROLE lifeos_maintenance PASSWORD '<maintenance-pw>'"
```

Build the three role-scoped URLs per branch (note `-pooler` only on runtime and
maintenance):

```text
DATABASE_URL              = postgresql://lifeos_runtime:<runtime-pw>@<branch>-pooler.aws-us-east-2.aws.neon.tech/<db>?sslmode=require
DATABASE_URL_UNPOOLED     = postgresql://lifeos_migrator:<migrator-pw>@<branch>.aws-us-east-2.aws.neon.tech/<db>?sslmode=require
MAINTENANCE_DATABASE_URL  = postgresql://lifeos_maintenance:<maintenance-pw>@<branch>-pooler.aws-us-east-2.aws.neon.tech/<db>?sslmode=require
```

Verify least privilege on each branch (expect `t|f|f`):

```bash
psql "$DATABASE_URL_UNPOOLED" -tAc "select current_user"           # lifeos_migrator
psql "$DATABASE_URL"          -tAc "select current_user"           # lifeos_runtime
psql "$DATABASE_URL_UNPOOLED" -tAc "select has_database_privilege('lifeos_migrator', current_database(), 'CREATE'), has_database_privilege('lifeos_runtime', current_database(), 'CREATE'), has_database_privilege('lifeos_maintenance', current_database(), 'CREATE');"
```

Apply migrations as the migrator against **development** only:

```bash
DATABASE_URL_UNPOOLED="$DEV_MIGRATOR_URL" npm run db:migrate
```

> If Neon denies `CREATE ROLE` for the owner role, create the three roles from
> the Neon Console **Roles** page (same names/attributes) and then run only the
> `GRANT`/`REVOKE` statements from `db-roles.sql`.

## 4. Clerk (identity)

1. Create application **`LifeOS`**. It has a **Development** and a
   **Production** instance.
2. On each instance enable **Email + password**, turn on **require email
   verification**, and enable **Google** sign-in.
3. Copy the **Publishable key** and **Secret key** from each instance into the
   matching Vercel environment (§5) and into local `.env.local`. Only the
   publishable key is client-eligible.
4. Create a **separate application `LifeOS Test`** for provider-controlled E2E.
   Its keys are the GitHub repository secrets `CLERK_TEST_PUBLISHABLE_KEY` /
   `CLERK_TEST_SECRET_KEY` (already set).
5. Leave webhooks disabled until the account-deletion slice (I-7).

## 5. Vercel (hosting, functions, cron)

```bash
vercel link            # create/link the "lifeos" project
```

1. Set the **function region** to `cle1` (Project → Settings → Functions).
2. Add environment variables for each scope (**Production**, **Preview**,
   **Development**) from the table below. `NEXT_PUBLIC_*` values may differ per
   environment; server secrets must.
3. Generate `CRON_SECRET`:
   - bash: `openssl rand -hex 32`
   - PowerShell: `-join ((48..57)+(97..102) | Get-Random -Count 64 | % {[char]$_})`
4. Pull locally: `vercel env pull .env.local` (Development scope).

| Variable | Scope | Notes |
|---|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | public | per environment |
| `NEXT_PUBLIC_APP_URL` | public | `http://localhost:3000` for dev; the deployment URL otherwise |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` / `SIGN_UP_URL` | public | `/sign-in`, `/sign-up` |
| `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` / `SIGN_UP_...` | public | `/dashboard` |
| `CLERK_SECRET_KEY` | server | per environment |
| `CLERK_WEBHOOK_SIGNING_SECRET` | server | later (I-7) |
| `DATABASE_URL` | server | `lifeos_runtime`, pooled |
| `DATABASE_URL_UNPOOLED` | server/migration | `lifeos_migrator`, direct |
| `MAINTENANCE_DATABASE_URL` | server | `lifeos_maintenance` |
| `BLOB_READ_WRITE_TOKEN` | server | set by the Blob store (§6) |
| `CRON_SECRET` | server | random 32-byte hex |
| `HEARTBEAT_URL` | server, optional | until a monitor is chosen |

## 6. Vercel Blob (private files)

1. Dashboard → **Storage** → **Create** → **Blob**. Choose **Private** access.
   A public store is never acceptable for LifeOS files.
2. Create one store per environment (`lifeos-blob-preview`, `lifeos-blob-prod`;
   dev may reuse preview) and connect each to the project so Vercel sets
   `BLOB_READ_WRITE_TOKEN` for the matching scope.
3. Confirm each store shows **Private** before moving on.

## 7. GitHub secrets and local environment

- Repository secrets (already set): `CLERK_TEST_PUBLISHABLE_KEY`,
  `CLERK_TEST_SECRET_KEY`.
- `.env.local` is produced by `vercel env pull` plus the **development** Clerk
  keys. Confirm `.env*` is ignored:

```bash
git check-ignore .env.local   # must print .env.local
```

- `.env.example` holds placeholders only (already complete).

## 8. Record and verify

Tick each acceptance item from the ticket:

- [ ] No secret committed; `.env.example` contains placeholders only.
- [ ] Runtime / migration / maintenance credentials are distinct and
      server-only; the app never uses the Neon owner role.
- [ ] Only the Clerk publishable key is eligible for the client bundle.
- [ ] Blob stores are private in every environment.
- [ ] `db-roles.sql` applied on all three branches; `has_database_privilege`
      returns `t|f|f`.
- [ ] `DATABASE_URL_UNPOOLED="$DEV_MIGRATOR_URL" npm run db:migrate` succeeds on
      development.
- [ ] `vercel env pull .env.local` then `npm run build` succeeds locally.

Record the final values in [ADR 0001](./adr/0001-backend-providers.md) and
[decisions.md](./decisions.md): Neon region, Vercel region, Blob store mode,
and estimated monthly cost.

### Hand back to the agent

Once provisioned, share (through the secret stores, not chat) the **region and
store facts**, and tell the agent when `.env.local` is populated. The agent can
then finish `vercel.json`, the `db:migrate` runbook for preview/production, and
the F-3 documentation updates.
