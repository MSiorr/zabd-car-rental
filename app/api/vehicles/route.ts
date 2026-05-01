import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city');

    let query = 'SELECT * FROM view_available_fleet';
    const params: string[] = [];

    if (city) {
        query += ' WHERE branch_city = ?';
        params.push(city);
    }

    try {
        const [rows] = await pool.execute(query, params);
        return NextResponse.json(rows);
    } catch (error) {
        return NextResponse.json({ error: 'Błąd pobierania danych z bazy' }, { status: 500 });
    }
}