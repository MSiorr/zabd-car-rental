import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
    try {
        const { firstName, lastName, email, password, drivingLicense } = await request.json();

        if (!firstName || !lastName || !email || !password || !drivingLicense) {
            return NextResponse.json({ error: 'Wypełnij wszystkie pola' }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await pool.execute(
            'INSERT INTO Users (First_Name, Last_Name, Email, Password_Hash, Driving_License, Role) VALUES (?, ?, ?, ?, ?, ?)',
            [firstName, lastName, email, hashedPassword, drivingLicense, 'client']
        ) as any;

        return NextResponse.json({ message: 'Użytkownik zarejestrowany pomyślnie!', userId: result.insertId }, { status: 201 });
    } catch (error: any) {
        if (error.code === 'ER_DUP_ENTRY') {
            return NextResponse.json({ error: 'Adres email jest już zajęty' }, { status: 400 });
        }
        console.error('Registration error:', error);
        return NextResponse.json({ error: 'Wystąpił błąd podczas rejestracji' }, { status: 500 });
    }
}
