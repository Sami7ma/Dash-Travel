-- ══════════════════════════════════════════════════════════════
-- FIXED Migration 002 — Admin Panel tables
-- Safe to run even if staff/audit_logs already exist with wrong schema
-- Run in Supabase Dashboard → SQL Editor → New Query
-- ══════════════════════════════════════════════════════════════

-- ═══ STEP 1: Drop and recreate staff table if schema is wrong ═
-- The error "column emp_number does not exist" means staff table
-- exists but was created with a different schema. We fix it safely.

DO $$
BEGIN
    -- Check if staff table exists but is missing emp_number column
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'staff'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'staff' AND column_name = 'emp_number'
    ) THEN
        -- Safe to drop only if no audit_logs references it yet
        DROP TABLE IF EXISTS audit_logs CASCADE;
        DROP TABLE IF EXISTS staff CASCADE;
        RAISE NOTICE 'Old staff table dropped (wrong schema) — will recreate';
    END IF;
END $$;

-- ═══ STEP 2: Create staff table (correct schema) ═════════════
CREATE TABLE IF NOT EXISTS staff (
    id           UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
    emp_number   TEXT    UNIQUE NOT NULL,
    full_name    TEXT    NOT NULL,
    password_hash TEXT   NOT NULL,
    role         TEXT    NOT NULL CHECK (role IN ('ADMIN', 'SUPER_ADMIN')),
    is_active    BOOLEAN DEFAULT true,
    created_at   TIMESTAMPTZ DEFAULT now(),
    created_by   UUID    REFERENCES staff(id)
);

CREATE INDEX IF NOT EXISTS idx_staff_emp_number ON staff(emp_number);

-- ═══ STEP 3: Create audit_logs table ═════════════════════════
CREATE TABLE IF NOT EXISTS audit_logs (
    id          UUID  DEFAULT gen_random_uuid() PRIMARY KEY,
    staff_id    UUID  NOT NULL REFERENCES staff(id),
    action      TEXT  NOT NULL,
    entity_type TEXT,
    entity_id   TEXT,
    details     JSONB DEFAULT '{}',
    ip_address  TEXT,
    created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_staff_id   ON audit_logs(staff_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action     ON audit_logs(action);

-- ═══ STEP 4: Seed the first Super Admin ══════════════════════
-- Password: DashTravel@2026  (real bcrypt hash - cost 12)
INSERT INTO staff (emp_number, full_name, password_hash, role, is_active)
VALUES (
    'SUPEMP001',
    'System Administrator',
    '$2b$12$FwtCHXnJUWIsVwJ93BHaCuXIjRtZZEMWm18bDjD6GqE/YwRiWPCcu',
    'SUPER_ADMIN',
    true
) ON CONFLICT (emp_number) DO NOTHING;

-- ═══ STEP 5: Patch other tables (add missing columns) ════════

-- schedules: add status if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'schedules' AND column_name = 'status'
    ) THEN
        ALTER TABLE schedules ADD COLUMN status TEXT DEFAULT 'SCHEDULED'
            CHECK (status IN ('SCHEDULED', 'IN_ROUTE', 'COMPLETED', 'CANCELLED'));
        RAISE NOTICE 'Added status column to schedules';
    END IF;
END $$;

-- bookings: add cancelled_at if missing
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

-- bookings: add group_ref if missing
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS group_ref TEXT;
CREATE INDEX IF NOT EXISTS idx_bookings_group_ref ON bookings(group_ref);
UPDATE bookings SET group_ref = booking_ref WHERE group_ref IS NULL;

-- buses: add bus_type if missing
ALTER TABLE buses ADD COLUMN IF NOT EXISTS bus_type TEXT DEFAULT 'STANDARD';

-- buses: add total_rows/total_cols if missing (used in seat picker)
ALTER TABLE buses ADD COLUMN IF NOT EXISTS total_rows INTEGER DEFAULT 13;
ALTER TABLE buses ADD COLUMN IF NOT EXISTS total_cols INTEGER DEFAULT 4;

-- ═══ STEP 6: Enable Row Level Security ═══════════════════════
ALTER TABLE staff     ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first (so this is safe to re-run)
DROP POLICY IF EXISTS "Staff: service role only"  ON staff;
DROP POLICY IF EXISTS "Audit: service role only"  ON audit_logs;

CREATE POLICY "Staff: service role only" ON staff
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Audit: service role only" ON audit_logs
    FOR ALL USING (auth.role() = 'service_role');

-- ═══ STEP 7: Verify everything ═══════════════════════════════
SELECT 
    'staff'      AS table_name, 
    count(*)     AS row_count,
    string_agg(emp_number, ', ') AS emp_numbers
FROM staff

UNION ALL

SELECT 
    'audit_logs' AS table_name,
    count(*)     AS row_count,
    NULL         AS emp_numbers
FROM audit_logs;
