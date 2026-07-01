import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { verifyPassword, createToken, setAuthCookie, logAudit } from '@/lib/auth'

export async function POST(req: NextRequest) {
    const { empNumber, password } = await req.json()

    if (!empNumber || !password) {
        return NextResponse.json({ error: 'Employee number and password are required' }, { status: 400 })
    }

    // Find staff by emp number
    const { data: staff, error } = await supabaseAdmin
        .from('staff')
        .select('id, emp_number, full_name, password_hash, role, is_active')
        .eq('emp_number', empNumber.toUpperCase().trim())
        .single()

    if (error || !staff) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    if (!staff.is_active) {
        return NextResponse.json({ error: 'Account deactivated. Contact your supervisor.' }, { status: 403 })
    }

    // Verify password
    const valid = await verifyPassword(password, staff.password_hash)
    if (!valid) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Create JWT + set cookie
    const token = await createToken(staff.id, staff.emp_number, staff.role)
    await setAuthCookie(token)

    // Audit log
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    await logAudit({
        staffId: staff.id,
        action: 'LOGIN',
        details: { emp_number: staff.emp_number, role: staff.role },
        ipAddress: ip,
    })

    return NextResponse.json({
        success: true,
        staff: {
            empNumber: staff.emp_number,
            fullName: staff.full_name,
            role: staff.role,
        },
    })
}
