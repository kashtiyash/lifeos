# LifeOS Greenfield Product Specification

**Status:** Proposed v1 scope for a fresh public multi-user application
**Product rules:** LifeOS v1 domain requirements, rewritten for a clean
non-Supabase implementation.
**Data policy:** Start empty. Existing users, credentials, records, files, and
IDs are not imported.

This document retains LifeOS's product behavior while removing product
requirements tied specifically to Supabase. Authentication and file service
details belong to the [architecture](./architecture.md).

## Product goals

1. Provide an authenticated private workspace for tasks, projects, habits,
   reminders, calendar, notes, attachments, and analytics.
2. Keep each account's records private from every other account.
3. Target $0 infrastructure spend during v1; check current vendor quotas before
   launch and monitor usage.
4. Meet production Core Web Vitals targets: LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.2.
5. Support evergreen browsers and usable layouts from 320px through desktop.

## v1 scope

**In scope:** authentication, profile/settings, account export and deletion,
dashboard, tasks, subtasks, tags, projects, milestones, habits and logs,
reminders, calendar, Markdown notes, private attachments, Trash, and analytics.

**Out of scope:** AI features, external calendar sync, native mobile app,
PWA/Web Push, multi-user collaboration or sharing, recurring calendar events, and custom reminder recurrence rules.

## Product behavior

### Accounts and settings

- Register and log in with email/password; support password reset, logout, and
  required email verification.
- Provide Google sign-in and safe account linking for verified matching email
  addresses, according to the selected Clerk configuration.
- Protect every workspace route and every server-side data operation.
- Store display name (optional), timezone, and week-start preference in the
  application database. Use Clerk's profile image; do not copy avatars into
  Blob storage. Read email from the auth provider.
- Let an authenticated user export their data (documented JSON plus a manifest
  of attachment download links) and request account deletion after reauthentication. Explain the
  deletion timeline, including retryable Blob cleanup, before confirmation.
- Process Clerk deletion webhooks only after signature verification. Make
  deletion idempotent and ensure data access is revoked immediately while
  storage cleanup retries safely.

### Tasks

- Create, edit, complete, reopen, and Trash tasks.
- Fields: title (required), description, status, priority, start date, due
  date, optional project, subtasks, tags, reminders, and attachments.
- Store an explicit fractional-index `position` for task ordering within each status/list and
  for subtask ordering. Use optimistic concurrency (`version`) for edits.
- Status: `TODO`, `IN_PROGRESS`, `BLOCKED`, `COMPLETED`, `CANCELLED`.
- Priority: `LOW`, `MEDIUM`, `HIGH`, `URGENT`.
- Reopening sets `TODO` and clears `completed_at`.
- Views: Inbox, Today, Upcoming, Overdue, Completed, List, and Kanban.
- Inbox contains open tasks with no project and no due date. Today contains
  open tasks due on or before the user's current calendar day; overdue items
  are flagged. Upcoming contains open tasks due after that day. Overdue
  contains open tasks due before that day. Completed contains completed tasks.
- Start date does not determine whether a task appears in Today. Cancelled
  tasks appear in List only when explicitly included.
- List filters include status, priority, project, tag, and due date.
- Kanban columns represent statuses; users can change status without relying
  solely on drag-and-drop.
- Users can reorder tasks within a Kanban status and reorder subtasks.
- Start date cannot be after due date.
- **Recurring tasks** (see [ADR 0002](./adr/0002-recurring-tasks.md)): a task
  with a due date can repeat daily, on weekdays, weekly on chosen days,
  monthly (day of month or last day), or yearly, every N units, either on a
  fixed schedule or counted from the completion date. Only one open instance
  exists per series; completing or skipping it creates the next. Reopening a
  recurring instance is replaced by Undo. Subtasks, attachments and reminders
  are not copied to the next instance in v1. Series can end on a date or after
  a number of occurrences.

### Subtasks and tags

- Subtasks have a title, completion flag, and explicit position.
- Completing every subtask does not complete the parent task.
- Tag names are unique per account, case-insensitively.
- Untagging is immediate; it does not use Trash.

### Projects and milestones

- Projects can be created, edited, archived, restored, and moved to Trash.
- Project statuses: `PLANNED`, `ACTIVE`, `ON_HOLD`, `COMPLETED`, `ARCHIVED`.
- Archiving hides a project from active lists but retains its tasks.
- Project progress is completed tasks divided by non-cancelled tasks; a project
  with no qualifying tasks is 0%.
- Milestones have a name, optional due date, and completion flag. They do not
  affect project progress.
- Deleting a project moves it and its dependent records to Trash after
  confirmation; restore recovers the tree.
- Start date cannot be after due date.

### Habits

- Frequencies: `DAILY`, `WEEKLY`, and `SPECIFIC_DAYS`.
- Weekly habits have a target of 1–7 logs per configured week. `SPECIFIC_DAYS`
  habits have at least one selected weekday and are due only on those days.
- A daily or specific-day habit streak counts consecutive eligible days with
  a log. A weekly habit streak counts consecutive configured weeks meeting its
  target. The current day/week is not considered missed until it ends in the
  user's timezone.
- Habits can be paused and archived. Paused periods (stored as intervals) do
  not count as missed and do not break a streak; logging during a pause is
  allowed and counts. Archived habits no longer appear in active views or
  accrue streaks.
- Changing the account timezone never rewrites stored `log_date` values;
  streaks and "today" are recomputed using the new timezone from that moment.
- There is at most one log per habit/date.
- No future-dated logs. Backfill is allowed from the habit's start date.
- Show history, current/best streak, and weekly/monthly performance.
- Unmarking a log is an immediate toggle, not a Trash operation.

### Reminders and calendar

- Reminders can be standalone or linked to an owned task, habit, project, or
  calendar event, with no more than one linked record. Enforce links through
  nullable same-owner foreign keys and a database check constraint. Support
  dismiss and snooze.
- Reminder recurrence presets are limited to daily, weekly, monthly, and
  weekdays.
- Browser notifications fire only while the app is open. Provide an in-app
  fallback and a Missed list. A reminder is Missed when its time has passed and
  it was neither delivered while the app was open nor dismissed or snoozed. Never request browser notification permission
  on page load.
- Calendar has month, week, and day views and shows tasks by due date, habits
  on scheduled days, reminders, events, and project deadlines.
- Calendar events do not recur in v1.
- All "today", streak, and week calculations use the account's configured
  timezone and week-start preference.

### Notes, files, Trash, and analytics

- Notes contain Markdown and may link to one project. Sanitize Markdown with
  `rehype-sanitize` before rendering.
- Attachments belong to a task or project and are private to their owner.
  Allowed extensions: `png`, `jpg`, `webp`, `gif`, `pdf`, `txt`, `md`, `csv`,
  `docx`, `xlsx`. Maximum 5 MB per file and 25 MB per user. Enforce limits
  server-side and make quota accounting safe under concurrent uploads. Limit
  upload and mutation request rates and return a retryable `429` response.
- Deletion requires UI confirmation and moves the record and its Trash-managed
  cascade tree to Trash for 30 days under one `trash_batch_id`. Trashed records
  are excluded from normal lists, dashboards, streaks, project progress, and
  analytics.
- Restore brings back only records in that delete batch, never records that
  were already in Trash. Use version checks to reject stale concurrent edits.
- The Trash view hides items older than 30 days; a nightly scheduled job
  physically purges them. Cleanup across Postgres and Blob must be retryable
  and idempotent.
- Analytics include task completion, overdue, completion rate, and weekly
  productivity; habit completion/streak/consistency; and project progress and
  deadlines. Completion rate is the number of tasks due in the period that
  were completed by the end of the period divided by the number of tasks due
  in that period. Default range is the last 7 days; productivity charts cover
  8 weeks.
- The dashboard includes today's tasks and completion, active projects,
  today's habits and streaks, upcoming reminders/events, and productivity
  statistics. Every widget includes loading, empty, and error states.

## Cross-cutting acceptance

- Every record and reference is scoped to one authenticated account.
- Export covers every account-owned database record and lists every private
  attachment with an authenticated download link. Deletion removes every
  account-owned record, Blob object and the Clerk user; it must be idempotent
  and safe to retry.
- Every list is bounded/paginated and has loading, empty, error, and retry
  states.
- Validate all external inputs on the server with shared schemas.
- Verify ownership of each referenced ID on the server and enforce same-owner
  relationships in the database.
- Test timezone boundaries, daylight saving time, and configured week starts.
- Meet WCAG 2.1 AA goals, visible focus, keyboard operability, and the
  target-size policy in the UI guidelines (24px floor, 40px default, 44px for
  primary one-handed actions).
- Verify critical flows at 360×800, 768×1024, and 1440×900 in light and dark
  themes.
- Send private downloads with `Content-Disposition: attachment` and
  `X-Content-Type-Options: nosniff`; apply the security headers and CSP defined
  by the architecture.
