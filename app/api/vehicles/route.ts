import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const city     = searchParams.get('city');
    const category = searchParams.get('category');
    const brand    = searchParams.get('brand');
    const fuel     = searchParams.get('fuel');

    const params: any[] = [];

    let query = `
        SELECT
            vaf.*,
            MAX(CASE WHEN a.Name = 'Marka'          THEN va.Value_String END) AS brand,
            MAX(CASE WHEN a.Name = 'Model'          THEN va.Value_String END) AS model,
            MAX(CASE WHEN a.Name = 'Paliwo'         THEN va.Value_String END) AS fuel,
            MAX(CASE WHEN a.Name = 'Skrzynia biegów' THEN va.Value_String END) AS transmission
        FROM view_available_fleet vaf
        LEFT JOIN Vehicle_Attribute va ON va.Vehicle_Id = vaf.vehicle_id
        LEFT JOIN Attributes a ON va.Attribute_Id = a.Id
        WHERE 1=1
    `;

    if (city)     { query += ' AND vaf.branch_city = ?'; params.push(city); }
    if (category) { query += ' AND vaf.category = ?';    params.push(category); }

    query += `
        GROUP BY vaf.vehicle_id, vaf.License_Plate, vaf.Base_Price_Per_Day,
                 vaf.Status, vaf.category, vaf.cat_multiplier,
                 vaf.branch_name, vaf.branch_city, vaf.main_image
        HAVING 1=1
    `;

    if (brand) { query += ` AND MAX(CASE WHEN a.Name = 'Marka' THEN va.Value_String END) = ?`; params.push(brand); }
    if (fuel)  { query += ` AND MAX(CASE WHEN a.Name = 'Paliwo' THEN va.Value_String END) = ?`; params.push(fuel); }

    try {
        const [rows] = await pool.execute(query, params);

        const [cities]      = await pool.execute('SELECT DISTINCT City FROM Branches ORDER BY City') as any;
        const [categories]  = await pool.execute('SELECT DISTINCT Name FROM Vehicle_Categories ORDER BY Name') as any;
        const [brands]      = await pool.execute(`
            SELECT DISTINCT va.Value_String AS val
            FROM Vehicle_Attribute va
            JOIN Attributes a ON va.Attribute_Id = a.Id
            JOIN Vehicles v ON va.Vehicle_Id = v.Id
            WHERE a.Name = 'Marka' AND v.Status = 'available' AND va.Value_String IS NOT NULL
            ORDER BY val
        `) as any;
        const [fuels]       = await pool.execute(`
            SELECT DISTINCT va.Value_String AS val
            FROM Vehicle_Attribute va
            JOIN Attributes a ON va.Attribute_Id = a.Id
            JOIN Vehicles v ON va.Vehicle_Id = v.Id
            WHERE a.Name = 'Paliwo' AND v.Status = 'available' AND va.Value_String IS NOT NULL
            ORDER BY val
        `) as any;

        return NextResponse.json({
            vehicles: rows,
            meta: {
                cities:     cities.map((r: any) => r.City),
                categories: categories.map((r: any) => r.Name),
                brands:     brands.map((r: any) => r.val),
                fuels:      fuels.map((r: any) => r.val),
            }
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Błąd pobierania danych z bazy' }, { status: 500 });
    }
}