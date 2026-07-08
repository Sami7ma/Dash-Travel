import { NextResponse, NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

// ─── In-memory rate limiter ──────────────────────────────────
const rateMap = new Map<string, { count: number; reset: number }>()
const WINDOW_MS = 60_000
const MAX_REQUESTS = 30

setInterval(() => {
    const now = Date.now()
    for (const [key, val] of rateMap.entries()) {
        if (now > val.reset) rateMap.delete(key)
    }
}, 300_000)

// ─── Admin panel path (obscured) ─────────────────────────────
const ADMIN_PATH = '/dash-travel'
const ADMIN_LOGIN_PATH = `${ADMIN_PATH}/login`
const JWT_SECRET = new TextEncoder().encode(
    process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 32) || 'dash-travel-admin-secret-key-2026'
)
const COOKIE_NAME = 'dash-travel-staff-token'

export async function middleware(req: NextRequest) {
    const path = req.nextUrl.pathname

    // ── Rate limit API routes ────────────────────────────────
    if (path.startsWith('/api/')) {
        const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
            || req.headers.get('x-real-ip')
            || 'unknown'
        const key = `${ip}:${path}`
        const now = Date.now()
        const entry = rateMap.get(key)

        if (!entry || now > entry.reset) {
            rateMap.set(key, { count: 1, reset: now + WINDOW_MS })
        } else {
            entry.count++
            if (entry.count > MAX_REQUESTS) {
                return NextResponse.json(
                    { error: 'Too many requests. Please wait a moment and try again.' },
                    { status: 429, headers: { 'Retry-After': String(Math.ceil((entry.reset - now) / 1000)) } }
                )
            }
        }
    }

    // ── Protect admin panel pages ────────────────────────────
    if (path.startsWith(ADMIN_PATH) && path !== ADMIN_LOGIN_PATH) {
        const token = req.cookies.get(COOKIE_NAME)?.value

        if (!token) {
            return NextResponse.redirect(new URL(ADMIN_LOGIN_PATH, req.url))
        }

        try {
            await jwtVerify(token, JWT_SECRET)
        } catch {
            // Invalid or expired token
            const response = NextResponse.redirect(new URL(ADMIN_LOGIN_PATH, req.url))
            response.cookies.delete(COOKIE_NAME)
            return response
        }
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/api/:path*', '/dash-travel/:path*'],
}
