'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

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
    const [isLoading, setIsLoading] = useState(true);

    const fetchFleet = async () => {
        setIsLoading(true);
        const params = new URLSearchParams();
        if (selectedCity)     params.append('city', selectedCity);
        if (selectedCategory) params.append('category', selectedCategory);
        if (selectedBrand)    params.append('brand', selectedBrand);
        if (selectedFuel)     params.append('fuel', selectedFuel);

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
    }, [selectedCity, selectedCategory, selectedBrand, selectedFuel]);

    return (
        <div className="py-8 px-4">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold text-zinc-900 tracking-tight">Nasza Flota</h1>
                    <p className="text-zinc-500 mt-2">Wybierz pojazd, który spełni Twoje oczekiwania.</p>
                </div>

                {/* Filtry */}
                <div className="flex flex-wrap gap-3 w-full md:w-auto">
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
                            className="flex h-10 w-full md:w-44 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                        >
                            <option value="">{f.label}</option>
                            {f.opts.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                    ))}
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-20 text-zinc-500">Ładowanie floty...</div>
            ) : vehicles.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed border-zinc-200 rounded-xl bg-zinc-50 max-w-2xl mx-auto">
                    <h3 className="text-xl font-bold text-zinc-900">Brak dostępnych pojazdów</h3>
                    <p className="text-zinc-500 mt-2">Zmień filtry wyżej, aby znaleźć samochód powiązany z inną kategorią lub miastem. Ewentualnie poczekaj, aż nasz oddział powiększy asortyment.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {vehicles.map((vehicle) => (
                        <div key={vehicle.vehicle_id} className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                            <div className="h-56 bg-zinc-100 w-full relative flex items-center justify-center border-b border-zinc-100 overflow-hidden">
                                {vehicle.main_image ? (
                                    <img src={vehicle.main_image} alt="Samochód" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-6xl drop-shadow-md">🚗</span>
                                )}
                                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-zinc-800 shadow-sm border border-zinc-200">
                                    {vehicle.category}
                                </div>
                            </div>
                            <div className="p-5 flex-1 flex flex-col">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-zinc-900 leading-tight">
                                            {vehicle.brand || vehicle.category} {vehicle.model || ''}
                                        </h3>
                                        <div className="text-xs text-zinc-500 mt-1 flex items-center gap-2">
                                            <span>{vehicle.category}</span>
                                            {vehicle.fuel && <span>· {vehicle.fuel}</span>}
                                            {vehicle.transmission && <span>· {vehicle.transmission}</span>}
                                        </div>
                                        <div className="text-sm text-zinc-500 mt-1 flex items-center gap-1.5">
                                            <span className="text-blue-500">📍</span> {vehicle.branch_city} - {vehicle.branch_name}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xl font-black text-blue-600">{vehicle.Base_Price_Per_Day} zł</div>
                                        <div className="text-xs text-zinc-400">/ dzień</div>
                                    </div>
                                </div>
                                <div className="mt-auto pt-4 grid grid-cols-2 gap-3">
                                    <Button variant="outline" className="w-full border-zinc-200 text-zinc-700 hover:bg-zinc-50" asChild>
                                        <Link href={`/vehicles/${vehicle.vehicle_id}`}>Szczegóły</Link>
                                    </Button>
                                    <Button className="w-full bg-blue-600 hover:bg-blue-500 text-white" asChild>
                                        <Link href={`/reservations/new?vehicleId=${vehicle.vehicle_id}`}>Rezerwuj</Link>
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