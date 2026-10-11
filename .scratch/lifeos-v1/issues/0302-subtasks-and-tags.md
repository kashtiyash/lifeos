# P-2 — Subtasks and tags

**Stage:** 3 (slice 1)
**Blocked by:** P-1
**Blocks:** —

## Goal

Task structure and cross-cutting labels, with the small but precise rules the
spec calls out.

## Scope

- **Subtasks**: title, completion flag, explicit `position`; reorder. Completing
  every subtask does **not** complete the parent.
- **Tags**: names unique **per account, case-insensitively** (unique active
  `(user_id, lower(name))`). Untagging is an **immediate** delete, never Trash.
- `task_tags` join table with same-owner composite FKs; primary key
  `(user_id, task_id, tag_id)`.
- Tag picker in the task form and tag filtering (feeds P-1 filters).

## Deliverables

- `subtasks`, `tags`, `task_tags` migrations + repositories.
- Subtask list + reorder UI; tag create/assign/remove UI.
- Tests: parent/sibling isolation via composite FKs; case-insensitive tag
  uniqueness; untag removes the link immediately.

## Acceptance

- [ ] Completing all subtasks leaves the parent open.
- [ ] "Work" and "work" are the same tag per account; different across accounts.
- [ ] Untagging leaves no Trash row.
- [ ] Wrong-owner `task_id`/`tag_id` links are rejected.

## References

- `docs/product-spec.md` (Subtasks and tags)
- `docs/data-and-security.md` (subtasks, tags, task_tags)
