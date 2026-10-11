# I-7 — Clerk webhook: verify signature and enqueue

**Stage:** 2
**Blocked by:** I-4, I-6
**Blocks:** S-5

## Goal

Accept provider-initiated events safely. A webhook is **not** an authenticated
session and must not run as the runtime role with forged/absent account context.

## Scope

- Verify the Clerk/Svix **signature** before accepting any event; reject
  invalid signatures.
- Use the **maintenance role** in the handler to insert only into
  `webhook_events` (PK = `svix-id`) and `deletion_jobs`. Store no payloads.
- **Deduplicate** on the event ID so replays are ignored.
- Do **not** rely on webhook delivery as the sole deletion trigger (S-5 covers
  the user-initiated path).

## Deliverables

- `/api/webhooks/clerk` route with signature verification + idempotent enqueue.
- `webhook_events` and `deletion_jobs` tables with maintenance-role insert
  grants and restrictive policies.
- Tests: invalid signature rejected; replay ignored; handler cannot read user
  rows.

## Acceptance

- [ ] Unsigned/incorrectly-signed requests are rejected with no side effects.
- [ ] A replayed event ID inserts nothing new.
- [ ] The handler can insert into the two queue tables only.
- [ ] No webhook payload is persisted.

## References

- `docs/architecture.md` (webhooks; account deletion section)
- `docs/data-and-security.md` (webhook_events; maintenance grants)
- `docs/testing.md` (webhook processing rejects invalid signatures)
