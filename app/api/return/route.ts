import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: Request) {
    const { reservationId, additionalFee } = await request.json();
    const fee = additionalFee || 0;

    const conn = await pool.getConnection();
    try {
        await conn.execute('SET @final_cost = 0, @msg = ""');
        await conn.execute(
            'CALL return_vehicle(?, ?, @final_cost, @msg)',
            [reservationId, fee]
        );
        const [[result]] = await conn.execute(
            'SELECT @final_cost AS finalCost, @msg AS message'
        ) as any;

        return NextResponse.json(result);
    } finally {
        conn.release();
    }
}