import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { decrypt } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET() {
    try {
        const cookieStore = await cookies();
        const cookie = cookieStore.get('session')?.value;
        const session = await decrypt(cookie);

        if (!session || !session.userId || (session.role !== 'admin' && session.role !== 'employee')) {
            return NextResponse.json({ error: 'Brak uprawnień. Dostęp tylko dla pracowników.' }, { status: 403 });
        }

        const [rows] = await pool.execute(
            `SELECT 
                r.*, 
                v.License_Plate, 
                v.VIN,
                u.First_Name,
                u.Last_Name,
                u.Email,
                u.Driving_License,
                b_pickup.City as PickupCity,
                b_pickup.Name as PickupBranchName,
                b_dropoff.City as DropoffCity,
                b_dropoff.Name as DropoffBranchName,
                (SELECT Value_String FROM Vehicle_Attribute va JOIN Attributes a ON va.Attribute_Id = a.Id WHERE va.Vehicle_Id = v.Id AND a.Name = 'Marka') as Brand,
                (SELECT Value_String FROM Vehicle_Attribute va JOIN Attributes a ON va.Attribute_Id = a.Id WHERE va.Vehicle_Id = v.Id AND a.Name = 'Model') as Model
             FROM Reservations r
             JOIN Vehicles v ON r.Vehicle_Id = v.Id
             JOIN Users u ON r.User_Id = u.Id
             JOIN Branches b_pickup ON r.PickUp_Branch_Id = b_pickup.Id
             JOIN Branches b_dropoff ON r.DropOff_Branch_Id = b_dropoff.Id
             WHERE r.Status IN ('active', 'confirmed', 'completed', 'pending_payment')
             ORDER BY r.Start_Date DESC`
        );

        return NextResponse.json(rows);
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Wystąpił błąd serwera' }, { status: 500 });
    }
}
