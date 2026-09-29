-- Corrective migration for a legacy Supabase identity schema, if present.
-- Operational identity is teensurance.*; legacy clients cannot create memberships.
DO $$ BEGIN
 IF to_regclass('public.household_members') IS NOT NULL THEN
  DROP POLICY IF EXISTS members_self_insert ON public.household_members;
  IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN REVOKE INSERT,UPDATE,DELETE ON public.household_members FROM authenticated; END IF;
  IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='anon') THEN REVOKE ALL ON public.household_members FROM anon; END IF;
 END IF;
END $$;
