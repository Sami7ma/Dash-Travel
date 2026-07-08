import { supabaseAdmin as supabase } from '@/lib/supabaseAdmin'
import { NextResponse, NextRequest } from 'next/server'

type SearchSchedule = {
    routes?: {
        origin?: { name?: string | null } | null
        destination?: { name?: string | null } | null
    } | null
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const date = searchParams.get('date')

    if (!from || !to || !date) {
        return NextResponse.json(
            { error: 'Missing required params: from , to , date' },
            { status: 400 }
        )
    }

    const { data, error } = await supabase
        .from('schedules')
        .select(`
          id,
          departure_date,
          departure_time,
          arrival_time,
          status,
          buses ( plate_number, total_rows, total_cols ),
          routes (
            base_price_etb,
            distance_km,
            origin:origin_id ( name ),
            destination:destination_id ( name )
          )
        `)
        .eq('departure_date', date)
        .eq('status', 'SCHEDULED')

    if (error) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        )
    }

    // Embedded filters can leave parent rows in the result, so keep only exact route matches.
    const filtered = ((data || []) as SearchSchedule[]).filter((s) =>
        s.routes?.origin?.name === from && s.routes?.destination?.name === to
    )
    return NextResponse.json(filtered)
}
