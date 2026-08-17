// ═══════════════════════════════════════════════════════════════════════════
// Dash Travel — Centralized Type Definitions
// Single source of truth for all domain entities, API contracts, and enums.
// ═══════════════════════════════════════════════════════════════════════════

// ─── Enums ────────────────────────────────────────────────────────────────

export type PaymentStatus = 'PENDING' | 'PAID'
export type BookingStatus = 'CONFIRMED' | 'CANCELLED'
export type ScheduleStatus = 'SCHEDULED' | 'DEPARTED' | 'CANCELLED'
export type StaffRole = 'ADMIN' | 'SUPER_ADMIN'
export type AuditAction = 'LOGIN' | 'LOGOUT' | 'CREATE' | 'UPDATE' | 'DELETE'
export type TripType = 'ONE_WAY'

// ─── Database Entities ────────────────────────────────────────────────────

export interface City {
    id: string
    name: string
    created_at?: string
}

export interface Route {
    id: string
    origin_id: string
    destination_id: string
    origin?: City
    destination?: City
    base_price_etb: number
    distance_km: number
    created_at?: string
}

export interface Bus {
    id: string
    plate_number: string
    total_rows: number
    total_cols: number
    bus_type: string
    created_at?: string
}

export interface Schedule {
    id: string
    route_id: string
    bus_id: string
    departure_date: string
    departure_time: string | null
    arrival_time: string | null
    status: ScheduleStatus
    routes?: Route | null
    buses?: Bus | null
    created_at?: string
}

export interface Seat {
    id: string
    schedule_id: string
    seat_number: string
    is_booked: boolean
    created_at?: string
}

export interface Passenger {
    id: string
    full_name: string
    phone: string
    phone_masked?: string
    created_at?: string
}

export interface Booking {
    id: string
    booking_ref: string
    group_ref: string | null
    passenger_id: string
    seat_id: string | null
    seat_traveller_name: string
    trip_type: TripType
    price_etb: number
    payment_status: PaymentStatus
    status: BookingStatus
    chapa_tx_ref: string | null
    booked_at: string
    paid_at: string | null
    passengers?: Passenger | null
    seats?: (Seat & { schedules?: Schedule }) | null
}

export interface Staff {
    id: string
    emp_number: string
    full_name: string
    role: StaffRole
    is_active: boolean
    created_at?: string
}

export interface AuditLog {
    id: string
    staff_id: string
    action: AuditAction
    entity_type: string | null
    entity_id: string | null
    details: Record<string, unknown>
    ip_address: string | null
    created_at: string
    staff?: Staff | null
}

// ─── API Response Types ───────────────────────────────────────────────────

export interface BookingCreateResponse {
    checkoutUrl: string
    groupRef: string
    seatCount: number
    totalPrice: number
    expiresAt: string
}

export interface BookingCancelResponse {
    success: boolean
    cancelledCount?: number
    refundAmount?: number
    refundMessage?: string
    error?: string
}

export interface StatsResponse {
    stats: {
        totalBookings: number
        paidBookings: number
        pendingBookings: number
        cancelledBookings: number
        totalRevenue: number
        todayBookings: number
        activeSchedules: number
        totalBuses: number
    }
    recentBookings: Booking[]
}

export interface ScheduleSearchResult {
    id: string
    departure_time: string | null
    arrival_time: string | null
    departure_date: string
    status: ScheduleStatus
    buses: {
        plate_number: string
    }
    routes: {
        base_price_etb: number
        distance_km: number
    }
}

export interface VerifyPaymentResponse {
    status: 'paid' | 'already_paid' | 'not_paid'
    message?: string
}

export interface StaffInfo {
    emp_number: string
    full_name: string
    role: StaffRole
}

export interface JWTPayload {
    staffId: string
    empNumber: string
    role: StaffRole
}

// ─── Component Prop Types ─────────────────────────────────────────────────

export type BadgeVariant = 'paid' | 'pending' | 'cancelled' | 'expired'

export interface StatusBadgeConfig {
    className: string
    text: string
    accentColor: string
}

/** Maps booking state to display configuration */
export function getStatusBadge(
    paymentStatus: PaymentStatus,
    bookingStatus: BookingStatus,
    isExpired: boolean
): StatusBadgeConfig {
    if (bookingStatus === 'CANCELLED') {
        return { className: 'badge-cancelled', text: '❌ Cancelled', accentColor: 'var(--color-status-error)' }
    }
    if (isExpired) {
        return { className: 'badge-expired', text: '🕒 Expired', accentColor: 'var(--text-muted)' }
    }
    if (paymentStatus === 'PAID') {
        return { className: 'badge-paid', text: '✅ Paid', accentColor: 'var(--color-status-success)' }
    }
    return { className: 'badge-pending', text: '⏳ Pending', accentColor: 'var(--color-accent-primary)' }
}

// ─── Grouped Booking Display ──────────────────────────────────────────────

export interface GroupedBooking extends Booking {
    _isGroup: boolean
    _groupRef?: string
    _groupItems?: Booking[]
    _allSeats: string[]
    _totalPrice: number
}

// ─── Seat Grid Helpers ────────────────────────────────────────────────────

export interface ParsedSeat {
    row: number
    col: string
}

export interface SeatRow {
    left: Seat[]
    right: Seat[]
}

export type SeatMap = Record<number, SeatRow>
