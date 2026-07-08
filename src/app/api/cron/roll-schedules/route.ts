import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

// GET /api/cron/roll-schedules
// Runs daily at midnight via Vercel cron (see vercel.json).
// Ensures every route × every bus has a schedule for the next 7 days at 08:00.
// Uses batch inserts so it completes in seconds even with large fleets.
export async function GET() {
    try {
        // 1. Load all routes and buses
        const [routesRes, busesRes] = await Promise.all([
            supabaseAdmin.from('routes').select('id'),
            supabaseAdmin.from('buses').select('id, total_rows, total_cols'),
        ])

        if (routesRes.error) throw new Error('Routes: ' + routesRes.error.message)
        if (busesRes.error) throw new Error('Buses: ' + busesRes.error.message)

        const routes = routesRes.data ?? []
        const buses = busesRes.data ?? []

        if (!routes.length) return NextResponse.json({ success: true, message: 'No routes.' })
        if (!buses.length) return NextResponse.json({ success: true, message: 'No buses.' })

        // 2. Target dates — today + next 6 days
        const dates: string[] = []
        for (let i = 0; i < 7; i++) {
            const d = new Date()
            d.setDate(d.getDate() + i)
            dates.push(d.toISOString().split('T')[0])
        }

        // 3. Fetch all already-existing schedules for target dates in one query
        const { data: existing, error: existErr } = await supabaseAdmin
            .from('schedules')
            .select('route_id, bus_id, departure_date')
            .in('departure_date', dates)
            .eq('departure_time', '08:00:00')

        if (existErr) throw new Error('Existing lookup: ' + existErr.message)

        const existingSet = new Set(
            (existing ?? []).map(s => `${s.route_id}::${s.bus_id}::${s.departure_date}`)
        )

        // 4. Build list of missing schedules
        const toInsert: object[] = []
        for (const route of routes) {
            for (const bus of buses) {
                for (const date of dates) {
                    if (!existingSet.has(`${route.id}::${bus.id}::${date}`)) {
                        toInsert.push({
                            route_id: route.id,
                            bus_id: bus.id,
                            departure_date: date,
                            departure_time: '08:00:00',
                            arrival_time: '16:00:00',
                            status: 'SCHEDULED',
                        })
                    }
                }
            }
        }

        // 5. Insert missing schedules in batches of 100
        let created = 0
        const BATCH = 100
        for (let i = 0; i < toInsert.length; i += BATCH) {
            const { error } = await supabaseAdmin
                .from('schedules')
                .insert(toInsert.slice(i, i + BATCH))
            if (error) console.error(`[ROLL] Batch ${i} error:`, error.message)
            else created += Math.min(BATCH, toInsert.length - i)
        }

        // 6. The DB trigger generate_seats_for_schedule fires on every INSERT
        //    so seats are already created. We backfill any orphans just in case.
        const { data: allScheds } = await supabaseAdmin
            .from('schedules')
            .select('id, bus_id, buses(total_rows, total_cols)')
            .in('departure_date', dates)

        const { data: existingSeats } = await supabaseAdmin
            .from('seats')
            .select('schedule_id')
            .in('schedule_id', (allScheds ?? []).map(s => s.id))

        const seatedSet = new Set((existingSeats ?? []).map(s => s.schedule_id))
        const busMap = Object.fromEntries(busesRes.data!.map(b => [b.id, b]))
        const seatRows: object[] = []

        for (const sched of allScheds ?? []) {
            if (seatedSet.has(sched.id)) continue
            const bus = busMap[sched.bus_id]
            if (!bus) continue
            const rows = (bus as any).total_rows ?? 13
            const cols = (bus as any).total_cols ?? 4
            for (let r = 1; r <= rows; r++) {
                for (let c = 0; c < cols; c++) {
                    seatRows.push({
                        schedule_id: sched.id,
                        seat_number: `${r}${String.fromCharCode(65 + c)}`,
                        col_index: c,
                        seat_type: c === 0 || c === cols - 1 ? 'WINDOW' : 'AISLE',
                        is_booked: false,
                    })
                }
            }
        }

        let seatsFixed = 0
        for (let i = 0; i < seatRows.length; i += 500) {
            const { error } = await supabaseAdmin
                .from('seats')
                .upsert(seatRows.slice(i, i + 500), {
                    onConflict: 'schedule_id,seat_number',
                    ignoreDuplicates: true,
                })
            if (!error) seatsFixed += Math.min(500, seatRows.length - i)
        }

        return NextResponse.json({
            success: true,
            message: `Rolled schedules for ${dates[0]} → ${dates[dates.length - 1]}.`,
            created_schedules: created,
            seats_backfilled: seatsFixed,
            total_expected: routes.length * buses.length * 7,
        })
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown error'
        console.error('[ROLL SCHEDULES]', msg)
        return NextResponse.json({ success: false, error: msg }, { status: 500 })
    }
}
