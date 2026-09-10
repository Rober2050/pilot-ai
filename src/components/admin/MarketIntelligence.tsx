import { useEffect, useState } from 'react';
import { analyticsService, TrialFeedbackRecord } from '../../services/firebase/analyticsService';
import {
    PieChart, Pie, Cell, Tooltip, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer
} from 'recharts';
import { Users, TrendingUp, Star, Trophy } from 'lucide-react';

const COLORS = {
    technical: '#8b5cf6',
    business:  '#6366f1',
    magia:     '#10b981',
    util:      '#0ea5e9',
    basico:    '#f59e0b',
};

function KPICard({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string | number; sub?: string }) {
    return (
        <div className="bg-slate-800/60 border border-white/10 rounded-xl p-5 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-indigo-500/20 text-indigo-400 shrink-0">
                <Icon size={22} />
            </div>
            <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider">{label}</p>
                <p className="text-2xl font-bold text-white mt-0.5">{value}</p>
                {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
            </div>
        </div>
    );
}

export function MarketIntelligence() {
    const [records, setRecords] = useState<TrialFeedbackRecord[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        analyticsService.getAllFeedback()
            .then(setRecords)
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    // ── Derived metrics ──────────────────────────────────────────────────────
    const uniqueUsers   = new Set(records.map(r => r.user_id)).size;
    const totalRecords  = records.length;

    // Profile distribution
    const techCount     = records.filter(r => r.user_profile === 'technical').length;
    const bizCount      = records.filter(r => r.user_profile === 'business').length;
    const profileData   = [
        { name: 'Técnico', value: techCount },
        { name: 'Negocio', value: bizCount  },
    ];

    // Sentiment distribution
    const counts = { magia: 0, util: 0, basico: 0 };
    records.forEach(r => { if (r.sentiment in counts) counts[r.sentiment]++; });
    const sentimentData = [
        { name: '🤩 ¡Es magia!', value: counts.magia, fill: COLORS.magia  },
        { name: '🙂 Es útil',    value: counts.util,  fill: COLORS.util   },
        { name: '😐 Básico',     value: counts.basico,fill: COLORS.basico },
    ];

    // Role ranking — flatten selected_experts arrays
    const roleFreq: Record<string, number> = {};
    records.forEach(r => {
        (r.selected_experts || []).forEach(roleId => {
            roleFreq[roleId] = (roleFreq[roleId] || 0) + 1;
        });
        if (r.reward_role) {
            roleFreq[r.reward_role] = (roleFreq[r.reward_role] || 0) + 1;
        }
    });
    const rankingData = Object.entries(roleFreq)
        .map(([roleId, count]) => ({ roleId, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);

    const topSentiment = sentimentData.reduce((a, b) => a.value > b.value ? a : b, sentimentData[0]);
    const magiaRate    = totalRecords > 0 ? Math.round((counts.magia / totalRecords) * 100) : 0;

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-white">Market Intelligence</h2>
                <p className="text-slate-400 text-sm mt-1">Datos del sistema de recompensa — Beta trial feedback</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard icon={Users}    label="Usuarios únicos" value={uniqueUsers}  sub={`${totalRecords} interacciones`} />
                <KPICard icon={TrendingUp} label="Perfil Técnico" value={`${techCount}`} sub={`${bizCount} de negocio`} />
                <KPICard icon={Star}     label="Tasa de Magia"  value={`${magiaRate}%`} sub="dicen que es mágico" />
                <KPICard icon={Trophy}   label="Top sentimiento" value={topSentiment?.name || '—'} sub="reacción más frecuente" />
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Profile pie */}
                <div className="bg-slate-800/60 border border-white/10 rounded-xl p-5">
                    <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-4">Perfil de Usuarios</h3>
                    {totalRecords === 0 ? (
                        <p className="text-slate-500 text-sm text-center py-8">Sin datos aún</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie data={profileData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                                    <Cell fill={COLORS.technical} />
                                    <Cell fill={COLORS.business}  />
                                </Pie>
                                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
                                <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Satisfaction bar */}
                <div className="bg-slate-800/60 border border-white/10 rounded-xl p-5">
                    <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-4">Satisfacción</h3>
                    {totalRecords === 0 ? (
                        <p className="text-slate-500 text-sm text-center py-8">Sin datos aún</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={sentimentData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                                <YAxis dataKey="name" type="category" tick={{ fill: '#94a3b8', fontSize: 11 }} width={90} />
                                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
                                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                    {sentimentData.map((entry, index) => (
                                        <Cell key={index} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            {/* Role ranking */}
            <div className="bg-slate-800/60 border border-white/10 rounded-xl p-5">
                <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-4">Ranking de Roles Elegidos</h3>
                {rankingData.length === 0 ? (
                    <p className="text-slate-500 text-sm text-center py-8">Sin datos aún</p>
                ) : (
                    <div className="space-y-3">
                        {rankingData.map((item, idx) => {
                            const maxCount = rankingData[0]?.count || 1;
                            const pct = Math.round((item.count / maxCount) * 100);
                            return (
                                <div key={item.roleId} className="flex items-center gap-3">
                                    <span className="text-[11px] font-bold text-slate-500 w-5 text-right">{idx + 1}</span>
                                    <span className="text-xs text-slate-300 w-36 truncate">{item.roleId}</span>
                                    <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all"
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                    <span className="text-xs font-bold text-slate-400 w-8 text-right">{item.count}</span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
