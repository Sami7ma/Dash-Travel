"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function StaffLogin() {
    const router = useRouter()
    const [empNumber, setEmpNumber] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        const res = await fetch('/api/staff/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ empNumber, password }),
        })
        const data = await res.json()

        if (data.success) {
            router.push('/bmc-ops/dashboard')
        } else {
            setError(data.error || 'Login failed')
        }
        setLoading(false)
    }

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #0a0e1a 0%, #111827 50%, #0a0e1a 100%)',
            padding: '2rem',
        }}>
            <div style={{
                width: '100%',
                maxWidth: 400,
                background: 'rgba(17,24,39,0.8)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 16,
                padding: '2.5rem',
            }}>
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{
                        width: 50, height: 50,
                        background: 'linear-gradient(135deg, #16a34a, #059669)',
                        borderRadius: 12,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 1rem',
                        fontSize: '1.5rem',
                    }}>🛡️</div>
                    <h1 style={{
                        fontSize: '1.3rem',
                        fontFamily: 'Outfit, sans-serif',
                        fontWeight: 700,
                        color: '#f1f5f9',
                        letterSpacing: '0.5px',
                    }}>Staff Portal</h1>
                    <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: 4 }}>
                        Authorized personnel only
                    </p>
                </div>

                {/* Error */}
                {error && (
                    <div style={{
                        background: 'rgba(239,68,68,0.1)',
                        border: '1px solid rgba(239,68,68,0.3)',
                        borderRadius: 8,
                        padding: '10px 14px',
                        marginBottom: '1rem',
                        color: '#ef4444',
                        fontSize: '0.85rem',
                    }}>
                        {error}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label style={{
                            display: 'block', fontSize: '0.75rem', color: '#94a3b8',
                            marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1,
                        }}>Employee Number</label>
                        <input
                            type="text"
                            placeholder="EMP001 or SUPEMP001"
                            value={empNumber}
                            onChange={e => setEmpNumber(e.target.value)}
                            required
                            style={{
                                width: '100%', padding: '12px 14px', fontSize: '0.95rem',
                                background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: 10, color: '#f1f5f9', outline: 'none',
                                fontFamily: 'monospace',
                            }}
                        />
                    </div>

                    <div>
                        <label style={{
                            display: 'block', fontSize: '0.75rem', color: '#94a3b8',
                            marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1,
                        }}>Password</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            style={{
                                width: '100%', padding: '12px 14px', fontSize: '0.95rem',
                                background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: 10, color: '#f1f5f9', outline: 'none',
                            }}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%', padding: '13px', fontSize: '0.95rem', fontWeight: 700,
                            background: loading ? '#1e293b' : 'linear-gradient(135deg, #16a34a, #059669)',
                            color: '#fff', border: 'none', borderRadius: 10, cursor: loading ? 'not-allowed' : 'pointer',
                            marginTop: '0.5rem',
                            transition: 'all 0.2s',
                        }}
                    >
                        {loading ? 'Authenticating...' : 'Sign In'}
                    </button>
                </form>

                <p style={{ textAlign: 'center', color: '#475569', fontSize: '0.7rem', marginTop: '2rem' }}>
                    Bemengede Transport Management System
                </p>
            </div>
        </div>
    )
}
