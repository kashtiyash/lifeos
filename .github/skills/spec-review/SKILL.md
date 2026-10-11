---
name: spec-review
description: Verify a greenfield LifeOS change against docs/product-spec.md, business rules, and acceptance criteria. Use for feature or PR spec reviews.
---

# Product Specification Review

1. Identify the stated product requirements and affected business rules.
2. Trace each requirement to implementation and a meaningful test.
3. Check timezone/week boundaries, Trash visibility, ownership, and failure
   states where relevant.
4. Label unclear behavior as unspecified and ask for a decision rather than
   inventing behavior.

Report a table of `Requirement | met / partial / missing | evidence | gap`.
