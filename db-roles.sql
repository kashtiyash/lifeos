-- Run as a trusted database administrator in each environment. Safe to re-run.
-- Set role credentials through the provider's secret manager (or, in CI, with
-- ALTER ROLE ... PASSWORD), never in this file.
-- Per-table grants and RLS policies belong in reviewed migrations.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'lifeos_migrator') THEN
    CREATE ROLE lifeos_migrator
      LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'lifeos_runtime') THEN
    CREATE ROLE lifeos_runtime
      LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'lifeos_maintenance') THEN
    CREATE ROLE lifeos_maintenance
      LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
  END IF;
END
$$;

REVOKE CREATE ON SCHEMA public FROM PUBLIC;
GRANT USAGE, CREATE ON SCHEMA public TO lifeos_migrator;
GRANT USAGE ON SCHEMA public TO lifeos_runtime, lifeos_maintenance;

-- Creating a schema requires CREATE on the *database*, not on the "public"
-- schema alone. drizzle-kit migrate creates the "drizzle" bookkeeping schema,
-- so the migration role needs this. It grants schema creation only; table
-- access, grants and RLS policies still apply per migration. The runtime and
-- maintenance roles never receive CREATE.
DO $$
BEGIN
  EXECUTE format('GRANT CREATE ON DATABASE %I TO lifeos_migrator', current_database());
END
$$;
