/**
 * Target-size tiers from `docs/ui-guidelines.md`, defined once so feature code
 * never re-invents them. Guidance: 24px hit-area floor, 40px default below
 * 768px, 36px (shadcn default) from 768px, and 44px for frequent one-handed
 * primary actions.
 *
 * Expand the hit area with padding or a pseudo-element instead of enlarging the
 * visual, so icons stay compact but remain easy to tap. Keep at least 8px
 * between adjacent tap targets.
 */
export const targetSizes = {
  /** Dense secondary controls (inline chips, table icons): never below 24x24px. */
  floor: "min-h-6 min-w-6",
  /** Default controls: buttons, inputs, selects, list rows, menu items. */
  default: "h-10 md:h-9",
  /** Default square icon controls. */
  icon: "size-10 md:size-9",
  /** Frequent one-handed primary actions: complete, check-in, quick-add. */
  primary: "h-11",
  /** Square primary icon control (bottom navigation, quick-add). */
  primaryIcon: "size-11",
} as const;

export type TargetSize = keyof typeof targetSizes;
