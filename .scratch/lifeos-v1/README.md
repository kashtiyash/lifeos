# LifeOS v1 — spec tickets

Local ticket tracker for the LifeOS v1 build. One file per ticket under
`issues/`, worked **blockers-first by hand**. Each ticket is a self-contained
tracer bullet: it declares what it is blocked by, and it can be implemented in a
fresh context without re-reading the others.

Source documents (source of truth):

- [`docs/product-spec.md`](../../docs/product-spec.md) — product behaviour
- [`docs/architecture.md`](../../docs/architecture.md) — system design
- [`docs/data-and-security.md`](../../docs/data-and-security.md) — DB & RLS contract
- [`docs/ui-guidelines.md`](../../docs/ui-guidelines.md) — UI conventions
- [`docs/testing.md`](../../docs/testing.md) — test layers & required coverage
- [`docs/implementation-plan.md`](../../docs/implementation-plan.md) — stage sequence
- [`docs/adr/0001-backend-providers.md`](../../docs/adr/0001-backend-providers.md)
- [`docs/adr/0002-recurring-tasks.md`](../../docs/adr/0002-recurring-tasks.md)
- [`docs/decisions.md`](../../docs/decisions.md) — decided scope
- [`docs/operations.md`](../../docs/operations.md) — runbook & budgets
- [`docs/github-and-ci.md`](../../docs/github-and-ci.md) — CI & rulesets

## Resolved open questions (this planning round)

| Question | Decision |
|---|---|
| Drizzle/Neon driver for the Stage 0 proof | `@neondatabase/serverless` + `drizzle-orm/neon-serverless` (pooled, WebSocket). **Validated** in the spike against `pg` (local + Neon + preview). |
| Google OAuth in v1 | **In scope** (Clerk native) |
| Repository license | **MIT** |
| Heartbeat monitor | **Healthchecks.io** (`HEARTBEAT_URL`) |
| Stage 0 shape | **Separate spike branch/PR first**, before the Stage 1 scaffold |

## How to work a ticket

1. Pick a ticket whose **Blocked by** list is fully done.
2. Read only that ticket plus the source docs it links.
3. Build it test-first (`/tdd`); keep domain rules pure; verify isolation.
4. Close it out with `/code-review` (Standards + Spec).
5. Tick it off below and unblock its dependents.

## Board

Legend: ☐ todo · ◐ in progress · ☑ done · ⊘ blocked

### Stage 0 — time-boxed architecture spike (separate branch)

| ID | Ticket | Blocked by | Status |
|---|---|---|---|
| [S0-1](issues/0001-rls-spike-complete-and-record.md) | Complete and record the RLS/spike proof | — | ☑ passed (local + Neon both drivers + preview) |

### Stage 1 — independent project foundation

| ID | Ticket | Blocked by | Status |
|---|---|---|---|
| [F-1](issues/0101-scaffold-nextjs-foundation.md) | Scaffold Next.js foundation | S0-1 | ☑ done |
| [F-2](issues/0102-ci-workflows-and-rulesets.md) | Enable CI workflows and rulesets | F-1 | ☑ done |
| [F-3](issues/0103-provision-provider-resources.md) | Provision provider resources and secrets | — | ☐ |
| [F-4](issues/0104-observability-and-security-headers.md) | Observability, error model, security headers/CSP | F-1 | ☐ |
| [F-5](issues/0105-export-retention-legal.md) | Export format, retention, privacy/legal review | — | ☐ |

### Stage 2 — identity, schema, isolation (before product features)

| ID | Ticket | Blocked by | Status |
|---|---|---|---|
| [I-1](issues/0201-clerk-auth-flows.md) | Clerk auth flows (email, Google, reset, verify) | F-1, F-3 | ☐ |
| [I-2](issues/0202-protected-routes-session-verification.md) | Protected routes and server session verification | I-1 | ☐ |
| [I-3](issues/0203-app-users-provisioning-and-rls.md) | `app_users` provisioning + insert policy | F-3 | ☐ |
| [I-4](issues/0204-drizzle-schema-migrations-and-roles.md) | Drizzle schema, migrations, roles, RLS helpers | F-3 | ☐ |
| [I-5](issues/0205-repository-transaction-context.md) | Repository layer with transaction-local context | I-2, I-4 | ☐ |
| [I-6](issues/0206-isolation-test-suite.md) | Cross-user / forged / reuse isolation suite | I-5 | ☐ |
| [I-7](issues/0207-clerk-webhook-verify-enqueue.md) | Clerk webhook verify + enqueue | I-4, I-6 | ☐ |

### Stage 3 — core product, one vertical slice at a time

| ID | Ticket | Blocked by | Status |
|---|---|---|---|
| [P-1](issues/0301-tasks-crud-views-filters.md) | Tasks: CRUD, views, filters, reorder | I-5, I-6 | ☐ |
| [P-2](issues/0302-subtasks-and-tags.md) | Subtasks and tags | P-1 | ☐ |
| [P-3](issues/0303-projects-milestones-trash.md) | Projects, milestones, batch Trash | P-1 | ☐ |
| [P-4](issues/0304-recurring-tasks.md) | Recurring tasks (ADR 0002) | P-3 | ☐ |
| [P-5](issues/0305-habits-logs-streaks.md) | Habits, logs, pause/archive, streaks | I-6 | ☐ |
| [P-6](issues/0306-reminders-and-calendar.md) | Reminders and calendar | P-1, P-5 | ☐ |
| [P-7](issues/0307-notes-markdown-sanitize.md) | Notes with sanitized Markdown | P-3 | ☐ |
| [P-8](issues/0308-dashboard-and-analytics.md) | Dashboard and analytics | P-1, P-3, P-5, P-6 | ☐ |

### Stage 4 — files, scheduled maintenance, account lifecycle

| ID | Ticket | Blocked by | Status |
|---|---|---|---|
| [S-1](issues/0401-attachments-upload-auth-and-quota.md) | Attachments: upload auth, quota, metadata | P-3 | ☐ |
| [S-2](issues/0402-attachments-verification-and-download.md) | Attachments: post-upload verify, safe download | S-1 | ☐ |
| [S-3](issues/0403-trash-purge-cron-and-heartbeat.md) | Trash purge cron + heartbeat | P-3, F-4 | ☐ |
| [S-4](issues/0404-account-export.md) | Account export (JSON + manifest) | S-2, P-7 | ☐ |
| [S-5](issues/0405-account-deletion-jobs.md) | Account deletion jobs + cascade + Clerk delete | S-3, S-4, I-7 | ☐ |

### Stage 5 — reliability, privacy, performance

| ID | Ticket | Blocked by | Status |
|---|---|---|---|
| [H-1](issues/0501-security-review-and-remediation.md) | Security review and remediation | S-5, P-8 | ☐ |
| [H-2](issues/0502-clean-db-migration-and-integration-tests.md) | Clean-DB migration + integration tests | I-6 | ☐ |
| [H-3](issues/0503-performance-budgets-and-cwv.md) | Performance budgets and Core Web Vitals | P-8 | ☐ |
| [H-4](issues/0504-accessibility-and-responsive-verification.md) | Accessibility and responsive verification | P-8 | ☐ |
| [H-5](issues/0505-operations-backup-and-cost-readiness.md) | Operations, backup, cost readiness | S-5 | ☐ |

## Mapping to `implementation-plan.md`

| Plan stage | Tickets |
|---|---|
| Stage 0 — spike | S0-1 |
| Stage 1 — foundation | F-1 … F-5 |
| Stage 2 — identity/schema/isolation | I-1 … I-7 |
| Stage 3 — product slices 1–5, 8 | P-1 … P-8 (attachments = plan slice 6 → S-1/S-2; export/deletion = plan slice 7 → S-4/S-5) |
| Stage 4 — file storage & scheduled maintenance | S-1 … S-5 |
| Stage 5 — reliability/privacy/performance | H-1 … H-5 |

## Critical path

```text
S0-1 → F-1 → F-3 → I-1 → I-2 → I-5 → I-6 → P-1 → P-3 → P-4
                                                   → S-1 → S-2 → S-4 → S-5 → H-1
                               P-5 → P-6 → P-8 ─────┘        H-3, H-4
```

The longest chain runs through the isolation proof (I-6): nothing user-facing
starts until cross-user isolation is green. Attachments and account
export/deletion (Stage 4) are the second half of the critical path because they
gate release hardening.
