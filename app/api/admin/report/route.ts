import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { decrypt } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
    const cookieStore = await cookies();
    const session = await decrypt(cookieStore.get('session')?.value);

    if (!session || !['admin', 'employee'].includes(session.role as string)) {
        return NextResponse.json({ error: 'Brak uprawnień' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const yearParam = searchParams.get('year');
    const year = yearParam ? parseInt(yearParam, 10) : null;

    try {
        // Procedura raportująca opakowuje widok view_monthly_summary parametrem roku.
        const [resultSets] = await pool.query(
            'CALL report_monthly_summary(?)',
            [year]
        ) as any;
        return NextResponse.json(resultSets[0]);
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Błąd generowania raportu' }, { status: 500 });
    }
}
