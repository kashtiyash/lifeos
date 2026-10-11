# F-2 — Enable CI workflows and branch ruleset

**Stage:** 1
**Blocked by:** F-1
**Blocks:** — (gate for later tickets)

## Goal

Turn the checked-in `.github/` templates into active, passing checks and
configure branch protection so later tickets land safely.

## Scope

- Activate `.github/workflows/`: CI (lint/typecheck/test), secret scanning
  (Gitleaks), npm audit, dependency review, CodeQL — per `docs/github-and-ci.md`.
- Provision **disposable local PostgreSQL** in CI: bootstrap superuser only
  creates roles; `db:migrate` runs as non-superuser `lifeos_migrator`; tests use
  separate `lifeos_runtime`/`lifeos_maintenance`.
- Keep the **build secret-free**: supply a well-formed, non-functional Clerk test
  publishable key; do not give the build job a Clerk secret key.
- Keep E2E advisory until it can run without exposing provider secrets to fork
  or Dependabot code.
- Open a test PR so every check name appears, then reconcile with
  `.github/rulesets/main-protection.json`; import the ruleset, add the maintainer
  as a pull-request-only bypass actor using their numeric GitHub ID, and verify
  the bypass works.
- Confirm MIT `LICENSE` and `CODEOWNERS` with real handles; enable private
  vulnerability reporting so `SECURITY.md` is true.

## Deliverables

- Green required checks: PR title, lint/typecheck, unit tests, DB/RLS tests,
  build, secret scan.
- Ruleset active with a verified bypass; documented required vs advisory.
- `LICENSE` (MIT), `CODEOWNERS`, `.nvmrc`/`.editorconfig` verified.

## Acceptance

- [ ] A fresh PR runs every workflow; names match the ruleset file.
- [ ] Fork/Dependabot PRs run the required checks with **no** repository secrets.
- [ ] Migrations in CI run as the migration role, never the bootstrap superuser.
- [ ] CodeQL/Dependency Review are advisory unless the license/plan supports them.

## References

- `docs/github-and-ci.md`
- `docs/testing.md` (CI scripts)
- `docs/implementation-plan.md` Stage 1 gate + Required CI commands
