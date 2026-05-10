import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { decrypt } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET() {
    try {
        const cookie = cookies().get('session')?.value;
        const session = await decrypt(cookie);

        if (!session || !session.userId) {
            return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 });
        }

        const [rows] = await pool.execute(
            `SELECT r.*, v.Brand, v.Model, v.License_Plate, b.City as PickupCity 
             FROM Reservations r
             JOIN Vehicles v ON r.Vehicle_Id = v.Id
             JOIN Branches b ON r.PickUp_Branch_Id = b.Id
             WHERE r.User_Id = ? 
             ORDER BY r.Created_At DESC`,
            [session.userId]
        );

        return NextResponse.json(rows);
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Wystąpił błąd serwera' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { vehicleId, pickupId, dropoffId, startDate, endDate, promoId } = body;

        const cookie = cookies().get('session')?.value;
        const session = await decrypt(cookie);

        if (!session || !session.userId) {
            return NextResponse.json({ error: 'Brak autoryzacji do wykonania rezerwacji.' }, { status: 401 });
        }

        const conn = await pool.getConnection();
        try {
            await conn.execute('SET @res_id = 0, @msg = ""');

            await conn.execute(
                'CALL create_reservation(?, ?, ?, ?, ?, ?, ?, @res_id, @msg)',
                [session.userId, vehicleId, pickupId, dropoffId, startDate, endDate, promoId ?? null]
            );

            const [[result]] = await conn.execute('SELECT @res_id AS id, @msg AS message') as any;

            if (result.id === -1) {
                return NextResponse.json({ error: result.message }, { status: 400 });
            }

            return NextResponse.json({ reservationId: result.id, message: result.message });
        } catch (error) {
            console.error(error);
            return NextResponse.json({ error: 'Wystąpił błąd procedury tworzenia rezerwacji' }, { status: 500 });
        } finally {
            conn.release();
        }
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Wystąpił błąd serwera podczas rezerwacji' }, { status: 500 });
    }
}