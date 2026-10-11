# S-2 — Attachments: post-upload verification and safe download

**Stage:** 4
**Blocked by:** S-1
**Blocks:** S-4

## Goal

Make objects unavailable until validated, and serve them only through an
authorized route.

## Scope

- **Validate after upload** before making the object available; filename and
  browser MIME are untrusted. Keep new objects unavailable until server-side
  metadata validation completes.
- **Authenticated download route**: resolve the path from **owned metadata**,
  authorize the user, then fetch the private object. Do not expose arbitrary
  Blob reads.
- Response headers: `Content-Disposition: attachment` and
  `X-Content-Type-Options: nosniff`; never inline uploaded HTML/active content.
- Make delete/overwrite authorize against the metadata row and owning parent.
- Note: true content inspection / malware scanning is a **separate, budgeted**
  feature — document the decision rather than silently skipping it.

## Deliverables

- Post-upload verification step + state transition to `available`.
- Download route with ownership check and strict headers.
- Tests: wrong-owner download/delete denied; headers present; an unvalidated
  object is not readable.

## Acceptance

- [ ] A private object cannot be fetched without passing the ownership check.
- [ ] Downloads always send the two required headers.
- [ ] An object pending validation is not downloadable.
- [ ] Wrong-owner upload/download/delete all fail.

## References

- `docs/product-spec.md` (Attachments; download headers)
- `docs/data-and-security.md` (downloads; validate content)
- `docs/architecture.md` (Upload and download flow)
