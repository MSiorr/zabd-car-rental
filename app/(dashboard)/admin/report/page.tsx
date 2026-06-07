'use client';

import { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, AlertTriangle, Wrench, Users } from 'lucide-react';

interface MonthRow {
    year: number;
    month: number;
    total_reservations: number;
    revenue: string;
    penalties: string;
    damages: string;
    total_income: string;
    unique_customers: number;
}

const MONTHS = ['', 'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
    'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'];

const pln = (v: any) => Number(v).toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function AdminReportPage() {
    const [rows, setRows] = useState<MonthRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetch('/api/admin/report')
            .then(res => res.json())
            .then(data => {
                if (data.error) setError(data.error);
                else setRows(data);
            })
            .catch(() => setError('Błąd ładowania raportu'))
            .finally(() => setLoading(false));
    }, []);

    const totals = rows.reduce((acc, r) => ({
        revenue: acc.revenue + Number(r.revenue),
        penalties: acc.penalties + Number(r.penalties),
        damages: acc.damages + Number(r.damages),
        income: acc.income + Number(r.total_income),
        reservations: acc.reservations + Number(r.total_reservations),
    }), { revenue: 0, penalties: 0, damages: 0, income: 0, reservations: 0 });

    const maxIncome = Math.max(1, ...rows.map(r => Number(r.total_income)));

    if (loading) return (
        <div className="flex items-center justify-center py-32 text-slate-400">
            <BarChart3 className="w-8 h-8 animate-pulse mr-3" /> Generowanie raportu...
        </div>
    );
    if (error) return <div className="text-center py-20 text-red-500 font-bold">{error}</div>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-black text-slate-900">Podsumowanie miesięczne</h1>
            </div>

            {/* Kafelki sumaryczne */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                    <div className="flex items-center gap-2 text-emerald-600 mb-2"><TrendingUp className="w-4 h-4" /><span className="text-xs font-semibold uppercase tracking-wider">Przychód z najmu</span></div>
                    <p className="text-2xl font-black text-slate-900">{pln(totals.revenue)} <span className="text-sm text-slate-400">PLN</span></p>
                </div>
                <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                    <div className="flex items-center gap-2 text-amber-600 mb-2"><AlertTriangle className="w-4 h-4" /><span className="text-xs font-semibold uppercase tracking-wider">Kary</span></div>
                    <p className="text-2xl font-black text-slate-900">{pln(totals.penalties)} <span className="text-sm text-slate-400">PLN</span></p>
                </div>
                <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                    <div className="flex items-center gap-2 text-rose-600 mb-2"><Wrench className="w-4 h-4" /><span className="text-xs font-semibold uppercase tracking-wider">Uszkodzenia</span></div>
                    <p className="text-2xl font-black text-slate-900">{pln(totals.damages)} <span className="text-sm text-slate-400">PLN</span></p>
                </div>
                <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                    <div className="flex items-center gap-2 text-sky-600 mb-2"><Users className="w-4 h-4" /><span className="text-xs font-semibold uppercase tracking-wider">Rezerwacje</span></div>
                    <p className="text-2xl font-black text-slate-900">{totals.reservations}</p>
                </div>
            </div>

            {rows.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center text-slate-400">
                    Brak danych. Zaksięgowane płatności pojawią się tutaj po opłaceniu rezerwacji.
                </div>
            ) : (
                <>
                    {/* Wykres słupkowy łącznego wpływu wg miesięcy */}
                    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                        <h2 className="text-sm font-bold text-slate-700 mb-5">Łączny wpływ wg miesięcy</h2>
                        <div className="flex items-end gap-3 h-48">
                            {[...rows].reverse().map(r => (
                                <div
                                    key={`${r.year}-${r.month}`}
                                    className="flex-1 flex flex-col items-center justify-end gap-2 group h-full"
                                >
                                    <span className="text-xs font-semibold text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">{pln(r.total_income)}</span>
                                    <div
                                        className="w-full bg-linear-to-t from-red-600 to-red-400 rounded-t-lg transition-all hover:from-red-700 hover:to-red-500"
                                        style={{ height: `${Math.max(4, (Number(r.total_income) / maxIncome) * 100)}%` }}
                                    />
                                    <span className="text-xs text-slate-400">{MONTHS[r.month].slice(0, 3)}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Tabela szczegółowa */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                    <th className="px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Okres</th>
                                    <th className="px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Rezerwacje</th>
                                    <th className="px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Klienci</th>
                                    <th className="px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Przychód</th>
                                    <th className="px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Kary</th>
                                    <th className="px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Uszkodzenia</th>
                                    <th className="px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Razem</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {rows.map(r => (
                                    <tr key={`${r.year}-${r.month}`} className="hover:bg-slate-50/70 transition-colors">
                                        <td className="px-5 py-4 font-semibold text-slate-900">{MONTHS[r.month]} {r.year}</td>
                                        <td className="px-5 py-4 text-right text-slate-700">{r.total_reservations}</td>
                                        <td className="px-5 py-4 text-right text-slate-700">{r.unique_customers}</td>
                                        <td className="px-5 py-4 text-right font-semibold text-emerald-600">{pln(r.revenue)}</td>
                                        <td className="px-5 py-4 text-right text-amber-600">{pln(r.penalties)}</td>
                                        <td className="px-5 py-4 text-right text-rose-600">{pln(r.damages)}</td>
                                        <td className="px-5 py-4 text-right font-black text-slate-900">{pln(r.total_income)}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="bg-slate-50 border-t-2 border-slate-200 font-black text-slate-900">
                                    <td className="px-5 py-4">Razem</td>
                                    <td className="px-5 py-4 text-right">{totals.reservations}</td>
                                    <td className="px-5 py-4 text-right">—</td>
                                    <td className="px-5 py-4 text-right text-emerald-700">{pln(totals.revenue)}</td>
                                    <td className="px-5 py-4 text-right text-amber-700">{pln(totals.penalties)}</td>
                                    <td className="px-5 py-4 text-right text-rose-700">{pln(totals.damages)}</td>
                                    <td className="px-5 py-4 text-right">{pln(totals.income)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
}
