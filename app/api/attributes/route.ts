import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    const [rows] = await pool.execute('SELECT Id, Name, Type FROM Attributes ORDER BY Id');
    return NextResponse.json(rows);
}
