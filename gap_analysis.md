# 📊 Bemengede — Done vs. Missing Gap Analysis

> Generated: 2026-05-03 | Based on: full codebase audit + task.md review

---

## ✅ COMPLETE — Currently Functional Features

| # | Feature | Location | Status |
|---|---------|----------|--------|
| 1 | Supabase schema (10 tables + RLS) | Database | ✅ Working |
| 2 | 11 Ethiopian cities + ~40 routes seeded | Database | ✅ Working |
| 3 | City-to-city route search | `page.tsx` → `api/routes/search` | ✅ Working |
| 4 | Schedule listing by date | `book/page.tsx` step 1 | ✅ Working |
| 5 | Interactive seat picker (2+2 bus layout) | `book/page.tsx` step 2 | ✅ Working |
| 6 | Real-time seat updates (Supabase Realtime) | `book/page.tsx` channel subscription | ✅ Working |
| 7 | Passenger creation/lookup by phone | `api/bookings/route.ts` | ✅ Working |
| 8 | Seat locking during payment | `api/bookings/route.ts` | ✅ Working |
| 9 | Chapa payment integration (test mode) | `api/bookings/route.ts` → Chapa API | ✅ Working |
| 10 | Chapa webhook (with signature verification) | `api/webhooks/chapa/route.ts` | ✅ Secured |
| 11 | Manual payment verification | `api/bookings/verify/route.ts` | ✅ Working |
| 12 | Ticket page with booking details | `ticket/[ref]/page.tsx` | ✅ Working |
| 13 | My Bookings lookup by phone | `my-bookings/page.tsx` + `api/bookings/lookup` | ✅ Working |
| 14 | Cancellation with refund tiers (90/50/0%) | `api/bookings/cancel/route.ts` | ✅ Secured |
| 15 | Expired ticket detection | `my-bookings/page.tsx` + `ticket/[ref]` | ✅ Working |
| 16 | Input validation (phone, name, same-city) | Client + Server | ✅ Working |
| 17 | Dark theme + glassmorphism UI | `globals.css` | ✅ Working |
| 18 | Bus-shaped seat diagram (green shell, wood floor) | `book/page.tsx` | ✅ Working |
| 19 | Slide transitions between booking steps | `globals.css` animations | ✅ Working |
| 20 | Rate limiting middleware | `src/middleware.ts` | ✅ Implemented |
| 21 | Security headers (CSP, HSTS, X-Frame) | `next.config.ts` | ✅ Implemented |
| 22 | Cryptographic booking refs | `crypto.randomBytes` | ✅ Implemented |
| 23 | Cancel ownership verification (phone) | `api/bookings/cancel/route.ts` | ✅ Implemented |

---

## ❌ MISSING — Features a Professional System Needs

### 🔴 Launch Blockers (Must have before any real users)

| # | Feature | Why It's Needed | Priority |
|---|---------|-----------------|----------|
| M1 | **Multi-seat booking** | Users often book for groups/families. Currently limited to 1 seat per transaction. | 🔴 P0 |
| M2 | **Seat lock timeout (15-min auto-release)** | Abandoned payment flows permanently lock seats. No cron/cleanup exists. Database fills with phantom locks. | 🔴 P0 |
| M3 | **Production Chapa keys + real domain** | `.env.local` has test keys + `localhost`. Payments won't work in production. | 🔴 P0 |
| M4 | **Admin panel (route/schedule management)** | Currently all data is seeded manually via SQL. No way for operators to add buses, schedules, or routes. | 🔴 P0 |
| M5 | **User authentication** | Anyone can look up/cancel bookings with just a phone number. No login, no sessions, no password. | 🔴 P0 |

### 🟠 Business Value (Needed for competitive product)

| # | Feature | Why It's Needed | Priority |
|---|---------|-----------------|----------|
| M6 | **Ticket PDF / downloadable ticket** | Users need something to show the conductor. Current ticket is just a web page that requires internet. | 🟠 P1 |
| M7 | **QR code on ticket** | Conductor needs to scan and verify tickets quickly. Referenced in task.md but never built. | 🟠 P1 |
| M8 | **SMS notification on booking** | Ethiopia has low smartphone penetration. SMS confirmation is critical for rural passengers. | 🟠 P1 |
| M9 | **Round-trip booking** | Most passengers need return trips. UI has the toggle hidden. | 🟠 P1 |
| M10 | **Dynamic pricing** | Listed in Phase 8 — buses >80% full should cost more. Standard in the industry. | 🟠 P1 |
| M11 | **Conductor manifest view** | Conductors need a list of passengers for each bus. No conductor-facing page exists. | 🟠 P1 |
| M12 | **Booking confirmation email/SMS** | After payment, user gets nothing except a web page. No email, no SMS, no push. | 🟠 P1 |
| M13 | **Error boundary / offline handling** | If network drops during payment, user sees white screen. No error boundaries anywhere. | 🟠 P1 |
| M14 | **Loading states on all pages** | Ticket page has skeleton but My Bookings lookup has no loading feedback if API is slow. | 🟠 P2 |

### 🟡 Polish / Nice-to-Have

| # | Feature | Why It's Needed | Priority |
|---|---------|-----------------|----------|
| M15 | **Amharic language support** | Most Ethiopian users prefer Amharic. Listed in task.md Phase 9. | 🟡 P2 |
| M16 | **Trie autocomplete for city search** | DSA requirement from Phase 8. Dropdowns work fine for 11 cities, but won't scale. | 🟡 P2 |
| M17 | **Dijkstra multi-leg routing** | DSA requirement. Currently only direct routes — no transfers. | 🟡 P2 |
| M18 | **TypeScript types file** | All data uses `any` type. No type safety across the codebase. | 🟡 P2 |
| M19 | **Mobile responsive optimization** | Works on mobile but not optimized — seat buttons are tiny on small screens. | 🟡 P2 |
| M20 | **Booking history / receipt export** | Users can't export their booking history for expense reporting. | 🟡 P3 |
| M21 | **Per-page `<title>` tags** | Only root layout has a title. Individual pages (My Bookings, Ticket) lack SEO titles. | 🟡 P3 |
| M22 | **Greedy "best seat" auto-suggest** | DSA feature from Phase 8. Suggest optimal seat based on preferences. | 🟡 P3 |

---

## 🐛 Logic Bugs Found

| # | Bug | Location | Severity | Details |
|---|-----|----------|----------|---------|
| B1 | **Single seat per booking — forced** | `api/bookings/route.ts` L48 | 🟠 HIGH | `.eq('seat_number', seatNumber).single()` — only ever books ONE seat. Frontend also enforces `selectedSeat: string \| null` (singular). Need to change to `selectedSeats: string[]` and loop through. |
| B2 | **Ticket page leaks data via anon key** | `ticket/[ref]/page.tsx` L15-23 | 🟠 HIGH | Uses browser `supabase` (anon key) to query bookings directly. Anyone who guesses a booking ref can view full passenger details (name, phone) without authentication. Should go through a server API route instead. |
| B3 | **Search results include null-route schedules** | `api/routes/search/route.ts` L34-35 | 🟡 MEDIUM | Supabase PostgREST `.eq('routes.origin.name', from)` on a nested join doesn't filter properly — it returns schedules where routes is `null` (no match). Need to filter these out in code: `data.filter(s => s.routes?.origin && s.routes?.destination)`. |
| B4 | **Phone validation inconsistency** | `book/page.tsx` L90 vs `api/bookings/route.ts` L17 | 🟢 LOW | Frontend allows both `09XXXXXXXX` and `0900XXXXXX` patterns (double regex). Server only allows `09\d{8}`. The `0900123456` test number passes both, but logic is inconsistent. |
| B5 | **No departure_date validation on booking** | `api/bookings/route.ts` | 🟡 MEDIUM | User can book a seat for a PAST date. No server-side check that `schedule.departure_date >= today`. |

---

## 📐 Architecture Assessment

### What's Well-Structured ✅
- **Server/client separation**: Admin key only in `/api`, anon key in client
- **Single-page booking flow**: Results → Seats → Confirm on one page with slide transitions
- **Database schema**: Properly normalized (cities, routes, buses, schedules, seats, bookings, passengers)
- **Real-time updates**: Supabase Realtime on seats table keeps seat map in sync

### What Needs Refactoring ⚠️
- **Zero TypeScript types**: Everything is `any`. No shared types between API and frontend.
- **Inline styles everywhere**: ~90% of styling is inline. Hard to maintain and inconsistent.
- **No error boundaries**: One failed API call = white screen of death.
- **No loading/error states**: Inconsistent — some pages have skeletons, others don't.
- **Ticket page reads DB directly**: Should go through an API route for security.

---

## 🎯 Priority Action Plan

### Tier 1 — Launch Blockers (Do these before ANY real deployment)

```
1. [ ] Multi-seat booking (M1 + B1)
2. [ ] Seat lock timeout cron (M2)
3. [ ] Fix ticket data leak (B2) — move to API route
4. [ ] Filter null routes from search (B3)
5. [ ] Add past-date booking check (B5)
6. [ ] Production env vars (M3)
7. [ ] Admin panel — at minimum schedule CRUD (M4)
8. [ ] Basic auth — at minimum phone OTP (M5)
```

### Tier 2 — Business Value (Build these for a competitive product)

```
9.  [ ] Ticket PDF generation (M6)
10. [ ] QR code on ticket (M7)
11. [ ] SMS booking confirmation (M8)
12. [ ] Round-trip flow (M9)
13. [ ] Conductor manifest (M11)
14. [ ] Error boundaries (M13)
```

### Tier 3 — Polish (Nice to have)

```
15. [ ] Amharic language (M15)
16. [ ] Trie autocomplete (M16)
17. [ ] Dijkstra routing (M17)
18. [ ] TypeScript types (M18)
19. [ ] Mobile optimization (M19)
20. [ ] Dynamic pricing (M10)
```

---

## Summary

| Category | Count |
|----------|-------|
| ✅ Complete & Working | 23 features |
| ❌ Missing (Launch Blockers) | 5 features |
| ❌ Missing (Business Value) | 9 features |
| ❌ Missing (Polish) | 8 features |
| 🐛 Logic Bugs | 5 bugs |
| **Total remaining work** | **27 items** |

> **Bottom line:** The core happy path works (search → pick seat → pay → get ticket). But the system is missing critical production requirements: multi-seat, admin panel, auth, and seat timeout. Fix the 5 logic bugs and 5 launch blockers before any real deployment.
