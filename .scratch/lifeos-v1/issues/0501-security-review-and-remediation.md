# H-1 — Security review and remediation

**Stage:** 5
**Blocked by:** S-5, P-8
**Blocks:** —

## Goal

Independent review of the whole attack surface before launch, with fixes landed
and re-tested.

## Scope

Review, at minimum:

- Auth/session handling (Clerk verification, redirects, sign-out).
- RLS, role grants, and same-owner FKs (re-run the I-6 suite as evidence).
- Server actions and mutation endpoints (input validation, ownership checks,
  CSRF/route-protection posture).
- File access (upload tokens, download headers, quota races).
- Markdown rendering (`rehype-sanitize` schema).
- Secret exposure (repo, client bundle, logs) and dependency exposure
  (audit / review / CodeQL where available).
- Rate limits on auth, mutation, upload, and download routes.

## Deliverables

- A written review report (findings, severity, remediation, evidence).
- Fixes landed with regression tests.
- Confirmation that no token/content/PII is logged or bundled.

## Acceptance

- [ ] No high/critical finding open; each has a fix or a documented accepted risk
      with an owner.
- [ ] Isolation suite green **after** remediation.
- [ ] Secret scan and dependency audit clean (no unaccepted high findings).

## References

- `docs/implementation-plan.md` Stage 5
- `docs/data-and-security.md` (Application security controls)
- `docs/operations.md` (Incident response)
- `.github/skills/security-review`
