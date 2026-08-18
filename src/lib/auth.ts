import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { supabaseAdmin } from './supabaseAdmin'
import {
    getJWTSecret,
    AUTH_COOKIE_NAME,
    JWT_EXPIRATION,
    JWT_MAX_AGE_SECONDS,
    log,
} from './constants'
import type { JWTPayload, StaffRole, AuditAction } from './types'

// ── Password ──────────────────────────────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash)
}

// ── JWT ───────────────────────────────────────────────────────────────────

export async function createToken(staffId: string, empNumber: string, role: StaffRole): Promise<string> {
    return new SignJWT({ staffId, empNumber, role })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(JWT_EXPIRATION)
        .sign(getJWTSecret())
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
    try {
        const { payload } = await jwtVerify(token, getJWTSecret())
        return payload as unknown as JWTPayload
    } catch {
        return null
    }
}

// ── Cookie-based session ──────────────────────────────────────────────────

export async function setAuthCookie(token: string): Promise<void> {
    const cookieStore = await cookies()
    cookieStore.set(AUTH_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: JWT_MAX_AGE_SECONDS,
    })
}

export async function getAuthCookie(): Promise<string | null> {
    const cookieStore = await cookies()
    return cookieStore.get(AUTH_COOKIE_NAME)?.value || null
}

export async function clearAuthCookie(): Promise<void> {
    const cookieStore = await cookies()
    cookieStore.delete(AUTH_COOKIE_NAME)
}

// ── Get current staff from cookie ─────────────────────────────────────────

export async function getCurrentStaff(): Promise<JWTPayload | null> {
    const token = await getAuthCookie()
    if (!token) return null
    return verifyToken(token)
}

// ── Audit logging ─────────────────────────────────────────────────────────

export async function logAudit(params: {
    staffId: string
    action: AuditAction
    entityType?: string
    entityId?: string
    details?: Record<string, unknown>
    ipAddress?: string
}): Promise<void> {
    const { error } = await supabaseAdmin.from('audit_logs').insert({
        staff_id: params.staffId,
        action: params.action,
        entity_type: params.entityType || null,
        entity_id: params.entityId || null,
        details: params.details || {},
        ip_address: params.ipAddress || null,
    })

    if (error) {
        log({
            level: 'error',
            module: 'AUDIT',
            message: 'Failed to write audit log',
            data: { error: error.message, action: params.action },
        })
    }
}

// ── Generate next emp number ──────────────────────────────────────────────

export async function generateEmpNumber(role: StaffRole): Promise<string> {
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
