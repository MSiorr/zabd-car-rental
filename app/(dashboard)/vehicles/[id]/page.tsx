'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Car, MapPin, ChevronLeft, Wrench } from 'lucide-react';

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

const STATUS_STYLES: Record<string, { label: string; cls: string }> = {
    available:   { label: 'Dostępny',    cls: 'bg-emerald-100 text-emerald-800' },
    rented:      { label: 'Wynajęty',    cls: 'bg-blue-100 text-blue-800' },
    maintenance: { label: 'Serwis',      cls: 'bg-amber-100 text-amber-800' },
    retired:     { label: 'Wycofany',    cls: 'bg-slate-100 text-slate-600' },
};

export default function VehicleDetailsPage() {
    const params = useParams();
    const [vehicle, setVehicle] = useState<VehicleCard | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    useEffect(() => {
        if (!params.id) return;
        fetch(`/api/vehicles/${params.id}`)
            .then(res => res.json())
            .then(data => { if (!data.error) setVehicle(data); setIsLoading(false); })
            .catch(() => setIsLoading(false));
    }, [params.id]);

    if (isLoading) return (
        <div className="flex items-center justify-center py-32 text-slate-400">
            <Car className="w-8 h-8 animate-pulse mr-3" /> Ładowanie szczegółów pojazdu...
        </div>
    );

    if (!vehicle) return (
        <div className="text-center py-20 text-red-500 font-bold text-xl">Nie znaleziono pojazdu!</div>
    );

    const attrs = typeof vehicle.attributes === 'string' ? JSON.parse(vehicle.attributes) : vehicle.attributes;
    const imgs = typeof vehicle.images === 'string' ? JSON.parse(vehicle.images) : vehicle.images;
    const mainImage = selectedImage || (imgs?.find((i: any) => i.main)?.path || imgs?.[0]?.path);
    const statusInfo = STATUS_STYLES[vehicle.Status] ?? { label: vehicle.Status, cls: 'bg-slate-100 text-slate-600' };

    return (
        <div className="py-8 px-4 max-w-5xl mx-auto">
            <Link href="/fleet" className="inline-flex items-center gap-1.5 text-slate-500 hover:text-red-600 transition-colors duration-150 mb-6 text-sm font-medium">
                <ChevronLeft className="w-4 h-4" /> Powrót do floty
            </Link>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="md:flex">
                    {/* Image column */}
                    <div className="md:w-1/2 p-6 flex flex-col gap-4">
                        <div className="h-80 w-full bg-slate-100 rounded-xl overflow-hidden flex items-center justify-center relative shadow-inner">
                            {mainImage ? (
                                <img
                                    src={mainImage}
                                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                                    alt={vehicle.category}
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                        if (e.currentTarget.nextElementSibling) {
                                            e.currentTarget.nextElementSibling.classList.remove('hidden');
                                            e.currentTarget.nextElementSibling.classList.add('flex');
                                        }
                                    }}
                                />
                            ) : (
                                <Car className="w-24 h-24 text-slate-300" />
                            )}
                            {mainImage && (
                                <span className="hidden w-full h-full items-center justify-center absolute inset-0 bg-slate-100">
                                    <Car className="w-24 h-24 text-slate-300" />
                                </span>
                            )}
                            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-bold text-slate-800 shadow-sm border border-slate-200">
                                {vehicle.category}
                            </div>
                        </div>

                        {imgs && imgs.length > 1 && (
                            <div className="flex gap-2 overflow-x-auto pb-2">
                                {imgs.map((img: any, idx: number) => (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedImage(img.path)}
                                        className={`flex-shrink-0 w-24 h-20 bg-slate-100 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                                            mainImage === img.path
                                                ? 'border-red-500 shadow-md ring-2 ring-red-100'
                                                : 'border-transparent opacity-70 hover:opacity-100'
                                        }`}
                                    >
                                        <img src={img.path} className="w-full h-full object-cover" alt={`Galeria ${idx}`} />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Info column */}
                    <div className="md:w-1/2 p-8 flex flex-col bg-slate-50/40 border-l border-slate-100">
                        <div className="mb-6">
                            <h1 className="text-4xl font-black text-slate-900 leading-tight mb-2">
                                {attrs?.Marka || vehicle.category} {attrs?.Model || ''}
                            </h1>
                            <div className="flex items-center gap-1.5 text-slate-500 text-sm">
                                <MapPin className="w-4 h-4 text-red-500 flex-shrink-0" />
                                {vehicle.city} — {vehicle.branch}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Cena bazowa</p>
                                <p className="text-2xl font-black text-red-600">
                                    {vehicle.Base_Price_Per_Day} <span className="text-sm font-normal text-slate-400">zł / dzień</span>
                                </p>
                            </div>
                            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Status</p>
                                <span className={`inline-block px-2.5 py-1 rounded-full text-sm font-semibold ${statusInfo.cls}`}>
                                    {statusInfo.label}
                                </span>
                            </div>
                        </div>

                        {attrs && Object.keys(attrs).length > 0 && (
                            <div className="mb-8 bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                                <h3 className="font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100 flex items-center gap-2 text-sm uppercase tracking-wider">
                                    <Wrench className="w-4 h-4 text-slate-400" /> Specyfikacja techniczna
                                </h3>
                                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6">
                                    {Object.entries(attrs).map(([key, value]) => {
                                        if (key === 'Marka' || key === 'Model') return null;
                                        return (
                                            <li key={key} className="flex flex-col pb-2 border-b border-slate-50">
                                                <span className="text-xs text-slate-400 tracking-wider uppercase">{key}</span>
                                                <span className="font-semibold text-slate-800">
                                                    {String(value) === 'true' ? 'Tak' : String(value) === 'false' ? 'Nie' : String(value)}
                                                </span>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        )}

                        <div className="mt-auto">
                            <Button
                                className={`w-full h-12 text-lg font-bold transition-colors duration-150 cursor-pointer ${
                                    vehicle.Status === 'available'
                                        ? 'bg-red-600 text-white'
                                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                }`}
                                asChild
                                disabled={vehicle.Status !== 'available'}
                            >
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
