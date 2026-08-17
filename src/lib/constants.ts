// ═══════════════════════════════════════════════════════════════════════════
// Dash Travel — Application Constants & Configuration
// Single source of truth for all hardcoded values, shared secrets, and
// runtime configuration. Never scatter magic numbers across the codebase.
// ═══════════════════════════════════════════════════════════════════════════

// ─── Authentication ───────────────────────────────────────────────────────

/** Cookie name for admin JWT session */
export const AUTH_COOKIE_NAME = 'dash-travel-staff-token'

/** JWT token expiration time */
export const JWT_EXPIRATION = '8h'

/** JWT expiration in seconds (for cookie maxAge) */
export const JWT_MAX_AGE_SECONDS = 8 * 60 * 60

/** Derive JWT signing secret — single source of truth for middleware + auth */
export function getJWTSecret(): Uint8Array {
    const secret = process.env.JWT_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 32)
    if (!secret) {
        throw new Error(
            'Missing JWT secret. Set JWT_SECRET or SUPABASE_SERVICE_ROLE_KEY in environment variables.'
        )
    }
    return new TextEncoder().encode(secret)
}

// ─── Admin Panel ──────────────────────────────────────────────────────────

export const ADMIN_PATH = '/dash-travel'
export const ADMIN_LOGIN_PATH = `${ADMIN_PATH}/login`

export const ADMIN_NAV = [
    { href: '/dash-travel/dashboard', label: 'Dashboard', icon: '📊', roles: ['ADMIN', 'SUPER_ADMIN'] },
    { href: '/dash-travel/schedules', label: 'Schedules', icon: '📅', roles: ['ADMIN', 'SUPER_ADMIN'] },
    { href: '/dash-travel/routes', label: 'Routes', icon: '🛤️', roles: ['ADMIN', 'SUPER_ADMIN'] },
    { href: '/dash-travel/buses', label: 'Buses', icon: '🚌', roles: ['SUPER_ADMIN'] },
    { href: '/dash-travel/bookings', label: 'Bookings', icon: '🎫', roles: ['ADMIN', 'SUPER_ADMIN'] },
    { href: '/dash-travel/staff', label: 'Staff', icon: '👥', roles: ['SUPER_ADMIN'] },
    { href: '/dash-travel/audit', label: 'Audit Log', icon: '📋', roles: ['SUPER_ADMIN'] },
] as const

// ─── Booking Rules ────────────────────────────────────────────────────────

/** Maximum seats a passenger can book in one transaction */
export const MAX_SEATS_PER_BOOKING = 10

/** Minutes before unpaid seat holds are released */
export const SEAT_HOLD_TIMEOUT_MINUTES = 15

/** Ethiopian phone number validation pattern */
export const PHONE_REGEX = /^09\d{8}$/

/** Minimum passenger name length */
export const MIN_NAME_LENGTH = 2

/** Maximum passenger name length */
export const MAX_NAME_LENGTH = 100

// ─── Rate Limiting ────────────────────────────────────────────────────────

/** Rate limit window in milliseconds */
export const RATE_LIMIT_WINDOW_MS = 60_000

/** Maximum requests per window per IP+path */
export const RATE_LIMIT_MAX_REQUESTS = 30

/** Cleanup interval for stale rate limit entries (ms) */
export const RATE_LIMIT_CLEANUP_INTERVAL_MS = 300_000

// ─── Seat Grid ────────────────────────────────────────────────────────────

/** Columns considered "left side" of the bus aisle */
export const LEFT_SEAT_COLUMNS = ['A', 'B']

/** Regex to parse seat labels like "1A", "12D" */
export const SEAT_LABEL_REGEX = /^(\d+)([A-Z]+)$/

// ─── Environment Validation ──────────────────────────────────────────────

interface EnvVarSpec {
    key: string
    required: boolean
    description: string
}

const ENV_SCHEMA: EnvVarSpec[] = [
    { key: 'NEXT_PUBLIC_SUPABASE_URL', required: true, description: 'Supabase project URL' },
    { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', required: true, description: 'Supabase anonymous key' },
    { key: 'SUPABASE_SERVICE_ROLE_KEY', required: true, description: 'Supabase service role key (server-only)' },
    { key: 'CHAPA_SECRET_KEY', required: true, description: 'Chapa payment gateway secret key' },
    { key: 'NEXT_PUBLIC_BASE_URL', required: true, description: 'App base URL (e.g. http://localhost:3000)' },
    { key: 'JWT_SECRET', required: false, description: 'JWT signing secret (falls back to SUPABASE_SERVICE_ROLE_KEY slice)' },
    { key: 'CHAPA_WEBHOOK_SECRET', required: false, description: 'Chapa webhook signature secret' },
]

/**
 * Validates required environment variables at startup.
 * Call this in server-side initialization paths.
 */
export function validateEnv(): { valid: boolean; missing: string[] } {
    const missing = ENV_SCHEMA
        .filter(spec => spec.required && !process.env[spec.key])
        .map(spec => `${spec.key} — ${spec.description}`)

    if (missing.length > 0) {
        console.error(
            `[ENV] Missing required environment variables:\n${missing.map(m => `  ✗ ${m}`).join('\n')}`
        )
    }

    return { valid: missing.length === 0, missing }
}

// ─── Logging ──────────────────────────────────────────────────────────────

type LogLevel = 'info' | 'warn' | 'error'

interface LogEntry {
    level: LogLevel
    module: string
    message: string
    data?: Record<string, unknown>
}

/**
 * Structured logging utility.
 * In production, replaces raw console.log/error with structured JSON output.
 */
export function log(entry: LogEntry): void {
    const timestamp = new Date().toISOString()
    const prefix = `[${entry.module}]`

    if (process.env.NODE_ENV === 'production') {
        // Structured JSON for production log aggregators
        const output = JSON.stringify({
            timestamp,
            level: entry.level,
            module: entry.module,
            message: entry.message,
            ...(entry.data || {}),
        })
        if (entry.level === 'error') {
            console.error(output)
        } else if (entry.level === 'warn') {
            console.warn(output)
        } else {
            console.log(output)
        }
    } else {
        // Human-readable for development
        const fn = entry.level === 'error' ? console.error : entry.level === 'warn' ? console.warn : console.log
        fn(`${prefix} ${entry.message}`, entry.data || '')
    }
}
