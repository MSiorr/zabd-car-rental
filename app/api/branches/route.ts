import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    try {
        const [rows] = await pool.execute('SELECT Id, Name, City, Address FROM Branches ORDER BY City');
        return NextResponse.json(rows, { status: 200 });
    } catch (error) {
        console.error('Fetch branches error:', error);
        return NextResponse.json({ error: 'Błąd pobierania oddziałów' }, { status: 500 });
    }
}
