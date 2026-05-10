import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const [rows] = await pool.execute(
            'SELECT * FROM view_vehicle_card WHERE Id = ?',
            [id]
        );

        const vehicles = rows as any[];

        if (vehicles.length === 0) {
            return NextResponse.json(
                { error: 'Nie znaleziono pojazdu' },
                { status: 404 }
            );
        }

        return NextResponse.json(vehicles[0], { status: 200 });
    } catch (error) {
        console.error('Fetch vehicle error:', error);

        return NextResponse.json(
            { error: 'Błąd podczas pobierania szczegółów pojazdu' },
            { status: 500 }
        );
    }
}