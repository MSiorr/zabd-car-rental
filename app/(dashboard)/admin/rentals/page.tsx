'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Car, ArrowLeftRight, Send, XCircle } from 'lucide-react';

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
    Outstanding: string;
    DropoffCity: string;
    DropoffBranchName: string;
}

interface DamageType {
    Id: number;
    Name: string;
    Default_Cost: string;
}

interface DamageRow {
    key: string;
    damageTypeId: number | null;
    description: string;
    amount: number;
    selected: boolean;
}

const STATUS_BADGES: Record<string, string> = {
    pending_payment: 'bg-amber-100 text-amber-800 border border-amber-200',
    confirmed:       'bg-sky-100 text-sky-800 border border-sky-200',
    active:          'bg-violet-100 text-violet-800 border border-violet-200',
    completed:       'bg-emerald-100 text-emerald-800 border border-emerald-200',
    cancelled:       'bg-red-100 text-red-700 border border-red-200',
};

const STATUS_LABELS: Record<string, string> = {
    pending_payment: 'Oczekuje na płatność',
    confirmed:       'Potwierdzona',
    active:          'Wydany / Aktywny',
    completed:       'Zakończona',
    cancelled:       'Anulowana',
};

export default function AdminRentalsPage() {
    const [rentals, setRentals] = useState<Rental[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedRental, setSelectedRental] = useState<Rental | null>(null);
    const [issueTarget, setIssueTarget] = useState<Rental | null>(null);
    const [cancelTarget, setCancelTarget] = useState<Rental | null>(null);
    const [isCancelling, setIsCancelling] = useState(false);
    const [damageTypes, setDamageTypes] = useState<DamageType[]>([]);
    const [damageRows, setDamageRows] = useState<DamageRow[]>([]);
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

    useEffect(() => { fetchRentals(); }, []);

    useEffect(() => {
        fetch('/api/admin/damage-types')
            .then(res => res.ok ? res.json() : [])
            .then(data => { if (Array.isArray(data)) setDamageTypes(data); })
            .catch(() => {});
    }, []);

    const openReturn = (r: Rental) => {
        // Inicjalizujemy listę usterek ze słownika (odznaczone, z domyślną kwotą).
        setDamageRows(damageTypes.map(dt => ({
            key: `dt-${dt.Id}`,
            damageTypeId: dt.Id,
            description: dt.Name,
            amount: Number(dt.Default_Cost),
            selected: false,
        })));
        setReturnError('');
        setReturnSuccess('');
        setSelectedRental(r);
    };

    const toggleDamage = (key: string) => {
        setDamageRows(rows => rows.map(row =>
            row.key === key ? { ...row, selected: !row.selected } : row
        ));
    };

    const setDamageAmount = (key: string, amount: number) => {
        setDamageRows(rows => rows.map(row =>
            row.key === key ? { ...row, amount } : row
        ));
    };

    const addCustomDamage = () => {
        setDamageRows(rows => [...rows, {
            key: `custom-${Date.now()}`,
            damageTypeId: null,
            description: '',
            amount: 0,
            selected: true,
        }]);
    };

    const setCustomDescription = (key: string, description: string) => {
        setDamageRows(rows => rows.map(row =>
            row.key === key ? { ...row, description } : row
        ));
    };

    const damageTotal = damageRows
        .filter(r => r.selected)
        .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

    const confirmIssue = async () => {
        if (!issueTarget) return;
        setIsIssuing(true);
        try {
            const res = await fetch('/api/admin/issue', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reservationId: issueTarget.Id, vehicleId: issueTarget.Vehicle_Id })
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Błąd wydawania');
            }
            setIssueTarget(null);
            fetchRentals();
        } catch (err: any) {
            setIssueTarget(null);
            setError(err.message);
        } finally {
            setIsIssuing(false);
        }
    };

    const confirmCancel = async () => {
        if (!cancelTarget) return;
        setIsCancelling(true);
        try {
            const res = await fetch(`/api/admin/rentals/${cancelTarget.Id}/cancel`, { method: 'PATCH' });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Błąd anulowania');
            }
            setCancelTarget(null);
            fetchRentals();
        } catch (err: any) {
            setError(err.message);
            setCancelTarget(null);
        } finally {
            setIsCancelling(false);
        }
    };

    const handleReturn = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedRental) return;
        setIsReturning(true);
        setReturnError('');
        setReturnSuccess('');
        try {
            const damages = damageRows
                .filter(r => r.selected && Number(r.amount) > 0)
                .map(r => ({
                    damageTypeId: r.damageTypeId,
                    description: r.description || 'Uszkodzenie',
                    amount: Number(r.amount),
                }));

            const res = await fetch('/api/return', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reservationId: selectedRental.Id, damages })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Błąd zwrotu');
            const lateMsg = Number(data.lateFee) > 0 ? ` | Kara za opóźnienie: ${Number(data.lateFee).toFixed(2)} PLN` : '';
            const dmgMsg = Number(data.damageFee) > 0 ? ` | Uszkodzenia: ${Number(data.damageFee).toFixed(2)} PLN` : '';
            setReturnSuccess(`Zwrot przyjęty! Koszt końcowy: ${Number(data.finalCost).toFixed(2)} PLN${lateMsg}${dmgMsg}`);
            fetchRentals();
            setTimeout(() => { setSelectedRental(null); setReturnSuccess(''); }, 4000);
        } catch (err: any) {
            setReturnError(err.message);
        } finally {
            setIsReturning(false);
        }
    };

    if (isLoading) return (
        <div className="flex items-center justify-center py-32 text-slate-400">
            <Car className="w-8 h-8 animate-pulse mr-3" /> Trwa ładowanie panelu...
        </div>
    );
    if (error) return <div className="text-center py-20 text-red-500 font-bold">{error}</div>;

    return (
        <>
            {/* Issue modal */}
            {issueTarget && (
                <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 backdrop-blur-sm z-50">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full border border-slate-100">
                        <div className="flex items-center gap-3 mb-5 pb-5 border-b border-slate-100">
                            <div className="w-10 h-10 bg-sky-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <Send className="w-5 h-5 text-sky-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">Wydanie pojazdu</h2>
                                <p className="text-sm text-slate-500">
                                    {issueTarget.Brand} {issueTarget.Model} ({issueTarget.License_Plate})
                                </p>
                            </div>
                        </div>
                        <p className="text-sm text-slate-600 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100 leading-relaxed">
                            Potwierdzasz wydanie pojazdu klientowi <span className="font-semibold text-slate-900">{issueTarget.First_Name} {issueTarget.Last_Name}</span>? Status rezerwacji zmieni się na <span className="font-semibold text-violet-700">Aktywny</span>.
                        </p>
                        <div className="flex gap-3">
                            <Button type="button" variant="outline" className="flex-1 cursor-pointer" onClick={() => setIssueTarget(null)} disabled={isIssuing}>
                                Anuluj
                            </Button>
                            <Button type="button" onClick={confirmIssue} disabled={isIssuing} className="flex-1 bg-slate-800 hover:opacity-90 text-white cursor-pointer transition-opacity duration-150">
                                {isIssuing ? 'Wydawanie...' : 'Potwierdź wydanie'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Cancel modal */}
            {cancelTarget && (
                <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 backdrop-blur-sm z-50">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full border border-slate-100">
                        <div className="flex items-center gap-3 mb-5 pb-5 border-b border-slate-100">
                            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <XCircle className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">Anulowanie rezerwacji</h2>
                                <p className="text-sm text-slate-500">
                                    #{cancelTarget.Id} — {cancelTarget.Brand} {cancelTarget.Model} ({cancelTarget.License_Plate})
                                </p>
                            </div>
                        </div>
                        <p className="text-sm text-slate-600 mb-6 bg-red-50 p-4 rounded-xl border border-red-100 leading-relaxed">
                            Rezerwacja klienta <span className="font-semibold text-slate-900">{cancelTarget.First_Name} {cancelTarget.Last_Name}</span> zostanie anulowana. Operacja jest nieodwracalna.
                        </p>
                        <div className="flex gap-3">
                            <Button type="button" variant="outline" className="flex-1 cursor-pointer" onClick={() => setCancelTarget(null)} disabled={isCancelling}>
                                Wróć
                            </Button>
                            <Button type="button" onClick={confirmCancel} disabled={isCancelling} className="flex-1 bg-red-600 hover:opacity-90 text-white cursor-pointer transition-opacity duration-150">
                                {isCancelling ? 'Anulowanie...' : 'Anuluj rezerwację'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Return modal */}
            {selectedRental && (
                <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 backdrop-blur-sm z-50">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full border border-slate-100">
                        <div className="flex items-center gap-3 mb-5 pb-5 border-b border-slate-100">
                            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <ArrowLeftRight className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">Formularz Zwrotu Pojazdu</h2>
                                <p className="text-sm text-slate-500">
                                    {selectedRental.Brand} {selectedRental.Model} ({selectedRental.License_Plate}) — {selectedRental.First_Name} {selectedRental.Last_Name}
                                </p>
                            </div>
                        </div>
                        <p className="text-sm text-slate-600 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100 leading-relaxed">
                            Kara za opóźnienie naliczy się automatycznie wg liczby dni po terminie. Zaznacz usterki ze słownika (kwoty można nadpisać). Naliczone koszty pojawią się u klienta jako kwota do dopłaty.
                        </p>
                        <form onSubmit={handleReturn} className="space-y-5">
                            <div>
                                <Label className="mb-2 block font-semibold text-slate-700">
                                    Protokół uszkodzeń
                                </Label>
                                <div className="space-y-2 max-h-64 overflow-auto pr-1">
                                    {damageRows.map(row => (
                                        <div
                                            key={row.key}
                                            className={`flex items-center gap-3 p-2.5 rounded-lg border transition-colors ${
                                                row.selected ? 'border-emerald-300 bg-emerald-50/50' : 'border-slate-200 bg-white'
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={row.selected}
                                                onChange={() => toggleDamage(row.key)}
                                                className="w-4 h-4 accent-emerald-600 cursor-pointer flex-shrink-0"
                                            />
                                            {row.damageTypeId === null ? (
                                                <Input
                                                    type="text"
                                                    placeholder="Opis usterki..."
                                                    value={row.description}
                                                    onChange={(e) => setCustomDescription(row.key, e.target.value)}
                                                    className="h-9 text-sm flex-1"
                                                />
                                            ) : (
                                                <span className="text-sm text-slate-700 flex-1">{row.description}</span>
                                            )}
                                            <div className="flex items-center gap-1 flex-shrink-0">
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    value={row.amount}
                                                    onChange={(e) => setDamageAmount(row.key, parseFloat(e.target.value) || 0)}
                                                    disabled={!row.selected}
                                                    className="h-9 w-24 text-sm font-mono text-right"
                                                />
                                                <span className="text-xs text-slate-400">PLN</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <button
                                    type="button"
                                    onClick={addCustomDamage}
                                    className="mt-2 text-sm text-slate-500 hover:text-slate-800 cursor-pointer underline underline-offset-2"
                                >
                                    + Dodaj inną pozycję
                                </button>
                            </div>

                            <div className="flex justify-between items-center bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">
                                <span className="text-sm font-semibold text-slate-600">Suma uszkodzeń do naliczenia</span>
                                <span className="text-lg font-black text-slate-900 font-mono">{damageTotal.toFixed(2)} PLN</span>
                            </div>

                            {returnError && <div className="text-red-600 bg-red-50 p-3 rounded-lg text-sm font-semibold border border-red-100">{returnError}</div>}
                            {returnSuccess && <div className="text-emerald-700 bg-emerald-50 p-3 rounded-lg text-sm font-semibold border border-emerald-100">{returnSuccess}</div>}
                            <div className="flex gap-3 mt-6 pt-5 border-t border-slate-100">
                                <Button type="button" variant="outline" className="flex-1 cursor-pointer" onClick={() => setSelectedRental(null)} disabled={isReturning}>
                                    Anuluj
                                </Button>
                                <Button type="submit" disabled={isReturning} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer transition-colors duration-150">
                                    {isReturning ? 'Zapisuję...' : 'Zatwierdź Zwrot'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-black text-slate-900">Operacje na Wypożyczeniach</h1>
                    <p className="text-slate-500 text-sm mt-0.5">{rentals.length} aktywnych wpisów</p>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    {rentals.length === 0 ? (
                        <div className="text-center py-20 text-slate-400">
                            <Car className="w-10 h-10 mx-auto mb-3 text-slate-200" />
                            Brak wypożyczeń do wyświetlenia.
                        </div>
                    ) : (
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                    <th className="px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">ID / Klient</th>
                                    <th className="px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Pojazd</th>
                                    <th className="px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Termin</th>
                                    <th className="px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Kwota</th>
                                    <th className="px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                    <th className="px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Akcja</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {rentals.map(r => (
                                    <tr key={r.Id} className="hover:bg-slate-50/70 transition-colors duration-100">
                                        <td className="px-5 py-4">
                                            <div className="font-bold text-slate-900">#RES-{r.Id}</div>
                                            <div className="text-sm text-slate-600">{r.First_Name} {r.Last_Name}</div>
                                            <div className="text-xs text-slate-400 font-mono">{r.Driving_License}</div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="font-semibold text-slate-900">{r.Brand} {r.Model}</div>
                                            <span className="text-xs font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded tracking-wide">{r.License_Plate}</span>
                                        </td>
                                        <td className="px-5 py-4 text-xs text-slate-600">
                                            <div>Od: {new Date(r.Start_Date).toLocaleDateString()}</div>
                                            <div className="font-semibold text-red-500">Do: {new Date(r.End_Date).toLocaleDateString()}</div>
                                            <div className="text-slate-400">Zwrot: {r.DropoffCity}</div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="font-semibold text-slate-900">{r.Estimated_Cost} PLN</div>
                                            {r.Final_Cost && <div className="text-xs text-emerald-600 font-bold mt-0.5">Finał: {r.Final_Cost} PLN</div>}
                                            {Number(r.Outstanding) > 0 && (
                                                <div className="text-xs text-red-600 font-bold mt-0.5">Do dopłaty: {Number(r.Outstanding).toFixed(2)} PLN</div>
                                            )}
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_BADGES[r.Status] ?? 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                                                {STATUS_LABELS[r.Status] ?? r.Status}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <div className="flex gap-2 justify-end">
                                                {(r.Status === 'confirmed' || r.Status === 'pending_payment') && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors duration-150"
                                                        onClick={() => setIssueTarget(r)}
                                                        disabled={isIssuing}
                                                    >
                                                        Wydaj pojazd
                                                    </Button>
                                                )}
                                                {(r.Status === 'active' || r.Status === 'confirmed') && (
                                                    <Button
                                                        size="sm"
                                                        className="bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer transition-colors duration-150"
                                                        onClick={() => openReturn(r)}
                                                    >
                                                        Przyjmij zwrot
                                                    </Button>
                                                )}
                                                {(r.Status === 'pending_payment' || r.Status === 'confirmed') && (
                                                    <Button
                                                        size="sm"
                                                        className="bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 cursor-pointer transition-colors duration-150"
                                                        onClick={() => setCancelTarget(r)}
                                                        disabled={isCancelling}
                                                    >
                                                        Anuluj
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </>
    );
}
