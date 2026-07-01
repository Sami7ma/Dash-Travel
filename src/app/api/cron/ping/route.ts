import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

// GET /api/cron/ping
// This route is called periodically (e.g., every 10 minutes) by Vercel cron jobs.
// Its sole purpose is to make a simple, low-cost query to Supabase.
// In Supabase free tiers, databases that receive no queries for a few days go into a deep sleep, 
// causing high latency (cold starts) or even transient errors when a user eventually visits the site.
// Ping cron prevents this cold sleep entirely.
export async function GET() {
    try {
        // A simple query to keep the database awake
        const { data, error } = await supabaseAdmin
            .from('cities')
            .select('id')
            .limit(1)

        if (error) {
            console.error('[PING CRON] Database query failed:', error.message)
            return NextResponse.json({ success: false, error: error.message }, { status: 500 })
        }

        console.log('[PING CRON] Database pinged successfully, kept warm.')
        return NextResponse.json({ success: true, message: 'Supabase kept awake!' })
    } catch (err: any) {
        console.error('[PING CRON] Unexpected error:', err.message)
        return NextResponse.json({ success: false, error: err.message }, { status: 500 })
    }
}
