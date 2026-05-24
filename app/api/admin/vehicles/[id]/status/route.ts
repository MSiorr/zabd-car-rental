import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { decrypt } from '@/lib/auth';
import { cookies } from 'next/headers';

const VALID_STATUSES = ['available', 'maintenance', 'retired'];

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const cookieStore = await cookies();
        const cookie = cookieStore.get('session')?.value;
        const session = await decrypt(cookie);

        if (!session || !['admin', 'employee'].includes(session.role as string)) {
            return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 403 });
        }

        const { id } = await params;
        const { status } = await request.json();

        if (!VALID_STATUSES.includes(status)) {
            return NextResponse.json({ error: 'Nieprawidłowy status' }, { status: 400 });
        }

        await pool.execute('UPDATE Vehicles SET Status = ? WHERE Id = ?', [status, id]);
        return NextResponse.json({ message: 'Status zaktualizowany' });
    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 });
    }
}
