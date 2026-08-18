"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Booking, GroupedBooking } from '@/lib/types'
import { getStatusBadge } from '@/lib/types'
import { PHONE_REGEX } from '@/lib/constants'

export default function MyBookings() {
    const router = useRouter()
    const [phone, setPhone] = useState('')
    const [bookings, setBookings] = useState<GroupedBooking[]>([])
    const [loading, setLoading] = useState(false)
    const [searched, setSearched] = useState(false)
    const [cancellingId, setCancellingId] = useState<string | null>(null)
    const [formError, setFormError] = useState('')

    // Custom Alert & Confirm states
    const [alertState, setAlertState] = useState<{ show: boolean; title: string; message: string; type: 'success' | 'error' | 'info' }>({
        show: false,
        title: '',
        message: '',
        type: 'info'
    })
    const [confirmCancel, setConfirmCancel] = useState<{ ref: string; seats: string[]; price: number } | null>(null)

    const handleLookup = async (e: React.FormEvent) => {
        e.preventDefault()
        setFormError('')

        if (!PHONE_REGEX.test(phone)) {
            setFormError('Enter a valid phone: 09XXXXXXXX')
            return
        }
        setLoading(true)
        setSearched(true)

        try {
            const res = await fetch(`/api/bookings/lookup?phone=${phone}`)
            const data: Booking[] = await res.json()

            // Group bookings by group_ref for display
            const grouped: Record<string, Booking[]> = {}
            const singles: Booking[] = []

            if (Array.isArray(data)) {
                data.forEach((b) => {
                    if (b.group_ref) {
                        if (!grouped[b.group_ref]) grouped[b.group_ref] = []
                        grouped[b.group_ref].push(b)
                    } else {
                        singles.push(b)
                    }
                })
            }

            // Merge groups into display items
            const displayItems: GroupedBooking[] = []
            Object.entries(grouped).forEach(([groupRef, items]) => {
                displayItems.push({
                    ...items[0],
                    _isGroup: true,
                    _groupRef: groupRef,
                    _groupItems: items,
                    _allSeats: items.map(i => i.seats?.seat_number).filter(Boolean) as string[],
                    _totalPrice: items.reduce((s, i) => s + Number(i.price_etb || 0), 0),
                })
            })
            singles.forEach(s => {
                displayItems.push({
                    ...s,
                    _isGroup: false,
                    _allSeats: [s.seats?.seat_number].filter(Boolean) as string[],
                    _totalPrice: Number(s.price_etb || 0),
                })
            })

            displayItems.sort((a, b) => new Date(b.booked_at).getTime() - new Date(a.booked_at).getTime())
            setBookings(displayItems)
        } catch {
            setFormError('Connection error. Please try again.')
        }
        setLoading(false)
    }

    const handleCancel = async (ref: string) => {
        setConfirmCancel(null)
        setCancellingId(ref)

        try {
            const res = await fetch('/api/bookings/cancel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookingRef: ref, phone }),
            })
            const data = await res.json()

            if (data.success) {
                const seatText = data.cancelledCount > 1 ? `${data.cancelledCount} seats` : '1 seat'
                setAlertState({
                    show: true,
                    title: 'Trip Cancelled Successfully',
                    message: `Cancelled ${seatText}! ${data.refundMessage || ''} Refund: ${data.refundAmount || 0} ETB.`,
                    type: 'success'
                })
                handleLookup({ preventDefault: () => {} } as React.FormEvent)
            } else {
                setAlertState({
                    show: true,
                    title: 'Cancellation Denied',
                    message: data.error || "This booking cannot be cancelled (it may have departed or time has expired).",
                    type: 'error'
                })
            }
        } catch {
            setAlertState({
                show: true,
                title: 'Request Failed',
                message: 'Connection error while processing cancellation. Please try again.',
                type: 'error'
            })
        }
        setCancellingId(null)
    }

    return (
        <div style={{ minHeight: '100vh', padding: '2rem 1.5rem' }}>
            <div style={{ maxWidth: '600px', margin: '0 auto' }}>

                {/* Header */}
                <button className="back-btn animate-in" onClick={() => router.push('/')} aria-label="Go to homepage">
                    ← Home
                </button>

                <div className="animate-in animate-in-delay-1" style={{ marginTop: '1.5rem', marginBottom: '0.5rem' }}>
                    <h1 style={{ fontSize: '1.8rem' }}>My Bookings</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                        Enter your phone number to find your tickets.
                    </p>
                </div>

                {/* Search Form */}
                <form onSubmit={handleLookup} className="animate-in animate-in-delay-2" style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', marginBottom: '2rem' }}>
                    <input
                        className="input"
                        placeholder="09XXXXXXXX"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        required
                        style={{ flex: 1 }}
                        aria-label="Phone number for booking lookup"
                    />
                    <button type="submit" disabled={loading} className="btn btn-gold">
                        {loading ? '...' : 'Look Up'}
                    </button>
                </form>

                {/* Form error */}
                {formError && (
                    <div role="alert" style={{
                        background: 'rgba(239,68,68,0.1)',
                        border: '1px solid rgba(239,68,68,0.3)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '10px 14px',
                        color: 'var(--danger)',
                        fontSize: '0.85rem',
                        marginBottom: '1rem',
                    }}>
                        ⚠️ {formError}
                    </div>
                )}

                {/* Empty State */}
                {searched && !loading && bookings.length === 0 && (
                    <div className="glass animate-in" style={{ padding: '3rem', textAlign: 'center' }}>
                        <p style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📭</p>
                        <h3 style={{ marginBottom: '0.5rem' }}>No bookings found</h3>
                        <p style={{ color: 'var(--text-muted)' }}>No tickets are associated with this phone number.</p>
                    </div>
                )}

                {/* Loading skeletons */}
                {loading && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {[1, 2, 3].map(i => (
                            <div key={i} className="skeleton" style={{ height: '90px' }} />
                        ))}
                    </div>
                )}

                {/* Booking Cards */}
                {!loading && bookings.map((b, i) => {
                    const schedule = b.seats?.schedules
                    const isExpired = schedule != null && new Date(`${schedule.departure_date}T23:59:59`) < new Date()
                    const isCancelled = b._isGroup
                        ? (b._groupItems || []).every((g) => g.status === 'CANCELLED')
                        : b.status === 'CANCELLED'

                    const badge = getStatusBadge(b.payment_status, b.status, isExpired)
                    const isInactive = isCancelled || isExpired
                    const displayRef = b._isGroup ? b._groupRef : b.booking_ref
                    const cancelRef = b._isGroup ? (b._groupRef || b.booking_ref) : b.booking_ref

                    return (
                        <div
                            key={`${displayRef}-${i}`}
                            className={`glass animate-in animate-in-delay-${Math.min(i + 1, 5)}`}
                            style={{
                                padding: '1.25rem',
                                marginBottom: '0.75rem',
                                opacity: isInactive ? 0.6 : 1,
                                borderLeft: `3px solid ${badge.accentColor}`,
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <p style={{ fontFamily: 'Outfit', fontWeight: 600, fontSize: '1rem' }}>
                                        {displayRef}
                                    </p>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
                                        {b._isGroup
                                            ? `Seats ${b._allSeats.join(', ')} · ${b._totalPrice} ETB`
                                            : `Seat ${b.seats?.seat_number} · ${b.price_etb} ETB`
                                        }
                                    </p>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '2px' }}>
                                        {b.seat_traveller_name} &nbsp;•&nbsp; {new Date(b.booked_at).toLocaleDateString()}
                                    </p>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                                    <div className={`badge ${badge.className}`}>
                                        {badge.text}
                                    </div>

                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            onClick={() => router.push(`/ticket/${displayRef}`)}
                                            className="btn btn-sm btn-outline"
                                            style={{ fontSize: '0.75rem' }}
                                        >
                                            View
                                        </button>

                                        {!isCancelled && !isExpired && (
                                            <button
                                                onClick={() => setConfirmCancel({
                                                    ref: cancelRef,
                                                    seats: b._allSeats,
                                                    price: b._totalPrice
                                                })}
                                                disabled={cancellingId === cancelRef}
                                                className="btn btn-sm btn-danger"
                                                style={{ fontSize: '0.75rem' }}
                                            >
                                                {cancellingId === cancelRef ? '...' : 'Cancel'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Custom Confirm Cancel Modal */}
            {confirmCancel && (
                <div
                    style={{
                        position: 'fixed', inset: 0, zIndex: 100,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)'
                    }}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="cancel-dialog-title"
                >
                    <div className="glass" style={{ padding: '2rem', maxWidth: 420, width: '90%', textAlign: 'center', border: '1px solid rgba(239,68,68,0.25)' }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>⚠️</div>
                        <h3 id="cancel-dialog-title" style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.75rem', color: '#f87171' }}>Confirm Cancellation</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                            Are you sure you want to cancel booking <strong style={{ color: '#f1f5f9' }}>{confirmCancel.ref}</strong>?<br />
                            This will cancel <span style={{ color: '#fbbf24', fontWeight: 600 }}>{confirmCancel.seats.length} seats ({confirmCancel.seats.join(', ')})</span>.
                            Cancellation is permanent and subject to our tiered refund policy.
                        </p>
                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                            <button
                                className="btn btn-danger btn-sm"
                                style={{ padding: '10px 20px' }}
                                onClick={() => handleCancel(confirmCancel.ref)}
                            >
                                Yes, Cancel Booking
                            </button>
                            <button
                                className="btn btn-outline btn-sm"
                                style={{ padding: '10px 20px' }}
                                onClick={() => setConfirmCancel(null)}
                            >
                                Keep Booking
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Alert Modal */}
            {alertState.show && (
                <div
                    style={{
                        position: 'fixed', inset: 0, zIndex: 101,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)'
                    }}
                    role="alertdialog"
                    aria-modal="true"
                    aria-labelledby="alert-dialog-title"
                >
                    <div className="glass" style={{
                        padding: '2rem',
                        maxWidth: 420,
                        width: '90%',
                        textAlign: 'center',
                        border: `1px solid ${alertState.type === 'success' ? 'rgba(34,197,94,0.3)' : alertState.type === 'error' ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.1)'}`
                    }}>
                        <div style={{
                            fontSize: '2.5rem',
                            marginBottom: '0.5rem',
                            color: alertState.type === 'success' ? '#4ade80' : alertState.type === 'error' ? '#f87171' : '#fbbf24'
                        }}>
                            {alertState.type === 'success' ? '✅' : alertState.type === 'error' ? '❌' : 'ℹ️'}
                        </div>
                        <h3 id="alert-dialog-title" style={{
                            fontSize: '1.25rem',
                            fontWeight: 700,
                            marginBottom: '0.75rem',
                            color: alertState.type === 'success' ? '#4ade80' : alertState.type === 'error' ? '#f87171' : '#f1f5f9'
                        }}>
                            {alertState.title}
                        </h3>
                        <p style={{
                            color: 'var(--text-muted)',
                            fontSize: '0.85rem',
                            marginBottom: '1.5rem',
                            lineHeight: 1.5,
                            whiteSpace: 'pre-line'
                        }}>
                            {alertState.message}
                        </p>
                        <button
                            className="btn btn-gold btn-sm"
                            style={{ padding: '10px 24px', minWidth: '120px' }}
                            onClick={() => setAlertState({ ...alertState, show: false })}
                        >
                            Dismiss
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
