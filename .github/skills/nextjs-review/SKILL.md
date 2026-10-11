---
name: nextjs-review
description: Review greenfield LifeOS Next.js, TypeScript, and React changes for server/client boundaries, auth, data access, performance, timezone behavior, accessibility, and error states.
---

# Next.js Review

- Prefer Server Components for initial user data; avoid duplicate client
  fetching after server rendering.
- Keep server secrets and database/storage access out of client bundles.
- Verify session and record ownership in every protected server operation.
- Validate requests server-side and test business rules outside components.
- Bound lists, select only necessary columns, and inspect rendering cost.
- Use configured User Day for today, overdue, and streak behavior.
- Include loading, empty, and retryable error states.
- Confirm focus, labels, keyboard use, mobile layouts, and reduced-motion
  behavior.

Report concrete findings with file/line evidence and severity.
