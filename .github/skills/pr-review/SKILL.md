---
name: pr-review
description: Review a greenfield LifeOS pull request against product requirements, engineering standards, PostgreSQL/RLS security, Next.js/UI behavior, tests, CI, and documentation.
---

# Pull Request Review

1. Read the PR description, linked issue, and relevant `docs/` source of truth.
2. Review changed files and trace behavior into tests.
3. For schema/query changes, apply `database-review`.
4. For user-facing behavior, apply `spec-review`, `nextjs-review`, and
   `ui-review` as relevant.
5. Always check authentication, ownership, RLS, private file access, and
   secrets; use `security-review`.
6. Confirm error/loading/empty states, dependency changes, CI evidence, and
   docs.

## Severity

- **BLOCKER:** cross-user data access, secret exposure, data loss, broken
  security boundary, or unrecoverable build failure.
- **HIGH:** incorrect business rule, missing ownership control, or missing
  critical regression test.
- **MEDIUM:** important edge-case, accessibility, or maintainability issue.
- **LOW:** non-blocking clarity/style issue.

## Output

Include verdict, concise summary, severity-rated findings with file/line
evidence, requirement coverage, checks run, and unresolved questions.
