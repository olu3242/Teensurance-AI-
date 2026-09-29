-- Apply after 001 using migration owner. No login credential is created here.
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='teensurance_runtime') THEN CREATE ROLE teensurance_runtime NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS; END IF; END $$;
GRANT USAGE ON SCHEMA teensurance TO teensurance_runtime;
GRANT SELECT ON teensurance.schema_version TO teensurance_runtime;
GRANT SELECT,INSERT,UPDATE,DELETE ON teensurance.users,teensurance.sessions,teensurance.records,teensurance.requests,teensurance.rate_limits TO teensurance_runtime;
GRANT SELECT,INSERT ON teensurance.audit,teensurance.ledger TO teensurance_runtime;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA teensurance TO teensurance_runtime;
-- Server-only role. No anonymous/authenticated browser grants. Tenant/resource
-- checks are enforced by domain services; SQL injection with this role is privileged.
CREATE POLICY runtime_users ON teensurance.users TO teensurance_runtime USING(true) WITH CHECK(true);
CREATE POLICY runtime_sessions ON teensurance.sessions TO teensurance_runtime USING(true) WITH CHECK(true);
CREATE POLICY runtime_records ON teensurance.records TO teensurance_runtime USING(true) WITH CHECK(true);
CREATE POLICY runtime_requests ON teensurance.requests TO teensurance_runtime USING(true) WITH CHECK(true);
CREATE POLICY runtime_rate_limits ON teensurance.rate_limits TO teensurance_runtime USING(true) WITH CHECK(true);
CREATE POLICY runtime_audit_read ON teensurance.audit FOR SELECT TO teensurance_runtime USING(true);
CREATE POLICY runtime_audit_append ON teensurance.audit FOR INSERT TO teensurance_runtime WITH CHECK(true);
CREATE POLICY runtime_ledger_read ON teensurance.ledger FOR SELECT TO teensurance_runtime USING(true);
CREATE POLICY runtime_ledger_append ON teensurance.ledger FOR INSERT TO teensurance_runtime WITH CHECK(true);
