CREATE TABLE teensurance.operational_errors(reference text PRIMARY KEY,category text NOT NULL,at text NOT NULL);
ALTER TABLE teensurance.operational_errors ENABLE ROW LEVEL SECURITY;
GRANT SELECT,INSERT ON teensurance.operational_errors TO teensurance_runtime;
CREATE POLICY runtime_errors_read ON teensurance.operational_errors FOR SELECT TO teensurance_runtime USING (true);
CREATE POLICY runtime_errors_insert ON teensurance.operational_errors FOR INSERT TO teensurance_runtime WITH CHECK (true);
REVOKE ALL ON teensurance.operational_errors FROM PUBLIC;
