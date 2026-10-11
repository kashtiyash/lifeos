/**
 * Drizzle schema entry point.
 *
 * Tables and RLS helpers land in I-4. Keeping a stable, empty module here lets
 * `drizzle-kit` resolve `schema` from the first commit and keeps `db:migrate`
 * a no-op until the first migration exists.
 */
export {};
