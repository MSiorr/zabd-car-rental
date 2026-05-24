'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

interface VehicleCard {
    Id: number;
    VIN: string;
    License_Plate: string;
    Status: string;
    Base_Price_Per_Day: string;
    category: string;
    branch: string;
    city: string;
    attributes: Record<string, any> | null;
}

const STATUS_COLORS: Record<string, string> = {
    available:   'bg-green-100 text-green-800',
    rented:      'bg-blue-100 text-blue-800',
    maintenance: 'bg-yellow-100 text-yellow-800',
    retired:     'bg-red-100 text-red-800',
};

export default function AdminVehiclesPage() {
    const router = useRouter();
    const [vehicles, setVehicles] = useState<VehicleCard[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchVehicles = () => {
        setIsLoading(true);
        fetch('/api/admin/vehicles')
            .then(res => res.json())
            .then(data => { setVehicles(data); setIsLoading(false); })
            .catch(() => setIsLoading(false));
    };

    useEffect(() => { fetchVehicles(); }, []);

    const handleStatusChange = async (id: number, newStatus: string) => {
        await fetch(`/api/admin/vehicles/${id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus }),
        });
        fetchVehicles();
    };

    const handleDelete = async (id: number, plate: string) => {
        if (!confirm(`Usunąć pojazd ${plate}? Operacji nie można cofnąć.`)) return;
        const res = await fetch(`/api/admin/vehicles/${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (!res.ok) { alert(data.error); return; }
        fetchVehicles();
    };

    if (isLoading) return <div className="text-center py-20 text-zinc-500">Ładowanie floty...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-zinc-800">Zarządzanie Flotą</h1>
                <Button className="bg-blue-600 hover:bg-blue-500" onClick={() => router.push('/admin/vehicles/new')}>
                    + Dodaj nowy pojazd
                </Button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
                <table className="w-full text-left text-sm text-zinc-600">
                    <thead className="bg-zinc-50 text-zinc-800 font-semibold border-b">
                        <tr>
                            <th className="px-4 py-3">ID / VIN</th>
                            <th className="px-4 py-3">Pojazd</th>
                            <th className="px-4 py-3">Rejestracja</th>
                            <th className="px-4 py-3">Cena / dzień</th>
                            <th className="px-4 py-3">Lokalizacja</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3 text-right">Akcje</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                        {vehicles.map(v => {
                            const attrs = typeof v.attributes === 'string' ? JSON.parse(v.attributes) : (v.attributes ?? {});
                            const brand = attrs?.Marka ?? '';
                            const model = attrs?.Model ?? '';
                            return (
                                <tr key={v.Id} className="hover:bg-zinc-50/50 transition-colors">
                                    <td className="px-4 py-3">
                                        <div className="font-bold text-zinc-900">#VEH-{v.Id}</div>
                                        <div className="text-xs text-zinc-400 font-mono">{v.VIN}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="font-semibold text-zinc-900">{brand} {model}</div>
                                        <div className="text-xs text-zinc-500">{v.category}</div>
                                    </td>
                                    <td className="px-4 py-3 font-mono font-bold">{v.License_Plate}</td>
                                    <td className="px-4 py-3 font-semibold">{v.Base_Price_Per_Day} PLN</td>
                                    <td className="px-4 py-3">{v.city} — {v.branch}</td>
                                    <td className="px-4 py-3">
                                        <select
                                            value={v.Status}
                                            onChange={e => handleStatusChange(v.Id, e.target.value)}
                                            className={`px-2 py-1 rounded text-xs font-bold border-0 cursor-pointer focus:outline-none ${STATUS_COLORS[v.Status] ?? 'bg-zinc-100 text-zinc-800'}`}
                                        >
                                            <option value="available">available</option>
                                            <option value="maintenance">maintenance</option>
                                            <option value="retired">retired</option>
                                            {v.Status === 'rented' && <option value="rented">rented</option>}
                                        </select>
                                    </td>
                                    <td className="px-4 py-3 text-right space-x-2">
                                        <Button size="sm" variant="outline" onClick={() => router.push(`/admin/vehicles/${v.Id}/edit`)}>
                                            Edytuj
                                        </Button>
                                        <Button size="sm" variant="destructive" onClick={() => handleDelete(v.Id, v.License_Plate)}>
                                            Usuń
                                        </Button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {vehicles.length === 0 && (
                    <div className="text-center py-12 text-zinc-400">Brak pojazdów w flocie.</div>
                )}
            </div>
        </div>
    );
}
