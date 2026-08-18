"use client"

import { useEffect, useState } from 'react'
import type { StatsResponse, Booking } from '@/lib/types'

export default function AdminDashboard() {
    const [stats, setStats] = useState<StatsResponse['stats'] | null>(null)
    const [loading, setLoading] = useState(true)
    const [recentBookings, setRecentBookings] = useState<Booking[]>([])

    useEffect(() => {
        async function loadStats() {
            try {
                const res = await fetch('/api/admin/stats')
                if (res.ok) {
                    const data: StatsResponse = await res.json()
                    setStats(data.stats)
                    setRecentBookings(data.recentBookings || [])
                }
            } catch {
                // Stats load failure — non-fatal, shows empty state
            }
            setLoading(false)
        }
        loadStats()
    }, [])

    const statCards = stats ? [
        { label: 'Total Bookings', value: stats.totalBookings, icon: '🎫', color: '#3b82f6' },
        { label: 'Paid', value: stats.paidBookings, icon: '✅', color: '#16a34a' },
        { label: 'Pending', value: stats.pendingBookings, icon: '⏳', color: '#f59e0b' },
        { label: 'Cancelled', value: stats.cancelledBookings, icon: '❌', color: '#ef4444' },
        { label: 'Revenue (ETB)', value: stats.totalRevenue.toLocaleString(), icon: '💰', color: '#8b5cf6' },
        { label: 'Today\'s Bookings', value: stats.todayBookings, icon: '📅', color: '#06b6d4' },
        { label: 'Active Schedules', value: stats.activeSchedules, icon: '🚌', color: '#10b981' },
        { label: 'Total Buses', value: stats.totalBuses, icon: '🚍', color: '#f97316' },
    ] : []

    return (
        <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '0.5rem' }}>Dashboard</h1>
            <p style={{ color: '#64748b', marginBottom: '2rem' }}>
                Overview of Dash Travel operations · {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>

            {/* Stats Grid */}
            {loading ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                    {[1,2,3,4,5,6,7,8].map(i => (
                        <div key={i} className="skeleton" style={{ height: 100, borderRadius: 12 }} />
                    ))}
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                    {statCards.map(card => (
                        <div key={card.label} style={{
                            background: 'rgba(17,24,39,0.8)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            borderRadius: 12,
                            padding: '1.25rem',
                            borderLeft: `3px solid ${card.color}`,
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>
                                    {card.label}
                                </span>
                                <span style={{ fontSize: '1.2rem' }} role="img" aria-hidden="true">{card.icon}</span>
                            </div>
                            <p style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'Outfit, sans-serif', color: '#f1f5f9' }}>
                                {card.value}
                            </p>
                        </div>
                    ))}
                </div>
            )}

            {/* Recent Bookings */}
            <div style={{
                background: 'rgba(17,24,39,0.8)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 12,
                overflow: 'hidden',
            }}>
                <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Recent Bookings</h3>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                {['Ref', 'Passenger', 'Seat', 'Amount', 'Status', 'Booked'].map(h => (
                                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {recentBookings.map((b) => (
                                <tr key={b.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                    <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontWeight: 600 }}>{b.booking_ref}</td>
                                    <td style={{ padding: '10px 14px' }}>{b.seat_traveller_name}</td>
                                    <td style={{ padding: '10px 14px' }}>{b.seats?.seat_number || '—'}</td>
                                    <td style={{ padding: '10px 14px', color: '#4ade80', fontWeight: 600 }}>{b.price_etb} ETB</td>
                                    <td style={{ padding: '10px 14px' }}>
                                        <span style={{
                                            padding: '3px 8px', borderRadius: 12, fontSize: '0.7rem', fontWeight: 600,
                                            background: b.payment_status === 'PAID' ? 'rgba(22,163,74,0.15)' : b.status === 'CANCELLED' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                                            color: b.payment_status === 'PAID' ? '#4ade80' : b.status === 'CANCELLED' ? '#f87171' : '#fbbf24',
                                        }}>
                                            {b.status === 'CANCELLED' ? 'CANCELLED' : b.payment_status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '10px 14px', color: '#64748b' }}>{new Date(b.booked_at).toLocaleString()}</td>
                                </tr>
                            ))}
                            {recentBookings.length === 0 && !loading && (
                                <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#475569' }}>No bookings yet</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
