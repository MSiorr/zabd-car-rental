import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city');
    const category = searchParams.get('category');

    let query = 'SELECT * FROM view_available_fleet WHERE 1=1';
    const params: string[] = [];

    if (city) {
        query += ' AND branch_city = ?';
        params.push(city);
    }

    if (category) {
        query += ' AND category = ?';
        params.push(category);
    }

    try {
        const [rows] = await pool.execute(query, params);

        // Pobranie filtrów dynamicznie
        const [cities] = await pool.execute('SELECT DISTINCT City FROM Branches');
        const [categories] = await pool.execute('SELECT DISTINCT Name FROM Vehicle_Categories');

        return NextResponse.json({
            vehicles: rows,
            meta: {
                cities: (cities as any[]).map(c => c.City),
                categories: (categories as any[]).map(c => c.Name)
            }
        });
    } catch (error) {
        return NextResponse.json({ error: 'Błąd pobierania danych z bazy' }, { status: 500 });
    }
}