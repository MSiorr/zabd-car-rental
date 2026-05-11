import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="container mx-auto p-4 py-8 max-w-7xl">
            <div className="flex gap-4 mb-8 border-b pb-4">
                <Link href="/admin/rentals" className="px-4 py-2 border rounded-lg hover:bg-zinc-100 bg-white font-semibold text-zinc-800">
                    🔄 Zarządzanie Wypożyczeniami
                </Link>
                <Link href="/admin/vehicles" className="px-4 py-2 border rounded-lg hover:bg-zinc-100 bg-white font-semibold text-zinc-800">
                    🚗 Zarządzanie Flotą
                </Link>
            </div>
            {children}
        </div>
    );
}
