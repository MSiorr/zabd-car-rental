import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { decrypt } from '@/lib/auth';
import { cookies } from 'next/headers';

interface DamageInput {
    damageTypeId: number | null;
    description: string;
    amount: number;
}

export async function POST(request: Request) {
    const cookieStore = await cookies();
    const cookie = cookieStore.get('session')?.value;
    const session = await decrypt(cookie);

    if (!session || !['admin', 'employee'].includes(session.role as string)) {
        return NextResponse.json({ error: 'Brak uprawnień. Dostęp tylko dla pracowników.' }, { status: 403 });
    }

    const { reservationId, damages } = await request.json() as {
        reservationId: number;
        damages?: DamageInput[];
    };

    const damageList = Array.isArray(damages) ? damages.filter(d => d.amount > 0) : [];
    const damageFee = damageList.reduce((sum, d) => sum + Number(d.amount), 0);

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // Zapisujemy szczegóły naliczonych uszkodzeń (z możliwością nadpisanej kwoty).
        for (const d of damageList) {
            await conn.execute(
                'INSERT INTO Reservation_Damages (Reservation_Id, Damage_Type_Id, Description, Amount) VALUES (?, ?, ?, ?)',
                [reservationId, d.damageTypeId ?? null, d.description || 'Uszkodzenie', d.amount]
            );
        }

        // Procedura: zamyka najem, nalicza karę za opóźnienie + opłatę za uszkodzenia
        // jako płatności "do dopłaty" (pending) i zwalnia pojazd.
        await conn.execute('SET @final_cost = 0, @late_fee = 0, @msg = ""');
        await conn.execute(
            'CALL return_vehicle(?, ?, @final_cost, @late_fee, @msg)',
            [reservationId, damageFee]
        );
        const [[result]] = await conn.execute(
            'SELECT @final_cost AS finalCost, @late_fee AS lateFee, @msg AS message'
        ) as any;

        if (result.message !== 'OK') {
            await conn.rollback();
            return NextResponse.json({ error: result.message }, { status: 400 });
        }

        await conn.commit();
        return NextResponse.json({
            finalCost: result.finalCost,
            lateFee: result.lateFee,
            damageFee,
            message: result.message,
        });
    } catch (e: any) {
        await conn.rollback();
        console.error(e);
        return NextResponse.json({ error: e.message || 'Błąd zwrotu' }, { status: 500 });
    } finally {
        conn.release();
    }
}
