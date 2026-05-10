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
    const mainImage = imgs?.find((i: any) => i.main)?.path || imgs?.[0]?.path;

    return (
        <div className="py-8 px-4 max-w-5xl mx-auto">
            <Link href="/fleet" className="text-blue-600 hover:underline mb-6 inline-block">
                &larr; Powrót do floty
            </Link>

            <div className="bg-white rounded-2xl shadow-xl border border-zinc-100 overflow-hidden">
                <div className="md:flex">
                    <div className="md:w-1/2 h-80 md:h-auto bg-zinc-100 flex items-center justify-center relative">
                        {mainImage ? (
                            <img src={mainImage} className="w-full h-full object-cover" alt={vehicle.category} />
                        ) : (
                            <span className="text-8xl drop-shadow-md">🚗</span>
                        )}
                        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-bold text-zinc-800 shadow-sm border border-zinc-200">
                            {vehicle.category}
                        </div>
                    </div>
                    <div className="md:w-1/2 p-8 flex flex-col">
                        <div className="mb-6">
                            <h1 className="text-3xl font-extrabold text-zinc-900 mb-2">
                                {vehicle.category} Class
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
                            <div className="mb-8">
                                <h3 className="font-bold text-zinc-900 mb-3 border-b pb-2">Specyfikacja</h3>
                                <ul className="space-y-2">
                                    {Object.entries(attrs).map(([key, value]) => (
                                        <li key={key} className="flex justify-between">
                                            <span className="text-zinc-500">{key}</span>
                                            <span className="font-medium text-zinc-900">{String(value)}</span>
                                        </li>
                                    ))}
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