import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getCurrentStaff, logAudit } from '@/lib/auth'

// GET — list all routes with city names
export async function GET() {
    const staff = await getCurrentStaff()
    if (!staff) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Try both FK name conventions (origin_id vs origin_city column names)
    let { data, error } = await supabaseAdmin
        .from('routes')
        .select('*, origin:cities!routes_origin_id_fkey(id, name), destination:cities!routes_destination_id_fkey(id, name)')
        .order('id', { ascending: false })

    // Fallback: some databases use origin_city / destination_city as column names
    if (error) {
        const fallback = await supabaseAdmin
            .from('routes')
            .select('*, origin:cities!routes_origin_city_fkey(id, name), destination:cities!routes_destination_city_fkey(id, name)')
            .order('id', { ascending: false })
        if (fallback.error) {
            // Last resort: return routes without city name join
            const plain = await supabaseAdmin.from('routes').select('*').order('id', { ascending: false })
            if (plain.error) return NextResponse.json({ error: plain.error.message }, { status: 500 })
            return NextResponse.json(plain.data)
        }
        data = fallback.data
    }

    return NextResponse.json(data)
}

// POST — create a new route
export async function POST(req: NextRequest) {
    const staff = await getCurrentStaff()
    if (!staff) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { origin_id, destination_id, base_price_etb, distance_km } = body

    if (!origin_id || !destination_id || !base_price_etb) {
        return NextResponse.json({ error: 'Origin, destination, and price are required' }, { status: 400 })
    }
    if (origin_id === destination_id) {
        return NextResponse.json({ error: 'Origin and destination must be different' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
        .from('routes')
        .insert({ origin_id, destination_id, base_price_etb: Number(base_price_etb), distance_km: Number(distance_km) || null })
        .select()
        .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await logAudit({ staffId: staff.staffId, action: 'CREATE', entityType: 'route', entityId: data.id, details: body })
    return NextResponse.json(data, { status: 201 })
}

// PUT — update a route
export async function PUT(req: NextRequest) {
    const staff = await getCurrentStaff()
    if (!staff) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { id, ...updates } = body

    if (!id) return NextResponse.json({ error: 'Route ID required' }, { status: 400 })

    const { data, error } = await supabaseAdmin
        .from('routes')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await logAudit({ staffId: staff.staffId, action: 'UPDATE', entityType: 'route', entityId: id, details: updates })
    return NextResponse.json(data)
}

// DELETE — delete a route
export async function DELETE(req: NextRequest) {
    const staff = await getCurrentStaff()
    if (!staff) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: 'Route ID required' }, { status: 400 })

    const { error } = await supabaseAdmin.from('routes').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await logAudit({ staffId: staff.staffId, action: 'DELETE', entityType: 'route', entityId: id })
    return NextResponse.json({ success: true })
}
