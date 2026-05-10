'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function PaymentPage() {
    const router = useRouter();
    const params = useParams();
    const reservationId = params.id as string;

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handlePayment = async () => {
        setLoading(true);
        setError('');

        try {
            // Symulacja opoznienia platnosci
            await new Promise(resolve => setTimeout(resolve, 1500));

            const res = await fetch(`/api/reservations/${reservationId}/pay`, {
                method: 'POST',
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Błąd płatności');
            }

            setSuccess(true);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!reservationId) return null;

    if (success) {
        return (
            <div className="container mx-auto p-4 max-w-md py-20 text-center">
                <div className="bg-green-50 text-green-700 p-8 rounded-xl border border-green-200">
                    <svg className="w-16 h-16 mx-auto mb-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <h2 className="text-2xl font-bold mb-2">Płatność Zakończona Sukcesem</h2>
                    <p className="mb-6">Twoja rezerwacja (ID: {reservationId}) została potwierdzona.</p>
                    <Button asChild className="w-full bg-green-600 hover:bg-green-700">
                        <Link href="/reservations">Przejdź do moich rezerwacji</Link>
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 max-w-md py-20">
            <div className="bg-white rounded-xl border p-8 shadow-sm text-center">
                <h1 className="text-2xl font-bold mb-6">Makieta Płatności</h1>
                <p className="text-muted-foreground mb-8">
                    Kliknij przycisk poniżej, aby zasymulować opłatę za rezerwację nr #{reservationId}.
                    System zmieni jej status na "Confirmed".
                </p>

                {error && (
                    <div className="bg-red-50 text-red-500 p-4 rounded-md mb-6 text-sm">
                        {error}
                    </div>
                )}

                <Button
                    onClick={handlePayment}
                    disabled={loading}
                    className="w-full"
                    size="lg"
                >
                    {loading ? 'Przetwarzanie transakcji...' : 'Zasymuluj Płatność (Zapłać)'}
                </Button>
            </div>
        </div>
    );
}
