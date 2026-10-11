# F-3 — Provision provider resources and secrets

**Stage:** 1
**Blocked by:** — (can run in parallel from the start)
**Blocks:** I-1, I-3, I-4

## Goal

Create the empty, isolated provider resources for dev/preview/production and wire
credentials through secret stores only. Nothing is imported from any prior app.

## Scope

- **Neon:** create dev/preview/production projects (or branches). Pick the region
  to match the Vercel function region. Record pooled vs direct hosts.
- **Clerk:** create **development** and **production** instances. Enable
  email + password, require email verification, enable Google. Keep a separate
  **test** instance for provider-controlled E2E (`CLERK_TEST_*`).
- **Vercel Blob:** create a **private** store per environment. Never a public
  store for LifeOS files.
- **Roles:** run `db-roles.sql` (idempotent) to provision
  `lifeos_migrator`/`lifeos_runtime`/`lifeos_maintenance`; set passwords via the
  provider secret mechanism.
- Write `.env.example` (placeholders only) covering every variable in
  `docs/data-and-security.md`; confirm `.env*` is git-ignored.
- Set all secrets in Vercel env per environment; `vercel env pull` locally.

## Deliverables

- Three Neon databases, two Clerk instances (+ one test), three private Blob
  stores, three DB roles.
- `.env.example` complete; `.env.local` and `.env*` ignored.
- Recorded: Neon region, Vercel region, Blob store mode, estimated monthly cost.

## Acceptance

- [ ] No secret committed; `.env.example` contains placeholders only.
- [ ] Runtime/migration/maintenance credentials are distinct and server-only.
- [ ] Only the Clerk publishable key is eligible for the client bundle.
- [ ] Blob stores are private in every environment.

## References

- `docs/implementation-plan.md` Stage 1
- `docs/data-and-security.md` (Environment variables, Database roles)
- `docs/setup.md` §5, §6, §8
- `docs/adr/0001-backend-providers.md`
