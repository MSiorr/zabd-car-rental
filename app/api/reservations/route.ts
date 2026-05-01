import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: Request) {
    const body = await request.json();
    const { userId, vehicleId, pickupId, dropoffId, startDate, endDate, promoId } = body;

    const conn = await pool.getConnection();
    try {
        await conn.execute('SET @res_id = 0, @msg = ""');

        await conn.execute(
            'CALL create_reservation(?, ?, ?, ?, ?, ?, ?, @res_id, @msg)',
            [userId, vehicleId, pickupId, dropoffId, startDate, endDate, promoId ?? null]
        );

        const [[result]] = await conn.execute('SELECT @res_id AS id, @msg AS message') as any;

        if (result.id === -1) {
            return NextResponse.json({ error: result.message }, { status: 400 });
        }

        return NextResponse.json({ reservationId: result.id, message: result.message });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Wystąpił błąd serwera podczas rezerwacji' }, { status: 500 });
    } finally {
        conn.release();
    }
}