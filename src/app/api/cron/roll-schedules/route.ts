import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

type RouteRow = {
    id: string
}

type BusRow = {
    id: string
    plate_number: string
    total_rows: number | null
    total_cols: number | null
}

function formatDate(date: Date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

function getSeatColumnLabel(index: number) {
    let label = ''
    let value = index

    do {
        label = String.fromCharCode(65 + (value % 26)) + label
        value = Math.floor(value / 26) - 1
    } while (value >= 0)

    return label
}

async function ensureSeats(scheduleId: string, bus: BusRow) {
    const totalRows = bus.total_rows || 13
    const totalCols = bus.total_cols || 4
    const seats = []

    for (let row = 1; row <= totalRows; row++) {
        for (let col = 0; col < totalCols; col++) {
            seats.push({
                schedule_id: scheduleId,
                seat_number: `${row}${getSeatColumnLabel(col)}`,
                col_index: col,
                seat_type: col === 0 || col === totalCols - 1 ? 'WINDOW' : 'AISLE',
                is_booked: false,
            })
        }
    }

    if (seats.length === 0) return

    const { error } = await supabaseAdmin
        .from('seats')
        .upsert(seats, {
            onConflict: 'schedule_id,seat_number',
            ignoreDuplicates: true,
        })

    if (error) {
        throw new Error(`Seat backfill failed for schedule ${scheduleId}: ${error.message}`)
    }
}

// GET /api/cron/roll-schedules
// Auto-populates schedules for the next 3 days (today, tomorrow, day after)
// for all registered routes using all buses at 08:00 AM daily.
// This ensures that the system always has active schedules for booking.
export async function GET() {
    try {
        // 1. Fetch all routes
        const { data: routes, error: routesErr } = await supabaseAdmin
            .from('routes')
            .select('id')
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
            dates.push(formatDate(d))
        }

        let createdCount = 0
        let repairedCount = 0

        // 4. For each route, bus, and date: insert missing schedule and ensure seats exist.
        for (const route of routes as RouteRow[]) {
            for (const bus of buses as BusRow[]) {
                for (const date of dates) {
                    // Check if schedule already exists for this route, bus, date, and time (08:00 AM)
                    const { data: existingSchedules, error: existingErr } = await supabaseAdmin
                        .from('schedules')
                        .select('id')
                        .eq('route_id', route.id)
                        .eq('bus_id', bus.id)
                        .eq('departure_date', date)
                        .eq('departure_time', '08:00:00')
                        .limit(1)

                    if (existingErr) {
                        throw new Error(`Schedule lookup failed for route ${route.id}, bus ${bus.id}: ${existingErr.message}`)
                    }

                    let scheduleId = existingSchedules?.[0]?.id

                    if (!scheduleId) {
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
                            throw new Error(`Failed to create schedule for route ${route.id}, bus ${bus.id}: ${insertErr.message}`)
                        }

                        scheduleId = schedule.id
                        createdCount++
                    } else {
                        repairedCount++
                    }

                    await ensureSeats(scheduleId, bus)
                }
            }
        }

        return NextResponse.json({
            success: true,
            message: `Schedules rolled successfully. Created ${createdCount} new departures and ensured seats for ${createdCount + repairedCount} departures.`,
            created: createdCount,
            checked: createdCount + repairedCount,
        })
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown rolling schedule error'
        console.error('[ROLL SCHEDULES ERROR]', message)
        return NextResponse.json({ success: false, error: message }, { status: 500 })
    }
}
