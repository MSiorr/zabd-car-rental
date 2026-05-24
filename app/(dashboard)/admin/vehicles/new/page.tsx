import VehicleForm from '@/components/VehicleForm';

export default function NewVehiclePage() {
    return (
        <div>
            <div className="mb-8 border-b border-slate-100 pb-6">
                <h1 className="text-2xl font-black text-slate-900">Dodaj nowy pojazd</h1>
                <p className="text-slate-500 text-sm mt-1">Uzupełnij dane podstawowe i atrybuty pojazdu.</p>
            </div>
            <VehicleForm />
        </div>
    );
}
