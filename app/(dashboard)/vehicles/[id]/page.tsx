'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface VehicleCard {
    Id: number;
    VIN: string;
    License_Plate: string;
    Status: string;
    Base_Price_Per_Day: string;
    category: string;
    branch: string;
    city: string;
    attributes: any;
    images: any;
}

export default function VehicleDetailsPage() {
    const params = useParams();
    const [vehicle, setVehicle] = useState<VehicleCard | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    useEffect(() => {
        if (!params.id) return;

        fetch(`/api/vehicles/${params.id}`)
            .then(res => res.json())
            .then(data => {
                if (!data.error) setVehicle(data);
                setIsLoading(false);
            })
            .catch(() => setIsLoading(false));
    }, [params.id]);

    if (isLoading) {
        return <div className="flex justify-center py-20 text-zinc-500">Ładowanie szczegółów pojazdu...</div>;
    }

    if (!vehicle) {
        return <div className="text-center py-20 text-red-500 font-bold text-xl">Nie znaleziono pojazdu!</div>;
    }

    const attrs = typeof vehicle.attributes === 'string' ? JSON.parse(vehicle.attributes) : vehicle.attributes;
    const imgs = typeof vehicle.images === 'string' ? JSON.parse(vehicle.images) : vehicle.images;
    const mainImage = selectedImage || (imgs?.find((i: any) => i.main)?.path || imgs?.[0]?.path);

    return (
        <div className="py-8 px-4 max-w-5xl mx-auto">
            <Link href="/fleet" className="text-blue-600 hover:underline mb-6 inline-block">
                &larr; Powrót do floty
            </Link>

            <div className="bg-white rounded-2xl shadow-xl border border-zinc-100 overflow-hidden">
                <div className="md:flex">
                    <div className="md:w-1/2 p-6 flex flex-col gap-4">
                        <div className="h-80 w-full bg-zinc-100 rounded-xl overflow-hidden flex items-center justify-center relative shadow-inner">
                            {mainImage ? (
                                <img src={mainImage} className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" alt={vehicle.category}
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                        if (e.currentTarget.nextElementSibling) {
                                            e.currentTarget.nextElementSibling.classList.remove('hidden');
                                            e.currentTarget.nextElementSibling.classList.add('flex');
                                        }
                                    }}
                                />
                            ) : (
                                <span className="flex text-8xl drop-shadow-md">🚗</span>
                            )}
                            {mainImage && (
                                <span className="hidden w-full h-full items-center justify-center text-8xl drop-shadow-md absolute inset-0 bg-zinc-100">🚗</span>
                            )}
                            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-bold text-zinc-800 shadow-sm border border-zinc-200">
                                {vehicle.category}
                            </div>
                        </div>

                        {imgs && imgs.length > 1 && (
                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                                {imgs.map((img: any, idx: number) => (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedImage(img.path)}
                                        className={`flex-shrink-0 w-24 h-20 bg-zinc-100 rounded-lg overflow-hidden border-2 transition-all ${mainImage === img.path ? 'border-blue-600 shadow-md ring-2 ring-blue-100' : 'border-transparent opacity-80 hover:opacity-100'
                                            }`}
                                    >
                                        <img
                                            src={img.path}
                                            className="w-full h-full object-cover"
                                            alt={`Galeria ${idx}`}
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                                if (e.currentTarget.parentElement?.querySelector('span')) return;
                                                const span = document.createElement('span');
                                                span.className = 'w-full h-full flex items-center justify-center text-3xl';
                                                span.innerText = '🚗';
                                                e.currentTarget.parentElement?.appendChild(span);
                                            }}
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="md:w-1/2 p-8 flex flex-col bg-zinc-50/50">
                        <div className="mb-6">
                            <h1 className="text-4xl font-extrabold text-zinc-900 mb-2">
                                {attrs?.Marka || vehicle.category} {attrs?.Model || ''}
                            </h1>
                            <div className="text-zinc-500 flex items-center gap-2">
                                <span className="text-blue-500">📍</span> {vehicle.city} - {vehicle.branch}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100">
                                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Cena bazowa</p>
                                <p className="text-2xl font-black text-blue-600">{vehicle.Base_Price_Per_Day} zł <span className="text-sm font-normal text-zinc-500">/ dzień</span></p>
                            </div>
                            <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100">
                                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Status</p>
                                <p className="text-lg font-bold text-zinc-900 capitalize">{vehicle.Status}</p>
                            </div>
                        </div>

                        {attrs && Object.keys(attrs).length > 0 && (
                            <div className="mb-8 bg-white p-5 rounded-xl border border-zinc-100 shadow-sm">
                                <h3 className="font-bold text-zinc-900 mb-4 border-b pb-2 flex items-center gap-2">
                                    <span className="text-blue-500">⚙️</span> Specyfikacja techniczna
                                </h3>
                                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6">
                                    {Object.entries(attrs).map(([key, value]) => {
                                        if (key === 'Marka' || key === 'Model') return null; // Ukrywamy w specyfikacji, skoro jest w tytule
                                        return (
                                            <li key={key} className="flex flex-col border-b border-zinc-50 pb-2">
                                                <span className="text-xs text-zinc-400 tracking-wider uppercase">{key}</span>
                                                <span className="font-semibold text-zinc-800">{String(value) === 'true' ? 'Tak' : String(value) === 'false' ? 'Nie' : String(value)}</span>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        )}

                        <div className="mt-auto">
                            <Button className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-500" asChild disabled={vehicle.Status !== 'available'}>
                                <Link href={vehicle.Status === 'available' ? `/reservations/new?vehicleId=${vehicle.Id}` : '#'}>
                                    {vehicle.Status === 'available' ? 'Zarezerwuj teraz' : 'Pojazd niedostępny'}
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}