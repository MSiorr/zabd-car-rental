'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Rental {
    Id: number;
    Vehicle_Id: number;
    First_Name: string;
    Last_Name: string;
    Email: string;
    Driving_License: string;
    Brand: string;
    Model: string;
    License_Plate: string;
    Status: string;
    Start_Date: string;
    End_Date: string;
    Estimated_Cost: string;
    Final_Cost: string | null;
    DropoffCity: string;
    DropoffBranchName: string;
}

export default function AdminPage() {
    const [rentals, setRentals] = useState<Rental[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    // Modal state
    const [selectedRental, setSelectedRental] = useState<Rental | null>(null);
    const [additionalFee, setAdditionalFee] = useState<number>(0);
    const [isReturning, setIsReturning] = useState(false);
    const [isIssuing, setIsIssuing] = useState(false);
    const [returnError, setReturnError] = useState('');
    const [returnSuccess, setReturnSuccess] = useState('');

    const fetchRentals = () => {
        setIsLoading(true);
        fetch('/api/admin/rentals')
            .then(res => res.json())
            .then(data => {
                if (data.error) setError(data.error);
                else setRentals(data);
                setIsLoading(false);
            })
            .catch(() => {
                setError('Wystąpił błąd podczas ładowania');
                setIsLoading(false);
            });
    };

    useEffect(() => {
        fetchRentals();
    }, []);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending_payment': return <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-1 rounded">Oczekuje na płatność</span>;
            case 'confirmed': return <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded">Potwierdzona</span>;
            case 'active': return <span className="bg-purple-100 text-purple-800 text-xs font-bold px-2 py-1 rounded">Wydany / Aktywny</span>;
            case 'completed': return <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded">Zakończona</span>;
            case 'cancelled': return <span className="bg-red-100 text-red-800 text-xs font-bold px-2 py-1 rounded">Anulowana</span>;
            default: return <span className="bg-zinc-100 text-zinc-800 text-xs font-bold px-2 py-1 rounded">{status}</span>;
        }
    };

    const handleIssue = async (rentalId: number, vehicleId: number) => {
        if (!confirm('Na pewno chcesz wydać ten pojazd klientowi?')) return;
        setIsIssuing(true);
        try {
            const res = await fetch('/api/admin/issue', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reservationId: rentalId, vehicleId })
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Błąd wydawania');
            }
            fetchRentals();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setIsIssuing(false);
        }
    };

    const handleReturn = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedRental) return;
        setIsReturning(true);
        setReturnError('');
        setReturnSuccess('');

        try {
            const res = await fetch('/api/return', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reservationId: selectedRental.Id,
                    additionalFee: additionalFee
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Błąd zwrotu');
            if (data.finalCost === null && data.message.includes('Błąd')) throw new Error(data.message);

            setReturnSuccess(`Zwrócono pomyślnie! ${data.message} | Ostateczny koszt: ${data.finalCost} PLN`);
            fetchRentals();
            setTimeout(() => {
                setSelectedRental(null);
                setReturnSuccess('');
            }, 3000);
        } catch (err: any) {
            setReturnError(err.message);
        } finally {
            setIsReturning(false);
        }
    };

    if (isLoading) return <div className="text-center py-20 text-zinc-500">Trwa ładowanie panelu pracownika...</div>;

    if (error) return <div className="text-center py-20 text-red-500 font-bold">{error}</div>;

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6 border-b pb-4 text-zinc-800">Operacje na Wypożyczeniach</h1>

            <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
                <table className="w-full text-left text-sm text-zinc-600">
                    <thead className="bg-zinc-50 text-zinc-800 font-semibold border-b">
                        <tr>
                            <th className="px-4 py-3">ID / Klient</th>
                            <th className="px-4 py-3">Pojazd</th>
                            <th className="px-4 py-3">Data Od - Do</th>
                            <th className="px-4 py-3">Szacowany koszt</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3 text-right">Akcja</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                        {rentals.map(r => (
                            <tr key={r.Id} className="hover:bg-zinc-50/50 transition-colors">
                                <td className="px-4 py-3">
                                    <div className="font-bold text-zinc-900">#RES-{r.Id}</div>
                                    <div className="text-xs">{r.First_Name} {r.Last_Name}</div>
                                    <div className="text-xs text-zinc-400">{r.Driving_License}</div>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="font-bold text-zinc-800">{r.Brand} {r.Model}</div>
                                    <div className="text-xs font-mono bg-zinc-200 px-1 py-0.5 rounded inline-block mt-1">{r.License_Plate}</div>
                                </td>
                                <td className="px-4 py-3 text-xs">
                                    Od: {new Date(r.Start_Date).toLocaleString()}<br />
                                    Do: <span className="font-bold text-red-500">{new Date(r.End_Date).toLocaleString()}</span><br />
                                    Zwrot w: <span className="text-zinc-800 font-semibold">{r.DropoffCity}</span>
                                </td>
                                <td className="px-4 py-3">
                                    <span className="font-semibold text-zinc-800">{r.Estimated_Cost} PLN</span>
                                    {r.Final_Cost && <div className="text-xs text-green-600 font-bold">Finał: {r.Final_Cost} PLN</div>}
                                </td>
                                <td className="px-4 py-3">
                                    {getStatusBadge(r.Status)}
                                </td>
                                <td className="px-4 py-3 text-right space-x-2">
                                    {(r.Status === 'confirmed' || r.Status === 'pending_payment') && (
                                        <Button size="sm" variant="outline" className="text-blue-600 border-blue-600 hover:bg-blue-50" onClick={() => handleIssue(r.Id, r.Vehicle_Id)} disabled={isIssuing}>
                                            Wydaj Pojazd
                                        </Button>
                                    )}
                                    {(r.Status === 'active' || r.Status === 'confirmed') && (
                                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500" onClick={() => {
                                            setSelectedRental(r);
                                            setAdditionalFee(0);
                                        }}>
                                            Przyjmij Zwrot
                                        </Button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal dla Zwrotu */}
            {selectedRental && (
                <div className="fixed inset-0 bg-zinc-900/50 flex items-center justify-center p-4 backdrop-blur-sm z-50">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-lg w-full">
                        <h2 className="text-2xl font-bold mb-4 text-zinc-900">Formularz Zwrotu Pojazdu</h2>
                        <p className="mb-4 text-sm text-zinc-600 border-b pb-4">
                            Przyjmujesz pojazd <strong>{selectedRental.Brand} {selectedRental.Model} ({selectedRental.License_Plate})</strong> od klienta <strong>{selectedRental.First_Name} {selectedRental.Last_Name}</strong>.
                            <br /><br />
                            Sprawdź stan pojazdu. Jeśli auto jest opóźnione wg daty w systemie, kwota za czas doliczy się automatycznie (chyba że podasz kwotę manualnej nadpłaty w tym formularzu).
                        </p>

                        <form onSubmit={handleReturn} className="space-y-4">
                            <div>
                                <Label htmlFor="additionalFee" className="mb-1 block font-semibold">Dodatkowe opłaty (uszkodzenia, nadmierne zabrudzenie) - PLN</Label>
                                <Input
                                    id="additionalFee"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={additionalFee}
                                    onChange={(e) => setAdditionalFee(parseFloat(e.target.value) || 0)}
                                    autoFocus
                                    className="font-mono text-lg"
                                />
                                <p className="text-xs text-zinc-500 mt-1">Wpisz 0, jeśli auto wróciło w stanie perfekcyjnym i o czasie.</p>
                            </div>

                            {returnError && <div className="text-red-600 bg-red-50 p-3 rounded-lg text-sm font-semibold">{returnError}</div>}
                            {returnSuccess && <div className="text-green-600 bg-green-50 p-3 rounded-lg text-sm font-semibold">{returnSuccess}</div>}

                            <div className="flex justify-end gap-3 mt-8 pt-4 border-t">
                                <Button type="button" variant="outline" onClick={() => setSelectedRental(null)} disabled={isReturning}>Anuluj</Button>
                                <Button type="submit" disabled={isReturning} className="bg-emerald-600 hover:bg-emerald-500">
                                    {isReturning ? 'Zapisuję w DB...' : 'Zatwierdź Zwrot'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}