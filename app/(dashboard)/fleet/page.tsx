'use client';
import { useEffect, useState } from 'react';

type Vehicle = {
    vehicle_id: number;
    License_Plate: string;
    Base_Price_Per_Day: string;
    Status: string;
    category: string;
    cat_multiplier: string;
    branch_name: string;
    branch_city: string;
};

export default function FleetPage() {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/vehicles')
            .then((res) => res.json())
            .then((data) => {
                setVehicles(data);
                setLoading(false);
            });
    }, []);

    if (loading) return <div className="p-10 text-center">Ładowanie floty...</div>;

    return (
        <div className="p-10">
            <h1 className="text-3xl font-bold mb-6">Dostępna Flota</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {vehicles.map((car) => (
                    <div key={car.vehicle_id} className="border p-4 rounded-lg shadow-md bg-white">
                        <h2 className="text-xl font-semibold">{car.category}</h2>
                        <p className="text-gray-600">Rejestracja: {car.License_Plate}</p>
                        <p className="text-gray-600">Lokalizacja: {car.branch_city} ({car.branch_name})</p>
                        <div className="mt-4 text-lg font-bold text-blue-600">
                            {car.Base_Price_Per_Day} PLN / dzień
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}