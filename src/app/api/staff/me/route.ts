import { NextResponse } from 'next/server'
import { getCurrentStaff, clearAuthCookie, logAudit } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

// GET /api/staff/me — get current authenticated staff
export async function GET() {
    const payload = await getCurrentStaff()
    if (!payload) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { data: staff } = await supabaseAdmin
        .from('staff')
        .select('id, emp_number, full_name, role, is_active, created_at')
        .eq('id', payload.staffId)
        .single()

    if (!staff || !staff.is_active) {
        await clearAuthCookie()
        return NextResponse.json({ error: 'Session expired' }, { status: 401 })
    }

    return NextResponse.json({ staff })
}
