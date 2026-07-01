import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getCurrentStaff, logAudit } from '@/lib/auth'

// GET — list all buses
export async function GET() {
    const staff = await getCurrentStaff()
    if (!staff) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await supabaseAdmin
        .from('buses')
        .select('id, plate_number, bus_type, total_rows, total_cols, created_at')
        .order('plate_number')

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
}

// POST — add new bus (SUPER_ADMIN only)
export async function POST(req: NextRequest) {
    const staff = await getCurrentStaff()
    if (!staff || staff.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Super Admin access required' }, { status: 403 })
    }

    const body = await req.json()
    const { plate_number, total_seats, bus_type } = body

    if (!plate_number || !total_seats) {
        return NextResponse.json({ error: 'Plate number and seat capacity are required' }, { status: 400 })
    }

    // Convert total_seats → total_rows × 4 cols
    const totalCols = 4
    const totalRows = Math.ceil(Number(total_seats) / totalCols)

    const { data, error } = await supabaseAdmin
        .from('buses')
        .insert({
            plate_number: plate_number.toUpperCase().trim(),
            total_rows: totalRows,
            total_cols: totalCols,
            bus_type: bus_type || 'STANDARD',
        })
        .select()
        .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await logAudit({ staffId: staff.staffId, action: 'CREATE', entityType: 'bus', entityId: data.id, details: body })
    return NextResponse.json(data, { status: 201 })
}

// PUT — update bus (SUPER_ADMIN only)
export async function PUT(req: NextRequest) {
    const staff = await getCurrentStaff()
    if (!staff || staff.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Super Admin access required' }, { status: 403 })
    }

    const { id, plate_number, total_seats, bus_type } = await req.json()
    if (!id) return NextResponse.json({ error: 'Bus ID required' }, { status: 400 })

    const updates: Record<string, unknown> = { bus_type }
    if (plate_number) updates.plate_number = plate_number.toUpperCase().trim()
    if (total_seats) {
        updates.total_cols = 4
        updates.total_rows = Math.ceil(Number(total_seats) / 4)
    }

    const { data, error } = await supabaseAdmin.from('buses').update(updates).eq('id', id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await logAudit({ staffId: staff.staffId, action: 'UPDATE', entityType: 'bus', entityId: id, details: updates })
    return NextResponse.json(data)
}

// DELETE — remove bus (SUPER_ADMIN only)
export async function DELETE(req: NextRequest) {
    const staff = await getCurrentStaff()
    if (!staff || staff.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Super Admin access required' }, { status: 403 })
    }

    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: 'Bus ID required' }, { status: 400 })

    const { error } = await supabaseAdmin.from('buses').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await logAudit({ staffId: staff.staffId, action: 'DELETE', entityType: 'bus', entityId: id })
    return NextResponse.json({ success: true })
}
