'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface Reservation {
    Id: number;
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

    if (loading) return <div className="p-8 text-center">Ładowanie...</div>;

    return (
        <div className="container mx-auto p-4 py-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Moje rezerwacje</h1>
            </div>

            {error && (
                <div className="bg-red-50 text-red-500 p-4 rounded-md mb-6 relative">
                    <p>{error}</p>
                </div>
            )}

            {reservations.length === 0 ? (
                <div className="bg-white rounded-xl border p-12 text-center shadow-sm">
                    <p className="text-muted-foreground text-lg mb-6">Nie masz jeszcze żadnych rezerwacji.</p>
                    <Button asChild>
                        <Link href="/fleet">Przeglądaj flotę</Link>
                    </Button>
                </div>
            ) : (
                <div className="grid gap-6">
                    {reservations.map(res => (
                        <div key={res.Id} className="bg-white p-6 rounded-xl border shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <h3 className="text-xl font-bold">{res.Brand} {res.Model}</h3>
                                <p className="text-sm text-gray-500 mb-2">Numer rej: {res.License_Plate} | Odbiór: {res.PickupCity}</p>
                                <p className="text-sm">
                                    <span className="font-semibold">Termin:</span> {new Date(res.Start_Date).toLocaleDateString()} - {new Date(res.End_Date).toLocaleDateString()}
                                </p>
                            </div>
                            <div className="flex flex-col md:items-end gap-2 w-full md:w-auto">
                                <div className="text-lg font-bold">
                                    {Number(res.Estimated_Cost).toFixed(2)} PLN
                                </div>
                                <div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${res.Status === 'pending_payment' ? 'bg-yellow-100 text-yellow-800' :
                                            res.Status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                                                res.Status === 'active' ? 'bg-green-100 text-green-800' :
                                                    'bg-gray-100 text-gray-800'
                                        }`}>
                                        {res.Status.toUpperCase()}
                                    </span>
                                </div>
                                {res.Status === 'pending_payment' && (
                                    <Button asChild size="sm" className="mt-2 text-xs">
                                        <Link href={`/reservations/payment/${res.Id}`}>Opłać teraz</Link>
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
