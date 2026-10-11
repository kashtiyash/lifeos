# UI Guidelines

The UI follows the LifeOS product specification and a clean, minimal
shadcn/ui-neutral visual language.

## Tokens and components

- Use semantic design tokens for backgrounds, text, borders, focus, and
  surfaces; avoid hard-coded palette colors in feature components.
- Keep status, priority, and item-type styles in shared semantic components.
- Use Lucide icons. Pair color with text or an icon; never use color alone.
- Use the shared shadcn/ui component library and avoid one-off interaction
  patterns.
- Default to Inter via `next/font` and use tabular numerals for dates, counts,
  and analytics values.
- Support light and dark themes; default to the system preference.

## Layout and interaction

- Mobile-first; design at 360px and verify 320px, 360x800, 768x1024, and
  1440x900. Avoid page-level horizontal overflow at 320px.
- Use a bottom navigation below 768px and a sidebar at/above 768px.
- Follow the target-size policy below. Drag interactions always have a
  keyboard/tap alternative.
- Use `min-h-dvh`, safe-area insets, visible focus, and reduced-motion
  behavior.
- Inputs have visible labels and inline errors. Destructive actions confirm
  before moving data to Trash; toggle actions remain immediate.

## States and accessibility

- Data views include skeleton/loading, useful empty state, and retryable error.
- Preserve user input on recoverable form errors.
- Keep keyboard operation, logical headings/landmarks, labelled controls,
  focus return, and screen-reader announcements.
- Sanitize Markdown before display.
- Check both themes and automated axe results. Automation supplements, not
  replaces, keyboard and screen-reader spot checks.

## Target sizes

44px is a platform guideline (Apple 44pt, Material 48dp), not a WCAG 2.1 AA
requirement. WCAG 2.2 AA sets a 24x24 CSS px minimum, with spacing exceptions.
LifeOS uses three tiers:

| Tier | Size | Applies to |
|---|---|---|
| Floor | 24x24px hit area, never less | Dense secondary controls (inline chips, table icons on desktop) |
| Default | 40px height below 768px; 36px (shadcn default) from 768px | Buttons, inputs, selects, list rows, menu items |
| Primary | 44px | Frequent one-handed actions: complete checkbox, habit check-in, bottom-nav items, quick-add |

- Expand the hit area instead of enlarging the visual (padding or a
  pseudo-element), so icons stay compact but remain easy to tap.
- Set sizes once in the shared components with responsive classes (for example
  `h-10 md:h-9`), not per feature.
- Keep at least 8px between adjacent tap targets.
- Mobile inputs use font-size 16px or larger so iOS does not zoom on focus.

## Component inventory

Build features from shadcn/ui primitives plus these shared product components.
Do not create one-off equivalents.

| Component | Purpose |
|---|---|
| `AppShell` | Sidebar from 768px, bottom navigation below; skip link and landmarks |
| `PageHeader` | Title, optional description, primary action |
| `FormField` | Label, control, hint, inline error; preserves input on error |
| `StatusBadge`, `PriorityBadge`, `ItemTypeIcon` | Semantic color paired with text or icon |
| `ListSkeleton`, `EmptyState`, `ErrorState` | Loading, empty (with next action), error with retry |
| `ConfirmDialog` | Confirmation before moving data to Trash; a bottom sheet on mobile |
| `UndoToast` | "Moved to Trash" or "Completed" with Undo (sonner) |
| `ResponsiveDialog` | Dialog from 768px, bottom sheet (Drawer) below |
| `QuickAdd` | Capture a task from anywhere in two taps |
| `DatePicker` | Native date input on touch devices; calendar popover on desktop |

Recommended libraries (verify current versions before adding):
react-hook-form with the shared Zod schemas, TanStack Table, dnd-kit,
sonner, cmdk, next-themes, shadcn charts (Recharts), date-fns, and
react-markdown with `rehype-sanitize`. shadcn's Calendar is a date picker only;
the month, week and day calendar views are product components to build.

## Mobile experience

- **Home is Today.** Open on today's tasks, habits and reminders, not a
  generic dashboard.
- **Bottom navigation** has at most five items. Place `QuickAdd` within thumb
  reach, and keep primary actions in the lower half of the screen or in a
  sticky bottom action bar.
- **Sheets over modals.** Use bottom sheets for forms, filters and
  confirmations; keep a visible close control and a drag handle.
- **Swipe actions are optional shortcuts** (complete, move to Trash with Undo)
  and always have a visible button or menu equivalent.
- **Optimistic updates with Undo** for completions and Trash, instead of
  blocking dialogs. Confirmation stays required for moving a project or other
  tree to Trash.
- **Kanban on phones** uses a status switcher (tabs) or snap-scrolling
  columns, with a "Move to…" menu instead of long-press dragging.
- **Calendar on phones** defaults to an agenda list with a compact month strip;
  week and day grids remain available.
- **Forms:** correct `inputmode`, `type` and `autocomplete`; native date and
  time pickers on touch; keep the primary button visible above the keyboard.
- **Performance:** paginate lists, keep first-load JavaScript small, and verify
  INP on a mid-range phone with throttled CPU and network.
- **Resilience:** show an offline or retry state when a mutation fails and keep
  the user's input. Offline editing and push are out of scope for v1.

