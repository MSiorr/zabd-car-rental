'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Car, MapPin, CalendarDays } from 'lucide-react';

interface Vehicle {
    vehicle_id: number;
    License_Plate: string;
    Base_Price_Per_Day: string;
    Status: string;
    category: string;
    cat_multiplier: string;
    branch_name: string;
    branch_city: string;
    main_image: string | null;
    brand: string | null;
    model: string | null;
    fuel: string | null;
    transmission: string | null;
}

export default function FleetPage() {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [cities, setCities] = useState<string[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [brands, setBrands] = useState<string[]>([]);
    const [fuels, setFuels] = useState<string[]>([]);

    const [selectedCity, setSelectedCity] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedBrand, setSelectedBrand] = useState('');
    const [selectedFuel, setSelectedFuel] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    const today = new Date().toISOString().split('T')[0];

    const fetchFleet = async () => {
        setIsLoading(true);
        const params = new URLSearchParams();
        if (selectedCity)     params.append('city', selectedCity);
        if (selectedCategory) params.append('category', selectedCategory);
        if (selectedBrand)    params.append('brand', selectedBrand);
        if (selectedFuel)     params.append('fuel', selectedFuel);
        if (startDate && endDate) {
            params.append('startDate', startDate);
            params.append('endDate', endDate);
        }

        try {
            const res = await fetch(`/api/vehicles?${params.toString()}`);
            const data = await res.json();
            if (res.ok) {
                // Nowe api/vehicles zwraca { vehicles, meta: { cities, categories } }
                if (data.vehicles) {
                    setVehicles(data.vehicles);
                    setCities(data.meta?.cities || []);
                    setCategories(data.meta?.categories || []);
                    setBrands(data.meta?.brands || []);
                    setFuels(data.meta?.fuels || []);
                } else {
                    // W razie gdyby API zwróciło starą strukturę
                    setVehicles(data as any);
                }
            }
        } catch (error) {
            console.error('Failed to fetch fleet:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchFleet();
    }, [selectedCity, selectedCategory, selectedBrand, selectedFuel, startDate, endDate]);

    return (
        <div className="py-8 px-4">
            <div className="mb-8">
                <div className="mb-5">
                    <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Nasza Flota</h1>
                    <p className="text-slate-500 mt-2">Wybierz pojazd, który spełni Twoje oczekiwania.</p>
                </div>

                {/* Daty — wyróżniony pasek */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                        <CalendarDays className="w-4 h-4 text-red-500" />
                        <span className="text-sm font-semibold text-slate-700">Kiedy chcesz wypożyczyć?</span>
                        {startDate && endDate && (
                            <button
                                onClick={() => { setStartDate(''); setEndDate(''); }}
                                className="ml-auto text-xs text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                            >
                                Wyczyść daty
                            </button>
                        )}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1">
                            <label className="text-xs text-slate-500 mb-1 block">Data odbioru</label>
                            <input
                                type="date"
                                value={startDate}
                                min={today}
                                onChange={e => { setStartDate(e.target.value); if (endDate && e.target.value > endDate) setEndDate(''); }}
                                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 transition-shadow"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="text-xs text-slate-500 mb-1 block">Data zwrotu</label>
                            <input
                                type="date"
                                value={endDate}
                                min={startDate || today}
                                onChange={e => setEndDate(e.target.value)}
                                disabled={!startDate}
                                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                        </div>
                    </div>
                    {startDate && endDate && (
                        <p className="text-xs text-emerald-600 mt-2 font-medium">
                            Pokazuję auta dostępne od {new Date(startDate).toLocaleDateString('pl-PL')} do {new Date(endDate).toLocaleDateString('pl-PL')}
                        </p>
                    )}
                    {startDate && !endDate && (
                        <p className="text-xs text-amber-600 mt-2">Wybierz datę zwrotu, aby przefiltrować dostępność.</p>
                    )}
                </div>

                {/* Filtry kategoryczne */}
                <div className="flex flex-wrap gap-3">
                    {[
                        { label: 'Wszystkie miasta',    value: selectedCity,     set: setSelectedCity,     opts: cities },
                        { label: 'Wszystkie kategorie', value: selectedCategory, set: setSelectedCategory, opts: categories },
                        { label: 'Wszystkie marki',     value: selectedBrand,    set: setSelectedBrand,    opts: brands },
                        { label: 'Wszystkie paliwa',    value: selectedFuel,     set: setSelectedFuel,     opts: fuels },
                    ].map(f => (
                        <select
                            key={f.label}
                            value={f.value}
                            onChange={e => f.set(e.target.value)}
                            className="flex h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 transition-shadow"
                        >
                            <option value="">{f.label}</option>
                            {f.opts.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                    ))}
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-20 text-slate-500">Ładowanie floty...</div>
            ) : vehicles.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-xl bg-white max-w-2xl mx-auto">
                    <Car className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                    <h3 className="text-xl font-bold text-slate-900">Brak dostępnych pojazdów</h3>
                    <p className="text-slate-500 mt-2">Zmień filtry, aby znaleźć samochód.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {vehicles.map((vehicle) => (
                        <div key={vehicle.vehicle_id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-default">
                            <div className="h-52 bg-slate-100 w-full relative flex items-center justify-center border-b border-slate-100 overflow-hidden">
                                {vehicle.main_image ? (
                                    <img src={vehicle.main_image} alt={`${vehicle.brand} ${vehicle.model}`} className="w-full h-full object-cover" loading="lazy" />
                                ) : (
                                    <Car className="w-20 h-20 text-slate-300" />
                                )}
                                <div className="absolute top-3 right-3 bg-white/95 px-2.5 py-1 rounded-full text-xs font-bold text-slate-700 shadow-sm border border-slate-200">
                                    {vehicle.category}
                                </div>
                                {vehicle.fuel && (
                                    <div className="absolute top-3 left-3 bg-slate-900/80 text-white px-2.5 py-1 rounded-full text-xs font-semibold">
                                        {vehicle.fuel}
                                    </div>
                                )}
                            </div>
                            <div className="p-5 flex-1 flex flex-col">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900 leading-tight">
                                            {vehicle.brand || vehicle.category} {vehicle.model || ''}
                                        </h3>
                                        <div className="text-xs text-slate-400 mt-1">
                                            {vehicle.transmission && <span>{vehicle.transmission}</span>}
                                        </div>
                                        <div className="text-sm text-slate-500 mt-1.5 flex items-center gap-1">
                                            <MapPin className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                                            {vehicle.branch_city} — {vehicle.branch_name}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xl font-black text-red-600">{vehicle.Base_Price_Per_Day} zł</div>
                                        <div className="text-xs text-slate-400">/ dzień</div>
                                    </div>
                                </div>
                                <div className="mt-auto pt-4 grid grid-cols-2 gap-3">
                                    <Button variant="outline" className="w-full border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors duration-150" asChild>
                                        <Link href={`/vehicles/${vehicle.vehicle_id}`}>Szczegóły</Link>
                                    </Button>
                                    <Button className="w-full bg-red-600 text-white cursor-pointer" asChild>
                                        <Link href={`/reservations/new?vehicleId=${vehicle.vehicle_id}${startDate ? `&startDate=${startDate}` : ''}${endDate ? `&endDate=${endDate}` : ''}`}>Rezerwuj</Link>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}