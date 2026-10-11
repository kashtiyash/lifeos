# F-4 — Observability, error model, and security headers/CSP

**Stage:** 1
**Blocked by:** F-1
**Blocks:** S-3

## Goal

Install privacy-safe instrumentation and a strict security posture before
feature development, so every later ticket inherits them.

## Scope

- Privacy-safe **request IDs**, a structured error model (typed domain errors →
  HTTP results), and a central logger that never records tokens, file contents,
  private notes, or unnecessary personal data.
- **Security headers + restrictive CSP** configured centrally, starting from
  `default-src 'self'`, adding only the exact Clerk/Blob origins required. Ship
  in **report-only** first; enforce after verifying no breakage.
- **Baseline performance measurement** hooks (server timing, DB query timing) so
  p50/p95 can be read without a profiler.
- Set up Vercel request/function logs + Speed Insights/Analytics. Sentry only if
  needs exceed these; if enabled, source-map token comes from the secret store.

## Deliverables

- Shared `errors`, `logger`, `request-id`, and `security-headers` modules.
- CSP report-only active in preview with a documented enforcement switch.
- Recorded baseline for an empty page (server + DB timing).

## Acceptance

- [ ] No token/content/PII in logs or error responses.
- [ ] CSP report-only shows no violations for Clerk sign-in on preview.
- [ ] Security headers applied to private responses.
- [ ] Request ID correlates a client error to a server log line.

## References

- `docs/architecture.md` (Email, scheduled jobs, observability; security headers)
- `docs/data-and-security.md` (Application security controls)
- `docs/operations.md` (Service objectives)
