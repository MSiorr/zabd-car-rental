'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';

export default function RegisterPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        drivingLicense: ''
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        const data = await res.json();
        setIsLoading(false);

        if (res.ok) {
            router.push('/login?registered=true');
        } else {
            setError(data.error || 'Wystąpił błąd podczas rejestracji');
        }
    };

    return (
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-lg space-y-8 bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
                        Załóż konto
                    </h2>
                    <p className="mt-2 text-center text-sm text-slate-600">
                        Masz już konto?{' '}
                        <Link href="/login" className="font-medium text-red-600 hover:text-red-500 transition-colors">
                            Zaloguj się
                        </Link>
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="firstName">Imię</Label>
                            <Input
                                id="firstName" name="firstName" required
                                value={formData.firstName} onChange={handleChange}
                                placeholder="Jan"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lastName">Nazwisko</Label>
                            <Input
                                id="lastName" name="lastName" required
                                value={formData.lastName} onChange={handleChange}
                                placeholder="Kowalski"
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email" name="email" type="email" required
                                value={formData.email} onChange={handleChange}
                                placeholder="jan.kowalski@example.com"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Hasło</Label>
                            <Input
                                id="password" name="password" type="password" required
                                value={formData.password} onChange={handleChange}
                                placeholder="••••••••"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="drivingLicense">Numer Prawa Jazdy</Label>
                            <Input
                                id="drivingLicense" name="drivingLicense" required
                                value={formData.drivingLicense} onChange={handleChange}
                                placeholder="12345/67/8901"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg border border-red-100 flex items-center gap-2">
                            <span className="font-semibold text-red-600">Błąd:</span> {error}
                        </div>
                    )}

                    <Button type="submit" className="w-full h-11 text-base bg-red-600 cursor-pointer" disabled={isLoading}>
                        {isLoading ? 'Rejestrowanie...' : 'Zarejestruj się'}
                    </Button>
                </form>
            </div>
        </div>
    );
}