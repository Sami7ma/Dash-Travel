-- ══════════════════════════════════════════════════════════════
-- DIAGNOSTIC QUERY — Run this FIRST in Supabase SQL Editor
-- This shows you every table and every column in your database
-- Share the output so we know exactly what exists
-- ══════════════════════════════════════════════════════════════

SELECT
    t.table_name,
    c.column_name,
    c.data_type,
    c.is_nullable,
    c.column_default
FROM information_schema.tables t
JOIN information_schema.columns c ON c.table_name = t.table_name
WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
ORDER BY t.table_name, c.ordinal_position;
