---
applyTo: "app/**/*.{ts,tsx},components/**/*.{ts,tsx},lib/**/*.ts,hooks/**/*.ts"
---
- Use Server Components by default; make client components explicit and small.
- Keep credentials and server-only database/storage modules out of client
  imports.
- Validate external input on the server with shared schemas.
- Keep business rules in pure domain modules and cover them with unit tests.
- Verify Clerk identity and ownership of every referenced record server-side.
- Keep database reads bounded and select only fields required by the view.
- Use the user's timezone for User Day, overdue, and streak calculations.
- Every data view has loading, empty, and error states with a retry path.
- Sanitize Markdown before rendering.
