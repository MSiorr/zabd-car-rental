import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const vehicleId = searchParams.get('vehicleId');
    const startDate = searchParams.get('startDate');
    const endDate   = searchParams.get('endDate');
    const promoCode = searchParams.get('promoCode') || '';

    if (!vehicleId || !startDate || !endDate) {
        return NextResponse.json({ error: 'Brak wymaganych parametrów' }, { status: 400 });
    }

    try {
        let promoId: number | null = null;
        let promoApplied = false;
        let promoError   = '';

        if (promoCode) {
            const [promoRows] = await pool.execute(
                'SELECT Id FROM Promotions WHERE Promo_Code = ? AND NOW() BETWEEN Valid_From AND Valid_To',
                [promoCode]
            ) as any[];
            if (promoRows.length > 0) {
                promoId      = promoRows[0].Id;
                promoApplied = true;
            } else {
                promoError = 'Nieprawidłowy lub wygasły kod';
            }
        }

        const [[result]] = await pool.execute(
            'SELECT calculate_final_rate(?, ?, ?, ?) AS cost',
            [vehicleId, startDate, endDate, promoId]
        ) as any;

        const days = Math.max(1, Math.ceil(
            (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 3600 * 24)
        ));

        return NextResponse.json({ estimatedCost: result.cost, days, promoApplied, promoError });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Błąd obliczania kosztu' }, { status: 500 });
    }
}
