'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export function Navbar({ session }: { session: any }) {
    const router = useRouter();

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/login');
        router.refresh();
    };

    return (
        <nav className="border-b bg-zinc-900 shadow-xl sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center gap-6">
                        <Link href="/" className="text-2xl font-black text-white flex items-center gap-2">
                            <span className="text-blue-500">🏎️</span> PremiumRent
                        </Link>
                        <div className="hidden md:flex space-x-2">
                            <Button variant="ghost" className="text-zinc-300 hover:text-white hover:bg-zinc-800" asChild>
                                <Link href="/fleet">Nasza Flota</Link>
                            </Button>
                            {session && (
                                <Button variant="ghost" className="text-zinc-300 hover:text-white hover:bg-zinc-800" asChild>
                                    <Link href="/reservations">Moje Rezerwacje</Link>
                                </Button>
                            )}
                            {session?.role === 'admin' && (
                                <Button variant="ghost" className="text-zinc-300 hover:text-white hover:bg-zinc-800" asChild>
                                    <Link href="/admin">Panel Admina</Link>
                                </Button>
                            )}
                        </div>
                    </div>
                    <div className="flex space-x-3 items-center">
                        {session ? (
                            <>
                                <span className="text-zinc-300 text-sm hidden md:block">
                                    Witaj, <strong className="text-white">{session.email}</strong>
                                </span>
                                <Button variant="destructive" onClick={handleLogout} className="bg-red-600/10 text-red-500 hover:bg-red-600/20 shadow-none border-none">
                                    Wyloguj
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button variant="ghost" className="text-zinc-300 hover:text-white hover:bg-zinc-800" asChild>
                                    <Link href="/login">Zaloguj</Link>
                                </Button>
                                <Button className="bg-blue-600 hover:bg-blue-500 text-white" asChild>
                                    <Link href="/register">Rejestracja</Link>
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}