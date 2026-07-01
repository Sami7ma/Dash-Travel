import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getCurrentStaff } from '@/lib/auth'

// GET — list audit logs (SUPER_ADMIN only)
export async function GET(req: NextRequest) {
    const staff = await getCurrentStaff()
    if (!staff || staff.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Super Admin access required' }, { status: 403 })
    }

    const url = new URL(req.url)
    const limit = Number(url.searchParams.get('limit')) || 100
    const action = url.searchParams.get('action')
    const staffFilter = url.searchParams.get('staff_id')

    let query = supabaseAdmin
        .from('audit_logs')
        .select('*, staff:staff_id(emp_number, full_name)')
        .order('created_at', { ascending: false })
        .limit(limit)

    if (action) query = query.eq('action', action)
    if (staffFilter) query = query.eq('staff_id', staffFilter)

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
}
