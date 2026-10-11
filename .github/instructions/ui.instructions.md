---
applyTo: "app/**/*.{tsx,css},components/**/*.tsx,lib/ui/**/*.ts"
---
- Follow `docs/ui-guidelines.md`.
- Use semantic tokens, Lucide icons, visible labels, and keyboard-operable
  controls; no hard-coded palette values in feature code.
- Design mobile-first; no horizontal overflow at 320px; follow the target-size
  policy in `docs/ui-guidelines.md` (24px floor, 40px default on mobile, 44px for
  primary actions).
- Every data view has skeleton/loading, empty, error, and retry states.
- Confirm destructive actions before moving records to Trash; toggles remain
  immediate.
- Format dates in the user's timezone and support light/dark themes and reduced
  motion.
- Sanitize Markdown before rendering.
