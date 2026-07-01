import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { supabaseAdmin } from './supabaseAdmin'

const JWT_SECRET = new TextEncoder().encode(
    process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 32) || 'bemengede-admin-secret-key-2026!'
)
const COOKIE_NAME = 'bmc-staff-token'

// ── Password ──────────────────────────────────────────────────
export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash)
}

// ── JWT ───────────────────────────────────────────────────────
export async function createToken(staffId: string, empNumber: string, role: string): Promise<string> {
    return new SignJWT({ staffId, empNumber, role })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('8h')
        .sign(JWT_SECRET)
}

export async function verifyToken(token: string) {
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET)
        return payload as { staffId: string; empNumber: string; role: string }
    } catch {
        return null
    }
}

// ── Cookie-based session ──────────────────────────────────────
export async function setAuthCookie(token: string) {
    const cookieStore = await cookies()
    cookieStore.set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 8 * 60 * 60, // 8 hours
    })
}

export async function getAuthCookie(): Promise<string | null> {
    const cookieStore = await cookies()
    return cookieStore.get(COOKIE_NAME)?.value || null
}

export async function clearAuthCookie() {
    const cookieStore = await cookies()
    cookieStore.delete(COOKIE_NAME)
}

// ── Get current staff from cookie ─────────────────────────────
export async function getCurrentStaff() {
    const token = await getAuthCookie()
    if (!token) return null
    const payload = await verifyToken(token)
    if (!payload) return null
    return payload
}

// ── Audit logging ─────────────────────────────────────────────
export async function logAudit(params: {
    staffId: string
    action: 'LOGIN' | 'LOGOUT' | 'CREATE' | 'UPDATE' | 'DELETE'
    entityType?: string
    entityId?: string
    details?: Record<string, any>
    ipAddress?: string
}) {
    await supabaseAdmin.from('audit_logs').insert({
        staff_id: params.staffId,
        action: params.action,
        entity_type: params.entityType || null,
        entity_id: params.entityId || null,
        details: params.details || {},
        ip_address: params.ipAddress || null,
    })
}

// ── Generate next emp number ──────────────────────────────────
export async function generateEmpNumber(role: 'ADMIN' | 'SUPER_ADMIN'): Promise<string> {
    const prefix = role === 'SUPER_ADMIN' ? 'SUPEMP' : 'EMP'

    const { data } = await supabaseAdmin
        .from('staff')
        .select('emp_number')
        .like('emp_number', `${prefix}%`)
        .order('emp_number', { ascending: false })
        .limit(1)

    if (!data || data.length === 0) return `${prefix}001`

    const lastNum = parseInt(data[0].emp_number.replace(prefix, ''), 10)
    return `${prefix}${String(lastNum + 1).padStart(3, '0')}`
}
