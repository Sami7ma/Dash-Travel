import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getCurrentStaff, logAudit } from '@/lib/auth'

// GET — list schedules with route + bus info
export async function GET(req: NextRequest) {
    const staff = await getCurrentStaff()
    if (!staff) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(req.url)
    const date = url.searchParams.get('date')

    // Use simple join — Supabase resolves origin_id/destination_id FKs to cities automatically
    let query = supabaseAdmin
        .from('schedules')
        .select(`
            id, route_id, bus_id, departure_date, departure_time, arrival_time, status, created_at,
            routes:route_id (
                id, base_price_etb,
                origin:origin_id ( name ),
                destination:destination_id ( name )
            ),
            buses:bus_id (
                id, plate_number, bus_type, total_rows, total_cols
            )
        `)
        .order('departure_date', { ascending: false })
        .limit(200)

    if (date) query = query.eq('departure_date', date)

    const { data, error } = await query

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
}

// POST — create new schedule + auto-generate seats
export async function POST(req: NextRequest) {
    const staff = await getCurrentStaff()
    if (!staff) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { route_id, bus_id, departure_date, departure_time, arrival_time } = body

    if (!route_id || !bus_id || !departure_date || !departure_time) {
        return NextResponse.json({ error: 'Route, bus, date, and departure time are required' }, { status: 400 })
    }

    // Create schedule
    const { data: schedule, error } = await supabaseAdmin
        .from('schedules')
        .insert({
            route_id, bus_id, departure_date, departure_time,
            arrival_time: arrival_time || null,
            status: 'SCHEDULED',
        })
        .select()
        .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Auto-generate seats from bus dimensions
    const { data: bus } = await supabaseAdmin
        .from('buses')
        .select('total_rows, total_cols')
        .eq('id', bus_id)
        .single()

    if (bus) {
        const totalRows = bus.total_rows || 13
        const totalCols = bus.total_cols || 4
        const colLabels = ['A', 'B', 'C', 'D']
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
    }

    await logAudit({
        staffId: staff.staffId, action: 'CREATE',
        entityType: 'schedule', entityId: schedule.id,
        details: body,
    })

    return NextResponse.json(schedule, { status: 201 })
}

// PUT — update schedule (status OR date/time)
export async function PUT(req: NextRequest) {
    const staff = await getCurrentStaff()
    if (!staff) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id, ...updates } = await req.json()
    if (!id) return NextResponse.json({ error: 'Schedule ID required' }, { status: 400 })

    // Whitelist allowed update fields
    const allowed = ['status', 'departure_date', 'departure_time', 'arrival_time', 'bus_id', 'route_id']
    const filtered = Object.fromEntries(
        Object.entries(updates).filter(([k]) => allowed.includes(k))
    )

    const { data, error } = await supabaseAdmin
        .from('schedules')
        .update(filtered)
        .eq('id', id)
        .select()
        .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await logAudit({ staffId: staff.staffId, action: 'UPDATE', entityType: 'schedule', entityId: id, details: filtered })
    return NextResponse.json(data)
}

// DELETE — delete schedule + its seats
export async function DELETE(req: NextRequest) {
    const staff = await getCurrentStaff()
    if (!staff) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: 'Schedule ID required' }, { status: 400 })

    // Delete seats first (foreign key)
    await supabaseAdmin.from('seats').delete().eq('schedule_id', id)
    const { error } = await supabaseAdmin.from('schedules').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await logAudit({ staffId: staff.staffId, action: 'DELETE', entityType: 'schedule', entityId: id })
    return NextResponse.json({ success: true })
}
