"use client"

import { useEffect, useState } from 'react'

interface StaffMember {
    id: string
    emp_number: string
    full_name: string
}

interface AuditLog {
    id: string
    staff_id: string
    action: string
    entity_type: string | null
    entity_id: string | null
    details: any
    ip_address: string | null
    created_at: string
    staff: { emp_number: string; full_name: string } | null
}

export default function AuditAdmin() {
    const [logs, setLogs] = useState<AuditLog[]>([])
    const [staffList, setStaffList] = useState<StaffMember[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    // Filters
    const [actionFilter, setActionFilter] = useState('ALL')
    const [staffFilter, setStaffFilter] = useState('ALL')
    const [limit, setLimit] = useState(100)

    // Expandable logs details state
    const [expandedLogId, setExpandedLogId] = useState<string | null>(null)

    const fetchLogs = async () => {
        setLoading(true)
        setError('')
        try {
            let url = `/api/admin/audit?limit=${limit}`
            if (actionFilter !== 'ALL') {
                url += `&action=${actionFilter}`
            }
            if (staffFilter !== 'ALL') {
                url += `&staff_id=${staffFilter}`
            }
            const res = await fetch(url)
            if (res.ok) {
                const data = await res.json()
                setLogs(data)
            } else {
                if (res.status === 403) {
                    setError('Access Denied: Super Admin permissions required to view audit logs.')
                } else {
                    setError('Failed to fetch audit logs')
                }
            }
        } catch {
            setError('Connection error occurred while loading audit logs')
        } finally {
            setLoading(false)
        }
    }

    const fetchStaffList = async () => {
        try {
            const res = await fetch('/api/admin/staff')
            if (res.ok) {
                const data = await res.json()
                setStaffList(data)
            }
        } catch {
            // Ignore if regular admin is trying to access and this fails
        }
    }

    useEffect(() => {
        fetchLogs()
        fetchStaffList()
    }, [actionFilter, staffFilter, limit])

    const getActionColor = (action: string) => {
        switch (action) {
            case 'CREATE': return { bg: 'rgba(34,197,94,0.15)', text: '#4ade80' }
            case 'UPDATE': return { bg: 'rgba(234,179,8,0.15)', text: '#facc15' }
            case 'DELETE': return { bg: 'rgba(239,68,68,0.15)', text: '#f87171' }
            case 'LOGIN': return { bg: 'rgba(59,130,246,0.15)', text: '#60a5fa' }
            case 'LOGOUT': return { bg: 'rgba(148,163,184,0.15)', text: '#cbd5e1' }
            default: return { bg: 'rgba(255,255,255,0.05)', text: '#cbd5e1' }
        }
    }

    return (
        <div className="animate-fade">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '0.25rem' }}>Audit Log & History</h1>
                    <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Inspect administrative actions, login events, and transaction cancellations</p>
                </div>
            </div>

            {/* Error/Access messages */}
            {error && (
                <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, color: '#ef4444', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                    ⚠️ {error}
                </div>
            )}

            {/* Filters */}
            <div className="glass" style={{ padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                
                <div style={{ width: 160 }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: 6, fontWeight: 600 }}>ACTION TYPE</label>
                    <select 
                        className="select" 
                        value={actionFilter} 
                        onChange={e => setActionFilter(e.target.value)}
                        style={{ padding: '10px 14px', fontSize: '0.9rem' }}
                    >
                        <option value="ALL">All Actions</option>
                        <option value="LOGIN">LOGIN</option>
                        <option value="LOGOUT">LOGOUT</option>
                        <option value="CREATE">CREATE</option>
                        <option value="UPDATE">UPDATE</option>
                        <option value="DELETE">DELETE</option>
                    </select>
                </div>

                <div style={{ flex: 1, minWidth: 200 }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: 6, fontWeight: 600 }}>FILTER BY OPERATOR</label>
                    <select 
                        className="select" 
                        value={staffFilter} 
                        onChange={e => setStaffFilter(e.target.value)}
                        style={{ padding: '10px 14px', fontSize: '0.9rem' }}
                    >
                        <option value="ALL">All Staff Members</option>
                        {staffList.map(member => (
                            <option key={member.id} value={member.id}>
                                {member.full_name} ({member.emp_number})
                            </option>
                        ))}
                    </select>
                </div>

                <div style={{ width: 120 }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: 6, fontWeight: 600 }}>ROW LIMIT</label>
                    <select 
                        className="select" 
                        value={limit} 
                        onChange={e => setLimit(parseInt(e.target.value))}
                        style={{ padding: '10px 14px', fontSize: '0.9rem' }}
                    >
                        <option value="50">50 entries</option>
                        <option value="100">100 entries</option>
                        <option value="200">200 entries</option>
                        <option value="500">500 entries</option>
                    </select>
                </div>

                <button 
                    className="btn btn-outline btn-sm" 
                    style={{ padding: '12px 18px', height: 45, display: 'flex', alignItems: 'center' }}
                    onClick={fetchLogs}
                >Refresh</button>
            </div>

            {/* Logs List */}
            <div className="glass" style={{ padding: '1.25rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.5rem' }}>Operations Audit Trail ({logs.length})</h3>
                {loading && logs.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Querying security log...</div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                    <th style={{ width: 40 }}></th>
                                    <th style={{ padding: '10px 14px', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>TIMESTAMP</th>
                                    <th style={{ padding: '10px 14px', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>OPERATOR</th>
                                    <th style={{ padding: '10px 14px', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>ACTION</th>
                                    <th style={{ padding: '10px 14px', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>TARGET ENTITY</th>
                                    <th style={{ padding: '10px 14px', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>IP ADDRESS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map(log => {
                                    const colors = getActionColor(log.action)
                                    const isExpanded = expandedLogId === log.id
                                    return (
                                        <>
                                            <tr 
                                                key={log.id} 
                                                style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer' }}
                                                onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                                            >
                                                <td style={{ padding: '12px 0', textAlign: 'center', color: 'var(--gold)', fontSize: '0.7rem' }}>
                                                    {isExpanded ? '▼' : '▶'}
                                                </td>
                                                <td style={{ padding: '12px 14px', color: '#94a3b8' }}>
                                                    {new Date(log.created_at).toLocaleString()}
                                                </td>
                                                <td style={{ padding: '12px 14px' }}>
                                                    {log.staff ? (
                                                        <div>
                                                            <div style={{ fontWeight: 600 }}>{log.staff.full_name}</div>
                                                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2, fontFamily: 'monospace' }}>
                                                                {log.staff.emp_number}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span style={{ color: '#ef4444', fontWeight: 600 }}>Deleted Staff</span>
                                                    )}
                                                </td>
                                                <td style={{ padding: '12px 14px' }}>
                                                    <span style={{
                                                        padding: '3px 8px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 700,
                                                        background: colors.bg, color: colors.text
                                                    }}>{log.action}</span>
                                                </td>
                                                <td style={{ padding: '12px 14px' }}>
                                                    {log.entity_type ? (
                                                        <div>
                                                            <span style={{ fontWeight: 600, color: '#f1f5f9', textTransform: 'capitalize' }}>
                                                                {log.entity_type}
                                                            </span>
                                                            <span style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace', marginLeft: 8 }}>
                                                                #{log.entity_id}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span style={{ color: '#64748b' }}>—</span>
                                                    )}
                                                </td>
                                                <td style={{ padding: '12px 14px', fontFamily: 'monospace', color: '#94a3b8' }}>
                                                    {log.ip_address || 'unknown'}
                                                </td>
                                            </tr>
                                            {isExpanded && (
                                                <tr style={{ background: 'rgba(255,255,255,0.01)' }}>
                                                    <td colSpan={6} style={{ padding: '1rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                                        <div style={{
                                                            padding: '1rem',
                                                            background: 'rgba(15,23,42,0.8)',
                                                            border: '1px solid rgba(255,255,255,0.05)',
                                                            borderRadius: 8,
                                                            overflowX: 'auto'
                                                        }}>
                                                            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: 6 }}>LOGGED DETAILS:</p>
                                                            <pre style={{
                                                                fontFamily: 'monospace', fontSize: '0.8rem', color: '#a78bfa',
                                                                whiteSpace: 'pre-wrap', wordBreak: 'break-all'
                                                            }}>
                                                                {JSON.stringify(log.details, null, 2)}
                                                            </pre>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </>
                                    )
                                })}
                                {logs.length === 0 && !loading && (
                                    <tr>
                                        <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#475569' }}>No audit records match the selected filters.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}
