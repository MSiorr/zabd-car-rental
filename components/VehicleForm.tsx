'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Category { Id: number; Name: string; Base_Multiplier: string; }
interface Branch { Id: number; Name: string; City: string; }
interface Attribute { Id: number; Name: string; Type: string; }

const ATTR_OPTIONS: Record<string, string[]> = {
    'Skrzynia biegów': ['Manualna', 'Automatyczna'],
    'Paliwo': ['Benzyna', 'Diesel', 'Hybryda', 'Elektryczny', 'LPG'],
};

interface VehicleFormProps {
    initialData?: {
        VIN: string;
        License_Plate: string;
        Base_Price_Per_Day: string;
        Category_Id: number;
        Branch_Id: number;
        Status: string;
        attributes: Record<number, any>;
    };
    vehicleId?: number;
}

const STATUS_OPTIONS = ['available', 'maintenance', 'retired'];

export default function VehicleForm({ initialData, vehicleId }: VehicleFormProps) {
    const router = useRouter();
    const isEdit = !!vehicleId;

    const [categories, setCategories] = useState<Category[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [attrDefs, setAttrDefs] = useState<Attribute[]>([]);

    const [VIN, setVIN] = useState(initialData?.VIN ?? '');
    const [plate, setPlate] = useState(initialData?.License_Plate ?? '');
    const [price, setPrice] = useState(initialData?.Base_Price_Per_Day ?? '');
    const [categoryId, setCategoryId] = useState(initialData?.Category_Id?.toString() ?? '');
    const [branchId, setBranchId] = useState(initialData?.Branch_Id?.toString() ?? '');
    const [status, setStatus] = useState(initialData?.Status ?? 'available');
    const [attrValues, setAttrValues] = useState<Record<number, any>>(initialData?.attributes ?? {});

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        Promise.all([
            fetch('/api/categories').then(r => r.json()),
            fetch('/api/branches').then(r => r.json()),
            fetch('/api/attributes').then(r => r.json()),
        ]).then(([cats, brs, attrs]) => {
            setCategories(cats);
            setBranches(brs);
            setAttrDefs(attrs);
        });
    }, []);

    const handleAttrChange = (attrId: number, value: any) => {
        setAttrValues(prev => ({ ...prev, [attrId]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const payload = {
            VIN,
            License_Plate: plate,
            Base_Price_Per_Day: price,
            Category_Id: Number(categoryId),
            Branch_Id: Number(branchId),
            Status: status,
            attributes: attrValues,
        };

        try {
            const url = isEdit ? `/api/admin/vehicles/${vehicleId}` : '/api/admin/vehicles';
            const method = isEdit ? 'PUT' : 'POST';
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Błąd zapisu');
            router.push('/admin/vehicles');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const renderAttrInput = (attr: Attribute) => {
        const val = attrValues[attr.Id] ?? '';
        const options = ATTR_OPTIONS[attr.Name];

        if (options) {
            return (
                <select
                    value={val}
                    onChange={e => handleAttrChange(attr.Id, e.target.value)}
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                    <option value="">Wybierz...</option>
                    {options.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
            );
        }

        switch (attr.Type) {
            case 'BOOLEAN':
                return (
                    <input
                        type="checkbox"
                        checked={val === true || val === 'true' || val === 1}
                        onChange={e => handleAttrChange(attr.Id, e.target.checked)}
                        className="h-5 w-5 mt-1"
                    />
                );
            case 'NUMBER':
                return (
                    <Input
                        type="number"
                        value={val}
                        onChange={e => handleAttrChange(attr.Id, e.target.value)}
                        className="h-10"
                    />
                );
            default:
                return (
                    <Input
                        type="text"
                        value={val}
                        onChange={e => handleAttrChange(attr.Id, e.target.value)}
                        className="h-10"
                    />
                );
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8 max-w-3xl">
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg font-semibold">
                    {error}
                </div>
            )}

            <div className="bg-white rounded-xl border p-6 shadow-sm space-y-5">
                <h2 className="text-lg font-bold text-slate-800 border-b pb-3">Dane podstawowe</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                        <Label>VIN *</Label>
                        <Input value={VIN} onChange={e => setVIN(e.target.value)} required maxLength={17} placeholder="WBA12345678901234" />
                    </div>
                    <div className="space-y-2">
                        <Label>Nr rejestracyjny *</Label>
                        <Input value={plate} onChange={e => setPlate(e.target.value)} required placeholder="WW 12345" />
                    </div>
                    <div className="space-y-2">
                        <Label>Cena bazowa / dzień (PLN) *</Label>
                        <Input type="number" step="0.01" min="0" value={price} onChange={e => setPrice(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                        <Label>Kategoria *</Label>
                        <select
                            value={categoryId}
                            onChange={e => setCategoryId(e.target.value)}
                            required
                            className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                            <option value="" disabled>Wybierz...</option>
                            {categories.map(c => (
                                <option key={c.Id} value={c.Id}>{c.Name} (×{c.Base_Multiplier})</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <Label>Oddział *</Label>
                        <select
                            value={branchId}
                            onChange={e => setBranchId(e.target.value)}
                            required
                            className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                            <option value="" disabled>Wybierz...</option>
                            {branches.map(b => (
                                <option key={b.Id} value={b.Id}>{b.City} — {b.Name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <Label>Status *</Label>
                        <select
                            value={status}
                            onChange={e => setStatus(e.target.value)}
                            className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {attrDefs.length > 0 && (
                <div className="bg-white rounded-xl border p-6 shadow-sm space-y-5">
                    <h2 className="text-lg font-bold text-slate-800 border-b pb-3">Atrybuty pojazdu</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {attrDefs.map(attr => (
                            <div key={attr.Id} className="space-y-2">
                                <Label>{attr.Name} <span className="text-slate-400 text-xs font-normal">({attr.Type})</span></Label>
                                {renderAttrInput(attr)}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex gap-3 justify-end">
                <Button type="button" variant="outline" onClick={() => router.push('/admin/vehicles')}>
                    Anuluj
                </Button>
                <Button type="submit" disabled={loading} className="bg-red-600 text-white cursor-pointer min-w-32">
                    {loading ? 'Zapisuję...' : isEdit ? 'Zapisz zmiany' : 'Dodaj pojazd'}
                </Button>
            </div>
        </form>
    );
}
