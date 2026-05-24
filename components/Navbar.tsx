'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Car, Calendar, LayoutDashboard, LogOut, LogIn, UserPlus } from 'lucide-react';

export function Navbar({ session }: { session: any }) {
    const router = useRouter();

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/login');
        router.refresh();
    };

    return (
        <nav className="border-b bg-slate-900 shadow-xl sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center gap-6">
                        <Link href="/" className="text-2xl font-black text-white flex items-center gap-2 hover:opacity-90 transition-opacity">
                            <Car className="w-6 h-6 text-red-500" />
                            <span><span className="text-red-500">Premium</span>Rent</span>
                        </Link>
                        <div className="hidden md:flex space-x-1">
                            <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer" asChild>
                                <Link href="/fleet">Flota</Link>
                            </Button>
                            {session?.role === 'client' && (
                                <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer" asChild>
                                    <Link href="/reservations" className="flex items-center gap-1.5">
                                        <Calendar className="w-4 h-4" /> Rezerwacje
                                    </Link>
                                </Button>
                            )}
                            {['admin', 'employee'].includes(session?.role) && (
                                <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer" asChild>
                                    <Link href="/admin" className="flex items-center gap-1.5">
                                        <LayoutDashboard className="w-4 h-4" /> Panel
                                    </Link>
                                </Button>
                            )}
                        </div>
                    </div>
                    <div className="flex space-x-3 items-center">
                        {session ? (
                            <>
                                <span className="text-slate-400 text-sm hidden md:block">
                                    {session.firstName} {session.lastName}
                                </span>
                                <Button
                                    variant="ghost"
                                    onClick={handleLogout}
                                    className="text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer flex items-center gap-1.5"
                                >
                                    <LogOut className="w-4 h-4" /> Wyloguj
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer" asChild>
                                    <Link href="/login" className="flex items-center gap-1.5">
                                        <LogIn className="w-4 h-4" /> Zaloguj
                                    </Link>
                                </Button>
                                <Button className="bg-red-600 text-white cursor-pointer" asChild>
                                    <Link href="/register" className="flex items-center gap-1.5">
                                        <UserPlus className="w-4 h-4" /> Rejestracja
                                    </Link>
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
