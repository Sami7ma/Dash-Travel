"use client"

import { useEffect, useState } from 'react'

interface StaffMember {
    id: string
    emp_number: string
    full_name: string
    role: string
    is_active: boolean
    created_at: string
}

export default function StaffAdmin() {
    const [staffList, setStaffList] = useState<StaffMember[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    // Form states (Create)
    const [fullName, setFullName] = useState('')
    const [password, setPassword] = useState('')
    const [role, setRole] = useState('ADMIN')

    // Editing state
    const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null)
    const [editFullName, setEditFullName] = useState('')
    const [editPassword, setEditPassword] = useState('')
    const [editIsActive, setEditIsActive] = useState(true)

    const fetchStaff = async () => {
        setLoading(true)
        setError('')
        try {
            const res = await fetch('/api/admin/staff')
            if (res.ok) {
                const data = await res.json()
                setStaffList(data)
            } else {
                if (res.status === 403) {
                    setError('Access Denied: Super Admin permissions required to manage staff.')
                } else {
                    setError('Failed to fetch staff list')
                }
            }
        } catch {
            setError('Connection error occurred while loading staff list')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchStaff()
    }, [])

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setSuccess('')

        if (!fullName.trim() || !password || !role) {
            setError('Name, password, and role are required')
            return
        }
        if (password.length < 8) {
            setError('Password must be at least 8 characters')
            return
        }

        try {
            const res = await fetch('/api/admin/staff', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    full_name: fullName,
                    password: password,
                    role: role,
                }),
            })

            const data = await res.json()
            if (res.ok) {
                setSuccess(`Staff account created! Employee Number: ${data.emp_number}`)
                setFullName('')
                setPassword('')
                setRole('ADMIN')
                fetchStaff()
            } else {
                setError(data.error || 'Failed to create staff account')
            }
        } catch {
            setError('Failed to create staff account')
        }
    }

    const startEditing = (member: StaffMember) => {
        setEditingStaff(member)
        setEditFullName(member.full_name)
        setEditPassword('')
        setEditIsActive(member.is_active)
    }

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingStaff) return
        setError('')
        setSuccess('')

        if (editPassword && editPassword.length < 8) {
            setError('New password must be at least 8 characters')
            return
        }

        try {
            const res = await fetch('/api/admin/staff', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: editingStaff.id,
                    full_name: editFullName,
                    is_active: editIsActive,
                    password: editPassword || undefined,
                }),
            })

            const data = await res.json()
            if (res.ok) {
                setSuccess(`Staff member ${data.emp_number} updated successfully!`)
                setEditingStaff(null)
                fetchStaff()
            } else {
                setError(data.error || 'Failed to update staff member')
            }
        } catch {
            setError('Failed to update staff member')
        }
    }

    return (
        <div className="animate-fade">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '0.25rem' }}>Staff Management</h1>
                    <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Administer system operators, assign credentials, and audit operational access</p>
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
                
                {/* Staff list */}
                <div className="glass" style={{ padding: '1.25rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Registered Operators ({staffList.length})</h3>
                    {loading && staffList.length === 0 ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Loading operator directory...</div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                        <th style={{ padding: '10px 14px', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>EMP NUMBER</th>
                                        <th style={{ padding: '10px 14px', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>FULL NAME</th>
                                        <th style={{ padding: '10px 14px', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>ROLE</th>
                                        <th style={{ padding: '10px 14px', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>STATUS</th>
                                        <th style={{ padding: '10px 14px', textAlign: 'right', color: '#64748b', fontWeight: 600 }}>ACTIONS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {staffList.map(member => (
                                        <tr key={member.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', opacity: member.is_active ? 1 : 0.5 }}>
                                            <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontWeight: 700, color: '#fbbf24' }}>
                                                {member.emp_number}
                                            </td>
                                            <td style={{ padding: '12px 14px', fontWeight: 600 }}>{member.full_name}</td>
                                            <td style={{ padding: '12px 14px' }}>
                                                <span style={{
                                                    padding: '2px 8px', borderRadius: 12, fontSize: '0.7rem', fontWeight: 600,
                                                    background: member.role === 'SUPER_ADMIN' ? 'rgba(234,179,8,0.15)' : 'rgba(59,130,246,0.15)',
                                                    color: member.role === 'SUPER_ADMIN' ? '#facc15' : '#60a5fa'
                                                }}>{member.role}</span>
                                            </td>
                                            <td style={{ padding: '12px 14px' }}>
                                                <span style={{
                                                    padding: '2px 8px', borderRadius: 12, fontSize: '0.7rem', fontWeight: 600,
                                                    background: member.is_active ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                                                    color: member.is_active ? '#4ade80' : '#f87171'
                                                }}>{member.is_active ? 'Active' : 'Deactivated'}</span>
                                            </td>
                                            <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                                                <button 
                                                    className="btn btn-outline btn-sm" 
                                                    style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                                                    onClick={() => startEditing(member)}
                                                >Edit</button>
                                            </td>
                                        </tr>
                                    ))}
                                    {staffList.length === 0 && !loading && (
                                        <tr>
                                            <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#475569' }}>No operators listed.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Edit or Create staff */}
                <div>
                    {editingStaff ? (
                        <div className="glass" style={{ padding: '1.25rem', border: '1px solid var(--gold)' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--gold)' }}>Edit Operator</h3>
                            <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, marginBottom: '1rem', fontSize: '0.8rem' }}>
                                <span style={{ color: '#64748b' }}>Operator:</span>
                                <span style={{ fontWeight: 700, fontFamily: 'monospace', marginLeft: 6 }}>{editingStaff.emp_number}</span>
                            </div>
                            <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: 6, fontWeight: 600 }}>FULL NAME</label>
                                    <input 
                                        type="text" 
                                        className="input" 
                                        value={editFullName} 
                                        onChange={e => setEditFullName(e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: 6, fontWeight: 600 }}>RESET PASSWORD (OPTIONAL)</label>
                                    <input 
                                        type="password" 
                                        className="input" 
                                        placeholder="Min 8 characters (leave blank to keep)" 
                                        value={editPassword} 
                                        onChange={e => setEditPassword(e.target.value)}
                                    />
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '4px 0' }}>
                                    <input 
                                        type="checkbox" 
                                        id="activeStatus"
                                        checked={editIsActive} 
                                        onChange={e => setEditIsActive(e.target.checked)}
                                        style={{ width: 16, height: 16, cursor: 'pointer' }}
                                    />
                                    <label htmlFor="activeStatus" style={{ fontSize: '0.85rem', color: '#cbd5e1', cursor: 'pointer', fontWeight: 500 }}>
                                        Account is Active
                                    </label>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                    <button type="submit" className="btn btn-gold btn-full btn-sm">Save changes</button>
                                    <button 
                                        type="button" 
                                        className="btn btn-outline btn-full btn-sm"
                                        onClick={() => setEditingStaff(null)}
                                    >Cancel</button>
                                </div>
                            </form>
                        </div>
                    ) : (
                        <div className="glass" style={{ padding: '1.25rem' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Register Operator</h3>
                            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: 6, fontWeight: 600 }}>FULL NAME</label>
                                    <input 
                                        type="text" 
                                        className="input" 
                                        placeholder="e.g. Samuel Kebede" 
                                        value={fullName} 
                                        onChange={e => setFullName(e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: 6, fontWeight: 600 }}>ROLE / LEVEL</label>
                                    <select 
                                        className="select" 
                                        value={role} 
                                        onChange={e => setRole(e.target.value)}
                                        required
                                    >
                                        <option value="ADMIN">ADMIN (Operations)</option>
                                        <option value="SUPER_ADMIN">SUPER ADMIN (Management)</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: 6, fontWeight: 600 }}>INITIAL PASSWORD</label>
                                    <input 
                                        type="password" 
                                        className="input" 
                                        placeholder="Minimum 8 characters" 
                                        value={password} 
                                        onChange={e => setPassword(e.target.value)}
                                        required
                                    />
                                </div>
                                <button type="submit" className="btn btn-emerald btn-full btn-sm" style={{ marginTop: '0.5rem' }}>Generate Operator</button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
