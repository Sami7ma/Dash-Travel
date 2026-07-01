-- ══════════════════════════════════════════════════════════════
-- Migration 003 — Rolling Schedules & Seed Data
-- Run this in Supabase Dashboard → SQL Editor → New Query
-- ══════════════════════════════════════════════════════════════

-- 1. Ensure at least one bus exists (plate AA-12345, 10 rows, 4 cols = 40 seats)
INSERT INTO buses (plate_number, total_rows, total_cols, bus_type)
VALUES ('AA-12345', 10, 4, 'STANDARD')
ON CONFLICT (plate_number) DO NOTHING;

-- 2. Ensure some additional buses exist for variety
INSERT INTO buses (plate_number, total_rows, total_cols, bus_type)
VALUES 
    ('AA-54321', 12, 4, 'LUXURY'),
    ('OB-98765', 11, 4, 'VIP')
ON CONFLICT (plate_number) DO NOTHING;

-- 3. Run a rolling scheduler block to auto-populate schedules for ALL routes
-- for today, tomorrow, and day after (at 08:00 AM) using ALL buses
DO $$
DECLARE
    r RECORD;
    b RECORD;
    d DATE;
    t TIME := '08:00:00';
BEGIN
    -- Loop through each route
    FOR r IN SELECT id FROM routes LOOP
        -- Loop through each bus
        FOR b IN SELECT id FROM buses LOOP
            -- Loop through the next 3 days: today (0), tomorrow (1), day after (2)
            FOR i IN 0..2 LOOP
                d := current_date + i;

                -- Insert schedule if it doesn't already exist for this combination
                IF NOT EXISTS (
                    SELECT 1 FROM schedules 
                    WHERE route_id = r.id 
                      AND bus_id = b.id 
                      AND departure_date = d 
                      AND departure_time = t
                ) THEN
                    INSERT INTO schedules (route_id, bus_id, departure_date, departure_time, arrival_time, status)
                    VALUES (r.id, b.id, d, t, '16:00:00', 'SCHEDULED');
                END IF;
            END LOOP;
        END LOOP;
    END LOOP;
END $$;

-- 4. Verify created schedules count
SELECT 
    departure_date,
    count(*) AS scheduled_trips_count
FROM schedules
GROUP BY departure_date
ORDER BY departure_date;
