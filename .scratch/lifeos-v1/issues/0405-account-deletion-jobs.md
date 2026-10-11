# S-5 — Account deletion: durable jobs, cascade, Clerk delete

**Stage:** 4 (plan slice 7)
**Blocked by:** S-3, S-4, I-7
**Blocks:** H-1, H-5

## Goal

Delete an account completely, idempotently, and retryably — revoking access
immediately, cleaning Blob and DB, then removing the Clerk user.

## Scope

- **Request** requires **recent reauthentication**; creates a `deletion_jobs`
  row; immediately marks the account unavailable to normal routes
  (`deletion_state = pending`) and **revokes active Clerk sessions**.
- Explain the **deletion timeline** (including retryable Blob cleanup) before
  confirmation.
- **Copy every Blob path** into `blob_cleanup_queue` **before** the `app_users`
  row is deleted; the cascade must never be the only copy of a path.
- Order: mark pending + revoke sessions → queue paths → delete Blobs → delete
  `app_users` (cascade) → delete Clerk user via Backend API (**404 = success**) →
  mark job `complete`. Every step idempotent; failures visible to operators.
- `deletion_jobs`: **no user FK** so it survives the cascade; states
  `requested`/`blobs_deleted`/`clerk_deleted`/`complete`/`failed`.
- Maintenance role: `SELECT`/`UPDATE` on `deletion_jobs`; `SELECT`/`DELETE` on
  `app_users` only where a matching job is `blobs_deleted`; child rows removed by
  `ON DELETE CASCADE`.
- Provider-initiated deletion (I-7) enqueues the same job; **not** the sole
  trigger.

## Deliverables

- Deletion request UI (recent-auth gate + timeline copy) + job processor
  (invoked by S-3 cron) + Clerk user deletion.
- Tests: immediate access revocation; cascade removes every child row; retry
  after Blob failure converges; "not found" treated as success; idempotent
  rerun.

## Acceptance

- [ ] After requesting deletion, normal routes are inaccessible immediately.
- [ ] Every owned row and Blob object is gone when the job reaches `complete`.
- [ ] A Blob failure leaves the job retryable with no lost paths.
- [ ] Deleting an already-deleted Clerk user succeeds.
- [ ] Webhook and user-initiated paths converge on one idempotent job.

## References

- `docs/architecture.md` (Account export and deletion)
- `docs/data-and-security.md` (deletion_jobs; account deletion order)
- `docs/operations.md` (Scheduled cleanup and deletion)
- `docs/product-spec.md` (Accounts and settings — deletion)
