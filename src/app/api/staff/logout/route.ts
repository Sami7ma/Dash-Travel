import { NextResponse } from 'next/server'
import { getCurrentStaff, clearAuthCookie, logAudit } from '@/lib/auth'

export async function POST() {
    const payload = await getCurrentStaff()

    if (payload) {
        await logAudit({
            staffId: payload.staffId,
            action: 'LOGOUT',
            details: { emp_number: payload.empNumber },
        })
    }

    await clearAuthCookie()
    return NextResponse.json({ success: true })
}
