import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { decrypt } from '@/lib/auth';
import { cookies } from 'next/headers';
import { insertAttributes } from '../route';

async function getSession() {
    const cookieStore = await cookies();
    const cookie = cookieStore.get('session')?.value;
    return decrypt(cookie);
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getSession();
        if (!session || !['admin', 'employee'].includes(session.role as string)) {
            return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 403 });
        }
        const { id } = await params;
        const [rows] = await pool.execute(
            `SELECT v.*, vc.Name as category_name, b.Name as branch_name, b.City as branch_city
             FROM Vehicles v
             JOIN Vehicle_Categories vc ON v.Category_Id = vc.Id
             JOIN Branches b ON v.Branch_Id = b.Id
             WHERE v.Id = ?`,
            [id]
        ) as any;
        if (!rows.length) return NextResponse.json({ error: 'Nie znaleziono pojazdu' }, { status: 404 });

        const [attrRows] = await pool.execute(
            `SELECT a.Id, a.Name, a.Type,
                    va.Value_String, va.Value_Number, va.Value_Date, va.Value_Bool
             FROM Attributes a
             LEFT JOIN Vehicle_Attribute va ON va.Attribute_Id = a.Id AND va.Vehicle_Id = ?
             ORDER BY a.Id`,
            [id]
        ) as any;

        return NextResponse.json({ vehicle: rows[0], attributes: attrRows });
    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 });
    }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getSession();
        if (!session || !['admin', 'employee'].includes(session.role as string)) {
            return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 403 });
        }
        const { id } = await params;
        const { VIN, License_Plate, Base_Price_Per_Day, Category_Id, Branch_Id, Status, attributes = {} } = await request.json();

        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();
            await conn.execute(
                'UPDATE Vehicles SET VIN=?, License_Plate=?, Base_Price_Per_Day=?, Category_Id=?, Branch_Id=?, Status=? WHERE Id=?',
                [VIN, License_Plate, Number(Base_Price_Per_Day), Number(Category_Id), Number(Branch_Id), Status, id]
            );
            await insertAttributes(conn, Number(id), attributes);
            await conn.commit();
            return NextResponse.json({ message: 'Zaktualizowano pojazd' });
        } catch (e) {
            await conn.rollback();
            throw e;
        } finally {
            conn.release();
        }
    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ error: e.message || 'Błąd serwera' }, { status: 500 });
    }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ error: 'Tylko admin może usuwać pojazdy' }, { status: 403 });
        }
        const { id } = await params;

        const [active] = await pool.execute(
            `SELECT COUNT(*) as cnt FROM Reservations WHERE Vehicle_Id = ? AND Status IN ('pending_payment','confirmed','active')`,
            [id]
        ) as any;
        if (active[0].cnt > 0) {
            return NextResponse.json({ error: 'Pojazd ma aktywne rezerwacje — nie można usunąć' }, { status: 400 });
        }

        await pool.execute('DELETE FROM Vehicle_Attribute WHERE Vehicle_Id = ?', [id]);
        await pool.execute('DELETE FROM Vehicle_Images WHERE Vehicle_Id = ?', [id]);
        await pool.execute('DELETE FROM Vehicles WHERE Id = ?', [id]);
        return NextResponse.json({ message: 'Usunięto pojazd' });
    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ error: e.message || 'Błąd serwera' }, { status: 500 });
    }
}
