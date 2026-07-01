"use client"

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'

interface StaffInfo {
    emp_number: string
    full_name: string
    role: string
}

const ADMIN_NAV = [
    { href: '/bmc-ops/dashboard', label: 'Dashboard', icon: '📊', roles: ['ADMIN', 'SUPER_ADMIN'] },
    { href: '/bmc-ops/schedules', label: 'Schedules', icon: '📅', roles: ['ADMIN', 'SUPER_ADMIN'] },
    { href: '/bmc-ops/routes', label: 'Routes', icon: '🛤️', roles: ['ADMIN', 'SUPER_ADMIN'] },
    { href: '/bmc-ops/buses', label: 'Buses', icon: '🚌', roles: ['SUPER_ADMIN'] },
    { href: '/bmc-ops/bookings', label: 'Bookings', icon: '🎫', roles: ['ADMIN', 'SUPER_ADMIN'] },
    { href: '/bmc-ops/staff', label: 'Staff', icon: '👥', roles: ['SUPER_ADMIN'] },
    { href: '/bmc-ops/audit', label: 'Audit Log', icon: '📋', roles: ['SUPER_ADMIN'] },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const pathname = usePathname()
    const [staff, setStaff] = useState<StaffInfo | null>(null)
    const [loading, setLoading] = useState(true)
    const [sidebarOpen, setSidebarOpen] = useState(true)

    // All hooks must be called before any conditional return
    useEffect(() => {
        async function checkAuth() {
            const res = await fetch('/api/staff/me')
            if (res.ok) {
                const data = await res.json()
                setStaff(data.staff)
            } else {
                router.push('/bmc-ops/login')
            }
            setLoading(false)
        }
        checkAuth()
    }, [])

    const handleLogout = async () => {
        await fetch('/api/staff/logout', { method: 'POST' })
        router.push('/bmc-ops/login')
    }

    // Login page bypasses the admin shell (safe here — after all hooks)
    if (pathname === '/bmc-ops/login') return <>{children}</>

    if (loading) return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0e1a' }}>
            <div style={{ color: '#64748b', fontSize: '1rem' }}>Loading...</div>
        </div>
    )

    const visibleNav = ADMIN_NAV.filter(n => n.roles.includes(staff?.role || ''))

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0e1a', color: '#f1f5f9' }}>
            {/* Sidebar */}
            <aside style={{
                width: sidebarOpen ? 240 : 60,
                background: 'rgba(17,24,39,0.95)',
                borderRight: '1px solid rgba(255,255,255,0.06)',
                display: 'flex', flexDirection: 'column',
                transition: 'width 0.2s ease',
                flexShrink: 0,
                position: 'sticky', top: 0, height: '100vh',
            }}>
                {/* Brand */}
                <div style={{
                    padding: sidebarOpen ? '1.25rem 1rem' : '1.25rem 0.5rem',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    display: 'flex', alignItems: 'center', gap: 10,
                    justifyContent: sidebarOpen ? 'flex-start' : 'center',
                }}>
                    <div style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: 'linear-gradient(135deg, #16a34a, #059669)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.9rem', flexShrink: 0,
                    }}>🛡️</div>
                    {sidebarOpen && (
                        <div>
                            <p style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '0.85rem', letterSpacing: 0.5 }}>Bemengede</p>
                            <p style={{ fontSize: '0.65rem', color: '#64748b' }}>Operations</p>
                        </div>
                    )}
                </div>

                {/* Nav */}
                <nav style={{ flex: 1, padding: '0.75rem 0.5rem', display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {visibleNav.map(item => {
                        const isActive = pathname === item.href
                        return (
                            <button
                                key={item.href}
                                onClick={() => router.push(item.href)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 10,
                                    padding: sidebarOpen ? '10px 12px' : '10px 0',
                                    justifyContent: sidebarOpen ? 'flex-start' : 'center',
                                    background: isActive ? 'rgba(22,163,74,0.15)' : 'transparent',
                                    border: 'none', borderRadius: 8, cursor: 'pointer',
                                    color: isActive ? '#4ade80' : '#94a3b8',
                                    fontSize: '0.85rem', fontWeight: isActive ? 600 : 400,
                                    transition: 'all 0.15s',
                                    width: '100%',
                                }}
                            >
                                <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
                                {sidebarOpen && <span>{item.label}</span>}
                            </button>
                        )
                    })}
                </nav>

                {/* Toggle + Profile */}
                <div style={{ padding: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        style={{
                            width: '100%', padding: '8px', background: 'rgba(255,255,255,0.05)',
                            border: 'none', borderRadius: 6, color: '#64748b', cursor: 'pointer',
                            fontSize: '0.75rem', marginBottom: 8,
                        }}
                    >{sidebarOpen ? '◀ Collapse' : '▶'}</button>

                    {sidebarOpen && staff && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                                <p style={{ fontSize: '0.8rem', fontWeight: 600 }}>{staff.full_name}</p>
                                <p style={{ fontSize: '0.65rem', color: '#64748b' }}>
                                    {staff.emp_number} · {staff.role === 'SUPER_ADMIN' ? '👑 Super' : '🔧 Admin'}
                                </p>
                            </div>
                            <button
                                onClick={handleLogout}
                                style={{
                                    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                                    borderRadius: 6, padding: '4px 8px', color: '#ef4444', cursor: 'pointer',
                                    fontSize: '0.7rem',
                                }}
                            >Logout</button>
                        </div>
                    )}
                </div>
            </aside>

            {/* Main content */}
            <main style={{ flex: 1, overflow: 'auto' }}>
                {/* Top bar */}
                <header style={{
                    padding: '1rem 1.5rem',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    background: 'rgba(17,24,39,0.6)',
                    backdropFilter: 'blur(12px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    position: 'sticky', top: 0, zIndex: 10,
                }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>
                        {visibleNav.find(n => n.href === pathname)?.label || 'Admin Panel'}
                    </h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{
                            background: staff?.role === 'SUPER_ADMIN' ? 'rgba(234,179,8,0.15)' : 'rgba(59,130,246,0.15)',
                            color: staff?.role === 'SUPER_ADMIN' ? '#fbbf24' : '#60a5fa',
                            padding: '4px 10px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 600,
                        }}>
                            {staff?.role === 'SUPER_ADMIN' ? '👑 Super Admin' : '🔧 Admin'}
                        </span>
                    </div>
                </header>

                {/* Page content */}
                <div style={{ padding: '1.5rem' }}>
                    {children}
                </div>
            </main>
        </div>
    )
}
