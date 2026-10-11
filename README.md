# LifeOS Greenfield Build

**Status:** Proposed blueprint
**Purpose:** Build a new LifeOS application without Supabase. This is a fresh
project, not a migration of the existing application.

## Important boundary

This blueprint describes a clean implementation of LifeOS using a different
backend stack. The new application starts with an empty database, newly
registered accounts, and a new private file store. It does not authorize
migrating or importing any existing users, credentials, sessions, records,
files, or identifiers.

## Recommended stack

| Layer | Proposed choice | Provider status |
|---|---|---|
| Web application and server functions | Next.js App Router on Vercel | Vercel |
| Relational database | PostgreSQL on Neon, provisioned through Vercel Marketplace | Third party |
| Database access and schema migrations | Drizzle ORM and Drizzle Kit | Third party / open source |
| Authentication | Clerk's Next.js integration | Third party |
| Private file storage | Vercel Blob, private store | Vercel |
| Authentication email | Clerk's configured email delivery; verify current plan and sender requirements | Third party/provider feature |
| Product email | None required for initial build; consider Resend only if product email is added | Third party |
| Scheduled maintenance | Vercel Cron Jobs | Vercel |
| CI and repository | GitHub Actions and GitHub | GitHub |
| Unit / integration / browser tests | Vitest, local PostgreSQL, Playwright | Open source |
| Optional monitoring | Vercel Observability / Speed Insights; add Sentry only if needed | Vercel / third party |

Vercel does not provide a single integrated service for database, hosted
authentication, and storage. This design deliberately uses separate providers
and requires explicit authorization between them. See the
[backend-provider decision](./docs/adr/0001-backend-providers.md) and provider
links in the detailed documents below.

## Documents

- [Product specification](./docs/product-spec.md): v1 scope and product/business rules.
- [Architecture](./docs/architecture.md): provider boundaries, request flows, and
  security model.
- [Data and security](./docs/data-and-security.md): schema, ownership, RLS, file
  access, and environment variables.
- [UI guidelines](./docs/ui-guidelines.md): shared visual and accessibility
  expectations.
- [Testing strategy](./docs/testing.md): unit, database/RLS, and browser-test
  coverage.
- [Implementation plan](./docs/implementation-plan.md): ordered build stages,
  validation gates, and operational checklist.
- [Operations](./docs/operations.md): backup, restore, purge, and incident
  procedures.
- [Architecture decisions](./docs/adr/): recorded provider and design choices.
- [Setup checklist](./docs/setup.md): accounts, tools, and provider provisioning.
- [Decisions log](./docs/decisions.md): product and scope decisions and open items.
- [GitHub, skills, and CI setup](./docs/github-and-ci.md): portable
  contribution configuration, branch protection, and activation notes.

## Decision still required before implementation

This is a recommended design, not proof that the selected vendors satisfy a
specific deployment budget or region requirement. Before creating production
resources, confirm the database and Function regions, current free-tier limits,
Clerk email/OAuth configuration, Vercel Blob private-file behavior, total
monthly cost, and applicable privacy obligations. Export and account deletion
must be implemented and tested before public launch. The target product
requirement remains $0 infrastructure spend for v1; if the combined free
tiers cannot meet it, pause and choose an alternative rather than silently
accepting a paid dependency.
