import Link from 'next/link';
import { Car, CalendarDays, CheckCircle2, MapPin, Shield, Zap, Clock, ChevronRight } from 'lucide-react';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

interface FeaturedVehicle {
    vehicle_id: number;
    Base_Price_Per_Day: string;
    category: string;
    branch_city: string;
    main_image: string | null;
    brand: string | null;
    model: string | null;
}

async function getFeaturedVehicles(): Promise<FeaturedVehicle[]> {
    try {
        const [rows] = await pool.query<RowDataPacket[]>(`
            SELECT
                vaf.vehicle_id,
                vaf.Base_Price_Per_Day,
                vaf.category,
                vaf.branch_city,
                vaf.main_image,
                MAX(CASE WHEN a.Name = 'Marka' THEN va.Value_String END) AS brand,
                MAX(CASE WHEN a.Name = 'Model' THEN va.Value_String END) AS model
            FROM view_available_fleet vaf
            LEFT JOIN Vehicle_Attribute va ON vaf.vehicle_id = va.Vehicle_Id
            LEFT JOIN Attributes a ON va.Attribute_Id = a.Id
            GROUP BY vaf.vehicle_id, vaf.Base_Price_Per_Day, vaf.category, vaf.branch_city, vaf.main_image
            LIMIT 3
        `);
        return rows as FeaturedVehicle[];
    } catch {
        return [];
    }
}

export default async function Home() {
    const featuredVehicles = await getFeaturedVehicles();

    return (
        <div className="flex flex-col">
            {/* ─── Hero ─────────────────────────────────────── */}
            <section className="relative bg-slate-900 text-white pt-24 pb-20 px-4 overflow-hidden">
                {/* Subtle red glow */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ backgroundImage: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(220,38,38,0.18), transparent)' }}
                />
                <div className="max-w-5xl mx-auto text-center relative">
                    <div className="inline-flex items-center gap-2 bg-red-600/20 text-red-400 border border-red-600/30 px-4 py-1.5 rounded-full text-sm font-semibold mb-8">
                        <Car className="w-4 h-4" /> Najlepsza flota w Polsce
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight leading-tight">
                        Wypożycz samochód<br />
                        <span className="text-red-500">szybko i wygodnie</span>
                    </h1>
                    <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
                        Szeroki wybór pojazdów — od ekonomicznych po premium. Prosta rezerwacja online, elastyczny zwrot, uczciwe ceny.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/fleet"
                            className="inline-flex items-center justify-center rounded-md bg-red-600 text-white text-lg font-semibold px-10 h-14 cursor-pointer hover:opacity-90 transition-opacity duration-200"
                        >
                            Przeglądaj flotę
                        </Link>
                        <Link
                            href="/register"
                            className="inline-flex items-center justify-center rounded-md border border-white/40 bg-white/10 text-white text-lg font-semibold px-10 h-14 cursor-pointer hover:opacity-90 transition-opacity duration-200"
                        >
                            Załóż konto
                        </Link>
                    </div>

                    {/* Stats inside hero */}
                    <div className="mt-16 grid grid-cols-3 gap-4 max-w-sm mx-auto">
                        {[
                            { value: '4', label: 'Pojazdy' },
                            { value: '3', label: 'Oddziały' },
                            { value: '4', label: 'Kategorie' },
                        ].map(s => (
                            <div key={s.label} className="border border-white/10 bg-white/5 rounded-2xl py-5 backdrop-blur-sm">
                                <div className="text-3xl font-black text-red-500">{s.value}</div>
                                <div className="text-slate-400 text-xs mt-1">{s.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── Jak to działa ────────────────────────────── */}
            <section className="py-20 px-4 bg-white">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-14">
                        <h2 className="text-3xl font-black text-slate-900 mb-3">Jak to działa?</h2>
                        <p className="text-slate-500 max-w-lg mx-auto text-base">Trzy proste kroki dzielą Cię od wymarzonej jazdy.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                        {[
                            {
                                icon: Car,
                                title: 'Wybierz pojazd',
                                desc: 'Przejrzyj flotę i filtruj po mieście, kategorii lub paliwie. Sprawdź szczegóły i galerię zdjęć.',
                            },
                            {
                                icon: CalendarDays,
                                title: 'Zarezerwuj online',
                                desc: 'Podaj daty odbioru i zwrotu, wybierz oddział i opcjonalny kod promo. Całość trwa 2 minuty.',
                            },
                            {
                                icon: CheckCircle2,
                                title: 'Odbierz i jedź',
                                desc: 'Opłać rezerwację i odbierz pojazd w wybranym oddziale. Zwrot możliwy w innym mieście.',
                            },
                        ].map((s, i) => (
                            <div key={s.title} className="flex flex-col items-center text-center">
                                <div className="relative mb-6">
                                    <div className="w-20 h-20 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-600/25">
                                        <s.icon className="w-9 h-9 text-white" />
                                    </div>
                                    <span className="absolute -top-2 -right-2 w-7 h-7 bg-slate-900 text-white rounded-full text-xs font-black flex items-center justify-center border-2 border-white">
                                        {i + 1}
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 mb-2">{s.title}</h3>
                                <p className="text-slate-500 text-sm leading-relaxed max-w-xs">{s.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── Polecane pojazdy ─────────────────────────── */}
            {featuredVehicles.length > 0 && (
                <section className="py-20 px-4 bg-slate-50">
                    <div className="max-w-5xl mx-auto">
                        <div className="flex justify-between items-end mb-10">
                            <div>
                                <h2 className="text-3xl font-black text-slate-900">Dostępne pojazdy</h2>
                                <p className="text-slate-500 mt-1 text-sm">Wybrane z naszej floty — gotowe do odbioru</p>
                            </div>
                            <Link
                                href="/fleet"
                                className="text-red-600 hover:opacity-80 text-sm font-semibold flex items-center gap-1 transition-opacity duration-200"
                            >
                                Zobacz wszystkie <ChevronRight className="w-4 h-4" />
                            </Link>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {featuredVehicles.map(v => (
                                <div
                                    key={v.vehicle_id}
                                    className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                                >
                                    <div className="h-44 bg-slate-100 flex items-center justify-center border-b border-slate-100 overflow-hidden relative">
                                        {v.main_image ? (
                                            <img
                                                src={v.main_image}
                                                alt={`${v.brand ?? ''} ${v.model ?? ''}`.trim() || v.category}
                                                className="w-full h-full object-cover"
                                                loading="lazy"
                                            />
                                        ) : (
                                            <Car className="w-16 h-16 text-slate-300" />
                                        )}
                                        <div className="absolute top-3 right-3 bg-white/90 px-2.5 py-1 rounded-full text-xs font-bold text-slate-700 border border-slate-200 backdrop-blur-sm">
                                            {v.category}
                                        </div>
                                    </div>
                                    <div className="p-5">
                                        <h3 className="font-bold text-slate-900 text-lg leading-tight">
                                            {v.brand || v.category} {v.model || ''}
                                        </h3>
                                        <div className="flex items-center gap-1 text-slate-400 text-xs mt-1 mb-4">
                                            <MapPin className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                                            {v.branch_city}
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <span className="text-xl font-black text-red-600">{v.Base_Price_Per_Day}</span>
                                                <span className="text-slate-400 text-xs ml-1">zł / dzień</span>
                                            </div>
                                            <Link
                                                href={`/reservations/new?vehicleId=${v.vehicle_id}`}
                                                className="text-sm font-semibold text-red-600 hover:opacity-80 transition-opacity duration-200 flex items-center gap-0.5"
                                            >
                                                Rezerwuj <ChevronRight className="w-4 h-4" />
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ─── Dlaczego PremiumRent ─────────────────────── */}
            <section className={`py-20 px-4 ${featuredVehicles.length > 0 ? 'bg-white' : 'bg-slate-50'}`}>
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-black text-slate-900 mb-3">
                            Dlaczego <span className="text-red-600">PremiumRent</span>?
                        </h2>
                        <p className="text-slate-500 max-w-lg mx-auto text-base">Stawiamy na jakość, wygodę i przejrzyste warunki — bez ukrytych opłat.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            {
                                icon: <Car className="w-7 h-7 text-red-600" />,
                                title: 'Szeroka flota',
                                desc: 'Od miejskich ekonomicznych po luksusowe SUV-y. Każdy pojazd zadbany i ubezpieczony.',
                            },
                            {
                                icon: <Zap className="w-7 h-7 text-red-600" />,
                                title: 'Łatwa rezerwacja',
                                desc: 'Wybierz pojazd, daty i oddział zwrotu. Cały proces zajmuje mniej niż 2 minuty.',
                            },
                            {
                                icon: <Clock className="w-7 h-7 text-red-600" />,
                                title: 'Elastyczny zwrot',
                                desc: 'Odbierz w jednym oddziale, zwróć w innym. Żadnych ukrytych opłat za zmianę lokalizacji.',
                            },
                        ].map(f => (
                            <div
                                key={f.title}
                                className="bg-white rounded-2xl border border-slate-100 p-8 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-default"
                            >
                                <div className="w-14 h-14 bg-red-50 rounded-xl flex items-center justify-center mb-5">
                                    {f.icon}
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3">{f.title}</h3>
                                <p className="text-slate-500 leading-relaxed">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── CTA ──────────────────────────────────────── */}
            <section className="bg-red-600 text-white py-20 px-4">
                <div className="max-w-3xl mx-auto text-center">
                    <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Shield className="w-8 h-8 text-white opacity-90" />
                    </div>
                    <h2 className="text-3xl font-black mb-4">Gotowy na jazdę?</h2>
                    <p className="text-red-100 mb-8 text-lg max-w-xl mx-auto leading-relaxed">
                        Zarejestruj się bezpłatnie i zarezerwuj swój pierwszy pojazd już dziś. Bez zobowiązań, bez ukrytych opłat.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/fleet"
                            className="inline-flex items-center justify-center rounded-md bg-white text-red-600 font-bold text-lg px-10 h-14 cursor-pointer hover:opacity-90 transition-opacity duration-200 shadow-lg"
                        >
                            Wybierz pojazd
                        </Link>
                        <Link
                            href="/register"
                            className="inline-flex items-center justify-center rounded-md border border-white/40 bg-white/10 text-white font-semibold text-lg px-10 h-14 cursor-pointer hover:opacity-90 transition-opacity duration-200"
                        >
                            Załóż konto za darmo
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
