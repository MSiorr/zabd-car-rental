import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { decrypt } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
    try {
        const cookieStore = await cookies();
        const cookie = cookieStore.get('session')?.value;
        const session = await decrypt(cookie);

        if (!session || !session.userId || !['admin', 'employee'].includes(session.role as string)) {
            return NextResponse.json({ error: 'Brak uprawnień. Dostęp tylko dla pracowników.' }, { status: 403 });
        }

        const { reservationId, vehicleId } = await request.json();

        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            // Upewniamy się, że pojazd i rezerwacja się zgadzają
            const [rows] = await conn.execute(
                'SELECT Status FROM Reservations WHERE Id = ? AND Vehicle_Id = ? FOR UPDATE',
                [reservationId, vehicleId]
            ) as any;

            if (rows.length === 0) {
                throw new Error('Rezerwacja nie istnieje.');
            }

            if (rows[0].Status === 'active') {
                throw new Error('Pojazd został już u wydany.');
            }

            // Wydanie pojazdu -> aktualizacja rezerwacji na aktywne wydanie i ustawienie auta jako rented
            await conn.execute('UPDATE Reservations SET Status = "active" WHERE Id = ?', [reservationId]);
            await conn.execute('UPDATE Vehicles SET Status = "rented" WHERE Id = ?', [vehicleId]);

            await conn.commit();
            return NextResponse.json({ message: 'Wydano pojazd poprawnie.' });
        } catch (e: any) {
            await conn.rollback();
            throw e;
        } finally {
            conn.release();
        }
    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ error: e.message || 'Wystąpił błąd serwera' }, { status: 500 });
    }
}
