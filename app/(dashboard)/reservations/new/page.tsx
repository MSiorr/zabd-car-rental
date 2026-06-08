'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Car } from 'lucide-react';

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

interface Breakdown {
    basePrice: number;
    category: string;
    categoryMultiplier: number;
    dailyRate: number;
    totalDays: number;
    weekdayDays: number;
    weekendDays: number;
    weekendMultiplier: number;
    weekdayCost: number;
    weekendCost: number;
    seasonApplies: boolean;
    seasonMultiplier: number;
    subtotal: number;
    promoApplies: boolean;
    discountPercent: number;
    discountAmount: number;
    total: number;
}

export default function NewReservationPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const vehicleIdStr = searchParams.get('vehicleId');
    const vehicleId = vehicleIdStr ? parseInt(vehicleIdStr, 10) : null;
    const preStartDate = searchParams.get('startDate') ?? '';
    const preEndDate   = searchParams.get('endDate')   ?? '';

    const [vehicle, setVehicle] = useState<Vehicle | null>(null);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [pickupId, setPickupId] = useState('');
    const [dropoffId, setDropoffId] = useState('');
    const [startDate, setStartDate] = useState(preStartDate);
    const [endDate, setEndDate] = useState(preEndDate);
    const [promoCode, setPromoCode] = useState('');
    const [debouncedPromo, setDebouncedPromo] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [estimatedDays, setEstimatedDays] = useState(0);
    const [estimatedCost, setEstimatedCost] = useState<number | null>(null);
    const [breakdown, setBreakdown] = useState<Breakdown | null>(null);
    const [estimateLoading, setEstimateLoading] = useState(false);
    const [promoStatus, setPromoStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');
    const [promoError, setPromoError] = useState('');

    useEffect(() => {
        if (!vehicleId) { router.push('/fleet'); return; }
        Promise.all([
            fetch(`/api/vehicles/${vehicleId}`),
            fetch('/api/branches')
        ]).then(async ([vehRes, branchRes]) => {
            if (vehRes.ok) {
                const v = await vehRes.json();
                setVehicle(v);
                if (v.Branch_Id) setPickupId(v.Branch_Id.toString());
            }
            if (branchRes.ok) setBranches(await branchRes.json());
        }).catch(console.error);
    }, [vehicleId, router]);

    // Debounce promo code — wait 600ms after user stops typing
    useEffect(() => {
        const t = setTimeout(() => setDebouncedPromo(promoCode), 600);
        return () => clearTimeout(t);
    }, [promoCode]);

    // Reset promo status when user is still typing
    useEffect(() => {
        if (promoCode !== debouncedPromo) {
            setPromoStatus('idle');
            setPromoError('');
        }
    }, [promoCode, debouncedPromo]);

    // Fetch real estimated cost from server (includes multipliers, season, promo)
    useEffect(() => {
        if (!vehicleId || !startDate || !endDate) {
            setEstimatedDays(0);
            setEstimatedCost(null);
            setBreakdown(null);
            setPromoStatus('idle');
            setPromoError('');
            return;
        }

        setEstimateLoading(true);
        const params = new URLSearchParams({
            vehicleId: String(vehicleId),
            startDate: `${startDate} 12:00:00`,
            endDate:   `${endDate} 12:00:00`,
        });
        if (debouncedPromo) params.set('promoCode', debouncedPromo);

        fetch(`/api/reservations/estimate?${params}`)
            .then(r => r.json())
            .then(data => {
                if (data.estimatedCost !== undefined) {
                    setEstimatedCost(parseFloat(data.estimatedCost));
                    setEstimatedDays(data.days);
                    setBreakdown(data.breakdown ?? null);
                    if (debouncedPromo) {
                        setPromoStatus(data.promoApplied ? 'valid' : 'invalid');
                        setPromoError(data.promoError || '');
                    } else {
                        setPromoStatus('idle');
                        setPromoError('');
                    }
                }
            })
            .catch(() => {})
            .finally(() => setEstimateLoading(false));
    }, [vehicleId, startDate, endDate, debouncedPromo]);

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
        if (promoCode && promoStatus === 'invalid') {
            setError('Kod promocyjny jest nieprawidłowy lub wygasł.');
            return;
        }
        setLoading(true);
        try {
            const payload: any = {
                vehicleId,
                pickupId: parseInt(pickupId, 10),
                dropoffId: parseInt(dropoffId, 10),
                startDate: `${startDate} 12:00:00`,
                endDate: `${endDate} 12:00:00`,
            };
            if (promoCode) payload.promoCode = promoCode;
            const res = await fetch('/api/reservations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Błąd podczas tworzenia rezerwacji');
            router.push(`/reservations/payment/${data.reservationId}`);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!vehicleId) return null;

    const selectCls = "flex h-12 w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 transition-shadow";
    const isPromoTyping = promoCode !== debouncedPromo && promoCode.length > 0;

    return (
        <div className="container mx-auto p-4 py-12 max-w-6xl">
            <div className="mb-8 pb-6 border-b border-slate-100">
                <h1 className="text-3xl font-black text-slate-900">Nowa Rezerwacja</h1>
                <p className="text-slate-500 text-sm mt-1">Wypełnij szczegóły wynajmu i przejdź do płatności.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-8 shadow-sm">
                    <h2 className="text-lg font-bold text-slate-900 mb-6">Szczegóły wynajmu</h2>

                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 border border-red-100 text-sm">
                            <p className="font-bold mb-1">Nie udało się złożyć rezerwacji</p>
                            <p>{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="font-semibold text-slate-700">Oddział odbioru <span className="text-red-500">*</span></Label>
                                <select
                                    className={`${selectCls} bg-slate-50 text-slate-500 cursor-not-allowed`}
                                    value={pickupId}
                                    disabled
                                    required
                                >
                                    <option value="" disabled>Wybierz miasto odbioru...</option>
                                    {branches.map(b => (
                                        <option key={b.Id} value={b.Id}>{b.City} — {b.Name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <Label className="font-semibold text-slate-700">Oddział zwrotu <span className="text-red-500">*</span></Label>
                                <select
                                    className={selectCls}
                                    value={dropoffId}
                                    onChange={(e) => setDropoffId(e.target.value)}
                                    required
                                >
                                    <option value="" disabled>Wybierz miasto zwrotu...</option>
                                    {branches.map(b => (
                                        <option key={b.Id} value={b.Id}>{b.City} — {b.Name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <Label className="font-semibold text-slate-700">Data odbioru <span className="text-red-500">*</span></Label>
                                <Input
                                    type="date"
                                    className="h-12 border-slate-200 rounded-lg px-4 focus:ring-red-500/30 focus:border-red-400"
                                    value={startDate}
                                    min={new Date().toISOString().split('T')[0]}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="font-semibold text-slate-700">Data zwrotu <span className="text-red-500">*</span></Label>
                                <Input
                                    type="date"
                                    className="h-12 border-slate-200 rounded-lg px-4 focus:ring-red-500/30 focus:border-red-400"
                                    value={endDate}
                                    min={startDate || new Date().toISOString().split('T')[0]}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <Label className="font-semibold text-slate-700">
                                    Kod Promocyjny
                                    <span className="text-slate-400 font-normal text-xs ml-2">(Opcjonalnie)</span>
                                </Label>
                                <div className="flex items-center gap-3">
                                    <Input
                                        type="text"
                                        placeholder="np. LATO2026"
                                        className={`h-12 rounded-lg px-4 w-full md:w-1/2 uppercase transition-colors ${
                                            promoStatus === 'valid'   ? 'border-emerald-400 focus:ring-emerald-500/30 focus:border-emerald-400' :
                                            promoStatus === 'invalid' ? 'border-red-300 focus:ring-red-500/30 focus:border-red-400' :
                                            'border-slate-200 focus:ring-red-500/30 focus:border-red-400'
                                        }`}
                                        value={promoCode}
                                        onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                                    />
                                    {isPromoTyping && (
                                        <span className="text-xs text-slate-400">Weryfikacja...</span>
                                    )}
                                    {!isPromoTyping && promoStatus === 'valid' && (
                                        <span className="text-xs font-semibold text-emerald-600">Kod aktywny</span>
                                    )}
                                    {!isPromoTyping && promoStatus === 'invalid' && (
                                        <span className="text-xs font-semibold text-red-500">{promoError || 'Nieprawidłowy kod'}</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 mt-2 border-t border-slate-100 flex justify-end">
                            <Button
                                type="submit"
                                size="lg"
                                className="w-full md:w-auto h-14 px-10 text-lg bg-red-600 text-white font-bold cursor-pointer shadow-sm"
                                disabled={loading || isPromoTyping}
                            >
                                {loading ? 'Przetwarzanie...' : 'Przejdź do kasy'}
                            </Button>
                        </div>
                    </form>
                </div>

                {/* Summary sidebar */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm sticky top-8">
                        <h2 className="text-lg font-bold text-slate-900 mb-5 pb-4 border-b border-slate-100">Podsumowanie</h2>

                        {vehicle ? (
                            <>
                                <div className="mb-5 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    <div className="aspect-[16/9] flex items-center justify-center bg-white rounded-lg border border-slate-100 mb-4 shadow-inner">
                                        <Car className="w-16 h-16 text-slate-300" />
                                    </div>
                                    <h3 className="font-black text-xl text-slate-900">
                                        {vehicle.attributes?.Marka || 'Pojazd'} {vehicle.attributes?.Model || ''}
                                    </h3>
                                    <p className="text-sm text-slate-500">{vehicle.category || vehicle.Category}</p>
                                    <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-center">
                                        <span className="text-slate-500 text-sm">Cena bazowa:</span>
                                        <span className="font-bold text-slate-900">{vehicle.Base_Price_Per_Day} PLN/dzień</span>
                                    </div>
                                </div>

                                {breakdown ? (
                                    <div className="space-y-2.5 text-sm mb-5 px-1">
                                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Jak liczymy cenę</p>

                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-500">Cena bazowa</span>
                                            <span className="font-medium text-slate-700">{breakdown.basePrice.toFixed(2)} PLN/dzień</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-500">
                                                Kategoria <span className="font-medium text-slate-700">{breakdown.category}</span>
                                                <span className="text-slate-400"> (×{breakdown.categoryMultiplier})</span>
                                            </span>
                                            <span className="font-medium text-slate-700">{breakdown.dailyRate.toFixed(2)} PLN/dzień</span>
                                        </div>

                                        <div className="border-t border-slate-100 pt-2 mt-1 space-y-2">
                                            <div className="flex justify-between items-center">
                                                <span className="text-slate-500">
                                                    Dni robocze: {breakdown.weekdayDays} × {breakdown.dailyRate.toFixed(2)}
                                                </span>
                                                <span className="font-medium text-slate-700">{breakdown.weekdayCost.toFixed(2)} PLN</span>
                                            </div>
                                            {breakdown.weekendDays > 0 && (
                                                <div className="flex justify-between items-center">
                                                    <span className="text-slate-500">
                                                        Weekend: {breakdown.weekendDays} × {breakdown.dailyRate.toFixed(2)}
                                                        <span className="text-amber-600"> ×{breakdown.weekendMultiplier}</span>
                                                    </span>
                                                    <span className="font-medium text-slate-700">{breakdown.weekendCost.toFixed(2)} PLN</span>
                                                </div>
                                            )}
                                        </div>

                                        {breakdown.seasonApplies && (
                                            <div className="flex justify-between items-center text-amber-600 border-t border-slate-100 pt-2">
                                                <span>Sezon wysoki (×{breakdown.seasonMultiplier})</span>
                                                <span className="font-semibold">+{(breakdown.subtotal - breakdown.weekdayCost - breakdown.weekendCost).toFixed(2)} PLN</span>
                                            </div>
                                        )}

                                        {breakdown.promoApplies && (
                                            <div className="flex justify-between items-center text-emerald-600 border-t border-slate-100 pt-2">
                                                <span>Rabat {promoCode} (−{breakdown.discountPercent}%)</span>
                                                <span className="font-semibold">−{breakdown.discountAmount.toFixed(2)} PLN</span>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-2 text-sm mb-5 px-1">
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-500">Liczba dni:</span>
                                            <span className="font-semibold text-slate-900">{estimatedDays || '—'}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-slate-400">
                                            <span>Wybierz daty, aby zobaczyć wycenę</span>
                                        </div>
                                    </div>
                                )}

                                <div className="pt-4 border-t-2 border-dashed border-slate-200">
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="font-bold text-slate-900">Całkowity koszt</p>
                                            <p className="text-xs text-slate-400">
                                                {estimatedCost !== null ? 'Kwota z mnożnikami i rabatem' : 'Wybierz daty'}
                                            </p>
                                        </div>
                                        <span className={`text-3xl font-black transition-opacity duration-200 ${estimateLoading ? 'opacity-40' : 'opacity-100'} ${estimatedCost !== null ? 'text-red-600' : 'text-slate-300'}`}>
                                            {estimatedCost !== null
                                                ? <>{estimatedCost.toFixed(2)} <span className="text-sm font-bold text-slate-400">PLN</span></>
                                                : '—'}
                                        </span>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="animate-pulse flex flex-col gap-4">
                                <div className="h-40 bg-slate-100 rounded-xl w-full"></div>
                                <div className="h-5 bg-slate-100 rounded w-1/2"></div>
                                <div className="h-4 bg-slate-100 rounded w-1/3"></div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
