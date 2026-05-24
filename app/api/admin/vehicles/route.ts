import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { decrypt } from '@/lib/auth';
import { cookies } from 'next/headers';

async function getSession() {
    const cookieStore = await cookies();
    const cookie = cookieStore.get('session')?.value;
    return decrypt(cookie);
}

export async function GET() {
    try {
        const session = await getSession();
        if (!session || !['admin', 'employee'].includes(session.role as string)) {
            return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 403 });
        }
        const [rows] = await pool.execute('SELECT * FROM view_vehicle_card ORDER BY Id DESC');
        return NextResponse.json(rows);
    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ error: 'Błąd pobierania bazy' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getSession();
        if (!session || !['admin', 'employee'].includes(session.role as string)) {
            return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 403 });
        }

        const { VIN, License_Plate, Base_Price_Per_Day, Category_Id, Branch_Id, Status = 'available', attributes = {} } = await request.json();

        if (!VIN || !License_Plate || !Base_Price_Per_Day || !Category_Id || !Branch_Id) {
            return NextResponse.json({ error: 'Brakuje wymaganych pól' }, { status: 400 });
        }

        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            const [result] = await conn.execute(
                'INSERT INTO Vehicles (VIN, License_Plate, Base_Price_Per_Day, Category_Id, Branch_Id, Status) VALUES (?, ?, ?, ?, ?, ?)',
                [VIN, License_Plate, Number(Base_Price_Per_Day), Number(Category_Id), Number(Branch_Id), Status]
            ) as any;

            const vehicleId = result.insertId;
            await insertAttributes(conn, vehicleId, attributes);

            await conn.commit();
            return NextResponse.json({ id: vehicleId }, { status: 201 });
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

export async function insertAttributes(conn: any, vehicleId: number, attributes: Record<string, any>) {
    const attrIds = Object.keys(attributes).filter(id => attributes[id] !== '' && attributes[id] !== null && attributes[id] !== undefined);
    if (attrIds.length === 0) return;

    const placeholders = attrIds.map(() => '?').join(',');
    const [attrRows] = await conn.execute(
        `SELECT Id, Type FROM Attributes WHERE Id IN (${placeholders})`,
        attrIds
    ) as any;

    for (const attr of attrRows) {
        const raw = attributes[attr.Id];
        let vs = null, vn = null, vd = null, vb = null;
        switch (attr.Type) {
            case 'STRING':  vs = String(raw); break;
            case 'NUMBER':  vn = Number(raw); break;
            case 'DATE':    vd = String(raw); break;
            case 'BOOLEAN': vb = (raw === true || raw === 'true') ? 1 : 0; break;
        }
        await conn.execute(
            `INSERT INTO Vehicle_Attribute (Vehicle_Id, Attribute_Id, Value_String, Value_Number, Value_Date, Value_Bool)
             VALUES (?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE Value_String=VALUES(Value_String), Value_Number=VALUES(Value_Number),
             Value_Date=VALUES(Value_Date), Value_Bool=VALUES(Value_Bool)`,
            [vehicleId, attr.Id, vs, vn, vd, vb]
        );
    }
}
