import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getCurrentStaff, logAudit, hashPassword, generateEmpNumber } from '@/lib/auth'

// GET — list all staff (SUPER_ADMIN only)
export async function GET() {
    const staff = await getCurrentStaff()
    if (!staff || staff.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Super Admin access required' }, { status: 403 })
    }

    const { data, error } = await supabaseAdmin
        .from('staff')
        .select('id, emp_number, full_name, role, is_active, created_at')
        .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
}

// POST — create new staff member (SUPER_ADMIN only)
export async function POST(req: NextRequest) {
    const currentStaff = await getCurrentStaff()
    if (!currentStaff || currentStaff.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Super Admin access required' }, { status: 403 })
    }

    const { full_name, password, role } = await req.json()

    if (!full_name || !password || !role) {
        return NextResponse.json({ error: 'Name, password, and role are required' }, { status: 400 })
    }
    if (!['ADMIN', 'SUPER_ADMIN'].includes(role)) {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }
    if (password.length < 8) {
        return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    const empNumber = await generateEmpNumber(role)
    const passwordHash = await hashPassword(password)

    const { data, error } = await supabaseAdmin
        .from('staff')
        .insert({
            emp_number: empNumber,
            full_name: full_name.trim(),
            password_hash: passwordHash,
            role,
            is_active: true,
            created_by: currentStaff.staffId,
        })
        .select('id, emp_number, full_name, role, is_active, created_at')
        .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await logAudit({
        staffId: currentStaff.staffId,
        action: 'CREATE',
        entityType: 'staff',
        entityId: data.emp_number,
        details: { full_name, role, emp_number: empNumber },
    })

    return NextResponse.json(data, { status: 201 })
}

// PUT — update staff (toggle active, change password) (SUPER_ADMIN only)
export async function PUT(req: NextRequest) {
    const currentStaff = await getCurrentStaff()
    if (!currentStaff || currentStaff.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Super Admin access required' }, { status: 403 })
    }

    const { id, is_active, password, full_name } = await req.json()
    if (!id) return NextResponse.json({ error: 'Staff ID required' }, { status: 400 })

    const updates: any = {}
    if (typeof is_active === 'boolean') updates.is_active = is_active
    if (full_name) updates.full_name = full_name.trim()
    if (password && password.length >= 8) {
        updates.password_hash = await hashPassword(password)
    }

    const { data, error } = await supabaseAdmin
        .from('staff')
        .update(updates)
        .eq('id', id)
        .select('id, emp_number, full_name, role, is_active')
        .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await logAudit({
        staffId: currentStaff.staffId,
        action: 'UPDATE',
        entityType: 'staff',
        entityId: data.emp_number,
        details: { changes: Object.keys(updates) },
    })

    return NextResponse.json(data)
}
