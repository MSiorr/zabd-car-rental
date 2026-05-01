'use client';
import { useState } from 'react';

export default function ReservationsPage() {
    const [loading, setLoading] = useState(false);
    const [response, setResponse] = useState<{ message?: string; error?: string; reservationId?: number } | null>(null);

    async function handleReservation(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setResponse(null);

        const formData = new FormData(e.currentTarget);
        const payload = {
            userId: Number(formData.get('userId')),
            vehicleId: Number(formData.get('vehicleId')),
            pickupId: Number(formData.get('pickupId')),
            dropoffId: Number(formData.get('dropoffId')),
            startDate: formData.get('startDate'),
            endDate: formData.get('endDate'),
            promoId: formData.get('promoId') ? Number(formData.get('promoId')) : null,
        };

        try {
            const res = await fetch('/api/reservations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            setResponse(res.ok ? data : { error: data.error });
        } catch (err) {
            setResponse({ error: 'Błąd sieci' });
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="p-10 max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Testowa Rezerwacja</h1>

            <form onSubmit={handleReservation} className="bg-white p-6 rounded-lg shadow-md flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                    <label className="flex flex-col">
                        <span className="text-gray-700 text-sm mb-1">User ID (np. 3 - Piotr)</span>
                        <input name="userId" type="number" defaultValue="3" required className="border p-2 rounded" />
                    </label>
                    <label className="flex flex-col">
                        <span className="text-gray-700 text-sm mb-1">Vehicle ID (np. 1)</span>
                        <input name="vehicleId" type="number" defaultValue="1" required className="border p-2 rounded" />
                    </label>
                    <label className="flex flex-col">
                        <span className="text-gray-700 text-sm mb-1">Oddział Odbioru (ID)</span>
                        <input name="pickupId" type="number" defaultValue="1" required className="border p-2 rounded" />
                    </label>
                    <label className="flex flex-col">
                        <span className="text-gray-700 text-sm mb-1">Oddział Zwrotu (ID)</span>
                        <input name="dropoffId" type="number" defaultValue="1" required className="border p-2 rounded" />
                    </label>
                    <label className="flex flex-col">
                        <span className="text-gray-700 text-sm mb-1">Data Od</span>
                        <input name="startDate" type="date" required className="border p-2 rounded" />
                    </label>
                    <label className="flex flex-col">
                        <span className="text-gray-700 text-sm mb-1">Data Do</span>
                        <input name="endDate" type="date" required className="border p-2 rounded" />
                    </label>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50 mt-2"
                >
                    {loading ? 'Przetwarzanie...' : 'Utwórz Rezerwację'}
                </button>
            </form>

            {response?.error && (
                <div className="mt-6 p-4 bg-red-100 text-red-700 border border-red-400 rounded">
                    <strong>Błąd:</strong> {response.error}
                </div>
            )}
            {response?.reservationId && (
                <div className="mt-6 p-4 bg-green-100 text-green-700 border border-green-400 rounded">
                    <strong>Sukces!</strong> Utworzono rezerwację o ID: {response.reservationId}.<br />
                    Wiadomość z bazy: {response.message}
                </div>
            )}
        </div>
    );
}