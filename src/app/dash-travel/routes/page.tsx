"use client"

import { useEffect, useState } from 'react'

interface City {
    id: string
    name: string
}

interface RouteInfo {
    id: string
    origin_id: string
    destination_id: string
    base_price_etb: number
    distance_km: number | null
    origin: { id: string; name: string }
    destination: { id: string; name: string }
    created_at: string
}

export default function RoutesAdmin() {
    const [routes, setRoutes] = useState<RouteInfo[]>([])
    const [cities, setCities] = useState<City[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    // Form states
    const [originId, setOriginId] = useState('')
    const [destinationId, setDestinationId] = useState('')
    const [basePrice, setBasePrice] = useState('')
    const [distanceKm, setDistanceKm] = useState('')
    const [editingRoute, setEditingRoute] = useState<RouteInfo | null>(null)

    // Delete confirmation
    const [deletingRouteId, setDeletingRouteId] = useState<string | null>(null)

    const fetchData = async () => {
        setLoading(true)
        setError('')
        try {
            const [routesRes, citiesRes] = await Promise.all([
                fetch('/api/admin/routes'),
                fetch('/api/cities')
            ])

            if (routesRes.ok && citiesRes.ok) {
                const routesData = await routesRes.json()
                const citiesData = await citiesRes.json()
                setRoutes(routesData)
                setCities(citiesData)
            } else {
                // Surface the actual error from the API response
                const failedRes = !routesRes.ok ? routesRes : citiesRes
                const errData = await failedRes.json().catch(() => ({}))
                setError(errData.error || `API error ${failedRes.status}: Failed to fetch routes or cities data`)
            }
        } catch {
            setError('Connection error occurred while loading data')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setSuccess('')

        if (!originId || !destinationId || !basePrice) {
            setError('Origin city, destination city, and base price are required')
            return
        }
        if (originId === destinationId) {
            setError('Origin and destination cities must be different')
            return
        }

        try {
            const res = await fetch('/api/admin/routes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    origin_id: originId,
                    destination_id: destinationId,
                    base_price_etb: parseFloat(basePrice),
                    distance_km: distanceKm ? parseFloat(distanceKm) : null,
                }),
            })

            const data = await res.json()
            if (res.ok) {
                setSuccess('Route created successfully!')
                setOriginId('')
                setDestinationId('')
                setBasePrice('')
                setDistanceKm('')
                fetchData()
            } else {
                setError(data.error || 'Failed to create route')
            }
        } catch {
            setError('Failed to create route')
        }
    }

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingRoute) return
        setError('')
        setSuccess('')

        try {
            const res = await fetch('/api/admin/routes', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: editingRoute.id,
                    base_price_etb: editingRoute.base_price_etb,
                    distance_km: editingRoute.distance_km,
                }),
            })

            const data = await res.json()
            if (res.ok) {
                setSuccess('Route updated successfully!')
                setEditingRoute(null)
                fetchData()
            } else {
                setError(data.error || 'Failed to update route')
            }
        } catch {
            setError('Failed to update route')
        }
    }

    const handleDelete = async (id: string) => {
        setError('')
        setSuccess('')
        try {
            const res = await fetch('/api/admin/routes', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            })

            if (res.ok) {
                setSuccess('Route deleted successfully!')
                setDeletingRouteId(null)
                fetchData()
            } else {
                const data = await res.json()
                setError(data.error || 'Failed to delete route')
            }
        } catch {
            setError('Failed to delete route')
        }
    }

    return (
        <div className="animate-fade">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '0.25rem' }}>Routes Management</h1>
                    <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Define pathways between cities and configure their pricing</p>
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem', alignItems: 'start' }}>
                
                {/* Routes List */}
                <div className="glass" style={{ padding: '1.25rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Active Routes ({routes.length})</h3>
                    {loading ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Loading routes...</div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                        <th style={{ padding: '10px 14px', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>ORIGIN</th>
                                        <th style={{ padding: '10px 14px', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>DESTINATION</th>
                                        <th style={{ padding: '10px 14px', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>DISTANCE</th>
                                        <th style={{ padding: '10px 14px', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>BASE PRICE</th>
                                        <th style={{ padding: '10px 14px', textAlign: 'right', color: '#64748b', fontWeight: 600 }}>ACTIONS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {routes.map(route => (
                                        <tr key={route.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                            <td style={{ padding: '12px 14px', fontWeight: 600 }}>{route.origin?.name || 'Unknown'}</td>
                                            <td style={{ padding: '12px 14px', fontWeight: 600 }}>{route.destination?.name || 'Unknown'}</td>
                                            <td style={{ padding: '12px 14px' }}>{route.distance_km ? `${route.distance_km} KM` : '—'}</td>
                                            <td style={{ padding: '12px 14px', color: '#4ade80', fontWeight: 600 }}>{route.base_price_etb} ETB</td>
                                            <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                                                <button 
                                                    className="btn btn-outline btn-sm" 
                                                    style={{ marginRight: 8, padding: '4px 10px', fontSize: '0.75rem' }}
                                                    onClick={() => setEditingRoute(route)}
                                                >Edit</button>
                                                <button 
                                                    className="btn btn-danger btn-sm"
                                                    style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                                                    onClick={() => setDeletingRouteId(route.id)}
                                                >Delete</button>
                                            </td>
                                        </tr>
                                    ))}
                                    {routes.length === 0 && (
                                        <tr>
                                            <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#475569' }}>No routes defined yet.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Create/Edit Form */}
                <div>
                    {editingRoute ? (
                        <div className="glass" style={{ padding: '1.25rem', border: '1px solid var(--gold)' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--gold)' }}>Edit Route Pricing</h3>
                            <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, marginBottom: '1rem', fontSize: '0.8rem' }}>
                                <p style={{ color: '#94a3b8' }}>Route details:</p>
                                <p style={{ fontWeight: 600, fontSize: '0.85rem', marginTop: 2 }}>
                                    {editingRoute.origin?.name} ➔ {editingRoute.destination?.name}
                                </p>
                            </div>
                            <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: 6, fontWeight: 600 }}>BASE PRICE (ETB)</label>
                                    <input 
                                        type="number" 
                                        className="input" 
                                        value={editingRoute.base_price_etb} 
                                        onChange={e => setEditingRoute({ ...editingRoute, base_price_etb: parseFloat(e.target.value) })}
                                        required
                                        min={0}
                                        step="0.01"
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: 6, fontWeight: 600 }}>DISTANCE (KM)</label>
                                    <input 
                                        type="number" 
                                        className="input" 
                                        value={editingRoute.distance_km || ''} 
                                        onChange={e => setEditingRoute({ ...editingRoute, distance_km: e.target.value ? parseFloat(e.target.value) : null })}
                                        min={0}
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                    <button type="submit" className="btn btn-gold btn-full btn-sm">Save Changes</button>
                                    <button 
                                        type="button" 
                                        className="btn btn-outline btn-full btn-sm"
                                        onClick={() => setEditingRoute(null)}
                                    >Cancel</button>
                                </div>
                            </form>
                        </div>
                    ) : (
                        <div className="glass" style={{ padding: '1.25rem' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Create Route</h3>
                            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: 6, fontWeight: 600 }}>ORIGIN CITY</label>
                                    <select 
                                        className="select" 
                                        value={originId} 
                                        onChange={e => setOriginId(e.target.value)}
                                        required
                                    >
                                        <option value="">Select Origin...</option>
                                        {cities.map(city => (
                                            <option key={city.id} value={city.id}>{city.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: 6, fontWeight: 600 }}>DESTINATION CITY</label>
                                    <select 
                                        className="select" 
                                        value={destinationId} 
                                        onChange={e => setDestinationId(e.target.value)}
                                        required
                                    >
                                        <option value="">Select Destination...</option>
                                        {cities.map(city => (
                                            <option key={city.id} value={city.id}>{city.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: 6, fontWeight: 600 }}>BASE PRICE (ETB)</label>
                                    <input 
                                        type="number" 
                                        className="input" 
                                        placeholder="e.g. 350" 
                                        value={basePrice} 
                                        onChange={e => setBasePrice(e.target.value)}
                                        required
                                        min={0}
                                        step="0.01"
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: 6, fontWeight: 600 }}>DISTANCE (KM)</label>
                                    <input 
                                        type="number" 
                                        className="input" 
                                        placeholder="e.g. 275 (optional)" 
                                        value={distanceKm} 
                                        onChange={e => setDistanceKm(e.target.value)}
                                        min={0}
                                    />
                                </div>
                                <button type="submit" className="btn btn-emerald btn-full btn-sm" style={{ marginTop: '0.5rem' }}>Create Route</button>
                            </form>
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {deletingRouteId && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 100,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)'
                }}>
                    <div className="glass" style={{ padding: '2rem', maxWidth: 400, width: '90%', textAlign: 'center' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem', color: '#f87171' }}>Delete Route?</h3>
                        <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                            Are you sure you want to remove this route? This action cannot be undone and will delete all schedules associated with this route.
                        </p>
                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(deletingRouteId)}>Confirm Delete</button>
                            <button className="btn btn-outline btn-sm" onClick={() => setDeletingRouteId(null)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
