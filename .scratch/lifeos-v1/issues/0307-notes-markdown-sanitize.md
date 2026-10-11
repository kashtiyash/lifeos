# P-7 — Notes with sanitized Markdown

**Stage:** 3 (slice 5)
**Blocked by:** P-3
**Blocks:** S-4

## Goal

Project-linked Markdown notes rendered safely.

## Scope

- `notes`: title, Markdown body, optional same-owner project ID, standard
  version/Trash fields.
- **Sanitize Markdown with `rehype-sanitize`** and an explicit schema before
  rendering; raw HTML is **not** permitted by default.
- Note create/edit/delete; delete goes through Trash (batch-scoped).
- Editor with live preview; loading/empty/error states.

## Deliverables

- `notes` migration + repository; sanitized Markdown renderer component.
- Note editor/detail linked to one project.
- Tests: XSS payloads are stripped; a note cannot reference another account's
  project.

## Acceptance

- [ ] `<script>`, event-handler attributes, and `javascript:` URLs never execute.
- [ ] Wrong-owner project reference is rejected.
- [ ] Deleted note returns on batch restore.

## References

- `docs/product-spec.md` (Notes)
- `docs/data-and-security.md` (notes; sanitize before rendering)
- `docs/ui-guidelines.md` (Sanitize Markdown before display)
