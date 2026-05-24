'use client';

import { useState, useEffect, use } from 'react';
import VehicleForm from '@/components/VehicleForm';

export default function EditVehiclePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [data, setData] = useState<any>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        fetch(`/api/admin/vehicles/${id}`)
            .then(r => r.json())
            .then(json => {
                if (json.error) { setError(json.error); return; }
                const attrMap: Record<number, any> = {};
                for (const a of json.attributes) {
                    if (a.Value_String !== null) attrMap[a.Id] = a.Value_String;
                    else if (a.Value_Number !== null) attrMap[a.Id] = a.Value_Number;
                    else if (a.Value_Date !== null) attrMap[a.Id] = a.Value_Date;
                    else if (a.Value_Bool !== null) attrMap[a.Id] = !!a.Value_Bool;
                }
                setData({ vehicle: json.vehicle, attrMap });
            })
            .catch(() => setError('Błąd ładowania danych pojazdu'));
    }, [id]);

    if (error) return <div className="text-red-600 font-bold p-8">{error}</div>;
    if (!data) return <div className="text-slate-500 p-8">Ładowanie...</div>;

    const { vehicle, attrMap } = data;

    return (
        <div>
            <div className="mb-8 border-b border-slate-100 pb-6">
                <h1 className="text-2xl font-black text-slate-900">Edytuj pojazd #{id}</h1>
                <p className="text-slate-500 text-sm mt-1">Zmodyfikuj dane i zapisz zmiany.</p>
            </div>
            <VehicleForm
                vehicleId={Number(id)}
                initialData={{
                    VIN: vehicle.VIN,
                    License_Plate: vehicle.License_Plate,
                    Base_Price_Per_Day: vehicle.Base_Price_Per_Day,
                    Category_Id: vehicle.Category_Id,
                    Branch_Id: vehicle.Branch_Id,
                    Status: vehicle.Status,
                    attributes: attrMap,
                }}
            />
        </div>
    );
}
