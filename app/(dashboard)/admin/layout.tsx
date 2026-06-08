'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Car, BarChart3, FlaskConical } from 'lucide-react';

const navItems = [
    { href: '/admin/rentals', label: 'Wypożyczenia', icon: LayoutDashboard },
    { href: '/admin/vehicles', label: 'Zarządzanie Flotą', icon: Car },
    { href: '/admin/report', label: 'Podsumowanie miesięczne', icon: BarChart3 },
    { href: '/admin/system', label: 'Symulacja systemu', icon: FlaskConical },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <div className="flex min-h-[calc(100vh-4rem)]">
            <aside className="w-56 bg-slate-900 text-white flex-shrink-0">
                <div className="p-4 border-b border-slate-800">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Panel zarządzania</p>
                </div>
                <nav className="p-3 space-y-1">
                    {navItems.map(({ href, label, icon: Icon }) => {
                        const active = pathname.startsWith(href);
                        return (
                            <Link
                                key={href}
                                href={href}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 cursor-pointer
                                    ${active
                                        ? 'bg-red-600/20 text-red-400 border-l-2 border-red-500 pl-2.5'
                                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                    }`}
                            >
                                <Icon className="w-4 h-4 flex-shrink-0" />
                                {label}
                            </Link>
                        );
                    })}
                </nav>
            </aside>
            <main className="flex-1 p-8 bg-slate-50 overflow-auto">
                {children}
            </main>
        </div>
    );
}
