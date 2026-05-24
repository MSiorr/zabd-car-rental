'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Car, Calendar, MapPin, CreditCard, Plus } from 'lucide-react';

interface Reservation {
    Id: number;
    Vehicle_Id: number;
    Brand: string;
    Model: string;
    License_Plate: string;
    PickupCity: string;
    Start_Date: string;
    End_Date: string;
    Status: string;
    Estimated_Cost: string;
}

const STATUS_STYLES: Record<string, { cls: string; label: string }> = {
    pending_payment: { cls: 'bg-amber-100 text-amber-800 border-amber-200',    label: 'Oczekuje na płatność' },
    confirmed:       { cls: 'bg-sky-100 text-sky-800 border-sky-200',          label: 'Potwierdzona' },
    active:          { cls: 'bg-violet-100 text-violet-800 border-violet-200', label: 'W trakcie / Wydany' },
    completed:       { cls: 'bg-emerald-100 text-emerald-800 border-emerald-200', label: 'Zakończona' },
    cancelled:       { cls: 'bg-red-100 text-red-700 border-red-200',          label: 'Anulowana' },
};

export default function ReservationsPage() {
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetch('/api/reservations')
            .then(res => { if (!res.ok) throw new Error('Błąd pobierania rezerwacji'); return res.json(); })
            .then(data => setReservations(data))
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center py-32">
            <div className="flex flex-col items-center gap-3 text-slate-400">
                <Car className="w-10 h-10 animate-pulse" />
                <p>Ładowanie rezerwacji...</p>
            </div>
        </div>
    );

    return (
        <div className="container mx-auto p-4 py-12 max-w-6xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 pb-6 border-b border-slate-100">
                <div>
                    <h1 className="text-3xl font-black text-slate-900">Moje Rezerwacje</h1>
                    <p className="text-slate-500 mt-1 text-sm">Zarządzaj swoimi podróżami w panelu klienta</p>
                </div>
                <Button className="mt-4 md:mt-0 bg-red-600 text-white cursor-pointer flex items-center gap-2" asChild>
                    <Link href="/fleet"><Plus className="w-4 h-4" /> Nowa rezerwacja</Link>
                </Button>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 border border-red-100 text-sm font-medium">
                    {error}
                </div>
            )}

            {reservations.length === 0 ? (
                <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-16 text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                        <Car className="w-8 h-8 text-slate-400" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Brak aktywnych rezerwacji</h2>
                    <p className="text-slate-500 mb-8 max-w-md mx-auto text-sm leading-relaxed">
                        Nie masz jeszcze żadnych rezerwacji. Przejdź do przeglądu floty, wybierz wymarzony samochód i zaplanuj swoją podróż.
                    </p>
                    <Button className="bg-red-600 text-white cursor-pointer" size="lg" asChild>
                        <Link href="/fleet">Przeglądaj flotę</Link>
                    </Button>
                </div>
            ) : (
                <div className="grid gap-5">
                    {reservations.map(res => {
                        const statusInfo = STATUS_STYLES[res.Status] ?? { cls: 'bg-slate-100 text-slate-600 border-slate-200', label: res.Status };
                        return (
                            <div key={res.Id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200">
                                <div className="flex flex-col md:flex-row">
                                    {/* Vehicle image placeholder */}
                                    <div className="w-full md:w-52 bg-slate-50 flex-shrink-0 flex items-center justify-center p-8 border-r border-slate-100">
                                        <Car className="w-16 h-16 text-slate-300" />
                                    </div>

                                    <div className="p-6 md:p-8 flex-grow flex flex-col justify-between">
                                        {/* Top row */}
                                        <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-5 pb-5 border-b border-slate-100">
                                            <div>
                                                <div className="flex items-center gap-3 mb-2 flex-wrap">
                                                    <h3 className="text-2xl font-black text-slate-900">
                                                        {res.Brand || 'Auto'} {res.Model}
                                                    </h3>
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusInfo.cls}`}>
                                                        {statusInfo.label}
                                                    </span>
                                                </div>
                                                <p className="text-slate-500 text-sm font-mono">
                                                    NR REJ: <span className="text-slate-800 font-bold">{res.License_Plate}</span>
                                                </p>
                                            </div>

                                            <div className="text-right flex-shrink-0">
                                                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Całkowity koszt</p>
                                                <div className="text-3xl font-black text-red-600">
                                                    {Number(res.Estimated_Cost).toFixed(2)}
                                                    <span className="text-sm font-bold text-slate-400 ml-1">PLN</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Details grid */}
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                                            <div className="flex items-start gap-2">
                                                <Calendar className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                                                <div>
                                                    <p className="text-xs text-slate-400 uppercase tracking-wider mb-0.5">Odbiór</p>
                                                    <p className="font-semibold text-slate-900 text-sm">{new Date(res.Start_Date).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <Calendar className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                                                <div>
                                                    <p className="text-xs text-slate-400 uppercase tracking-wider mb-0.5">Zwrot</p>
                                                    <p className="font-semibold text-slate-900 text-sm">{new Date(res.End_Date).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <MapPin className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                                                <div>
                                                    <p className="text-xs text-slate-400 uppercase tracking-wider mb-0.5">Oddział odbioru</p>
                                                    <p className="font-semibold text-slate-900 text-sm">{res.PickupCity}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col sm:flex-row gap-3">
                                            {res.Status === 'pending_payment' && (
                                                <Button className="sm:w-auto bg-amber-500 hover:bg-amber-600 text-white font-bold h-11 cursor-pointer transition-colors duration-150 flex items-center gap-2" asChild>
                                                    <Link href={`/reservations/payment/${res.Id}`}>
                                                        <CreditCard className="w-4 h-4" /> Opłać rezerwację
                                                    </Link>
                                                </Button>
                                            )}
                                            <Button variant="outline" className="sm:w-auto border-slate-200 text-slate-700 hover:bg-slate-50 h-11 cursor-pointer transition-colors duration-150" asChild>
                                                <Link href={`/vehicles/${res.Vehicle_Id}`}>Karta pojazdu</Link>
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
