import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getCurrentStaff, logAudit } from '@/lib/auth'

// GET — list all bookings with passenger + seat info
export async function GET(req: NextRequest) {
    const staff = await getCurrentStaff()
    if (!staff) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(req.url)
    const status = url.searchParams.get('status')
    const limit = Number(url.searchParams.get('limit')) || 50

    let query = supabaseAdmin
        .from('bookings')
        .select('*, group_ref, passengers(full_name, phone), seats(seat_number, schedules(departure_date, departure_time, routes(origin:cities!routes_origin_id_fkey(name), destination:cities!routes_destination_id_fkey(name))))')
        .order('booked_at', { ascending: false })
        .limit(limit)

    if (status) query = query.eq('payment_status', status)

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
}

// DELETE — admin delete booking (cancels booking + releases seat)
export async function DELETE(req: NextRequest) {
    const staff = await getCurrentStaff()
    if (!staff) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: 'Booking ID required' }, { status: 400 })

    // Get booking to find seat
    const { data: booking } = await supabaseAdmin
        .from('bookings')
        .select('id, booking_ref, seat_id, group_ref')
        .eq('id', id)
        .single()

    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

    // Cancel the booking
    await supabaseAdmin
        .from('bookings')
        .update({ status: 'CANCELLED', cancelled_at: new Date().toISOString() })
        .eq('id', id)

    // Release the seat
    if (booking.seat_id) {
        await supabaseAdmin
            .from('seats')
            .update({ is_booked: false })
            .eq('id', booking.seat_id)
    }

    await logAudit({
        staffId: staff.staffId,
        action: 'DELETE',
        entityType: 'booking',
        entityId: booking.booking_ref,
        details: { booking_id: id, group_ref: booking.group_ref },
    })

    return NextResponse.json({ success: true })
}
