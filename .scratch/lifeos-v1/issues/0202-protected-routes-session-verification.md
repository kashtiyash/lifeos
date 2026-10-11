# I-2 — Protected routes and server session verification

**Stage:** 2
**Blocked by:** I-1
**Blocks:** I-5

## Goal

Make every protected server operation verify the Clerk session and derive the
account ID **only** from it. Route guards are UX, not the boundary.

## Scope

- A single server helper that resolves and **verifies** the Clerk session and
  returns the opaque Clerk user ID; callers never accept an account ID from a
  request.
- Protect every workspace route and every server-side data operation.
- Redirect unauthenticated users to sign-in; return explicit results for
  unauthenticated server actions (not silent success).
- Establish the pattern later repositories follow: verify → validate input →
  transaction-scoped repository call.

## Deliverables

- `requireSession()`-style server helper used by all protected operations.
- A protected placeholder page that reads the verified ID and nothing else.
- A server action that rejects a caller-supplied account ID.

## Acceptance

- [ ] No protected operation runs without a verified session.
- [ ] Forging a user ID in form/query/client state changes nothing.
- [ ] Direct navigation to a private route redirects when signed out.
- [ ] Server action returns an explicit unauthorized result, not a silent no-op.

## References

- `docs/architecture.md` (Identity, sessions, authorization; request flows)
- `docs/data-and-security.md` (Row-level isolation model, step 1)
- `docs/product-spec.md` (Cross-cutting acceptance)
