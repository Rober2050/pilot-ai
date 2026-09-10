import { useEffect, useState } from 'react';
import { Mail, Users, RefreshCw, Download } from 'lucide-react';
import { waitlistService, WaitlistEntry } from '../../../services/firebase/waitlistService';

const PLAN_COLORS: Record<string, string> = {
    pro: 'bg-indigo-100 text-indigo-700',
    enterprise: 'bg-cyan-100 text-cyan-700',
};

function formatDate(ts: any): string {
    if (!ts) return '—';
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function downloadCSV(entries: WaitlistEntry[]) {
    const header = 'Email,Plan,Fecha,Estado';
    const rows = entries.map(e =>
        `${e.email},${e.plan},${formatDate(e.createdAt)},${e.status}`
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `waitlist_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

export const WaitlistPanel = () => {
    const [entries, setEntries] = useState<WaitlistEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const load = async () => {
        setIsLoading(true);
        const data = await waitlistService.getAllEntries();
        setEntries(data);
        setIsLoading(false);
    };

    useEffect(() => { load(); }, []);

    const byPlan = entries.reduce<Record<string, number>>((acc, e) => {
        acc[e.plan] = (acc[e.plan] ?? 0) + 1;
        return acc;
    }, {});

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Mail className="w-5 h-5 text-indigo-400" />
                        Waitlist de Usuarios
                    </h2>
                    <p className="text-slate-400 text-sm mt-1">
                        Personas interesadas en planes de pago — listas para notificar cuando estén disponibles
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={load}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Actualizar
                    </button>
                    {entries.length > 0 && (
                        <button
                            onClick={() => downloadCSV(entries)}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm transition-colors"
                        >
                            <Download className="w-4 h-4" />
                            Descargar CSV
                        </button>
                    )}
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-slate-800 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-slate-400 text-xs uppercase tracking-wider mb-1">
                        <Users className="w-3.5 h-3.5" />
                        Total registrados
                    </div>
                    <p className="text-3xl font-bold text-white">{entries.length}</p>
                </div>
                {Object.entries(byPlan).map(([plan, count]) => (
                    <div key={plan} className="bg-slate-800 rounded-xl p-4">
                        <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Plan {plan}</div>
                        <p className="text-3xl font-bold text-white">{count}</p>
                    </div>
                ))}
            </div>

            {/* Table */}
            <div className="bg-slate-800 rounded-xl overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center py-16">
                        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : entries.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                        <Mail className="w-10 h-10 mb-3 opacity-40" />
                        <p className="font-medium">Aún no hay registros en la waitlist</p>
                        <p className="text-sm mt-1">Los emails aparecerán aquí cuando alguien haga clic en "Unirse a la Lista de Espera"</p>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-700">
                                <th className="text-left px-6 py-3 text-slate-400 font-medium">#</th>
                                <th className="text-left px-6 py-3 text-slate-400 font-medium">Email</th>
                                <th className="text-left px-6 py-3 text-slate-400 font-medium">Plan</th>
                                <th className="text-left px-6 py-3 text-slate-400 font-medium">Fecha</th>
                                <th className="text-left px-6 py-3 text-slate-400 font-medium">Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {entries.map((entry, i) => (
                                <tr key={entry.id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                                    <td className="px-6 py-4 text-slate-500">{i + 1}</td>
                                    <td className="px-6 py-4 text-white font-medium">{entry.email}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${PLAN_COLORS[entry.plan] ?? 'bg-slate-700 text-slate-300'}`}>
                                            {entry.plan}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-400">{formatDate(entry.createdAt)}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${entry.status === 'notified' ? 'text-emerald-400 bg-emerald-900/30' : 'text-amber-400 bg-amber-900/30'}`}>
                                            {entry.status === 'notified' ? 'Notificado' : 'Pendiente'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};
