'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FlaskConical, Clock, AlertTriangle, Play, History, RefreshCw } from 'lucide-react';

interface PendingRow {
    Id: number;
    Created_At: string;
    Estimated_Cost: string;
    First_Name: string;
    Last_Name: string;
    Brand: string;
    Model: string;
    hours_elapsed: number;
}

interface ActiveRow {
    Id: number;
    Start_Date: string;
    End_Date: string;
    Estimated_Cost: string;
    First_Name: string;
    Last_Name: string;
    Brand: string;
    Model: string;
    days_overdue: number;
    pending_penalty: string;
}

interface AuditRow {
    Id: number;
    Record_Id: number;
    Action_Type: string;
    New_Values: any;
    Changed_At: string;
}

export default function AdminSystemPage() {
    const [pending, setPending] = useState<PendingRow[]>([]);
    const [active, setActive] = useState<ActiveRow[]>([]);
    const [auditLogs, setAuditLogs] = useState<AuditRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [overdueDays, setOverdueDays] = useState<Record<number, number>>({});

    const fetchData = () => {
        fetch('/api/admin/system')
            .then(res => res.json())
            .then(data => {
                if (data.error) { setError(data.error); return; }
                setPending(data.pending);
                setActive(data.active);
                setAuditLogs(data.auditLogs);
            })
            .catch(() => setError('Błąd ładowania panelu'))
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchData(); }, []);

    const runAction = async (body: any, successFallback = 'Wykonano.') => {
        setBusy(true);
        setMessage('');
        setError('');
        try {
            const res = await fetch('/api/admin/system', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Błąd operacji');
            setMessage(data.message || successFallback);
            fetchData();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setBusy(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center py-32 text-slate-400">
            <FlaskConical className="w-8 h-8 animate-pulse mr-3" /> Ładowanie panelu symulacji...
        </div>
    );

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-black text-slate-900">Symulacja systemu</h1>
                <p className="text-slate-500 text-sm mt-0.5">
                    Cofnij rezerwacje w czasie i uruchom procedury SQL, by zademonstrować naliczanie kar (kursor) oraz auto-anulowanie nieopłaconych (event).
                </p>
            </div>

            {message && (
                <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl border border-emerald-200 text-sm font-semibold flex items-center gap-2">
                    <Play className="w-4 h-4" /> {message}
                </div>
            )}
            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 text-sm font-semibold">{error}</div>
            )}

            {/* Globalne procedury */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-2 text-amber-600">
                        <AlertTriangle className="w-5 h-5" />
                        <h2 className="font-bold text-slate-900">Przetwarzanie zaległości</h2>
                    </div>
                    <p className="text-sm text-slate-500 mb-4">
                        Procedura kursorowa <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">process_overdue_reservations</code> iteruje po aktywnych wynajmach po terminie i nalicza kary dzienne.
                    </p>
                    <Button onClick={() => runAction({ action: 'process_overdue' })} disabled={busy} className="bg-amber-600 hover:bg-amber-700 text-white cursor-pointer w-full">
                        Uruchom kursor kar
                    </Button>
                </div>
                <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-2 text-red-600">
                        <Clock className="w-5 h-5" />
                        <h2 className="font-bold text-slate-900">Auto-anulowanie nieopłaconych</h2>
                    </div>
                    <p className="text-sm text-slate-500 mb-4">
                        Procedura <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">cancel_unpaid_reservations</code> (wywoływana cyklicznie przez event) anuluje rezerwacje nieopłacone po 24h.
                    </p>
                    <Button onClick={() => runAction({ action: 'cancel_unpaid' })} disabled={busy} className="bg-red-600 hover:bg-red-700 text-white cursor-pointer w-full">
                        Uruchom event anulowania
                    </Button>
                </div>
            </div>

            {/* Oczekujące na płatność */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <h2 className="text-sm font-bold text-slate-700">Oczekujące na płatność ({pending.length})</h2>
                    <span className="text-xs text-slate-400 ml-2">Cofnij utworzenie o 24h, a potem uruchom auto-anulowanie</span>
                </div>
                {pending.length === 0 ? (
                    <div className="px-5 py-8 text-center text-slate-400 text-sm">Brak rezerwacji oczekujących na płatność.</div>
                ) : (
                    <div className="divide-y divide-slate-50">
                        {pending.map(r => (
                            <div key={r.Id} className="px-5 py-4 flex items-center justify-between gap-4">
                                <div>
                                    <p className="font-semibold text-slate-900 text-sm">#RES-{r.Id} · {r.Brand} {r.Model}</p>
                                    <p className="text-xs text-slate-500">{r.First_Name} {r.Last_Name} · utworzono {r.hours_elapsed}h temu</p>
                                </div>
                                <Button
                                    size="sm" variant="outline" disabled={busy}
                                    className="cursor-pointer border-slate-200 text-slate-700"
                                    onClick={() => runAction({ action: 'backdate_created', reservationId: r.Id, hours: 25 })}
                                >
                                    Cofnij o 24h
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Aktywne wynajmy */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-slate-400" />
                    <h2 className="text-sm font-bold text-slate-700">Aktywne wynajmy ({active.length})</h2>
                    <span className="text-xs text-slate-400 ml-2">Cofnij termin zwrotu, a potem uruchom kursor kar</span>
                </div>
                {active.length === 0 ? (
                    <div className="px-5 py-8 text-center text-slate-400 text-sm">Brak aktywnych wynajmów.</div>
                ) : (
                    <div className="divide-y divide-slate-50">
                        {active.map(r => (
                            <div key={r.Id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <p className="font-semibold text-slate-900 text-sm">#RES-{r.Id} · {r.Brand} {r.Model}</p>
                                    <p className="text-xs text-slate-500">
                                        {r.First_Name} {r.Last_Name} · termin zwrotu: {new Date(r.End_Date).toLocaleDateString()}
                                        {r.days_overdue > 0 && <span className="text-red-600 font-bold"> · {r.days_overdue} dni po terminie</span>}
                                        {Number(r.pending_penalty) > 0 && <span className="text-amber-600 font-bold"> · kara {Number(r.pending_penalty).toFixed(2)} PLN</span>}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="number" min="1"
                                        value={overdueDays[r.Id] ?? 3}
                                        onChange={(e) => setOverdueDays(prev => ({ ...prev, [r.Id]: parseInt(e.target.value) || 1 }))}
                                        className="h-9 w-16 text-sm text-center"
                                    />
                                    <span className="text-xs text-slate-400">dni</span>
                                    <Button
                                        size="sm" variant="outline" disabled={busy}
                                        className="cursor-pointer border-slate-200 text-slate-700"
                                        onClick={() => runAction({ action: 'backdate_end', reservationId: r.Id, days: overdueDays[r.Id] ?? 3 })}
                                    >
                                        Cofnij termin
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Dziennik audytu */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <History className="w-4 h-4 text-slate-400" />
                        <h2 className="text-sm font-bold text-slate-700">Dziennik audytu (trigger / kursor)</h2>
                    </div>
                    <button onClick={fetchData} className="text-slate-400 hover:text-slate-700 cursor-pointer" title="Odśwież">
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </div>
                {auditLogs.length === 0 ? (
                    <div className="px-5 py-8 text-center text-slate-400 text-sm">Brak wpisów w dzienniku.</div>
                ) : (
                    <div className="divide-y divide-slate-50 max-h-80 overflow-auto">
                        {auditLogs.map(log => (
                            <div key={log.Id} className="px-5 py-3 text-xs flex items-start gap-3">
                                <span className={`px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${
                                    log.Action_Type === 'DELETE' ? 'bg-red-100 text-red-700' :
                                    log.Action_Type === 'INSERT' ? 'bg-emerald-100 text-emerald-700' :
                                    'bg-sky-100 text-sky-700'
                                }`}>{log.Action_Type}</span>
                                <span className="text-slate-500 flex-shrink-0">#RES-{log.Record_Id}</span>
                                <span className="text-slate-600 font-mono break-all flex-1">
                                    {typeof log.New_Values === 'string' ? log.New_Values : JSON.stringify(log.New_Values)}
                                </span>
                                <span className="text-slate-400 flex-shrink-0">{new Date(log.Changed_At).toLocaleString('pl-PL')}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
