---
applyTo: ".github/workflows/**/*.yml"
---
- Pin actions to reviewed major-version tags or immutable SHAs.
- Grant least-privilege workflow/job permissions and disable persisted checkout
  credentials unless a job needs them.
- Pass secrets through GitHub Secrets and environment variables; never echo
  them or use them in pull-request code from untrusted forks.
- Keep required CI checks deterministic; document job names before changing
  branch protection.
- Do not use production database credentials in tests or CI.
