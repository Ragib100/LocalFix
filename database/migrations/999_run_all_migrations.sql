-- LocalFix - Run All Migrations Script (Active Set) - PostgreSQL Version
-- This script lists the correct execution order for active migrations (001–008)

-- Stop immediately if any migration fails, so the completion message is reliable.
\set ON_ERROR_STOP on

\echo '=== Starting LocalFix Database Migration ==='
\echo 'Timestamp: ' `date '+%Y-%m-%d %H:%M:%S'`

-- Note: Run these files in order using psql, or use this as a reference
-- This script serves as documentation of the correct execution order

\echo '=== Step 1: Users Table ==='
\ir 001_create_users_table.sql

\echo '=== Step 2: Locations Table ==='
\ir 002_create_locations_table.sql

\echo '=== Step 3: Issues Table ==='
\ir 003_create_issues_table.sql

\echo '=== Step 4: Applications Table ==='
\ir 004_create_applications_table.sql

\echo '=== Step 5: Issue Proofs Table ==='
\ir 005_create_issue_proofs_table.sql

\echo '=== Step 6: Payments Table ==='
\ir 006_create_payments_table.sql

\echo '=== Step 7: Ratings Table ==='
\ir 007_create_ratings_table.sql

\echo '=== Step 8: Withdrawals Table + Views/Functions ==='
\ir 008_create_withdrawals_table.sql

-- Verification queries to check if everything is set up correctly
\echo '=== Verification: Checking Tables ==='
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN (
    'users','locations','issues','applications','issue_proofs','payments','ratings','withdrawals'
)
ORDER BY tablename;

\echo '=== Verification: Checking Views ==='
SELECT viewname FROM pg_views 
WHERE schemaname = 'public'
  AND viewname IN ('v_issues_with_details','v_worker_payment_summary')
ORDER BY viewname;

\echo '=== Verification: Checking Functions ==='
SELECT proname, prokind FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND proname IN ('set_issue_status_safe','get_issue_count_by_status')
ORDER BY proname;

\echo '=== LocalFix Database Migration Completed ==='
\echo 'Active schema objects (001–008) created successfully.'
