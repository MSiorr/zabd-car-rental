import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function Navbar() {
    return (
        <nav className="border-b bg-white shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center">
                        <Link href="/" className="text-xl font-bold text-blue-600">
                            CarRental
                        </Link>
                    </div>
                    <div className="flex space-x-4">
                        <Button variant="ghost" asChild>
                            <Link href="/">Strona Główna</Link>
                        </Button>
                        <Button variant="ghost" asChild>
                            <Link href="/fleet">Dostępna Flota</Link>
                        </Button>
                        <Button variant="default" asChild>
                            <Link href="/reservations">Test Rezerwacji</Link>
                        </Button>
                    </div>
                </div>
            </div>
        </nav>
    );
}