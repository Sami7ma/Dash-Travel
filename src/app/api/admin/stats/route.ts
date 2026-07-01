import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getCurrentStaff } from '@/lib/auth'

export async function GET() {
    const staff = await getCurrentStaff()
    if (!staff) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Parallel queries for speed
    const today = new Date().toISOString().split('T')[0]

    const [
        { count: totalBookings },
        { count: paidBookings },
        { count: pendingBookings },
        { count: cancelledBookings },
        { data: revenueData },
        { count: todayBookings },
        { count: activeSchedules },
        { count: totalBuses },
        { data: recentBookings },
    ] = await Promise.all([
        supabaseAdmin.from('bookings').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('bookings').select('*', { count: 'exact', head: true }).eq('payment_status', 'PAID'),
        supabaseAdmin.from('bookings').select('*', { count: 'exact', head: true }).eq('payment_status', 'PENDING'),
        supabaseAdmin.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'CANCELLED'),
        supabaseAdmin.from('bookings').select('price_etb').eq('payment_status', 'PAID'),
        supabaseAdmin.from('bookings').select('*', { count: 'exact', head: true }).gte('booked_at', today),
        supabaseAdmin.from('schedules').select('*', { count: 'exact', head: true }).eq('status', 'SCHEDULED'),
        supabaseAdmin.from('buses').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('bookings')
            .select('id, booking_ref, seat_traveller_name, price_etb, payment_status, status, booked_at, seats(seat_number)')
            .order('booked_at', { ascending: false })
            .limit(15),
    ])

    const totalRevenue = (revenueData || []).reduce((sum, b) => sum + Number(b.price_etb || 0), 0)

    return NextResponse.json({
        stats: {
            totalBookings: totalBookings || 0,
            paidBookings: paidBookings || 0,
            pendingBookings: pendingBookings || 0,
            cancelledBookings: cancelledBookings || 0,
            totalRevenue,
            todayBookings: todayBookings || 0,
            activeSchedules: activeSchedules || 0,
            totalBuses: totalBuses || 0,
        },
        recentBookings: recentBookings || [],
    })
}
