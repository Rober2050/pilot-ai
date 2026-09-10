import { TrendingUp } from 'lucide-react';
import { KPI } from '../utils/types';

export const KPICard = ({ kpi }: { kpi: KPI }) => (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
        <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{kpi.label}</span>
            {kpi.trend === 'up' && <TrendingUp className="w-4 h-4 text-emerald-500" />}
            {kpi.trend === 'down' && <TrendingUp className="w-4 h-4 text-rose-500 rotate-180" />}
            {kpi.trend === 'neutral' && <div className="w-4 h-4 bg-slate-200 rounded-full" />}
        </div>
        <div className="text-2xl font-bold text-slate-800">{kpi.value}</div>
    </div>
);
