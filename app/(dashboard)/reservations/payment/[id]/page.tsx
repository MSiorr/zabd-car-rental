'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { use } from 'react';

export default function PaymentPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const unwrappedParams = use(params);
    const reservationId = unwrappedParams.id;

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handlePayment = async () => {
        setLoading(true);
        setError('');

        try {
            // Symulacja autoryzacji platnosci, spinner
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
                <div className="bg-green-50 text-green-700 p-8 rounded-2xl border border-green-200 shadow-md">
                    <svg className="w-16 h-16 mx-auto mb-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                    <h2 className="text-2xl font-extrabold mb-2">Płatność Zakończona Sukcesem</h2>
                    <p className="mb-8 font-medium">Twoja rezerwacja (ID: #{reservationId}) została potwierdzona.</p>
                    <Button asChild className="w-full bg-green-600 hover:bg-green-700 h-12 text-lg">
                        <Link href="/reservations">Moje rezerwacje</Link>
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 max-w-md py-20">
            <div className="bg-white rounded-2xl border border-slate-100 p-8 shadow-sm text-center">
                <div className="bg-slate-100 text-slate-700 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                </div>
                <h1 className="text-2xl font-bold mb-4">Bezpieczna Płatność</h1>
                <p className="text-muted-foreground mb-8">
                    Kliknij przycisk poniżej, aby opłacić rezerwację nr <span className="font-bold text-slate-900">#{reservationId}</span>. <br />
                    (To jest tylko makieta bramki płatności)
                </p>

                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 text-sm border border-red-100">
                        {error}
                    </div>
                )}

                <Button
                    onClick={handlePayment}
                    disabled={loading}
                    className="w-full h-12 text-lg font-semibold bg-red-600 cursor-pointer"
                >
                    {loading ? (
                        <span className="flex items-center gap-2">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Przetwarzanie transakcji...
                        </span>
                    ) : 'Zasymuluj i Zapłać'}
                </Button>
            </div>
        </div>
    );
}