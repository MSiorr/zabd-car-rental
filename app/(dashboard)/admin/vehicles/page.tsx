'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2, Car } from 'lucide-react';

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

const STATUS_STYLES: Record<string, { badge: string; label: string }> = {
    available:   { badge: 'bg-emerald-100 text-emerald-800 border border-emerald-200', label: 'Dostępny' },
    rented:      { badge: 'bg-blue-100 text-blue-800 border border-blue-200',         label: 'Wypożyczony' },
    maintenance: { badge: 'bg-amber-100 text-amber-800 border border-amber-200',      label: 'Serwis' },
    retired:     { badge: 'bg-slate-100 text-slate-600 border border-slate-200',      label: 'Wycofany' },
};

const STATUS_OPTIONS = [
    { value: 'available',   label: 'Dostępny' },
    { value: 'maintenance', label: 'Serwis' },
    { value: 'retired',     label: 'Wycofany' },
];

export default function AdminVehiclesPage() {
    const router = useRouter();
    const [vehicles, setVehicles] = useState<VehicleCard[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [deleteTarget, setDeleteTarget] = useState<{ id: number; plate: string } | null>(null);

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

    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return;
        const res = await fetch(`/api/admin/vehicles/${deleteTarget.id}`, { method: 'DELETE' });
        const data = await res.json();
        setDeleteTarget(null);
        if (!res.ok) { alert(data.error); return; }
        fetchVehicles();
    };

    if (isLoading) return (
        <div className="flex items-center justify-center py-32 text-slate-400">
            <Car className="w-8 h-8 animate-pulse mr-3" /> Ładowanie floty...
        </div>
    );

    return (
        <>
            {/* Delete modal */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 border border-slate-100">
                        <div className="flex items-center justify-center w-14 h-14 bg-red-100 rounded-full mx-auto mb-5">
                            <Trash2 className="w-7 h-7 text-red-600" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 text-center mb-2">Usunąć pojazd?</h3>
                        <p className="text-slate-500 text-center mb-6">
                            Pojazd <span className="font-mono font-bold text-slate-800">{deleteTarget.plate}</span> zostanie trwale usunięty. Tej operacji nie można cofnąć.
                        </p>
                        <div className="flex gap-3">
                            <Button variant="outline" className="flex-1 cursor-pointer" onClick={() => setDeleteTarget(null)}>
                                Anuluj
                            </Button>
                            <Button className="flex-1 bg-red-600 text-white cursor-pointer" onClick={handleDeleteConfirm}>
                                Usuń pojazd
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900">Zarządzanie Flotą</h1>
                        <p className="text-slate-500 text-sm mt-0.5">{vehicles.length} pojazdów w systemie</p>
                    </div>
                    <Button
                        className="bg-red-600 text-white cursor-pointer flex items-center gap-2 h-10 px-5"
                        onClick={() => router.push('/admin/vehicles/new')}
                    >
                        <Plus className="w-4 h-4" /> Dodaj pojazd
                    </Button>
                </div>

                {/* Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    {vehicles.length === 0 ? (
                        <div className="text-center py-20 text-slate-400">
                            <Car className="w-10 h-10 mx-auto mb-3 text-slate-200" />
                            Brak pojazdów w flocie.
                        </div>
                    ) : (
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                    <th className="px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Pojazd</th>
                                    <th className="px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Rejestracja</th>
                                    <th className="px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Cena / dzień</th>
                                    <th className="px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Lokalizacja</th>
                                    <th className="px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                    <th className="px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Akcje</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {vehicles.map(v => {
                                    const attrs = typeof v.attributes === 'string' ? JSON.parse(v.attributes) : (v.attributes ?? {});
                                    const brand = attrs?.Marka ?? '';
                                    const model = attrs?.Model ?? '';
                                    const style = STATUS_STYLES[v.Status] ?? STATUS_STYLES.retired;
                                    return (
                                        <tr key={v.Id} className="hover:bg-slate-50/70 transition-colors duration-100">
                                            <td className="px-5 py-4">
                                                <div className="font-semibold text-slate-900">
                                                    {brand || model ? `${brand} ${model}`.trim() : v.category}
                                                </div>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-xs text-slate-400">{v.category}</span>
                                                    <span className="text-slate-200">·</span>
                                                    <span className="text-xs font-mono text-slate-400">#VEH-{v.Id}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-xs tracking-wide">
                                                    {v.License_Plate}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 font-semibold text-slate-900">
                                                {v.Base_Price_Per_Day} <span className="text-slate-400 font-normal text-xs">PLN</span>
                                            </td>
                                            <td className="px-5 py-4 text-slate-600">
                                                <div className="font-medium">{v.city}</div>
                                                <div className="text-xs text-slate-400">{v.branch}</div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <select
                                                    value={v.Status}
                                                    onChange={e => handleStatusChange(v.Id, e.target.value)}
                                                    className={`px-2.5 py-1 rounded-full text-xs font-semibold border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500/30 ${style.badge}`}
                                                >
                                                    {STATUS_OPTIONS.map(s => (
                                                        <option key={s.value} value={s.value}>{s.label}</option>
                                                    ))}
                                                    {v.Status === 'rented' && <option value="rented">Wypożyczony</option>}
                                                </select>
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                <div className="flex gap-2 justify-end">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer flex items-center gap-1.5 transition-colors duration-150"
                                                        onClick={() => router.push(`/admin/vehicles/${v.Id}/edit`)}
                                                    >
                                                        <Pencil className="w-3.5 h-3.5" /> Edytuj
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        className="bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 cursor-pointer flex items-center gap-1.5 transition-colors duration-150"
                                                        onClick={() => setDeleteTarget({ id: v.Id, plate: v.License_Plate })}
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" /> Usuń
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </>
    );
}
