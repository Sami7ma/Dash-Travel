"use client"

import { useEffect, useState } from 'react'

interface RouteInfo {
    id: string
    origin: { name: string }
    destination: { name: string }
    base_price_etb: number
}

interface Bus {
    id: string
    plate_number: string
    total_rows: number
    total_cols: number
    bus_type: string
}

interface Schedule {
    id: string
    route_id: string
    bus_id: string
    departure_date: string
    departure_time: string | null
    arrival_time: string | null
    status: string
    routes: RouteInfo | null
    buses: Bus | null
    created_at: string
}

export default function SchedulesAdmin() {
    const [schedules, setSchedules] = useState<Schedule[]>([])
    const [routes, setRoutes] = useState<RouteInfo[]>([])
    const [buses, setBuses] = useState<Bus[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    // Form states
    const [routeId, setRouteId] = useState('')
    const [busId, setBusId] = useState('')
    const [departureDate, setDepartureDate] = useState('')
    const [departureTime, setDepartureTime] = useState('')
    const [arrivalTime, setArrivalTime] = useState('')

    // Filter state
    const [filterDate, setFilterDate] = useState('')

    // Modal/Delete states
    const [deletingScheduleId, setDeletingScheduleId] = useState<string | null>(null)
    const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null)
    const [editRouteId, setEditRouteId] = useState('')
    const [editBusId, setEditBusId] = useState('')
    const [editDepartureDate, setEditDepartureDate] = useState('')
    const [editDepartureTime, setEditDepartureTime] = useState('')
    const [editArrivalTime, setEditArrivalTime] = useState('')
    const [editStatus, setEditStatus] = useState('')

    const fetchSchedules = async (dateFilter = '') => {
        setLoading(true)
        setError('')
        try {
            const url = dateFilter ? `/api/admin/schedules?date=${dateFilter}` : '/api/admin/schedules'
            const res = await fetch(url)
            if (res.ok) {
                const data = await res.json()
                setSchedules(data)
            } else {
                const errData = await res.json().catch(() => ({}))
                setError(errData.error || `API error ${res.status}: Failed to load schedules`)
            }
        } catch {
            setError('Connection error occurred while loading schedules')
        } finally {
            setLoading(false)
        }
    }

    const fetchRoutesAndBuses = async () => {
        try {
            const [routesRes, busesRes] = await Promise.all([
                fetch('/api/admin/routes'),
                fetch('/api/admin/buses')
            ])
            if (routesRes.ok && busesRes.ok) {
                const routesData = await routesRes.json()
                const busesData = await busesRes.json()
                setRoutes(routesData)
                setBuses(busesData)
            }
        } catch {
            setError('Failed to fetch auxiliary data (routes or buses)')
        }
    }

    useEffect(() => {
        fetchSchedules()
        fetchRoutesAndBuses()
    }, [])

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setSuccess('')

        if (!routeId || !busId || !departureDate || !departureTime) {
            setError('Route, Bus, Date, and Departure Time are required')
            return
        }

        try {
            const res = await fetch('/api/admin/schedules', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    route_id: routeId,
                    bus_id: busId,
                    departure_date: departureDate,
                    departure_time: departureTime,
                    arrival_time: arrivalTime || null,
                }),
            })

            const data = await res.json()
            if (res.ok) {
                setSuccess('Schedule created successfully! Seats generated.')
                setRouteId('')
                setBusId('')
                setDepartureDate('')
                setDepartureTime('')
                setArrivalTime('')
                fetchSchedules(filterDate)
            } else {
                setError(data.error || 'Failed to create schedule')
            }
        } catch {
            setError('Failed to create schedule')
        }
    }

    const openEditModal = (sched: Schedule) => {
        setEditingSchedule(sched)
        setEditRouteId(sched.route_id || '')
        setEditBusId(sched.bus_id || '')
        setEditDepartureDate(sched.departure_date || '')
        setEditDepartureTime(sched.departure_time || '')
        setEditArrivalTime(sched.arrival_time || '')
        setEditStatus(sched.status || 'SCHEDULED')
    }

    const handleSaveSchedule = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingSchedule) return
        setError('')
        setSuccess('')

        try {
            const res = await fetch('/api/admin/schedules', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: editingSchedule.id,
                    route_id: editRouteId,
                    bus_id: editBusId,
                    departure_date: editDepartureDate,
                    departure_time: editDepartureTime,
                    arrival_time: editArrivalTime || null,
                    status: editStatus,
                }),
            })

            const data = await res.json()
            if (res.ok) {
                setSuccess('Schedule details updated successfully!')
                setEditingSchedule(null)
                fetchSchedules(filterDate)
            } else {
                setError(data.error || 'Failed to update schedule')
            }
        } catch {
            setError('Failed to update schedule')
        }
    }

    const handleDelete = async (id: string) => {
        setError('')
        setSuccess('')
        try {
            const res = await fetch('/api/admin/schedules', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            })

            if (res.ok) {
                setSuccess('Schedule and its seats deleted successfully!')
                setDeletingScheduleId(null)
                fetchSchedules(filterDate)
            } else {
                const data = await res.json()
                setError(data.error || 'Failed to delete schedule')
            }
        } catch {
            setError('Failed to delete schedule')
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'SCHEDULED': return { bg: 'rgba(245,158,11,0.15)', text: '#fbbf24' }
            case 'IN_ROUTE': return { bg: 'rgba(34,197,94,0.15)', text: '#4ade80' }
            case 'COMPLETED': return { bg: 'rgba(148,163,184,0.15)', text: '#94a3b8' }
            case 'CANCELLED': return { bg: 'rgba(239,68,68,0.15)', text: '#f87171' }
            default: return { bg: 'rgba(255,255,255,0.05)', text: '#cbd5e1' }
        }
    }

    return (
        <div className="animate-fade">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '0.25rem' }}>Schedules & Departures</h1>
                    <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Schedule trips, monitor dispatch states, and manage passenger seat layouts</p>
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

            {/* Filter and Content layout */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem', alignItems: 'start' }}>
                
                {/* List portion */}
                <div>
                    {/* Date filter bar */}
                    <div className="glass" style={{ padding: '0.75rem 1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8' }}>Filter Departures:</span>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <input 
                                type="date" 
                                className="input" 
                                style={{ padding: '6px 12px', fontSize: '0.8rem', width: 150 }}
                                value={filterDate}
                                onChange={e => {
                                    setFilterDate(e.target.value)
                                    fetchSchedules(e.target.value)
                                }}
                            />
                            {filterDate && (
                                <button 
                                    className="btn btn-outline btn-sm" 
                                    style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                                    onClick={() => {
                                        setFilterDate('')
                                        fetchSchedules('')
                                    }}
                                >Clear</button>
                            )}
                        </div>
                    </div>

                    <div className="glass" style={{ padding: '1.25rem' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Active Schedules ({schedules.length})</h3>
                        {loading ? (
                            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Loading schedules...</div>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                            <th style={{ padding: '10px 14px', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>ROUTE</th>
                                            <th style={{ padding: '10px 14px', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>DEPARTURE</th>
                                            <th style={{ padding: '10px 14px', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>BUS (PLATE)</th>
                                            <th style={{ padding: '10px 14px', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>STATUS</th>
                                            <th style={{ padding: '10px 14px', textAlign: 'right', color: '#64748b', fontWeight: 600 }}>ACTIONS</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {schedules.map(sched => {
                                            const colors = getStatusColor(sched.status)
                                            return (
                                                <tr key={sched.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                                    <td style={{ padding: '12px 14px' }}>
                                                        <div style={{ fontWeight: 600 }}>
                                                            {sched.routes?.origin?.name} ➔ {sched.routes?.destination?.name}
                                                        </div>
                                                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>
                                                            Price: {sched.routes?.base_price_etb} ETB
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '12px 14px', fontFamily: 'monospace' }}>
                                                        <div>{sched.departure_date}</div>
                                                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>
                                                            {sched.departure_time || '—'} {sched.arrival_time ? `(Arrive: ${sched.arrival_time})` : ''}
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '12px 14px' }}>
                                                        <div style={{ fontWeight: 600, fontFamily: 'monospace' }}>{sched.buses?.plate_number}</div>
                                                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>
                                                            {sched.buses ? sched.buses.total_rows * sched.buses.total_cols : 0} seats ({sched.buses?.bus_type})
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '12px 14px' }}>
                                                        <span style={{
                                                            padding: '3px 8px', borderRadius: 12, fontSize: '0.7rem', fontWeight: 600,
                                                            background: colors.bg, color: colors.text
                                                        }}>{sched.status}</span>
                                                    </td>
                                                    <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                                                        <button 
                                                            className="btn btn-outline btn-sm" 
                                                            style={{ marginRight: 8, padding: '4px 10px', fontSize: '0.75rem' }}
                                                            onClick={() => openEditModal(sched)}
                                                        >Edit</button>
                                                        <button 
                                                            className="btn btn-danger btn-sm"
                                                            style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                                                            onClick={() => setDeletingScheduleId(sched.id)}
                                                        >Delete</button>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                        {schedules.length === 0 && (
                                            <tr>
                                                <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#475569' }}>No scheduled departures found.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* Create Schedule Form */}
                <div className="glass" style={{ padding: '1.25rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Create Schedule</h3>
                    <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: 6, fontWeight: 600 }}>SELECT ROUTE</label>
                            <select 
                                className="select" 
                                value={routeId} 
                                onChange={e => setRouteId(e.target.value)}
                                required
                            >
                                <option value="">Choose a route...</option>
                                {routes.map(r => (
                                    <option key={r.id} value={r.id}>
                                        {r.origin?.name} ➔ {r.destination?.name} ({r.base_price_etb} ETB)
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: 6, fontWeight: 600 }}>ASSIGN VEHICLE (BUS)</label>
                            <select 
                                className="select" 
                                value={busId} 
                                onChange={e => setBusId(e.target.value)}
                                required
                            >
                                <option value="">Choose a bus...</option>
                                {buses.map(b => (
                                    <option key={b.id} value={b.id}>
                                        {b.plate_number} ({b.total_rows * b.total_cols} seats · {b.bus_type})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: 6, fontWeight: 600 }}>DEPARTURE DATE</label>
                            <input 
                                type="date" 
                                className="input" 
                                value={departureDate} 
                                onChange={e => setDepartureDate(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: 6, fontWeight: 600 }}>DEPARTURE TIME</label>
                            <input 
                                type="time" 
                                className="input" 
                                value={departureTime} 
                                onChange={e => setDepartureTime(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: 6, fontWeight: 600 }}>ESTIMATED ARRIVAL (OPTIONAL)</label>
                            <input 
                                type="time" 
                                className="input" 
                                value={arrivalTime} 
                                onChange={e => setArrivalTime(e.target.value)}
                            />
                        </div>
                        <button type="submit" className="btn btn-emerald btn-full btn-sm" style={{ marginTop: '0.5rem' }}>Schedule Departure</button>
                    </form>
                </div>
            </div>

            {/* Edit Schedule Modal */}
            {editingSchedule && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 100,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
                    overflowY: 'auto', padding: '2rem 0'
                }}>
                    <div className="glass" style={{ padding: '2rem', maxWidth: 450, width: '90%' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--gold)', textAlign: 'center' }}>Edit Schedule Details</h3>
                        
                        <form onSubmit={handleSaveSchedule} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: 6, fontWeight: 600 }}>SELECT ROUTE</label>
                                <select 
                                    className="select" 
                                    value={editRouteId} 
                                    onChange={e => setEditRouteId(e.target.value)}
                                    required
                                >
                                    {routes.map(r => (
                                        <option key={r.id} value={r.id}>
                                            {r.origin?.name} ➔ {r.destination?.name} ({r.base_price_etb} ETB)
                                        </option>
                                    ))}
                                </select>
                            </div>
                            
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: 6, fontWeight: 600 }}>ASSIGN VEHICLE (BUS)</label>
                                <select 
                                    className="select" 
                                    value={editBusId} 
                                    onChange={e => setEditBusId(e.target.value)}
                                    required
                                >
                                    {buses.map(b => (
                                        <option key={b.id} value={b.id}>
                                            {b.plate_number} ({b.total_rows * b.total_cols} seats · {b.bus_type})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: 6, fontWeight: 600 }}>DEPARTURE DATE</label>
                                <input 
                                    type="date" 
                                    className="input" 
                                    value={editDepartureDate} 
                                    onChange={e => setEditDepartureDate(e.target.value)}
                                    required
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: 6, fontWeight: 600 }}>DEPARTURE TIME</label>
                                    <input 
                                        type="time" 
                                        className="input" 
                                        value={editDepartureTime} 
                                        onChange={e => setEditDepartureTime(e.target.value)}
                                        required
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: 6, fontWeight: 600 }}>ARRIVAL TIME</label>
                                    <input 
                                        type="time" 
                                        className="input" 
                                        value={editArrivalTime || ''} 
                                        onChange={e => setEditArrivalTime(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: 6, fontWeight: 600 }}>TRANSIT STATUS</label>
                                <select 
                                    className="select" 
                                    value={editStatus} 
                                    onChange={e => setEditStatus(e.target.value)}
                                    required
                                >
                                    <option value="SCHEDULED">SCHEDULED</option>
                                    <option value="IN_ROUTE">IN_ROUTE</option>
                                    <option value="COMPLETED">COMPLETED</option>
                                    <option value="CANCELLED">CANCELLED</option>
                                </select>
                            </div>

                            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                                <button type="submit" className="btn btn-emerald btn-full btn-sm">Save Changes</button>
                                <button 
                                    type="button" 
                                    className="btn btn-outline btn-full btn-sm"
                                    onClick={() => setEditingSchedule(null)}
                                >Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deletingScheduleId && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 100,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)'
                }}>
                    <div className="glass" style={{ padding: '2rem', maxWidth: 400, width: '90%', textAlign: 'center' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem', color: '#f87171' }}>Delete Schedule?</h3>
                        <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                            Warning: Deleting this schedule will also delete all generated seats for this departure. Active passenger bookings for this schedule will fail checkout.
                        </p>
                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(deletingScheduleId)}>Confirm Delete</button>
                            <button className="btn btn-outline btn-sm" onClick={() => setDeletingScheduleId(null)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
