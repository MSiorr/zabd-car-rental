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

export default function NewReservationPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const vehicleIdStr = searchParams.get('vehicleId');
    const vehicleId = vehicleIdStr ? parseInt(vehicleIdStr, 10) : null;

    const [branches, setBranches] = useState<Branch[]>([]);
    const [pickupId, setPickupId] = useState('');
    const [dropoffId, setDropoffId] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!vehicleId) {
            router.push('/fleet');
        }

        const fetchBranches = async () => {
            try {
                const res = await fetch('/api/branches');
                const data = await res.json();
                setBranches(data || []);
            } catch (err) {
                console.error(err);
            }
        };
        fetchBranches();
    }, [vehicleId, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!pickupId || !dropoffId || !startDate || !endDate) {
            setError('Wypełnij wszystkie pola.');
            return;
        }

        setLoading(true);

        try {
            const res = await fetch('/api/reservations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    vehicleId,
                    pickupId: parseInt(pickupId, 10),
                    dropoffId: parseInt(dropoffId, 10),
                    startDate,
                    endDate,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Błąd podczas tworzenia rezerwacji');
            }

            // Przechodzimy do mockowej strony płatności z ID nowej rezerwacji
            router.push(`/reservations/payment/${data.reservationId}`);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!vehicleId) return null;

    return (
        <div className="container mx-auto p-4 max-w-2xl py-12">
            <h1 className="text-3xl font-bold mb-8">Złóż rezerwację</h1>

            <div className="bg-white rounded-xl border p-6 shadow-sm">
                {error && (
                    <div className="bg-red-50 text-red-500 p-4 rounded-md mb-6 relative">
                        <p className="font-medium">Nie udało się złożyć rezerwacji</p>
                        <p className="text-sm mt-1">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="pickup">Oddział odbioru</Label>
                            <select
                                id="pickup"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                value={pickupId}
                                onChange={(e) => setPickupId(e.target.value)}
                                required
                            >
                                <option value="">Wybierz...</option>
                                {branches.map(b => (
                                    <option key={b.Id} value={b.Id}>{b.City} - {b.Name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="dropoff">Oddział zwrotu</Label>
                            <select
                                id="dropoff"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                value={dropoffId}
                                onChange={(e) => setDropoffId(e.target.value)}
                                required
                            >
                                <option value="">Wybierz...</option>
                                {branches.map(b => (
                                    <option key={b.Id} value={b.Id}>{b.City} - {b.Name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="startDate">Data odbioru</Label>
                            <Input
                                id="startDate"
                                type="date"
                                value={startDate}
                                min={new Date().toISOString().split('T')[0]}
                                onChange={(e) => setStartDate(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="endDate">Data zwrotu</Label>
                            <Input
                                id="endDate"
                                type="date"
                                value={endDate}
                                min={startDate || new Date().toISOString().split('T')[0]}
                                onChange={(e) => setEndDate(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? 'Przetwarzanie...' : 'Przejdź do płatności'}
                    </Button>
                </form>
            </div>
        </div>
    );
}
