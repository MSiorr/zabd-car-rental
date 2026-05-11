'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Branch {
    Id: number;
    Name: string;
    City: string;
    Address: string;
}

interface Vehicle {
    Id: number;
    Brand: string;
    Model: string;
    Category: string;
    Base_Price_Per_Day: string;
    [key: string]: any;
}

export default function NewReservationPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const vehicleIdStr = searchParams.get('vehicleId');
    const vehicleId = vehicleIdStr ? parseInt(vehicleIdStr, 10) : null;

    const [vehicle, setVehicle] = useState<Vehicle | null>(null);
    const [branches, setBranches] = useState<Branch[]>([]);

    const [pickupId, setPickupId] = useState('');
    const [dropoffId, setDropoffId] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [promoCode, setPromoCode] = useState('');

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Kalkulacja na froncie (poglądowa)
    const [estimatedDays, setEstimatedDays] = useState(0);
    const [estimatedCost, setEstimatedCost] = useState(0);

    useEffect(() => {
        if (!vehicleId) {
            router.push('/fleet');
            return;
        }

        const fetchData = async () => {
            try {
                const [vehRes, branchRes] = await Promise.all([
                    fetch(`/api/vehicles/${vehicleId}`),
                    fetch('/api/branches')
                ]);

                if (vehRes.ok) {
                    const v = await vehRes.json();
                    setVehicle(v);
                    if (v.Branch_Id) {
                        setPickupId(v.Branch_Id.toString());
                    }
                }
                if (branchRes.ok) {
                    setBranches(await branchRes.json());
                }
            } catch (err) {
                console.error(err);
            }
        };
        fetchData();
    }, [vehicleId, router]);

    useEffect(() => {
        if (startDate && endDate && vehicle) {
            const sDate = new Date(startDate);
            const eDate = new Date(endDate);
            const msDiff = eDate.getTime() - sDate.getTime();
            const days = Math.ceil(msDiff / (1000 * 3600 * 24));

            if (days >= 0) {
                // Minimalnie pobieramy za 1 dzień
                const billableDays = days === 0 ? 1 : days;
                setEstimatedDays(billableDays);
                setEstimatedCost(billableDays * parseFloat(vehicle.Base_Price_Per_Day));
            } else {
                setEstimatedDays(0);
                setEstimatedCost(0);
            }
        } else {
            setEstimatedDays(0);
            setEstimatedCost(0);
        }
    }, [startDate, endDate, vehicle]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!pickupId || !dropoffId || !startDate || !endDate) {
            setError('Wypełnij wszystkie wymagane pola (daty i oddziały).');
            return;
        }

        if (estimatedDays <= 0) {
            setError('Data zwrotu nie może być wcześniejsza niż data odbioru.');
            return;
        }

        setLoading(true);

        try {
            const payload: any = {
                vehicleId,
                pickupId: parseInt(pickupId, 10),
                dropoffId: parseInt(dropoffId, 10),
                startDate: `${startDate} 12:00:00`, // Ustawienie konkretnej godziny domyślnie
                endDate: `${endDate} 12:00:00`,
            };

            if (promoCode) {
                payload.promoCode = promoCode;
            }

            const res = await fetch('/api/reservations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Błąd podczas tworzenia rezerwacji');
            }

            // Po udanej rezerwacji - przekierowanie do płatności
            router.push(`/reservations/payment/${data.reservationId}`);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!vehicleId) return null;

    return (
        <div className="container mx-auto p-4 py-12 max-w-6xl">
            <h1 className="text-3xl font-extrabold mb-8 text-zinc-900 border-b pb-4">Nowa Rezerwacja</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Formularz - Lewa Strona */}
                <div className="lg:col-span-2 bg-white rounded-2xl border p-8 shadow-sm">
                    <h2 className="text-xl font-bold mb-6">Szczegóły wynajmu</h2>

                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 border border-red-100 flex items-start gap-3">
                            <span className="text-xl">⚠️</span>
                            <div>
                                <p className="font-bold">Nie udało się złożyć rezerwacji</p>
                                <p className="text-sm mt-1">{error}</p>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <Label htmlFor="pickup" className="font-semibold text-zinc-700">Oddział odbioru <span className="text-red-500">*</span></Label>
                                <select
                                    id="pickup"
                                    className="flex h-12 w-full rounded-lg border border-zinc-200 bg-zinc-100 px-4 py-2 text-sm text-zinc-500 cursor-not-allowed focus:outline-none transition-shadow"
                                    value={pickupId}
                                    disabled
                                    required
                                >
                                    <option value="" disabled>Wybierz miasto odbioru...</option>
                                    {branches.map(b => (
                                        <option key={b.Id} value={b.Id}>{b.City} - {b.Name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-3">
                                <Label htmlFor="dropoff" className="font-semibold text-zinc-700">Oddział zwrotu <span className="text-red-500">*</span></Label>
                                <select
                                    id="dropoff"
                                    className="flex h-12 w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                                    value={dropoffId}
                                    onChange={(e) => setDropoffId(e.target.value)}
                                    required
                                >
                                    <option value="" disabled>Wybierz miasto zwrotu...</option>
                                    {branches.map(b => (
                                        <option key={b.Id} value={b.Id}>{b.City} - {b.Name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-3">
                                <Label htmlFor="startDate" className="font-semibold text-zinc-700">Data odbioru <span className="text-red-500">*</span></Label>
                                <Input
                                    id="startDate"
                                    type="date"
                                    className="h-12 border-zinc-200 rounded-lg px-4"
                                    value={startDate}
                                    min={new Date().toISOString().split('T')[0]}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="space-y-3">
                                <Label htmlFor="endDate" className="font-semibold text-zinc-700">Data zwrotu <span className="text-red-500">*</span></Label>
                                <Input
                                    id="endDate"
                                    type="date"
                                    className="h-12 border-zinc-200 rounded-lg px-4"
                                    value={endDate}
                                    min={startDate || new Date().toISOString().split('T')[0]}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="space-y-3 md:col-span-2">
                                <Label htmlFor="promoCode" className="font-semibold text-zinc-700">Kod Promocyjny <span className="text-zinc-400 font-normal text-xs ml-2">(Opcjonalnie)</span></Label>
                                <Input
                                    id="promoCode"
                                    type="text"
                                    placeholder="np. LATO2026"
                                    className="h-12 border-zinc-200 rounded-lg px-4 w-full md:w-1/2 uppercase"
                                    value={promoCode}
                                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                                />
                            </div>
                        </div>

                        <div className="pt-6 mt-6 border-t border-zinc-100 flex justify-end">
                            <Button type="submit" size="lg" className="w-full md:w-auto h-14 px-10 text-lg bg-blue-600 hover:bg-blue-700 shadow-md" disabled={loading}>
                                {loading ? 'Przetwarzanie...' : 'Przejdź do kasy'}
                            </Button>
                        </div>
                    </form>
                </div>

                {/* Podsumowanie - Prawa Strona */}
                <div className="lg:col-span-1">
                    <div className="bg-zinc-50 rounded-2xl border border-zinc-200 p-6 sticky top-8">
                        <h2 className="text-xl font-bold mb-4 text-zinc-900 border-b border-zinc-200 pb-3">Podsumowanie</h2>

                        {vehicle ? (
                            <>
                                <div className="mb-6 bg-white p-4 rounded-xl shadow-sm border border-zinc-100">
                                    <div className="text-4xl aspect-[16/9] flex items-center justify-center bg-zinc-50 rounded-lg border border-zinc-100 mb-4 shadow-inner">
                                        🚗
                                    </div>
                                    <h3 className="font-extrabold text-xl text-zinc-900">{vehicle.attributes?.Marka || 'Pojazd'} {vehicle.attributes?.Model || ''}</h3>
                                    <p className="text-sm text-zinc-500 font-medium">{vehicle.category || vehicle.Category} Class</p>

                                    <div className="mt-4 pt-4 border-t border-zinc-100 flex justify-between items-center">
                                        <span className="text-zinc-500 text-sm">Cena bazowa:</span>
                                        <span className="font-bold text-zinc-900">{vehicle.Base_Price_Per_Day} PLN/dzień</span>
                                    </div>
                                </div>

                                <div className="space-y-3 text-sm mb-6 px-1">
                                    <div className="flex justify-between items-center">
                                        <span className="text-zinc-500">Ilość dni wynajmu:</span>
                                        <span className="font-semibold text-zinc-900">{estimatedDays}</span>
                                    </div>
                                    {/* Additional info fees */}
                                    <div className="flex justify-between items-center text-zinc-400">
                                        <span>Podatki i opłaty (wliczone):</span>
                                        <span>0.00 PLN</span>
                                    </div>
                                </div>

                                <div className="mt-6 pt-4 border-t-2 border-zinc-200 border-dashed">
                                    <div className="flex justify-between items-end">
                                        <div className="flex flex-col">
                                            <span className="text-lg font-bold text-zinc-900">Całkowity koszt</span>
                                            <span className="text-xs text-zinc-500">Szacowana kwota (brutto)</span>
                                        </div>
                                        <span className="text-3xl font-black text-blue-600">
                                            {estimatedCost.toFixed(2)} PLN
                                        </span>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="animate-pulse flex flex-col gap-4">
                                <div className="h-48 bg-zinc-200 rounded-xl w-full"></div>
                                <div className="h-6 bg-zinc-200 rounded w-1/2"></div>
                                <div className="h-4 bg-zinc-200 rounded w-1/3"></div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}