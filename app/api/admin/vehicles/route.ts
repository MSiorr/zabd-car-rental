import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { decrypt } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET() {
    try {
        const cookieStore = await cookies();
        const cookie = cookieStore.get('session')?.value;
        const session = await decrypt(cookie);

        if (!session || !session.userId || !['admin', 'employee'].includes(session.role as string)) {
            return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 403 });
        }

        const [rows] = await pool.execute('SELECT * FROM view_vehicle_card ORDER BY Id DESC');
        return NextResponse.json(rows);
    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ error: 'Błąd pobierania bazy' }, { status: 500 });
    }
}
