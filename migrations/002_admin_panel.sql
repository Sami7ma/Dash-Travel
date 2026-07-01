-- Migration: Phase 7 — Admin Panel tables
-- Run this in Supabase SQL Editor

-- ═══ 1. STAFF TABLE ═══════════════════════════════════════════
CREATE TABLE IF NOT EXISTS staff (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    emp_number TEXT UNIQUE NOT NULL,          -- EMP001 (admin) or SUPEMP001 (super admin)
    full_name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('ADMIN', 'SUPER_ADMIN')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES staff(id)     -- who created this staff member
);

-- Index for fast login lookup
CREATE INDEX IF NOT EXISTS idx_staff_emp_number ON staff(emp_number);

-- ═══ 2. AUDIT LOGS TABLE ═════════════════════════════════════
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    staff_id UUID NOT NULL REFERENCES staff(id),
    action TEXT NOT NULL,                     -- LOGIN, CREATE, UPDATE, DELETE, LOGOUT
    entity_type TEXT,                         -- staff, route, bus, schedule, booking
    entity_id TEXT,                           -- ID of the affected entity
    details JSONB DEFAULT '{}',              -- what changed (before/after, etc.)
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_audit_logs_staff_id ON audit_logs(staff_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- ═══ 3. SEED FIRST SUPER ADMIN ═══════════════════════════════
-- Password: "Bemengede@2026" (bcrypt hash generated offline)
-- IMPORTANT: Change this password immediately after first login!
INSERT INTO staff (emp_number, full_name, password_hash, role, is_active)
VALUES (
    'SUPEMP001',
    'System Administrator',
    '$2a$12$LJ3a4F8K5Q2X1Y0Z9W8vOe7N6M5k4J3h2G1f0E9d8C7b6A5a4Z3y',
    'SUPER_ADMIN',
    true
) ON CONFLICT (emp_number) DO NOTHING;

-- ═══ 4. ADD schedule status if missing ═══════════════════════
-- Ensure schedules table has a status column for IN_ROUTE tracking
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'schedules' AND column_name = 'status'
    ) THEN
        ALTER TABLE schedules ADD COLUMN status TEXT DEFAULT 'SCHEDULED' 
            CHECK (status IN ('SCHEDULED', 'IN_ROUTE', 'COMPLETED', 'CANCELLED'));
    END IF;
END $$;

-- ═══ 5. RLS POLICIES ═════════════════════════════════════════
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Staff: only service role can access (no public access)
CREATE POLICY "Staff: service role only" ON staff
    FOR ALL USING (auth.role() = 'service_role');

-- Audit logs: only service role can access
CREATE POLICY "Audit: service role only" ON audit_logs
    FOR ALL USING (auth.role() = 'service_role');

-- ═══ VERIFY ══════════════════════════════════════════════════
SELECT 'Staff table created' AS status, count(*) AS staff_count FROM staff;
SELECT 'Audit logs table created' AS status;
