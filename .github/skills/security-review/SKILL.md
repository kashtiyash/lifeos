---
name: security-review
description: Review greenfield LifeOS changes for authentication, Clerk session validation, PostgreSQL RLS, ownership, injection, XSS, private Blob access, secrets, and dependencies.
---

# Security Review

- Identity comes from a verified Clerk server session, not request data.
- Every protected operation checks ownership of every referenced ID.
- Runtime database credentials are least privilege; inspect RLS ownership,
  `BYPASSRLS`, policies, transaction-local context, and pool reuse.
- Use parameterized queries; validate input using shared server schemas.
- Sanitize Markdown; user content is otherwise rendered as text.
- Blob files stay private; verify metadata ownership for upload, download,
  replacement, and deletion; enforce limits server-side.
- No secrets in source, browser bundles, tests, logs, fixtures, or CI output.
- Check redirects, webhooks/signatures, dependency exposure, security headers,
  and privacy-safe logging.

Report severity, file/line evidence, exploit preconditions, and a minimal
remediation for each confirmed finding. Cross-account access or secret
exposure is critical.
