import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { decrypt } from '@/lib/auth';
import { cookies } from 'next/headers';

// Dopłata po stronie klienta — opłaca zaległe płatności (kary, uszkodzenia)
// naliczone przy zwrocie pojazdu.
export async function POST(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    const cookieStore = await cookies();
    const session = await decrypt(cookieStore.get('session')?.value);
    if (!session || !session.userId) {
        return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 });
    }

    const conn = await pool.getConnection();
    try {
        // Upewniamy się, że rezerwacja należy do zalogowanego klienta.
        const [[res]] = await conn.execute(
            'SELECT Id FROM Reservations WHERE Id = ? AND User_Id = ?',
            [id, session.userId]
        ) as any;

        if (!res) {
            return NextResponse.json({ error: 'Nie znaleziono rezerwacji.' }, { status: 404 });
        }

        const [result] = await conn.execute(
            "UPDATE Payments SET Status = 'paid', Payment_Date = NOW() WHERE Reservation_Id = ? AND Status = 'pending'",
            [id]
        ) as any;

        if (result.affectedRows === 0) {
            return NextResponse.json({ error: 'Brak płatności do uregulowania.' }, { status: 400 });
        }

        return NextResponse.json({ message: 'Dopłata zaksięgowana.', settled: result.affectedRows });
    } finally {
        conn.release();
    }
}
