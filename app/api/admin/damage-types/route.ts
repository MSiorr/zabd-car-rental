import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { decrypt } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET() {
    const cookieStore = await cookies();
    const session = await decrypt(cookieStore.get('session')?.value);

    if (!session || !['admin', 'employee'].includes(session.role as string)) {
        return NextResponse.json({ error: 'Brak uprawnień' }, { status: 403 });
    }

    const [rows] = await pool.execute(
        'SELECT Id, Name, Default_Cost FROM Damage_Types ORDER BY Name'
    );
    return NextResponse.json(rows);
}
