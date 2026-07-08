import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { releaseExpiredSeatHolds } from '@/lib/seatHolds'

// Secure ticket lookup — replaces direct browser Supabase query
export async function GET(req: NextRequest) {
    const ref = new URL(req.url).searchParams.get('ref')

    if (!ref || typeof ref !== 'string' || ref.length < 5) {
        return NextResponse.json({ error: 'Invalid booking reference' }, { status: 400 })
    }

    await releaseExpiredSeatHolds(ref)

    // Find bookings matching this ref (could be single or group)
    const { data: bookings, error } = await supabaseAdmin
        .from('bookings')
        .select(`
            id, booking_ref, group_ref, seat_traveller_name,
            price_etb, trip_type, payment_status, status,
            booked_at, paid_at, cancelled_at, chapa_tx_ref,
            seats ( seat_number, seat_type, schedules(departure_date, departure_time, arrival_time, routes(origin:origin_id(name), destination:destination_id(name))) ),
            passengers ( full_name, phone )
        `)
        .or(`booking_ref.eq.${ref},group_ref.eq.${ref}`)
        .order('booking_ref')

    if (error || !bookings || bookings.length === 0) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Mask phone number for privacy (show last 4 digits only)
    const sanitized = bookings.map(b => ({
        ...b,
        passengers: b.passengers ? {
            full_name: (b.passengers as any).full_name,
            phone_masked: (b.passengers as any).phone
                ? '****' + (b.passengers as any).phone.slice(-4)
                : null,
        } : null,
    }))

    return NextResponse.json(sanitized)
}
