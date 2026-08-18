import { NextResponse, NextRequest } from 'next/server'
import { jwtVerify } from 'jose'
import {
    getJWTSecret,
    AUTH_COOKIE_NAME,
    ADMIN_PATH,
    ADMIN_LOGIN_PATH,
    RATE_LIMIT_WINDOW_MS,
    RATE_LIMIT_MAX_REQUESTS,
    RATE_LIMIT_CLEANUP_INTERVAL_MS,
    log,
} from '@/lib/constants'

// ─── In-memory rate limiter ──────────────────────────────────────────────

const rateMap = new Map<string, { count: number; reset: number }>()

setInterval(() => {
    const now = Date.now()
    for (const [key, val] of rateMap.entries()) {
        if (now > val.reset) rateMap.delete(key)
    }
}, RATE_LIMIT_CLEANUP_INTERVAL_MS)

// ─── Middleware ──────────────────────────────────────────────────────────

export async function middleware(req: NextRequest) {
    const path = req.nextUrl.pathname

    // ── Rate limit API routes ────────────────────────────────────────
    if (path.startsWith('/api/')) {
        const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
            || req.headers.get('x-real-ip')
            || 'unknown'
        const key = `${ip}:${path}`
        const now = Date.now()
        const entry = rateMap.get(key)

        if (!entry || now > entry.reset) {
            rateMap.set(key, { count: 1, reset: now + RATE_LIMIT_WINDOW_MS })
        } else {
            entry.count++
            if (entry.count > RATE_LIMIT_MAX_REQUESTS) {
                log({
                    level: 'warn',
                    module: 'RATE_LIMIT',
                    message: `Rate limit exceeded for ${ip} on ${path}`,
                })
                return NextResponse.json(
                    { error: 'Too many requests. Please wait a moment and try again.' },
                    { status: 429, headers: { 'Retry-After': String(Math.ceil((entry.reset - now) / 1000)) } }
                )
            }
        }
    }

    // ── Protect admin panel pages ────────────────────────────────────
    if (path.startsWith(ADMIN_PATH) && path !== ADMIN_LOGIN_PATH) {
        const token = req.cookies.get(AUTH_COOKIE_NAME)?.value

        if (!token) {
            return NextResponse.redirect(new URL(ADMIN_LOGIN_PATH, req.url))
        }

        try {
            await jwtVerify(token, getJWTSecret())
        } catch {
            const response = NextResponse.redirect(new URL(ADMIN_LOGIN_PATH, req.url))
            response.cookies.delete(AUTH_COOKIE_NAME)
            return response
        }
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/api/:path*', '/dash-travel/:path*'],
}
