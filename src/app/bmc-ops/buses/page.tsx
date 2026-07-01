"use client"

import { useEffect, useState } from 'react'

interface Bus {
    id: string
    plate_number: string
    total_rows: number
    total_cols: number
    bus_type: string
    created_at: string
}

export default function BusesAdmin() {
    const [buses, setBuses] = useState<Bus[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    // Form states
    const [plateNumber, setPlateNumber] = useState('')
    const [totalSeats, setTotalSeats] = useState(48) // default capacity
    const [busType, setBusType] = useState('STANDARD')
    const [editingBus, setEditingBus] = useState<Bus | null>(null)

    // Delete confirmation
    const [deletingBusId, setDeletingBusId] = useState<string | null>(null)

    const fetchBuses = async () => {
        setLoading(true)
        setError('')
        try {
            const res = await fetch('/api/admin/buses')
            if (res.ok) {
                const data = await res.json()
                setBuses(data)
            } else {
                const errData = await res.json()
                setError(errData.error || 'Failed to fetch buses')
            }
        } catch {
            setError('Connection error')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchBuses()
    }, [])

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setSuccess('')

        if (!plateNumber.trim() || !totalSeats) {
            setError('Plate number and total seats are required')
            return
        }

        try {
            const res = await fetch('/api/admin/buses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    plate_number: plateNumber,
                    total_seats: totalSeats,
                    bus_type: busType,
                }),
            })

            const data = await res.json()
            if (res.ok) {
                setSuccess(`Bus ${data.plate_number} created successfully!`)
                setPlateNumber('')
                setTotalSeats(49)
                setBusType('STANDARD')
                fetchBuses()
            } else {
                setError(data.error || 'Failed to create bus')
            }
        } catch {
            setError('Failed to create bus')
        }
    }

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingBus) return
        setError('')
        setSuccess('')

        try {
            const res = await fetch('/api/admin/buses', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: editingBus.id,
                    plate_number: editingBus.plate_number,
                    total_seats: editingBus.total_rows * editingBus.total_cols,
                    bus_type: editingBus.bus_type,
                }),
            })

            const data = await res.json()
            if (res.ok) {
                setSuccess(`Bus ${data.plate_number} updated successfully!`)
                setEditingBus(null)
                fetchBuses()
            } else {
                setError(data.error || 'Failed to update bus')
            }
        } catch {
            setError('Failed to update bus')
        }
    }

    const handleDelete = async (id: string) => {
        setError('')
        setSuccess('')
        try {
            const res = await fetch('/api/admin/buses', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            })

            if (res.ok) {
                setSuccess('Bus deleted successfully!')
                setDeletingBusId(null)
                fetchBuses()
            } else {
                const data = await res.json()
                setError(data.error || 'Failed to delete bus')
            }
        } catch {
            setError('Failed to delete bus')
        }
    }

    return (
        <div className="animate-fade">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '0.25rem' }}>Fleet Management</h1>
                    <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Manage transport vehicles, seat capacities, and specifications</p>
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem', alignItems: 'start' }}>
                
                {/* Buses List */}
                <div className="glass" style={{ padding: '1.25rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Active Fleet ({buses.length})</h3>
                    {loading ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Loading buses...</div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                        <th style={{ padding: '10px 14px', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>PLATE NUMBER</th>
                                        <th style={{ padding: '10px 14px', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>CAPACITY</th>
                                        <th style={{ padding: '10px 14px', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>TYPE</th>
                                        <th style={{ padding: '10px 14px', textAlign: 'right', color: '#64748b', fontWeight: 600 }}>ACTIONS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {buses.map(bus => (
                                        <tr key={bus.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                            <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontWeight: 700, fontSize: '0.9rem' }}>{bus.plate_number}</td>
                                            <td style={{ padding: '12px 14px' }}>{bus.total_rows * bus.total_cols} Seats</td>
                                            <td style={{ padding: '12px 14px' }}>
                                                <span style={{
                                                    padding: '2px 8px', borderRadius: 12, fontSize: '0.7rem', fontWeight: 600,
                                                    background: bus.bus_type === 'LUXURY' ? 'rgba(139,92,246,0.15)' : bus.bus_type === 'VIP' ? 'rgba(234,179,8,0.15)' : 'rgba(148,163,184,0.15)',
                                                    color: bus.bus_type === 'LUXURY' ? '#a78bfa' : bus.bus_type === 'VIP' ? '#facc15' : '#cbd5e1',
                                                }}>
                                                    {bus.bus_type}
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                                                <button 
                                                    className="btn btn-outline btn-sm" 
                                                    style={{ marginRight: 8, padding: '4px 10px', fontSize: '0.75rem' }}
                                                    onClick={() => setEditingBus(bus)}
                                                >Edit</button>
                                                <button 
                                                    className="btn btn-danger btn-sm"
                                                    style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                                                    onClick={() => setDeletingBusId(bus.id)}
                                                >Delete</button>
                                            </td>
                                        </tr>
                                    ))}
                                    {buses.length === 0 && (
                                        <tr>
                                            <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: '#475569' }}>No buses added yet.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Create/Edit Form */}
                <div>
                    {editingBus ? (
                        <div className="glass" style={{ padding: '1.25rem', border: '1px solid var(--gold)' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--gold)' }}>Edit Bus Details</h3>
                            <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: 6, fontWeight: 600 }}>PLATE NUMBER</label>
                                    <input 
                                        type="text" 
                                        className="input" 
                                        value={editingBus.plate_number} 
                                        onChange={e => setEditingBus({ ...editingBus, plate_number: e.target.value })}
                                        required
                                        style={{ fontFamily: 'monospace' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: 6, fontWeight: 600 }}>SEAT CAPACITY</label>
                                    <input 
                                        type="number" 
                                        className="input" 
                                        value={editingBus.total_rows * editingBus.total_cols} 
                                        onChange={e => {
                                            const seats = parseInt(e.target.value) || 40
                                            setEditingBus({ ...editingBus, total_cols: 4, total_rows: Math.ceil(seats / 4) })
                                        }}
                                        required
                                        min={1}
                                        max={100}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: 6, fontWeight: 600 }}>BUS TYPE</label>
                                    <select 
                                        className="select" 
                                        value={editingBus.bus_type} 
                                        onChange={e => setEditingBus({ ...editingBus, bus_type: e.target.value })}
                                    >
                                        <option value="STANDARD">STANDARD</option>
                                        <option value="VIP">VIP</option>
                                        <option value="LUXURY">LUXURY</option>
                                    </select>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                    <button type="submit" className="btn btn-gold btn-full btn-sm">Save Changes</button>
                                    <button 
                                        type="button" 
                                        className="btn btn-outline btn-full btn-sm"
                                        onClick={() => setEditingBus(null)}
                                    >Cancel</button>
                                </div>
                            </form>
                        </div>
                    ) : (
                        <div className="glass" style={{ padding: '1.25rem' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Add New Bus</h3>
                            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: 6, fontWeight: 600 }}>PLATE NUMBER</label>
                                    <input 
                                        type="text" 
                                        className="input" 
                                        placeholder="e.g. AA 3-B12345" 
                                        value={plateNumber} 
                                        onChange={e => setPlateNumber(e.target.value)}
                                        required
                                        style={{ fontFamily: 'monospace' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: 6, fontWeight: 600 }}>SEAT CAPACITY</label>
                                    <input 
                                        type="number" 
                                        className="input" 
                                        value={totalSeats} 
                                        onChange={e => setTotalSeats(parseInt(e.target.value))}
                                        required
                                        min={1}
                                        max={100}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: 6, fontWeight: 600 }}>BUS TYPE</label>
                                    <select 
                                        className="select" 
                                        value={busType} 
                                        onChange={e => setBusType(e.target.value)}
                                    >
                                        <option value="STANDARD">STANDARD</option>
                                        <option value="VIP">VIP</option>
                                        <option value="LUXURY">LUXURY</option>
                                    </select>
                                </div>
                                <button type="submit" className="btn btn-emerald btn-full btn-sm" style={{ marginTop: '0.5rem' }}>Register Bus</button>
                            </form>
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {deletingBusId && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 100,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)'
                }}>
                    <div className="glass" style={{ padding: '2rem', maxWidth: 400, width: '90%', textAlign: 'center' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem', color: '#f87171' }}>Delete Bus?</h3>
                        <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                            Are you sure you want to remove this bus? This action is permanent and might affect active schedules using this bus.
                        </p>
                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(deletingBusId)}>Confirm Delete</button>
                            <button className="btn btn-outline btn-sm" onClick={() => setDeletingBusId(null)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
