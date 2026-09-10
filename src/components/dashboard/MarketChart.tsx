/**
 * MarketChart — lazy-loaded sub-component for the Strategy Analyst "Market" tab.
 *
 * Why it exists:
 * Recharts is ~400 KB of JavaScript. When imported at the top of
 * StrategyAnalystDashboard, the browser had to download + parse ALL of
 * Recharts before rendering ANY tab — including the "overview" tab that
 * only shows the IDEO triangle (no charts at all). This was the ROOT CAUSE
 * of the 3.14s LCP on project pages.
 *
 * By extracting the chart into its own lazy component, the overview tab
 * renders immediately, and Recharts only downloads when the user clicks
 * the "Market Intelligence" tab.
 */
import React from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { ExternalLink } from 'lucide-react';

// --- Source Badge (duplicated here to keep this chunk self-contained) ---
const SourceBadge = ({ source, t }: { source: any | null; t: any }) => {
    if (!source) return null;
    const tierColors: Record<number, string> = {
        1: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        2: 'bg-blue-50 text-blue-700 border-blue-200',
        3: 'bg-amber-50 text-amber-700 border-amber-200',
        4: 'bg-slate-50 text-slate-500 border-slate-200',
    };
    const tierColor = tierColors[source.tier] || tierColors[4];
    return (
        <div className={`inline-flex items-center gap-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full border ${tierColor} mt-2`}>
            <span>📎 {source.source || 'Source'}</span>
            {source.year && <span>({source.year})</span>}
            <span className="opacity-60">· {t('sources.tier', 'Tier')} {source.tier}</span>
            {source.url && (
                <a href={source.url} target="_blank" rel="noopener noreferrer" className="hover:opacity-70">
                    <ExternalLink className="w-2.5 h-2.5" />
                </a>
            )}
        </div>
    );
};

interface MarketChartProps {
    market: {
        tam: number;
        sam: number;
        som: number;
    };
    marketSource: any;
    t: any;
}

const MarketChart: React.FC<MarketChartProps> = ({ market, marketSource, t }) => {
    return (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-6">{t('market.title')}</h3>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={[
                            { name: 'TAM', value: market.tam || 0, fill: '#6366f1' },
                            { name: 'SAM', value: market.sam || 0, fill: '#818cf8' },
                            { name: 'SOM', value: market.som || 0, fill: '#a5b4fc' },
                        ]}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={40} />
                        <Tooltip
                            formatter={(value: number) => [`$${value.toLocaleString()}`, 'Market Value']}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                        />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                            {[
                                { name: 'TAM', fill: '#4f46e5' },
                                { name: 'SAM', fill: '#818cf8' },
                                { name: 'SOM', fill: '#c7d2fe' },
                            ].map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
            {/* Source badge for TAM/SAM/SOM */}
            <SourceBadge source={marketSource} t={t} />
        </div>
    );
};

export default MarketChart;
