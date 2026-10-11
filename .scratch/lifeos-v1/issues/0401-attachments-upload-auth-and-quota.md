# S-1 — Attachments: upload authorization, quota, metadata

**Stage:** 4 (plan slice 6)
**Blocked by:** P-3
**Blocks:** S-2

## Goal

Let a user attach private files to a task or project, with server-side quota and
ownership enforced **before** any byte is uploaded.

## Scope

- `attachments`: exactly one task/project owner (same-owner FKs), opaque Blob
  path, display name, detected media type, size, upload state, version, Trash
  fields; unique Blob path.
- **Server-issued, narrowly scoped upload token**: authenticate → verify owning
  task/project → check remaining quota, allowed size/type → issue a constrained
  token for the exact path; minimize its exposure lifetime.
- **Quota**: allowlist (`png,jpg,webp,gif,pdf,txt,md,csv,docx,xlsx`), ≤5 MB per
  file, ≤25 MB per user. **Reserve quota transactionally** before issuing the
  token; make accounting safe under concurrent uploads; cap pending uploads per
  account.
- Opaque server-generated paths, e.g.
  `users/{clerk-user-id}/attachments/{random-id}`; no user-supplied paths as
  authorization.
- Lifecycle states (pending/available/delete_pending/failed); DB and Blob do not
  share a transaction — use an outbox/`blob_cleanup_queue` for failures.
- Upload UI on task/project detail with progress and error/retry states.

## Deliverables

- `attachments` migration + repository + upload-authorization route.
- Private Blob client upload wired to the constrained token.
- Tests: wrong-owner parent rejected; oversize/unsupported rejected; concurrent
  quota attempts cannot exceed the cap; abandoned upload is reconciled.

## Acceptance

- [ ] No upload token is issued without a verified session and owned parent.
- [ ] Concurrent uploads cannot exceed the 25 MB per-user cap.
- [ ] Disallowed types/sizes are rejected server-side, not just in the UI.
- [ ] Failed/abandoned uploads leave no orphan metadata and are queued for
      cleanup.

## References

- `docs/product-spec.md` (Attachments)
- `docs/data-and-security.md` (Blob authorization and lifecycle)
- `docs/architecture.md` (Private files)
