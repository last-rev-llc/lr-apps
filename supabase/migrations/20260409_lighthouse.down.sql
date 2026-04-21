-- Reverse 20260409_lighthouse.sql
DROP POLICY IF EXISTS "Authenticated users can read lighthouse runs" ON lighthouse_runs;
DROP POLICY IF EXISTS "Authenticated users can read lighthouse sites" ON lighthouse_sites;
DROP TABLE IF EXISTS lighthouse_runs;
DROP TABLE IF EXISTS lighthouse_sites;
