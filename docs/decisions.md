# Decisions log

Product and scope decisions, newest first. Architecture decisions that need
more explanation live in [`adr/`](./adr/).

## 2026-10-11

| Topic | Decision |
|---|---|
| Audience | Public launch. Keep full RLS isolation, quotas, export/deletion and legal pages. |
| Attachment quota | 25 MB per user, 5 MB per file (reduced from 10 MB so a user can store more than two files). Revisit if provider quotas allow more. |
| Rate limiting | Vercel Firewall rules at the edge (per IP and route); per-account fairness via quota, pending-upload cap and row-count limits. No Redis in v1. Verify rule availability on the plan. |
| Recurring tasks | In v1 scope per [ADR 0002](./adr/0002-recurring-tasks.md): fixed and after-completion repeat; no nth-weekday rules; no subtask or reminder copying. |
| UI kit | shadcn/ui with shared product components; target sizes 24px floor, 40px default, 44px for primary one-handed actions. |

## Still open

- Heartbeat monitor service for the nightly maintenance job.
- Repository visibility and license (affects Dependency Review and CodeQL).
- Whether Vercel Firewall rate limiting and the chosen Blob plan meet the limits above.
