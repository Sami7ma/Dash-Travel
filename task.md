# Bemengede — Implementation Progress Tracker

> Design reference: [walkthrough1.md](./walkthrough1.md) (locked snapshot)
> Last updated: 2026-05-17

---

## Phase 1 — Foundation: Supabase + Seed Data ✅ DONE
> **Goal**: Working database with all cities, routes, and auth ready.

- [x] Create Supabase project at supabase.com
- [x] Run full schema SQL (10 tables)
- [x] Enable Row Level Security (RLS) on all tables
- [x] Seed 11 cities + ~40 route pairs with ETB prices
- [x] Verify data in Supabase Table Editor

---

## Phase 2 — Next.js Project + Route Search ✅ DONE
> **Goal**: Running web app where user can search for buses by route and date.

- [x] Scaffold Next.js project + install Supabase JS client
- [x] Connect to Supabase (env vars + split client/admin)
- [x] Build `/api/cities` endpoint
- [x] Build `/api/routes/search` endpoint
- [x] Build `SearchScreen` UI (From/To city picker, date picker)
- [x] Build `ResultsScreen` UI (schedule cards: time, price, seats left)

---

## Phase 3 — Live Seat Picker ✅ DONE
> **Goal**: Interactive seat map with real-time availability.

- [x] Build `SeatPickerScreen` — 2D grid with aisle gap
- [x] Wire up Supabase Realtime subscription on `seats` table
- [x] Fix row sorting (1-10 numeric, not alphabetic)

---

## Phase 4 — Booking Flow + Chapa Payment + Ticket ✅ DONE
> **Goal**: End-to-end one-way booking with real payment.

- [x] Create Chapa account + get API keys
- [x] Build `/api/bookings` POST endpoint (find/create passenger, lock seat, call Chapa)
- [x] Build `/api/webhooks/chapa` POST endpoint (verify payment, mark PAID)
- [x] Build `BookingConfirm` screen (name + phone form → Pay button)
- [x] Build `TicketScreen` (booking details + payment ref)
- [x] Fix Chapa email validation + title length bugs
- [x] Integrate Chapa sandbox payment flow

---

## Phase 4.5 — Bug Fixes + Hardening ✅ DONE
> **Goal**: Fix critical bugs before building more features.

- [x] Fix ticket page RLS policy (bookings table)
- [x] Add phone number validation (Ethiopian format, client + server)
- [x] Remove console.log from bookings API
- [x] Update layout metadata to "Bemengede"
- [x] Add error handling to city fetch
- [x] Add same-city check (can't search Addis → Addis)
- [x] Switch API routes from browser client to supabaseAdmin
- [x] Add payment warning on confirm page
- [x] Seat timeout — release if unpaid after 15 min (cron cleanup)
- [ ] Create shared TypeScript types file (deferred to Phase 9)

---

## Phase 5 — Cancellation + My Bookings ✅ DONE
> **Goal**: Booking lookup, cancellation with refund tiers, expired ticket handling.

- [x] Build `/api/bookings/lookup` GET endpoint (find by phone)
- [x] Build `MyBookings` page (phone lookup → booking list)
- [x] Build `/api/bookings/cancel` POST endpoint with refund tier logic:
  - [x] >24h → 90% refund
  - [x] 6–24h → 50% refund
  - [x] <6h → 0% refund (seat still released)
  - [x] Past departure → blocked, cannot cancel
- [x] Cancel button on My Bookings page
- [x] Expired ticket detection (departure date passed → grey + 🕒 EXPIRED)
- [x] Ghost out View Receipt button for cancelled/expired bookings
- [x] Ticket page shows CANCELLED (red, line-through) and EXPIRED (grey) states
- [x] Build `/api/bookings/verify` GET endpoint (manual Chapa verification)
- [x] "Verify Payment" button on ticket page (workaround for localhost webhook)
- [x] Hide round-trip toggle (not implemented yet)
- [ ] Round-trip booking flow (deferred to Phase 8+)

---

## Phase 6 — Security Hardening + Multi-Seat ✅ DONE
> **Goal**: Fix all critical/high/medium security vulnerabilities + multi-seat booking.

- [x] HMAC-SHA256 webhook signature verification
- [x] Chapa API re-verification + amount matching
- [x] Cancel endpoint ownership verification (phone match)
- [x] Cryptographic booking refs (`crypto.randomBytes`)
- [x] Input name sanitization (strip control chars, max 100)
- [x] Rate limiting middleware (30 req/min/IP)
- [x] Security headers (CSP, HSTS, X-Frame-Options, nosniff)
- [x] Multi-seat selection (up to 10 seats per booking, toggle UI)
- [x] Group bookings with shared `group_ref` column
- [x] Multi-seat cancel (cancels all seats in group)
- [x] Multi-seat verify (verifies all seats in group)
- [x] Multi-seat webhook (marks all in group as PAID)
- [x] My Bookings groups multi-seat bookings into single card
- [x] Ticket page shows all seats in group + QR code
- [x] 15-minute countdown timer on pending tickets
- [x] Auto seat release when timer expires
- [x] Cron endpoint `/api/cron/release-seats` + Vercel cron config
- [x] Secure ticket API route (no more direct Supabase browser query)
- [x] Phone number masking on ticket display
- [x] Null route filtering in search results
- [x] Past-date booking server-side block
- [x] Error boundary component (prevents white screen of death)
- [x] `.env.local` removed from git tracking
- [x] Database migration for `group_ref` column

---

## Phase 7 — Admin / Operator / Conductor Web Panel ⬅️ NEXT
> **Goal**: Full staff tooling, all three role tiers working.

- [ ] Build admin login (email + password against `staff` table)
- [ ] Super Admin: dashboard, routes CRUD, buses CRUD, schedule CRUD, reports
- [ ] Operator: dashboard, schedules, manifest view
- [ ] Conductor: today's manifest, QR scanner
- [ ] Build `/api/checkin` endpoint for QR validation

---

## Phase 8 — DSA Features
> **Goal**: Trie autocomplete + Dijkstra multi-leg routing live in production.

- [ ] Implement `Trie` class for city search autocomplete
- [ ] Implement Dijkstra for multi-leg route suggestions
- [ ] Implement greedy "best seat" suggester
- [ ] Implement dynamic pricing (>80% full → price +20%)
- [ ] Round-trip booking flow

---

## Phase 9 — UI Polish + Mobile
> **Goal**: Professional design + optional mobile app.

- [ ] Move all inline styles to proper CSS modules
- [ ] Add Google Fonts (Inter)
- [ ] Add loading skeletons + micro-animations
- [ ] Add per-page `<title>` tags
- [ ] Amharic + English language toggle
- [ ] Create shared TypeScript types file
- [ ] Ticket PDF download
- [ ] SMS booking confirmations
- [ ] (Optional) Scaffold Expo React Native project

---

## Completed Phases
- ✅ **Phase 1** — Supabase schema (10 tables), RLS policies, 11 cities + ~40 routes seeded
- ✅ **Phase 2 & 3** — Next.js search UI, API routes, and realtime 2D seat picker
- ✅ **Phase 4** — Booking flow, Chapa payment integration, webhook, ticket page
- ✅ **Phase 4.5** — Input validation, metadata, admin client, error handling
- ✅ **Phase 5** — My Bookings, cancel + refund tiers, expired detection, verify payment
- ✅ **Phase 6** — Security hardening, multi-seat booking, countdown timer, error boundary

---

## Progress Snapshots
| Date | Phase | What Was Done |
|------|-------|---------------|
| 2026-02-28 | Design | `walkthrough1.md` locked. Phase 1 starting. |
| 2026-02-28 | Phase 1 | All 10 tables created, RLS enabled, seed data inserted. |
| 2026-03-07 | Phase 2 & 3 | Built Search UI, Results UI, Seat Picker UI, and Realtime sync. |
| 2026-03-14 | Phase 4 | Booking API, Chapa payment, webhook, confirm screen, ticket page. |
| 2026-03-28 | Phase 4.5 | Full audit, bug fixes, validation, admin client migration. |
| 2026-03-29 | Phase 5 | My Bookings, cancel API, expired detection, status improvements. |
| 2026-04-04 | Audit & Fix | Fixed 3 critical bugs: ticket query, cancel past trips, verify payment. |
| 2026-05-03 | Security | Full security audit, 14 vulnerabilities found, 11 patched. |
| 2026-05-06 | Phase 6 | Multi-seat booking, group refs, timer, error boundary, seat release cron. |
