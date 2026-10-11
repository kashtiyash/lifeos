# F-1 — Scaffold the Next.js foundation

**Stage:** 1
**Blocked by:** S0-1
**Blocks:** F-2, F-4, I-1

## Goal

Stand up the app skeleton and the package scripts CI expects, keeping the
existing `docs/`, `.github/`, and root config files. No product features yet.

## Scope

- Scaffold Next.js App Router at the repo root (scaffold elsewhere and merge, per
  `docs/setup.md` §7) with **strict TypeScript**, Tailwind, ESLint, `app/`
  directory (no `src/`).
- Install and configure: `@clerk/nextjs`, `drizzle-orm`,
  `@neondatabase/serverless`, `pg`, `zod`; dev: `drizzle-kit`, `vitest`,
  `@playwright/test`. Init shadcn/ui with the tokens in `docs/ui-guidelines.md`.
- Adopt shared conventions: semantic design tokens, Inter via `next/font`,
  light/dark with system default (`next-themes`), Lucide icons.
- Add the `package.json` scripts that are the **command source of truth**:
  `lint`, `typecheck`, `test`, `db:migrate`, `test:integration`, `build`,
  `test:e2e`. Commit `package-lock.json`.
- Add the shared product component **stubs** from the UI guidelines inventory
  (`AppShell`, `PageHeader`, `FormField`, `StatusBadge`, `ListSkeleton`,
  `EmptyState`, `ErrorState`, `ConfirmDialog`, `UndoToast`, `ResponsiveDialog`,
  `QuickAdd`, `DatePicker`) with the target-size tiers set once
  (`h-10 md:h-9`, 24px floor, 44px primary).
- App shell: sidebar ≥768px, bottom navigation <768px, skip link, landmarks,
  `min-h-dvh`, safe-area insets, reduced-motion support.

## Deliverables

- Empty app builds and runs; a placeholder authenticated area renders.
- CI-referenced scripts exist and pass locally.
- `AppShell` responsive layout with light/dark and keyboard navigation.

## Acceptance

- [x] `npm run lint`, `typecheck`, `test`, `build` pass on the empty app.
- [x] No secret in the repo or the client bundle.
- [x] Layout verified at 320/360/768/1440px, no page-level horizontal overflow.
- [x] Design tokens only (no hard-coded palette in feature components).

## References

- `docs/implementation-plan.md` Stage 1
- `docs/ui-guidelines.md`
- `docs/architecture.md` (Runtime and web application)
- `docs/setup.md` §7

## Done (2026-10-11)

Next.js 16.4 App Router at the repo root (no `src/`), strict TypeScript,
Tailwind v4, ESLint, shadcn/ui ("radix-nova") with Inter via `next/font`.

- **Scripts (command source of truth):** `lint`, `typecheck`, `test`,
  `db:migrate`, `test:integration`, `build`, `test:e2e`; `package-lock.json`
  committed. `typecheck` runs `next typegen` first so it works on a fresh clone.
- **Deps:** `@clerk/nextjs`, `drizzle-orm`, `@neondatabase/serverless`, `pg`,
  `zod`; dev `drizzle-kit`, `vitest`, `@playwright/test`.
- **Shell:** `AppShell` (sidebar ≥768px, bottom nav <768px, skip link,
  landmarks, `min-h-dvh`, safe-area insets), light/dark via `next-themes`
  (system default), Lucide icons, `Toaster` (sonner).
- **Product stubs:** `AppShell`, `PageHeader`, `FormField`, `StatusBadge`/
  `PriorityBadge`, `ListSkeleton`, `EmptyState`, `ErrorState`, `ConfirmDialog`,
  `UndoToast`, `ResponsiveDialog`, `QuickAdd`, `DatePicker`. Target-size tiers
  set once in `lib/ui/targets.ts` (24px floor, `h-10 md:h-9`, 44px primary).
- **Routes:** public `/`, protected `(app)` group (`/dashboard` = Today plus
  placeholder Tasks/Projects/Habits/Notes), `/sign-in`, `/sign-up`. The proxy is
  a UX layer only; the protected layout's server `auth()` is the real gate.
- **Data seam:** `lib/db/schema.ts` placeholder + `drizzle/meta/_journal.json`
  so `db:migrate` is a clean no-op until I-4. `db-roles.sql` and CI env names
  unchanged.
- **Verified:** lint, typecheck, unit (5), build and E2E (6, incl. 320/360/768/
  1440px no-overflow checks) all pass locally; `db:migrate` verified against a
  disposable local Postgres 17. No `.env*` or secret is tracked.
