import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { decrypt } from '@/lib/auth';
import { cookies } from 'next/headers';

async function requireStaff() {
    const cookieStore = await cookies();
    const session = await decrypt(cookieStore.get('session')?.value);
    if (!session || !['admin', 'employee'].includes(session.role as string)) return null;
    return session;
}

// Dane potrzebne do panelu symulacji: rezerwacje oczekujące na płatność,
// aktywne wynajmy oraz ostatnie wpisy z dziennika audytu.
export async function GET() {
    if (!await requireStaff()) {
        return NextResponse.json({ error: 'Brak uprawnień' }, { status: 403 });
    }

    const brandSub = "(SELECT Value_String FROM Vehicle_Attribute va JOIN Attributes a ON va.Attribute_Id = a.Id WHERE va.Vehicle_Id = v.Id AND a.Name = 'Marka')";
    const modelSub = "(SELECT Value_String FROM Vehicle_Attribute va JOIN Attributes a ON va.Attribute_Id = a.Id WHERE va.Vehicle_Id = v.Id AND a.Name = 'Model')";

    const [pending] = await pool.execute(
        `SELECT r.Id, r.Created_At, r.Estimated_Cost,
                u.First_Name, u.Last_Name,
                ${brandSub} AS Brand, ${modelSub} AS Model,
                TIMESTAMPDIFF(HOUR, r.Created_At, NOW()) AS hours_elapsed
         FROM Reservations r
         JOIN Vehicles v ON r.Vehicle_Id = v.Id
         JOIN Users u ON r.User_Id = u.Id
         WHERE r.Status = 'pending_payment'
         ORDER BY r.Created_At ASC`
    );

    const [active] = await pool.execute(
        `SELECT r.Id, r.Start_Date, r.End_Date, r.Estimated_Cost,
                u.First_Name, u.Last_Name,
                ${brandSub} AS Brand, ${modelSub} AS Model,
                GREATEST(0, DATEDIFF(NOW(), r.End_Date)) AS days_overdue,
                (SELECT COALESCE(SUM(Amount), 0) FROM Payments p
                   WHERE p.Reservation_Id = r.Id AND p.Payment_Type = 'Penalty' AND p.Status = 'pending') AS pending_penalty
         FROM Reservations r
         JOIN Vehicles v ON r.Vehicle_Id = v.Id
         JOIN Users u ON r.User_Id = u.Id
         WHERE r.Status = 'active'
         ORDER BY r.End_Date ASC`
    );

    const [auditLogs] = await pool.execute(
        `SELECT Id, Record_Id, Action_Type, New_Values, Changed_At
         FROM Audit_Logs
         WHERE Table_Name = 'Reservations'
         ORDER BY Changed_At DESC, Id DESC
         LIMIT 15`
    );

    return NextResponse.json({ pending, active, auditLogs });
}

// Akcje symulacji: cofanie dat w czasie oraz ręczne uruchomienie procedur SQL.
export async function POST(request: Request) {
    if (!await requireStaff()) {
        return NextResponse.json({ error: 'Brak uprawnień' }, { status: 403 });
    }

    const { action, reservationId, days, hours } = await request.json();

    try {
        switch (action) {
            case 'backdate_created': {
                // Cofa moment utworzenia rezerwacji, by przekroczyła limit 24h.
                const [res] = await pool.execute(
                    'UPDATE Reservations SET Created_At = DATE_SUB(Created_At, INTERVAL ? HOUR) WHERE Id = ? AND Status = ?',
                    [hours ?? 25, reservationId, 'pending_payment']
                ) as any;
                if (res.affectedRows === 0) {
                    return NextResponse.json({ error: 'Nie znaleziono rezerwacji oczekującej na płatność.' }, { status: 400 });
                }
                return NextResponse.json({ message: `Cofnięto utworzenie rezerwacji #${reservationId} o ${hours ?? 25} h.` });
            }

            case 'backdate_end': {
                // Cofa termin zwrotu aktywnego wynajmu, czyniąc go zaległym.
                const [res] = await pool.execute(
                    'UPDATE Reservations SET End_Date = DATE_SUB(End_Date, INTERVAL ? DAY) WHERE Id = ? AND Status = ?',
                    [days ?? 3, reservationId, 'active']
                ) as any;
                if (res.affectedRows === 0) {
                    return NextResponse.json({ error: 'Nie znaleziono aktywnego wynajmu.' }, { status: 400 });
                }
                return NextResponse.json({ message: `Cofnięto termin zwrotu wynajmu #${reservationId} o ${days ?? 3} dni.` });
            }

            case 'process_overdue': {
                // Kursor naliczający kary za opóźnienia.
                await pool.execute('CALL process_overdue_reservations()');
                const [[row]] = await pool.execute(
                    "SELECT COUNT(*) AS cnt FROM Reservations WHERE Status = 'active' AND End_Date < NOW()"
                ) as any;
                return NextResponse.json({ message: `Procedura zakończona. Zaległych wynajmów przetworzonych: ${row.cnt}.` });
            }

            case 'cancel_unpaid': {
                // Event/procedura anulująca nieopłacone rezerwacje po przekroczeniu limitu.
                const [[before]] = await pool.execute(
                    "SELECT COUNT(*) AS cnt FROM Reservations WHERE Status = 'cancelled'"
                ) as any;
                await pool.execute('CALL cancel_unpaid_reservations()');
                const [[after]] = await pool.execute(
                    "SELECT COUNT(*) AS cnt FROM Reservations WHERE Status = 'cancelled'"
                ) as any;
                return NextResponse.json({ message: `Anulowano nieopłaconych rezerwacji: ${after.cnt - before.cnt}.` });
            }

            default:
                return NextResponse.json({ error: 'Nieznana akcja' }, { status: 400 });
        }
    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ error: e.message || 'Błąd operacji' }, { status: 500 });
    }
}
