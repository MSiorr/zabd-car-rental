import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { decrypt } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function PATCH(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const cookieStore = await cookies();
    const cookie = cookieStore.get('session')?.value;
    const session = await decrypt(cookie);

    if (!session || (session.role !== 'admin' && session.role !== 'employee')) {
        return NextResponse.json({ error: 'Brak uprawnień' }, { status: 403 });
    }

    const { id } = await params;

    const [result] = await pool.execute(
        `UPDATE Reservations
         SET Status = 'cancelled'
         WHERE Id = ? AND Status IN ('pending_payment', 'confirmed')`,
        [id]
    ) as any;

    if (result.affectedRows === 0) {
        return NextResponse.json(
            { error: 'Nie można anulować — rezerwacja nie istnieje lub ma nieodpowiedni status.' },
            { status: 400 }
        );
    }

    return NextResponse.json({ success: true });
}
