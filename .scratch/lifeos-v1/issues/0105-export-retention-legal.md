# F-5 — Export format, retention policy, and privacy/legal review

**Stage:** 1
**Blocked by:** — (policy work, runs alongside scaffolding)
**Blocks:** S-4 (informs the export contract)

## Goal

Agree the data-handling commitments **before public launch** so the export,
deletion, and Trash tickets implement a fixed contract rather than inventing one.

## Scope

- Define the **versioned export JSON format**: which tables, field names, and the
  shape of the attachment manifest (links, not bytes).
- State the **account-deletion timeline** and user-facing copy: what happens
  immediately (access revoked, sessions cleared) vs retried (Blob cleanup).
- Confirm the **Trash retention window** (30 days) and purge behaviour.
- Complete a **privacy/legal review** appropriate to a public product: privacy
  notice, terms, data-subject request path, and the pending repos-
  visibility/license item.
- Decide the **heartbeat monitor** (Healthchecks.io) and whether Vercel Firewall
  rate-limit rules are available on the plan; record both in `docs/decisions.md`.

## Deliverables

- A short `docs/export-format.md` (or ADR) fixing the JSON contract.
- Updated `docs/decisions.md` open items closed where possible.
- Privacy notice + terms drafted for launch.

## Acceptance

- [ ] Export format is versioned and documented; manifest links are
      authenticated per file.
- [ ] Deletion timeline and copy are approved.
- [ ] Retention window fixed at 30 days.
- [ ] Remaining `docs/decisions.md` open items either closed or explicitly
      deferred with an owner.

## References

- `docs/implementation-plan.md` Stage 1
- `docs/data-and-security.md` (Blob authorization and lifecycle, export)
- `docs/operations.md` (Scheduled cleanup and deletion)
- `docs/decisions.md`
