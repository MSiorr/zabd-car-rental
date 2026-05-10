import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import bcrypt from 'bcryptjs';
import { encrypt } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json({ error: 'Podaj email i hasło' }, { status: 400 });
        }

        const [rows] = await pool.execute('SELECT * FROM Users WHERE Email = ?', [email]) as any;
        const user = rows[0];

        if (!user) {
            return NextResponse.json({ error: 'Nieprawidłowy email lub hasło' }, { status: 401 });
        }

        const isMatch = await bcrypt.compare(password, user.Password_Hash);
        if (!isMatch) {
            return NextResponse.json({ error: 'Nieprawidłowy email lub hasło' }, { status: 401 });
        }

        // Dodanie roli i danych do payloadu JWT
        const payload = {
            userId: user.Id,
            email: user.Email,
            role: user.Role,
            firstName: user.First_Name,
            lastName: user.Last_Name
        };

        const session = await encrypt(payload);

        const cookieStore = await cookies();

        cookieStore.set('session', session, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 7
        });

        return NextResponse.json(
            {
                message: 'Zalogowano pomyślnie!',
                user: payload
            },
            { status: 200 }
        );

    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ error: 'Wystąpił błąd podczas logowania' }, { status: 500 });
    }
}
