# ADR 0001: Backend providers

- **Status:** Accepted (2026-10-11). Stage 0 spike passed locally, on Neon with
  both drivers, and on a Vercel preview.
- **Date:** 2026-10-10
- **Context:** LifeOS needs a fresh, public multi-user application with
  account isolation, private files, predictable operations, and a $0 v1
  infrastructure target. This is not a migration of any existing service.

## Decision

Use Next.js App Router on Vercel, Neon PostgreSQL, Drizzle migrations, Clerk
for identity, and a private Vercel Blob store. Use Vercel Cron for scheduled
maintenance and local PostgreSQL for integration/RLS tests. Avoid adding a
queue, cache, or product-email provider until a measured requirement justifies
it.

| Capability | Selection | Provider boundary |
|---|---|---|
| Hosting and server functions | Next.js on Vercel | Vercel |
| Relational database | Neon PostgreSQL through Vercel Marketplace | Third-party provider |
| ORM and migrations | Drizzle ORM and Drizzle Kit | Open source |
| Authentication | Clerk Next.js integration | Third-party provider |
| Private file storage | Vercel Blob private store | Vercel |
| Verification and recovery email | Clerk-supported delivery | Provider feature; verify sender and plan |
| Product email | None initially | Consider a provider only for a defined product need |
| Scheduled cleanup | Vercel Cron | Vercel |
| Queue/cache | None initially | Add only for a demonstrated requirement |

No provider is trusted to enforce complete LifeOS authorization alone:

- Clerk supplies identity; the server verifies each protected session.
- PostgreSQL RLS and same-owner foreign keys enforce data isolation.
- Blob access is mediated by authenticated application code and owner-scoped
  metadata.
- Scheduled work uses a dedicated least-privilege maintenance role and a
  bearer secret.

Provider limits to validate before production include database compute and
storage, private Blob storage/operations/transfer, function regions, Cron
schedule precision, Clerk account/email/OAuth features, and total monthly
cost. A private Function-mediated download may consume both Blob and
application transfer. Do not treat Marketplace provisioning as a single
provider's integrated security boundary.

## Consequences

- Database, identity, hosting, and file storage are separate provider
  boundaries; private access and cleanup need explicit integration tests.
- The chosen database driver must pin transactions and support transaction
  local `set_config('app.user_id', value, true)`. Failure of the Stage 0 proof
  blocks protected data storage.
- Provider free-tier quotas, legal terms, email/OAuth behavior, regions, and
  recovery capabilities must be checked against current official terms before
  provisioning. No price or plan limit is assumed by this ADR.
- Keep new provider accounts and data empty. Do not import credentials,
  records, files, or identifiers from another application.

## Alternatives and reconsideration

Reconsider the selection if transaction-local RLS context cannot be proven,
private Blob downloads cannot be authorized end-to-end, required account
deletion/export cannot be implemented, the provider terms are incompatible
with the product, or the approved cost/region requirements cannot be met.

## Stage 0 spike result

Local proof is **PASS**:

- The Stage 0 RLS harness passed 13/13 against local PostgreSQL 17 under
  the three production-style roles, including default-deny, forged identity,
  pooled-connection reuse, rollback, and the account-deletion cascade.
- The Stage 0 vertical slice compiled, booted, protected `/`, and ran each
  query inside one `@neondatabase/serverless` pinned transaction with
  `set_config('app.user_id', $1, true)`.

**Driver selected:** `@neondatabase/serverless` with `drizzle-orm/neon-serverless`.
The node-postgres path remains the comparison baseline.

Provider validation **PASSED** on 2026-10-11 on a throwaway Neon branch and a
Vercel preview:

- The RLS harness passed 13/13 on Neon with node-postgres **and** with
  `USE_NEON_SERVERLESS=1` (the WebSocket pool Vercel functions use).
- The Stage 0 preview derived the account id only from the verified Clerk
  session, and its one protected read/write path was owner-scoped by RLS; two
  Clerk accounts were isolated on the preview.
- No secret is present in the repository or the client bundle.

| Provider fact | Value |
|---|---|
| Neon region | AWS US East 2 (Ohio) — `aws-us-east-2` |
| Vercel function region | `cle1` (Cleveland) |
| Estimated monthly cost | $0 (free tiers) at v1 scale |

## References

- [Vercel backend options research note](../vercel-backend-options.md)
- [Architecture](../architecture.md)
- [Data and security](../data-and-security.md)
- [Vercel Postgres and Marketplace](https://vercel.com/docs/postgres)
- [Neon pricing](https://neon.com/pricing)
- [Vercel Blob pricing and security](https://vercel.com/docs/vercel-blob/usage-and-pricing)
- [Vercel Cron](https://vercel.com/docs/cron-jobs)
- [Clerk Next.js quickstart](https://clerk.com/docs/nextjs/getting-started/quickstart)
- [Drizzle transactions](https://orm.drizzle.team/docs/transactions)
- [PostgreSQL row security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
