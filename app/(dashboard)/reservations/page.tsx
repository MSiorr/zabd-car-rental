'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

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

export default function ReservationsPage() {
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchReservations = async () => {
            try {
                const res = await fetch('/api/reservations');
                if (!res.ok) {
                    throw new Error('Błąd pobierania rezerwacji');
                }
                const data = await res.json();
                setReservations(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchReservations();
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending_payment': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'active': return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'completed': return 'bg-green-100 text-green-800 border-green-200';
            case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'pending_payment': return 'Oczekuje na płatność';
            case 'confirmed': return 'Potwierdzona';
            case 'active': return 'W trakcie / Wydany';
            case 'completed': return 'Zakończona';
            case 'cancelled': return 'Anulowana';
            default: return status;
        }
    };

    if (loading) return (
        <div className="container mx-auto p-4 py-12 flex justify-center items-center h-64">
            <div className="flex flex-col items-center text-zinc-500 gap-4">
                <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p>Ładowanie rezerwacji...</p>
            </div>
        </div>
    );

    return (
        <div className="container mx-auto p-4 py-12 max-w-6xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b pb-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-zinc-900">Moje Rezerwacje</h1>
                    <p className="text-zinc-500 mt-1">Zarządzaj swoimi podróżami w panelu klienta</p>
                </div>
                <div className="mt-4 md:mt-0">
                    <Button asChild className="bg-blue-600 hover:bg-blue-700">
                        <Link href="/fleet">Zarezerwuj nowy pojazd</Link>
                    </Button>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 text-red-500 p-4 rounded-xl mb-6 flex items-center gap-3 border border-red-100">
                    <span className="text-xl">⚠️</span>
                    <p>{error}</p>
                </div>
            )}

            {reservations.length === 0 ? (
                <div className="bg-zinc-50 rounded-2xl border border-dashed border-zinc-300 p-12 text-center shadow-sm">
                    <div className="text-6xl mb-4 opacity-50">📭</div>
                    <h2 className="text-xl font-bold text-zinc-800 mb-2">Brak aktywnych rezerwacji</h2>
                    <p className="text-zinc-500 mb-6 max-w-md mx-auto">
                        Nie masz jeszcze żadnych rezerwacji. Przejdź do przeglądu floty, wybierz wymarzony samochód i zaplanuj swoją podróż.
                    </p>
                    <Button asChild size="lg">
                        <Link href="/fleet">Przeglądaj wyselekcjonowaną flotę</Link>
                    </Button>
                </div>
            ) : (
                <div className="grid gap-6">
                    {reservations.map(res => (
                        <div key={res.Id} className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                            <div className="flex flex-col md:flex-row">
                                {/* Auto - wizualizacja lub zdjęcie */}
                                <div className="w-full md:w-64 bg-zinc-100 flex-shrink-0 flex items-center justify-center p-8 border-r border-zinc-100">
                                    <span className="text-8xl drop-shadow-sm">🚗</span>
                                </div>

                                {/* Treść */}
                                <div className="p-6 md:p-8 flex-grow flex flex-col justify-between">
                                    <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4 border-b border-zinc-100 pb-4">
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-2xl font-black text-zinc-900 uppercase">
                                                    {res.Brand || 'Auto'} {res.Model}
                                                </h3>
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(res.Status)}`}>
                                                    {getStatusLabel(res.Status)}
                                                </span>
                                            </div>
                                            <p className="text-zinc-500 flex items-center gap-2 text-sm font-medium">
                                                <span className="w-4 h-4 bg-zinc-200 rounded-sm inline-flex justify-center items-center text-[10px]">🔢</span>
                                                NR REJ: <span className="text-zinc-800">{res.License_Plate}</span>
                                            </p>
                                        </div>

                                        <div className="text-left md:text-right">
                                            <p className="text-xs text-zinc-400 font-semibold uppercase tracking-wider mb-1">Całkowity koszt</p>
                                            <div className="text-3xl font-black text-blue-600">
                                                {Number(res.Estimated_Cost).toFixed(2)} <span className="text-sm font-bold text-zinc-500">PLN</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                                        <div>
                                            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Termin odbioru</p>
                                            <p className="font-bold text-zinc-900 flex items-center gap-2">
                                                <span className="text-blue-500">📅</span>
                                                {new Date(res.Start_Date).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Termin zwrotu</p>
                                            <p className="font-bold text-zinc-900 flex items-center gap-2">
                                                <span className="text-red-500">📅</span>
                                                {new Date(res.End_Date).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Oddział odbioru</p>
                                            <p className="font-bold text-zinc-900 flex items-center gap-2">
                                                <span className="text-green-500">📍</span>
                                                {res.PickupCity}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Opcje zarzadzania</p>
                                            <p className="text-sm text-zinc-400 mt-1">Skontaktuj się z biurem w celu dokonania zmian.</p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-3 pt-4">
                                        {res.Status === 'pending_payment' && (
                                            <Button asChild size="lg" className="w-full sm:w-auto bg-yellow-500 hover:bg-yellow-600 text-white font-bold h-12">
                                                <Link href={`/reservations/payment/${res.Id}`}>Opłać rezerwację teraz</Link>
                                            </Button>
                                        )}
                                        <Button variant="outline" size="lg" className="w-full sm:w-auto font-semibold h-12" asChild>
                                            <Link href={`/vehicles/${res.Vehicle_Id}`}>Pokaż kartę pojazdu</Link>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
