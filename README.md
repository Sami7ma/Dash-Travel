# Dash Travel - Ethiopian Bus Booking Platform

> **Full-stack bus booking system** built for Ethiopia. Search routes, pick seats in real-time, pay online with Chapa, and manage operations through a complete admin panel.

[![Live Demo](https://img.shields.io/badge/Live-Vercel-black)](https://github.com/Sami7ma/Dash-Travel)
[![Next.js](https://img.shields.io/badge/Next.js-App_Router-blue)](https://nextjs.org)
[![Supabase](https://img.shields.io/badge/Database-Supabase-green)](https://supabase.com)

---

## 🚌 What It Does

**Passenger side:**
- Search bus routes between Ethiopian cities
- See available schedules for any date
- Pick exact seats on an interactive bus diagram (updates live with Supabase Realtime)
- Book up to 10 seats in one transaction
- Pay via Chapa (Ethiopian payment gateway)
- Receive a QR-code ticket you can share or print
- Look up any booking by phone number, cancel with tiered refund

**Operations side (`/dash-travel`):**
- Staff login with employee number + password (JWT sessions)
- Dashboard with live KPI stats (revenue, bookings, buses, schedules)
- Full CRUD for: buses, routes, schedules, bookings, staff
- Audit log — every admin action recorded
- Role-based access: ADMIN vs SUPER_ADMIN

---

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js (App Router) |
| Language | TypeScript |
| Frontend | React 19, Vanilla CSS — dark theme, glassmorphism |
| Database | Supabase (PostgreSQL + Realtime subscriptions) |
| Admin Auth | JWT (`jose`) + `bcryptjs` password hashing |
| Payments | Chapa API (Ethiopian gateway) |
| QR Codes | `qrcode` npm library |
| Deployment | Vercel (with scheduled cron jobs) |
| Font | Outfit (Google Fonts) |

---

## 🗺️ Pages

| URL | Who | What |
|---|---|---|
| `/` | Everyone | Homepage — city search form |
| `/book` | Passenger | 3-step flow: select bus → pick seats → pay |
| `/my-bookings` | Passenger | Phone-based booking lookup + cancel |
| `/ticket/[ref]` | Passenger | Ticket with QR code |
| `/dash-travel/login` | Staff | Admin login |
| `/dash-travel/dashboard` | Admin | KPI stats overview |
| `/dash-travel/schedules` | Admin | Create/manage departures |
| `/dash-travel/routes` | Admin | Manage city-to-city routes |
| `/dash-travel/buses` | Super Admin | Fleet management |
| `/dash-travel/staff` | Super Admin | Staff accounts |
| `/dash-travel/audit` | Super Admin | Full audit trail |

---

## ⚙️ Local Setup

### 1. Clone & Install

```bash
git clone https://github.com/Sami7ma/Dash-Travel
cd Dash-Travel
npm install
```

### 2. Environment Variables

Create `.env.local` in the root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

CHAPA_SECRET_KEY=CHASECK_TEST-your-key
NEXT_PUBLIC_BASE_URL=http://localhost:3000

JWT_SECRET=your-random-secret-at-least-32-chars
```

### 3. Run Database Migrations

Go to **Supabase Dashboard → SQL Editor** and run these in order:

```
migrations/002_admin_panel_fixed.sql   ← Creates staff + audit tables, seeds first admin
migrations/003_rolling_schedules.sql   ← Seeds cities, routes, buses, and 3-day rolling schedules
```

### 4. Start Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🔐 Admin Access

Default super admin credentials (created by migration):

| Field | Value |
|---|---|
| Employee Number | `SUPEMP001` |
| Password | `DashTravel@2026` |

> ⚠️ Change this password immediately after first login in the Staff management page.

To create new staff, log in as SUPER_ADMIN and go to `/dash-travel/staff`.

---

## 🗄️ Database Schema

| Table | Purpose |
|---|---|
| `cities` | Ethiopian city list |
| `routes` | City-to-city routes with base prices |
| `buses` | Fleet registry (plate, rows, cols) |
| `schedules` | Specific departures (route + bus + date/time + status) |
| `seats` | Auto-generated per schedule (seat number, booked state) |
| `bookings` | Passenger ticket records with payment info |
| `staff` | Admin accounts with hashed passwords |
| `audit_logs` | All admin action history |

---

## 🕐 Cron Jobs (Vercel)

| Job | Schedule | Purpose |
|---|---|---|
| `/api/cron/release-seats` | Every 5 min | Release seats held for 15+ min with unpaid bookings |
| `/api/cron/ping` | Every 10 min | Keep Supabase connection warm (prevent cold starts) |
| `/api/cron/roll-schedules` | Daily at midnight | Auto-create schedules for next 3 days for all routes × buses |

---

## 📁 Project Structure

```
src/
├── app/
│   ├── page.tsx                  # Homepage
│   ├── book/page.tsx             # Booking flow
│   ├── my-bookings/page.tsx      # Phone lookup + cancel
│   ├── ticket/[ref]/page.tsx     # QR ticket
│   ├── dash-travel/              # Admin panel
│   │   ├── layout.tsx            # Auth shell + sidebar
│   │   ├── login/
│   │   ├── dashboard/
│   │   ├── schedules/
│   │   ├── routes/
│   │   ├── buses/
│   │   ├── bookings/
│   │   ├── staff/
│   │   └── audit/
│   └── api/
│       ├── cities/
│       ├── routes/
│       ├── bookings/             # CRUD + cancel + verify + ticket + lookup
│       ├── webhooks/chapa/       # Payment callback
│       ├── cron/                 # release-seats, ping, roll-schedules
│       ├── admin/                # CRUD for buses/routes/schedules/bookings/staff/stats/audit
│       └── staff/                # login/logout/me
├── lib/
│   ├── supabase.ts               # Browser client (anon key)
│   ├── supabaseAdmin.ts          # Server client (service_role)
│   ├── auth.ts                   # JWT, bcrypt, audit, emp# generation
│   └── seatHolds.ts              # Stale booking cleanup
├── components/
│   └── ErrorBoundary.tsx
└── middleware.ts                  # Rate limiting + JWT admin guard
```

---

## 🚀 Deploy on Vercel

1. Push to GitHub
2. Import project in [vercel.com](https://vercel.com)
3. Add all environment variables from `.env.local`
4. Deploy — cron jobs in `vercel.json` activate automatically

---

## 📄 License

Built as a DSA final project. All rights reserved.
