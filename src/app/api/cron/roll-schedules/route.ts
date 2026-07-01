import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

// GET /api/cron/roll-schedules
// Auto-populates schedules for the next 3 days (today, tomorrow, day after)
// for ALL registered routes using ALL active buses at 08:00 AM daily.
// This ensures that the system always has active schedules for booking.
export async function GET() {
    try {
        // 1. Fetch all routes
        const { data: routes, error: routesErr } = await supabaseAdmin
            .from('routes')
            .select('id, origin_id, destination_id')
        if (routesErr) throw new Error('Routes fetch failed: ' + routesErr.message)

        // 2. Fetch all buses
        const { data: buses, error: busesErr } = await supabaseAdmin
            .from('buses')
            .select('id, plate_number, total_rows, total_cols')
        if (busesErr) throw new Error('Buses fetch failed: ' + busesErr.message)

        if (!routes || routes.length === 0) {
            return NextResponse.json({ success: true, message: 'No routes found to schedule.' })
        }
        if (!buses || buses.length === 0) {
            return NextResponse.json({ success: true, message: 'No buses found to schedule.' })
        }

        // 3. Define the next 3 days
        const dates: string[] = []
        for (let i = 0; i < 3; i++) {
            const d = new Date()
            d.setDate(d.getDate() + i)
            dates.push(d.toISOString().split('T')[0])
        }

        let createdCount = 0
        const colLabels = ['A', 'B', 'C', 'D']

        // 4. For each route, each bus, and each date: insert schedule + seats if it doesn't exist
        for (const route of routes) {
            // Assign buses to routes sequentially to distribute fleet evenly
            for (let bIndex = 0; bIndex < buses.length; bIndex++) {
                const bus = buses[bIndex]

                for (const date of dates) {
                    // Check if schedule already exists for this route, bus, date, and time (08:00 AM)
                    const { data: existing } = await supabaseAdmin
                        .from('schedules')
                        .select('id')
                        .eq('route_id', route.id)
                        .eq('bus_id', bus.id)
                        .eq('departure_date', date)
                        .eq('departure_time', '08:00:00')
                        .maybeSingle()

                    if (!existing) {
                        // Create schedule
                        const { data: schedule, error: insertErr } = await supabaseAdmin
                            .from('schedules')
                            .insert({
                                route_id: route.id,
                                bus_id: bus.id,
                                departure_date: date,
                                departure_time: '08:00:00',
                                arrival_time: '16:00:00',
                                status: 'SCHEDULED'
                            })
                            .select()
                            .single()

                        if (insertErr) {
                            console.error(`Failed to create schedule for route ${route.id}: ${insertErr.message}`)
                            continue
                        }

                        // Create seats
                        const totalRows = bus.total_rows || 13
                        const totalCols = bus.total_cols || 4
                        const seats = []

                        for (let r = 1; r <= totalRows; r++) {
                            for (let c = 0; c < totalCols; c++) {
                                seats.push({
                                    schedule_id: schedule.id,
                                    seat_number: `${r}${colLabels[c]}`,
                                    col_index: c,
                                    seat_type: (c === 0 || c === totalCols - 1) ? 'WINDOW' : 'AISLE',
                                    is_booked: false,
                                })
                            }
                        }

                        await supabaseAdmin.from('seats').insert(seats)
                        createdCount++
                    }
                }
            }
        }

        return NextResponse.json({
            success: true,
            message: `Schedules rolled successfully. Created ${createdCount} new schedule departures and matching seats.`
        })
    } catch (err: any) {
        console.error('[ROLL SCHEDULES ERROR]', err.message)
        return NextResponse.json({ success: false, error: err.message }, { status: 500 })
    }
}
