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

        // Procedura zwraca pojedynczy wiersz z rozbiciem ceny na składniki.
        const [resultSets] = await pool.query(
            'CALL calculate_rate_breakdown(?, ?, ?, ?)',
            [vehicleId, startDate, endDate, promoId]
        ) as any;
        const b = resultSets[0][0];

        // Promo mogło zostać odrzucone w procedurze (np. za mało dni) — odzwierciedlamy to.
        if (promoCode && promoApplied && !b.promo_applies) {
            promoApplied = false;
            promoError   = promoError || 'Kod wymaga dłuższego okresu najmu';
        }

        const breakdown = {
            basePrice:          Number(b.base_price),
            category:           b.category,
            categoryMultiplier: Number(b.category_multiplier),
            dailyRate:          Number(b.daily_rate),
            totalDays:          Number(b.total_days),
            weekdayDays:        Number(b.weekday_days),
            weekendDays:        Number(b.weekend_days),
            weekendMultiplier:  Number(b.weekend_multiplier),
            weekdayCost:        Number(b.weekday_cost),
            weekendCost:        Number(b.weekend_cost),
            seasonApplies:      !!b.season_applies,
            seasonMultiplier:   Number(b.season_multiplier),
            subtotal:           Number(b.subtotal),
            promoApplies:       !!b.promo_applies,
            discountPercent:    Number(b.discount_percent),
            discountAmount:     Number(b.discount_amount),
            total:              Number(b.total),
        };

        return NextResponse.json({
            estimatedCost: breakdown.total,
            days: breakdown.totalDays,
            promoApplied,
            promoError,
            breakdown,
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Błąd obliczania kosztu' }, { status: 500 });
    }
}
