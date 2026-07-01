import { NextRequest, NextResponse } from 'next/server'
import { releaseExpiredSeatHolds } from '@/lib/seatHolds'

// Seat lock timeout — releases seats that were locked for payment but never paid
// Call this via: GET /api/cron/release-seats
// In production, set up a cron job (Vercel Cron, Supabase Edge Function, or external)
// to hit this endpoint every 5 minutes.

export async function GET(req: NextRequest) {
    const ref = new URL(req.url).searchParams.get('ref') || undefined
    const result = await releaseExpiredSeatHolds(ref)

    if (result.errors.length > 0 && result.checkedGroups === result.skippedGroups) {
        console.error('Release seats cron error:', result.errors)
        return NextResponse.json({ ...result, error: result.errors[0] }, { status: 500 })
    }

    return NextResponse.json({
        ...result,
        released: result.releasedSeats,
        bookingsRemoved: result.deletedBookings,
        message: result.deletedBookings === 0
            ? 'No stale unpaid bookings found'
            : `Released ${result.releasedSeats} seat(s) and removed ${result.deletedBookings} unpaid booking(s)`,
    })
}
