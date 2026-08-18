import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { SEAT_HOLD_TIMEOUT_MINUTES, log } from '@/lib/constants'

// Re-export for consumers that import from here
export { SEAT_HOLD_TIMEOUT_MINUTES } from '@/lib/constants'

// ─── Types ────────────────────────────────────────────────────────────────

interface StaleBooking {
    id: string
    seat_id: string | null
    booking_ref: string
    group_ref: string | null
    price_etb: number | string | null
}

interface ChapaVerification {
    paid: boolean
    shouldSkipRelease: boolean
    error?: string
}

export interface SeatHoldCleanupResult {
    checkedGroups: number
    markedPaid: number
    releasedSeats: number
    deletedBookings: number
    skippedGroups: number
    errors: string[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function emptyResult(): SeatHoldCleanupResult {
    return {
        checkedGroups: 0,
        markedPaid: 0,
        releasedSeats: 0,
        deletedBookings: 0,
        skippedGroups: 0,
        errors: [],
    }
}

function getTxRef(booking: StaleBooking): string {
    return booking.group_ref || booking.booking_ref
}

async function verifyChapaPayment(txRef: string, expectedAmount: number): Promise<ChapaVerification> {
    if (!process.env.CHAPA_SECRET_KEY) {
        return { paid: false, shouldSkipRelease: false }
    }

    try {
        const verifyRes = await fetch(`https://api.chapa.co/v1/transaction/verify/${txRef}`, {
            headers: { Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}` },
        })

        const verifyData = await verifyRes.json().catch(() => null)

        if (!verifyRes.ok) {
            const isServerOrNetworkIssue = verifyRes.status >= 500 || verifyRes.status === 429
            return {
                paid: false,
                shouldSkipRelease: isServerOrNetworkIssue,
                error: isServerOrNetworkIssue
                    ? `Chapa verify failed for ${txRef}: HTTP ${verifyRes.status}`
                    : undefined,
            }
        }

        if (verifyData?.status !== 'success') {
            return { paid: false, shouldSkipRelease: false }
        }

        const paidAmount = verifyData.data?.amount
        if (paidAmount && Number(paidAmount) < expectedAmount) {
            return {
                paid: false,
                shouldSkipRelease: true,
                error: `Chapa amount mismatch for ${txRef}: expected ${expectedAmount}, got ${paidAmount}`,
            }
        }

        return { paid: true, shouldSkipRelease: false }
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        return {
            paid: false,
            shouldSkipRelease: true,
            error: `Chapa verify failed for ${txRef}: ${message}`,
        }
    }
}

// ─── Main Cleanup Logic ──────────────────────────────────────────────────

export async function releaseExpiredSeatHolds(ref?: string): Promise<SeatHoldCleanupResult> {
    const result = emptyResult()
    const cutoff = new Date(Date.now() - SEAT_HOLD_TIMEOUT_MINUTES * 60 * 1000).toISOString()

    let query = supabaseAdmin
        .from('bookings')
        .select('id, seat_id, booking_ref, group_ref, price_etb')
        .eq('payment_status', 'PENDING')
        .lt('booked_at', cutoff)

    if (ref) {
        query = query.or(`booking_ref.eq.${ref},group_ref.eq.${ref}`)
    }

    const { data: staleBookings, error } = await query

    if (error) {
        return { ...result, errors: [error.message] }
    }

    if (!staleBookings || staleBookings.length === 0) {
        return result
    }

    const groups = new Map<string, StaleBooking[]>()
    for (const booking of staleBookings as StaleBooking[]) {
        const txRef = getTxRef(booking)
        groups.set(txRef, [...(groups.get(txRef) || []), booking])
    }

    result.checkedGroups = groups.size

    for (const [txRef, bookings] of groups) {
        const expectedAmount = bookings.reduce((sum, booking) => sum + Number(booking.price_etb || 0), 0)
        const verification = await verifyChapaPayment(txRef, expectedAmount)

        if (verification.error) {
            result.errors.push(verification.error)
            log({
                level: 'error',
                module: 'SEAT_HOLDS',
                message: verification.error,
            })
        }

        const bookingIds = bookings.map(booking => booking.id)

        if (verification.paid) {
            const { error: updateError } = await supabaseAdmin
                .from('bookings')
                .update({
                    payment_status: 'PAID',
                    paid_at: new Date().toISOString(),
                    chapa_tx_ref: txRef,
                })
                .in('id', bookingIds)

            if (updateError) {
                result.skippedGroups += 1
                result.errors.push(updateError.message)
            } else {
                result.markedPaid += bookings.length
            }
            continue
        }

        if (verification.shouldSkipRelease) {
            result.skippedGroups += 1
            continue
        }

        const seatIds = bookings.map(booking => booking.seat_id).filter(Boolean) as string[]
        if (seatIds.length > 0) {
            const { error: seatError } = await supabaseAdmin
                .from('seats')
                .update({ is_booked: false })
                .in('id', seatIds)

            if (seatError) {
                result.skippedGroups += 1
                result.errors.push(seatError.message)
                continue
            }
        }

        const { error: deleteError } = await supabaseAdmin
            .from('bookings')
            .delete()
            .in('id', bookingIds)

        if (deleteError) {
            result.skippedGroups += 1
            result.errors.push(deleteError.message)
            continue
        }

        result.releasedSeats += seatIds.length
        result.deletedBookings += bookingIds.length
    }

    return result
}
