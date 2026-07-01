"use client"

import { useEffect, useState } from 'react'

interface Passenger {
    full_name: string
    phone: string
}

interface RouteInfo {
    origin: { name: string }
    destination: { name: string }
}

interface ScheduleInfo {
    departure_date: string
    departure_time: string | null
    routes: RouteInfo | null
}

interface SeatInfo {
    seat_number: string
    schedules: ScheduleInfo | null
}

interface Booking {
    id: string
    booking_ref: string
    group_ref: string
    passenger_id: string
    seat_traveller_name: string
    price_etb: number
    payment_status: string
    status: string
    booked_at: string
    passengers: Passenger | null
    seats: SeatInfo | null
}

export default function BookingsAdmin() {
    const [bookings, setBookings] = useState<Booking[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    // Filters
    const [searchQuery, setSearchQuery] = useState('')
    const [payFilter, setPayFilter] = useState('ALL')
    const [statusFilter, setStatusFilter] = useState('ALL')
    const [limit, setLimit] = useState(100)

    // Cancel modal state
    const [cancellingBookingId, setCancellingBookingId] = useState<string | null>(null)

    const fetchBookings = async () => {
        setLoading(true)
        setError('')
        try {
            let url = `/api/admin/bookings?limit=${limit}`
            if (payFilter !== 'ALL') {
                url += `&status=${payFilter}`
            }
            const res = await fetch(url)
            if (res.ok) {
                const data = await res.json()
                setBookings(data)
            } else {
                setError('Failed to fetch bookings')
            }
        } catch {
            setError('Connection error occurred while loading bookings')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchBookings()
    }, [payFilter, limit])

    const handleCancel = async (id: string) => {
        setError('')
        setSuccess('')
        try {
            const res = await fetch('/api/admin/bookings', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            })

            if (res.ok) {
                setSuccess('Booking cancelled successfully and seat released.')
                setCancellingBookingId(null)
                fetchBookings()
            } else {
                const data = await res.json()
                setError(data.error || 'Failed to cancel booking')
            }
        } catch {
            setError('Failed to cancel booking')
        }
    }

    // Client-side search filtering
    const filteredBookings = bookings.filter(b => {
        const term = searchQuery.toLowerCase().trim()
        if (!term) return true

        const ref = b.booking_ref.toLowerCase()
        const gRef = b.group_ref?.toLowerCase() || ''
        const name = b.seat_traveller_name.toLowerCase()
        const phone = b.passengers?.phone || ''
        const origin = b.seats?.schedules?.routes?.origin?.name.toLowerCase() || ''
        const dest = b.seats?.schedules?.routes?.destination?.name.toLowerCase() || ''

        return ref.includes(term) || gRef.includes(term) || name.includes(term) || phone.includes(term) || origin.includes(term) || dest.includes(term)
    }).filter(b => {
        if (statusFilter === 'ALL') return true
        if (statusFilter === 'CANCELLED') return b.status === 'CANCELLED'
        if (statusFilter === 'ACTIVE') return b.status !== 'CANCELLED'
        return true
    })

    return (
        <div className="animate-fade">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '0.25rem' }}>Bookings & Tickets</h1>
                    <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Monitor ticket transactions, verify payment statuses, and cancel reservations</p>
                </div>
            </div>

            {/* Error/Success banners */}
            {error && (
                <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, color: '#ef4444', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                    ⚠️ {error}
                </div>
            )}
            {success && (
                <div style={{ padding: '12px 16px', background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 10, color: '#4ade80', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                    ✅ {success}
                </div>
            )}

            {/* Filters Bar */}
            <div className="glass" style={{ padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: 6, fontWeight: 600 }}>SEARCH PASSENGER OR REF</label>
                    <input 
                        type="text" 
                        className="input" 
                        placeholder="Search name, phone, BMG-XXXXX..." 
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        style={{ padding: '10px 14px', fontSize: '0.9rem' }}
                    />
                </div>
                
                <div style={{ width: 140 }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: 6, fontWeight: 600 }}>PAYMENT STATUS</label>
                    <select 
                        className="select" 
                        value={payFilter} 
                        onChange={e => setPayFilter(e.target.value)}
                        style={{ padding: '10px 14px', fontSize: '0.9rem' }}
                    >
                        <option value="ALL">All Payments</option>
                        <option value="PAID">PAID</option>
                        <option value="PENDING">PENDING</option>
                    </select>
                </div>

                <div style={{ width: 140 }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: 6, fontWeight: 600 }}>BOOKING STATUS</label>
                    <select 
                        className="select" 
                        value={statusFilter} 
                        onChange={e => setStatusFilter(e.target.value)}
                        style={{ padding: '10px 14px', fontSize: '0.9rem' }}
                    >
                        <option value="ALL">All Statuses</option>
                        <option value="ACTIVE">Active</option>
                        <option value="CANCELLED">Cancelled</option>
                    </select>
                </div>

                <div style={{ width: 100 }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: 6, fontWeight: 600 }}>LIMIT</label>
                    <select 
                        className="select" 
                        value={limit} 
                        onChange={e => setLimit(parseInt(e.target.value))}
                        style={{ padding: '10px 14px', fontSize: '0.9rem' }}
                    >
                        <option value="50">50 rows</option>
                        <option value="100">100 rows</option>
                        <option value="200">200 rows</option>
                        <option value="500">500 rows</option>
                    </select>
                </div>
            </div>

            {/* List */}
            <div className="glass" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Bookings Log ({filteredBookings.length})</h3>
                    <button 
                        className="btn btn-outline btn-sm" 
                        style={{ padding: '5px 12px', fontSize: '0.75rem' }}
                        onClick={fetchBookings}
                    >Refresh List</button>
                </div>

                {loading ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Retrieving bookings database...</div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                    <th style={{ padding: '10px 14px', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>REF / GROUP</th>
                                    <th style={{ padding: '10px 14px', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>PASSENGER</th>
                                    <th style={{ padding: '10px 14px', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>TRIP</th>
                                    <th style={{ padding: '10px 14px', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>SEAT</th>
                                    <th style={{ padding: '10px 14px', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>PRICE</th>
                                    <th style={{ padding: '10px 14px', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>STATUSES</th>
                                    <th style={{ padding: '10px 14px', textAlign: 'right', color: '#64748b', fontWeight: 600 }}>ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredBookings.map(booking => {
                                    const sched = booking.seats?.schedules
                                    const route = sched?.routes
                                    const isCancelled = booking.status === 'CANCELLED'
                                    const isPaid = booking.payment_status === 'PAID'

                                    return (
                                        <tr key={booking.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', opacity: isCancelled ? 0.6 : 1 }}>
                                            <td style={{ padding: '12px 14px', fontFamily: 'monospace' }}>
                                                <div style={{ fontWeight: 700, color: '#fbbf24' }}>{booking.booking_ref}</div>
                                                <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: 2 }}>Grp: {booking.group_ref || '—'}</div>
                                            </td>
                                            <td style={{ padding: '12px 14px' }}>
                                                <div style={{ fontWeight: 600 }}>{booking.seat_traveller_name}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>
                                                    {booking.passengers?.phone || '—'}
                                                </div>
                                            </td>
                                            <td style={{ padding: '12px 14px' }}>
                                                {route ? (
                                                    <div>
                                                        <div style={{ fontWeight: 600 }}>{route.origin?.name} ➔ {route.destination?.name}</div>
                                                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>
                                                            {sched?.departure_date} · {sched?.departure_time || '—'}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span style={{ color: '#64748b' }}>Schedule Deleted</span>
                                                )}
                                            </td>
                                            <td style={{ padding: '12px 14px', fontWeight: 600, fontFamily: 'monospace' }}>
                                                {booking.seats?.seat_number || '—'}
                                            </td>
                                            <td style={{ padding: '12px 14px', fontWeight: 600, color: '#4ade80' }}>
                                                {booking.price_etb} ETB
                                            </td>
                                            <td style={{ padding: '12px 14px' }}>
                                                <div style={{ display: 'flex', gap: '0.25rem', flexDirection: 'column', alignItems: 'flex-start' }}>
                                                    <span style={{
                                                        padding: '2px 6px', borderRadius: 4, fontSize: '0.65rem', fontWeight: 700,
                                                        background: isPaid ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)',
                                                        color: isPaid ? '#4ade80' : '#fbbf24'
                                                    }}>{booking.payment_status}</span>
                                                    
                                                    {isCancelled && (
                                                        <span style={{
                                                            padding: '2px 6px', borderRadius: 4, fontSize: '0.65rem', fontWeight: 700,
                                                            background: 'rgba(239,68,68,0.15)', color: '#f87171'
                                                        }}>CANCELLED</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                                                {!isCancelled && (
                                                    <button 
                                                        className="btn btn-danger btn-sm"
                                                        style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                                                        onClick={() => setCancellingBookingId(booking.id)}
                                                    >Cancel</button>
                                                )}
                                            </td>
                                        </tr>
                                    )
                                })}
                                {filteredBookings.length === 0 && (
                                    <tr>
                                        <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: '#475569' }}>No booking records match the current filters.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Cancel Confirmation Modal */}
            {cancellingBookingId && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 100,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)'
                }}>
                    <div className="glass" style={{ padding: '2rem', maxWidth: 400, width: '90%', textAlign: 'center' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem', color: '#f87171' }}>Cancel Booking?</h3>
                        <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                            Are you sure you want to cancel this ticket reservation? The booking will be marked as CANCELLED and the seat will be immediately released for other passengers.
                        </p>
                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                            <button className="btn btn-danger btn-sm" onClick={() => handleCancel(cancellingBookingId)}>Confirm Cancel</button>
                            <button className="btn btn-outline btn-sm" onClick={() => setCancellingBookingId(null)}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
