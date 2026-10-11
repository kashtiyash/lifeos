# H-4 — Accessibility and responsive verification

**Stage:** 5
**Blocked by:** P-8
**Blocks:** —

## Goal

Confirm WCAG 2.1 AA goals, keyboard operability, theme support, and responsive
behaviour across the critical flows.

## Scope

- **axe-core** automated results plus **keyboard and screen-reader spot checks**
  (automation supplements, not replaces).
- Verify at **360×800, 768×1024, 1440×900** and 320px floor, in **light and
  dark** themes, with no page-level horizontal overflow at 320px.
- Check: visible focus, logical headings/landmarks, labelled controls, focus
  return after dialogs/sheets, screen-reader announcements, reduced motion.
- Confirm the **target-size tiers**: 24px floor, 40px default (<768px), 44px
  primary one-handed actions; ≥8px between adjacent targets; 16px mobile inputs.
- Verify data views' loading/empty/error/retry states and that input is preserved
  on recoverable errors.

## Deliverables

- Accessibility report (axe + manual notes) per critical flow.
- Fixes landed with follow-up automation where reasonable.

## Acceptance

- [ ] No critical/serious axe violations on critical routes.
- [ ] Every drag interaction has a keyboard/tap alternative.
- [ ] Both themes and all four widths verified.
- [ ] Focus is visible and returns correctly after sheets/dialogs.

## References

- `docs/ui-guidelines.md` (States, accessibility, target sizes)
- `docs/product-spec.md` (Cross-cutting acceptance — WCAG)
- `docs/testing.md` (Accessibility layer)
