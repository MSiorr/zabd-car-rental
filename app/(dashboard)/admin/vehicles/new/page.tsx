import VehicleForm from '@/components/VehicleForm';

export default function NewVehiclePage() {
    return (
        <div>
            <h1 className="text-3xl font-bold text-zinc-800 mb-8 border-b pb-4">Dodaj nowy pojazd</h1>
            <VehicleForm />
        </div>
    );
}
