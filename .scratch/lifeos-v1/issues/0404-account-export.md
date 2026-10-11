# S-4 — Account export

**Stage:** 4 (plan slice 7)
**Blocked by:** S-2, P-7, F-5
**Blocks:** S-5

## Goal

Let a user export every account-owned record plus a manifest of their private
attachments, streamed under their own RLS context.

## Scope

- **Versioned JSON** export (format fixed by F-5), streamed **table by table**
  from an authenticated request under the user's RLS context.
- Include a **manifest of attachments** with authenticated per-file download
  links. **Do not bundle file bytes** (a zip cannot be built reliably in a
  serverless request); note "download everything" as a later, separate job.
- Cover **every** account-owned database record.
- Rate-limit the export route; it is heavy.

## Deliverables

- `/api/account/export` streaming route + versioned schema.
- Manifest with authenticated download links.
- Tests: export includes all owned tables; contains nothing from another account;
  links require the owner's session.

## Acceptance

- [ ] Export completeness verified against a seeded account.
- [ ] No other account's data appears in the export.
- [ ] Manifest links are authenticated and owner-scoped.
- [ ] Export streams without buffering the whole dataset in memory.

## References

- `docs/data-and-security.md` (export; Blob lifecycle)
- `docs/architecture.md` (Account export and deletion)
- `docs/product-spec.md` (Cross-cutting acceptance)
