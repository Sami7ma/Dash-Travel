import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getCurrentStaff, logAudit } from '@/lib/auth'

// GET — list schedules with route + bus info
export async function GET(req: NextRequest) {
    const staff = await getCurrentStaff()
    if (!staff) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(req.url)
    const date = url.searchParams.get('date')

    const SELECT_PRIMARY = '*, routes(origin:cities!routes_origin_id_fkey(name), destination:cities!routes_destination_id_fkey(name), base_price_etb), buses(plate_number, total_seats, bus_type)'
    const SELECT_FALLBACK = '*, routes(origin:cities!routes_origin_city_fkey(name), destination:cities!routes_destination_city_fkey(name), base_price_etb), buses(plate_number, total_seats, bus_type)'

    let baseQuery = supabaseAdmin
        .from('schedules')
        .select(SELECT_PRIMARY)
        .order('departure_date', { ascending: false })
        .limit(100)

    if (date) baseQuery = baseQuery.eq('departure_date', date)

    let { data, error } = await baseQuery

    if (error) {
        // Fallback: try origin_city FK name convention
        let fallbackQuery = supabaseAdmin
            .from('schedules')
            .select(SELECT_FALLBACK)
            .order('departure_date', { ascending: false })
            .limit(100)
        if (date) fallbackQuery = fallbackQuery.eq('departure_date', date)

        const fallback = await fallbackQuery
        if (fallback.error) return NextResponse.json({ error: fallback.error.message }, { status: 500 })
        data = fallback.data
    }

    return NextResponse.json(data)
}

// POST — create new schedule
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

    // Auto-generate seats for this schedule
    const { data: bus } = await supabaseAdmin
        .from('buses')
        .select('total_seats')
        .eq('id', bus_id)
        .single()

    if (bus) {
        const seats = []
        const totalSeats = bus.total_seats || 49
        const cols = ['A', 'B', 'C', 'D']
        const rows = Math.ceil(totalSeats / 4)

        for (let r = 1; r <= rows; r++) {
            for (const c of cols) {
                if (seats.length >= totalSeats) break
                seats.push({
                    schedule_id: schedule.id,
                    seat_number: `${r}${c}`,
                    seat_type: r === 1 ? 'PREMIUM' : 'REGULAR',
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

// PUT — update schedule
export async function PUT(req: NextRequest) {
    const staff = await getCurrentStaff()
    if (!staff) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id, ...updates } = await req.json()
    if (!id) return NextResponse.json({ error: 'Schedule ID required' }, { status: 400 })

    const { data, error } = await supabaseAdmin
        .from('schedules')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await logAudit({ staffId: staff.staffId, action: 'UPDATE', entityType: 'schedule', entityId: id, details: updates })
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
