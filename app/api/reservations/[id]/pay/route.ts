import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { decrypt } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const cookieStore = await cookies();
        const cookie = cookieStore.get('session')?.value;
        const session = await decrypt(cookie);

        if (!session || !session.userId) {
            return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 });
        }

        const conn = await pool.getConnection();
        try {
            // Symulacja platnosci - z 'pending_payment' na 'confirmed'
            const [result] = await conn.execute(
                'UPDATE Reservations SET Status = ? WHERE Id = ? AND User_Id = ? AND Status = ?',
                ['confirmed', id, session.userId, 'pending_payment']
            ) as any;

            if (result.affectedRows === 0) {
                return NextResponse.json({ error: 'Nie można opłacić tej rezerwacji.' }, { status: 400 });
            }

            return NextResponse.json({ message: 'Płatność zakończona sukcesem', status: 'confirmed' });
        } finally {
            conn.release();
        }
    } catch (error) {
        console.error('Payment Error:', error);
        return NextResponse.json({ error: 'Wystąpił błąd serwera' }, { status: 500 });
    }
}
