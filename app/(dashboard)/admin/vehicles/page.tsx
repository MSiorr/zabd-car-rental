'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

interface VehicleCard {
    Id: number;
    VIN: string;
    License_Plate: string;
    Status: string;
    Base_Price_Per_Day: string;
    category: string;
    branch: string;
}

export default function AdminVehiclesPage() {
    const [vehicles, setVehicles] = useState<VehicleCard[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchVehicles = () => {
        setIsLoading(true);
        fetch('/api/admin/vehicles')
            .then(res => res.json())
            .then(data => {
                setVehicles(data);
                setIsLoading(false);
            })
            .catch(() => setIsLoading(false));
    };

    useEffect(() => {
        fetchVehicles();
    }, []);

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-zinc-800">Zarządzanie Flotą</h1>
                <Button className="bg-blue-600 hover:bg-blue-500" onClick={() => alert('W trakcie implementacji API do insertów.')}>
                    dodaj nowy pojazd
                </Button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
                <table className="w-full text-left text-sm text-zinc-600">
                    <thead className="bg-zinc-50 text-zinc-800 font-semibold border-b">
                        <tr>
                            <th className="px-4 py-3">ID / VIN</th>
                            <th className="px-4 py-3">Kategoria</th>
                            <th className="px-4 py-3">Rejestracja</th>
                            <th className="px-4 py-3">Cena bazowa</th>
                            <th className="px-4 py-3">Lokalizacja</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3 text-right">Akcja</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                        {vehicles.map(v => (
                            <tr key={v.Id} className="hover:bg-zinc-50/50 transition-colors">
                                <td className="px-4 py-3">
                                    <div className="font-bold text-zinc-900">#VEH-{v.Id}</div>
                                    <div className="text-xs text-zinc-400 font-mono">{v.VIN}</div>
                                </td>
                                <td className="px-4 py-3">{v.category}</td>
                                <td className="px-4 py-3 font-mono font-bold">{v.License_Plate}</td>
                                <td className="px-4 py-3 font-semibold">{v.Base_Price_Per_Day} PLN</td>
                                <td className="px-4 py-3">{v.branch}</td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${v.Status === 'available' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                        {v.Status}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-right space-x-2">
                                    <Button size="sm" variant="outline" onClick={() => alert('Edycja w trakcie implementacji')}>
                                        Edytuj
                                    </Button>
                                    <Button size="sm" variant="destructive" onClick={() => alert('Usuwanie w trakcie implementacji')}>
                                        Usuń
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}