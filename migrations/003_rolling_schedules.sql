-- Migration 003 - Rolling schedules and seed data
-- Run in Supabase Dashboard -> SQL Editor -> New Query
--
-- Safe to rerun. It fills missing cities, routes, buses, schedules, and seats
-- without duplicating records that already exist.

-- 1. Patch columns used by the app.
ALTER TABLE buses ADD COLUMN IF NOT EXISTS bus_type TEXT DEFAULT 'STANDARD';
ALTER TABLE buses ADD COLUMN IF NOT EXISTS total_rows INTEGER DEFAULT 13;
ALTER TABLE buses ADD COLUMN IF NOT EXISTS total_cols INTEGER DEFAULT 4;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'schedules'
          AND column_name = 'status'
    ) THEN
        ALTER TABLE schedules ADD COLUMN status TEXT DEFAULT 'SCHEDULED';
    END IF;
END $$;

-- 2. Ensure the public city list exists.
INSERT INTO cities (name) VALUES
    ('Addis Ababa'),
    ('Dire Dawa'),
    ('Bahir Dar'),
    ('Gondar'),
    ('Mekelle'),
    ('Hawassa'),
    ('Jimma'),
    ('Adama'),
    ('Dessie'),
    ('Debre Markos'),
    ('Jijiga')
ON CONFLICT (name) DO NOTHING;

-- 3. Ensure all default routes exist, both outbound and return legs.
INSERT INTO routes (origin_id, destination_id, distance_km, base_price_etb)
SELECT o.id, d.id, r.dist, r.price
FROM (VALUES
    ('Addis Ababa', 'Adama',         100, 120),
    ('Addis Ababa', 'Hawassa',       275, 280),
    ('Addis Ababa', 'Jimma',         350, 340),
    ('Addis Ababa', 'Debre Markos',  300, 300),
    ('Addis Ababa', 'Dessie',        400, 380),
    ('Addis Ababa', 'Dire Dawa',     452, 430),
    ('Addis Ababa', 'Jijiga',        630, 580),
    ('Addis Ababa', 'Bahir Dar',     550, 500),
    ('Addis Ababa', 'Gondar',        740, 650),
    ('Addis Ababa', 'Mekelle',       780, 700),
    ('Adama',        'Addis Ababa',  100, 120),
    ('Hawassa',      'Addis Ababa',  275, 280),
    ('Jimma',        'Addis Ababa',  350, 340),
    ('Debre Markos', 'Addis Ababa',  300, 300),
    ('Dessie',       'Addis Ababa',  400, 380),
    ('Dire Dawa',    'Addis Ababa',  452, 430),
    ('Jijiga',       'Addis Ababa',  630, 580),
    ('Bahir Dar',    'Addis Ababa',  550, 500),
    ('Gondar',       'Addis Ababa',  740, 650),
    ('Mekelle',      'Addis Ababa',  780, 700),
    ('Bahir Dar',    'Gondar',       180, 180),
    ('Gondar',       'Bahir Dar',    180, 180),
    ('Bahir Dar',    'Debre Markos', 265, 260),
    ('Debre Markos', 'Bahir Dar',    265, 260),
    ('Bahir Dar',    'Mekelle',      600, 550),
    ('Mekelle',      'Bahir Dar',    600, 550),
    ('Dessie',       'Mekelle',      380, 360),
    ('Mekelle',      'Dessie',       380, 360),
    ('Gondar',       'Mekelle',      570, 520),
    ('Mekelle',      'Gondar',       570, 520),
    ('Dessie',       'Gondar',       450, 420),
    ('Gondar',       'Dessie',       450, 420),
    ('Dire Dawa',    'Jijiga',       180, 180),
    ('Jijiga',       'Dire Dawa',    180, 180),
    ('Adama',        'Dire Dawa',    400, 380),
    ('Dire Dawa',    'Adama',        400, 380),
    ('Adama',        'Hawassa',      250, 250),
    ('Hawassa',      'Adama',        250, 250),
    ('Hawassa',      'Jimma',        280, 270),
    ('Jimma',        'Hawassa',      280, 270)
) AS r(origin_name, dest_name, dist, price)
JOIN cities o ON o.name = r.origin_name
JOIN cities d ON d.name = r.dest_name
ON CONFLICT (origin_id, destination_id) DO UPDATE
SET distance_km = EXCLUDED.distance_km,
    base_price_etb = EXCLUDED.base_price_etb;

-- 4. Ensure a starter fleet exists. The rolling job schedules every bus in
-- the buses table, including buses you add later from the admin panel.
INSERT INTO buses (plate_number, total_rows, total_cols, bus_type)
VALUES
    ('AA-12345', 10, 4, 'STANDARD'),
    ('AA-54321', 12, 4, 'LUXURY'),
    ('OB-98765', 11, 4, 'VIP')
ON CONFLICT (plate_number) DO UPDATE
SET total_rows = COALESCE(buses.total_rows, EXCLUDED.total_rows),
    total_cols = COALESCE(buses.total_cols, EXCLUDED.total_cols),
    bus_type = COALESCE(buses.bus_type, EXCLUDED.bus_type);

-- 5. Generate seats automatically whenever a schedule is created.
CREATE OR REPLACE FUNCTION generate_seats_for_schedule()
RETURNS TRIGGER AS $$
DECLARE
    bus_rows INTEGER;
    bus_cols INTEGER;
    row_num INTEGER;
    col_num INTEGER;
    seat_label TEXT;
    seat_type_value TEXT;
BEGIN
    SELECT COALESCE(total_rows, 13), COALESCE(total_cols, 4)
    INTO bus_rows, bus_cols
    FROM buses
    WHERE id = NEW.bus_id;

    IF bus_rows IS NULL OR bus_cols IS NULL THEN
        RETURN NEW;
    END IF;

    FOR row_num IN 1..bus_rows LOOP
        FOR col_num IN 0..(bus_cols - 1) LOOP
            seat_label := row_num::TEXT || chr(65 + col_num);
            seat_type_value := CASE
                WHEN col_num = 0 OR col_num = bus_cols - 1 THEN 'WINDOW'
                ELSE 'AISLE'
            END;

            INSERT INTO seats (schedule_id, seat_number, col_index, seat_type, is_booked)
            VALUES (NEW.id, seat_label, col_num, seat_type_value, false)
            ON CONFLICT (schedule_id, seat_number) DO NOTHING;
        END LOOP;
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_generate_seats ON schedules;
CREATE TRIGGER trigger_generate_seats
AFTER INSERT ON schedules
FOR EACH ROW
EXECUTE FUNCTION generate_seats_for_schedule();

-- 6. Create schedules for every route x every bus for today and the next 2 days.
DO $$
DECLARE
    route_row RECORD;
    bus_row RECORD;
    day_offset INTEGER;
    schedule_date DATE;
    departure TIME := '08:00:00';
    arrival TIME := '16:00:00';
BEGIN
    FOR route_row IN SELECT id FROM routes LOOP
        FOR bus_row IN SELECT id FROM buses LOOP
            FOR day_offset IN 0..2 LOOP
                schedule_date := current_date + day_offset;

                IF NOT EXISTS (
                    SELECT 1
                    FROM schedules
                    WHERE route_id = route_row.id
                      AND bus_id = bus_row.id
                      AND departure_date = schedule_date
                      AND departure_time = departure
                ) THEN
                    INSERT INTO schedules (
                        route_id,
                        bus_id,
                        departure_date,
                        departure_time,
                        arrival_time,
                        status
                    )
                    VALUES (
                        route_row.id,
                        bus_row.id,
                        schedule_date,
                        departure,
                        arrival,
                        'SCHEDULED'
                    );
                END IF;
            END LOOP;
        END LOOP;
    END LOOP;
END $$;

-- 7. Backfill seats for any existing schedules that were created before the
-- trigger existed or while an older seed script was partially failing.
INSERT INTO seats (schedule_id, seat_number, col_index, seat_type, is_booked)
SELECT
    s.id,
    row_num::TEXT || chr(65 + col_num),
    col_num,
    CASE
        WHEN col_num = 0 OR col_num = COALESCE(b.total_cols, 4) - 1 THEN 'WINDOW'
        ELSE 'AISLE'
    END,
    false
FROM schedules s
JOIN buses b ON b.id = s.bus_id
CROSS JOIN LATERAL generate_series(1, COALESCE(b.total_rows, 13)) AS row_num
CROSS JOIN LATERAL generate_series(0, COALESCE(b.total_cols, 4) - 1) AS col_num
ON CONFLICT (schedule_id, seat_number) DO NOTHING;

-- 8. Verify the next 3 days are fully populated.
WITH next_days AS (
    SELECT current_date + day_offset AS departure_date
    FROM generate_series(0, 2) AS day_offset
),
expected AS (
    SELECT (SELECT count(*) FROM routes) * (SELECT count(*) FROM buses) AS trips_per_day
)
SELECT
    nd.departure_date,
    expected.trips_per_day AS expected_trips,
    count(s.id) AS actual_trips
FROM next_days nd
CROSS JOIN expected
LEFT JOIN schedules s ON s.departure_date = nd.departure_date
GROUP BY nd.departure_date, expected.trips_per_day
ORDER BY nd.departure_date;

SELECT
    count(*) AS schedules_missing_seats
FROM schedules s
JOIN buses b ON b.id = s.bus_id
LEFT JOIN seats st ON st.schedule_id = s.id
WHERE s.departure_date BETWEEN current_date AND current_date + 2
GROUP BY s.id, b.total_rows, b.total_cols
HAVING count(st.id) < COALESCE(b.total_rows, 13) * COALESCE(b.total_cols, 4);
