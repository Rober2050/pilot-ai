import React, { useState, useMemo, Suspense, lazy } from 'react';
import { SourcesTab } from '../strategy-analyst/SourcesTab';
import { SourceCitation } from '../../types/war-room';
import { useTranslation } from 'react-i18next';
import {
    Target, TrendingUp, Users, DollarSign,
    Shield, ArrowRight, Activity, Globe,
    Briefcase, AlertTriangle, CheckCircle, Zap, ExternalLink
} from 'lucide-react';
// ⚡ Recharts is ~400KB — lazy-load it so the 'overview' tab (IDEO triangle)
// renders immediately without waiting for chart code to parse.
// This is the #1 fix for the 3.14s LCP on project pages.
const LazyMarketChart = lazy(() => import('./MarketChart'));
import { loggingService } from '../../services/firebase/loggingService';

// --- Types ---
interface StrategyDashboardProps {
    data: any;
    projectId?: string;
    roleId?: string;
    onConvertToMaster?: (node: any, subDiagram?: any) => void;
}

// --- Helper: find relevant source for a keyword ---
function findSourceForKeyword(sources: any[], keywords: string[]): any | null {
    if (!sources || sources.length === 0) return null;
    for (const src of sources) {
        const claim = (src.claim || '').toLowerCase();
        if (keywords.some(kw => claim.includes(kw))) return src;
    }
    return null;
}

// --- Source Badge Component ---
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

// --- Helper Components ---

const Tooltip = ({ text }: { text: string }) => (
    <div className="group relative inline-block ml-2 cursor-help">
        <div className="p-1 rounded-full hover:bg-slate-100 transition-colors">
            <Activity className="w-3.5 h-3.5 text-slate-400" />
        </div>
        <div className="invisible group-hover:visible fixed z-[9999] px-3 py-2 bg-slate-900/95 backdrop-blur-sm text-white text-xs rounded-lg whitespace-normal min-w-[200px] max-w-[250px] shadow-xl border border-slate-700/50 -translate-x-1/2 -translate-y-full -mt-2 left-1/2">
            {text}
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-slate-900/95"></div>
        </div>
    </div>
);

const TrafficLightScore = ({ score, classification, rationale, t }: { score: number, classification: any, rationale?: string, t: any }) => {
    // Determine color based on score
    const color = score >= 80 ? 'emerald' : score >= 50 ? 'amber' : 'rose';
    const ColorIcon = score >= 80 ? CheckCircle : score >= 50 ? AlertTriangle : Shield;

    return (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
            {/* Background Gradient */}
            <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-${color}-50 to-transparent rounded-bl-full opacity-50 transition-transform group-hover:scale-110 duration-700`}></div>

            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                {/* Radial Score */}
                <div className="relative flex items-center justify-center w-40 h-40">
                    <svg className="w-full h-full transform -rotate-90">
                        <circle
                            cx="80" cy="80" r="70"
                            stroke="currentColor" strokeWidth="12" fill="transparent"
                            className="text-slate-100"
                        />
                        <circle
                            cx="80" cy="80" r="70"
                            stroke="currentColor" strokeWidth="12" fill="transparent"
                            strokeDasharray={440}
                            strokeDashoffset={440 - (440 * score) / 100}
                            className={`text-${color}-500 transition-all duration-1000 ease-out`}
                            strokeLinecap="round"
                        />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                        <span className={`text-5xl font-black text-${color}-600 tracking-tighter`}>{score}</span>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Score</span>
                    </div>
                </div>

                {/* Verdict Text */}
                <div className="text-center md:text-left flex-1">
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-${color}-100 text-${color}-700 text-xs font-bold uppercase tracking-wider mb-3`}>
                        <ColorIcon className="w-3 h-3" />
                        {classification?.verdict || t('score.analysisComplete')}
                    </div>
                    <h2 className="text-3xl font-bold text-slate-800 mb-2">
                        {classification?.action || (score >= 80 ? "PROCEED" : score >= 50 ? "PIVOT" : "HALT")}
                    </h2>
                    <p className="text-slate-600 leading-relaxed max-w-lg">
                        {rationale || classification?.reason || t('score.reason')}
                    </p>
                </div>
            </div>
        </div>
    );
};

const IdeoTriangle = ({ desirability, feasibility, viability, t }: { desirability: any, feasibility: any, viability: any, t: any }) => {
    return (
        <div className="bg-slate-900 rounded-2xl p-8 text-white relative overflow-hidden flex flex-col items-center justify-center min-h-[400px]">
            {/* Ambient Background */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(99,102,241,0.15),transparent_70%)]"></div>

            <h3 className="text-lg font-bold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-indigo-200 to-indigo-400 flex items-center gap-2 relative z-10">
                <Zap className="w-4 h-4 text-indigo-400" />
                {t('ideo.frameworkTitle')}
            </h3>

            <div className="relative w-full max-w-md aspect-square">
                {/* Visual Representation of Triangle */}
                <div className="absolute inset-0 flex items-center justify-center">
                    {/* HD Triangle Image */}
                    <img
                        src="/assets/ideo-triangle-hd.png"
                        alt="IDEO Triangle Framework"
                        width="400"
                        height="400"
                        loading="eager"
                        decoding="async"
                        // @ts-expect-error fetchpriority lowercase is the correct HTML attribute (React 18 limitation)
                        fetchpriority="high"
                        className="w-full h-full object-contain opacity-90 drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]"
                    />

                    {/* Desirability (Customer) - Bottom Left */}
                    <div className="absolute bottom-[15%] left-[10%] flex flex-col items-center group cursor-pointer transition-transform hover:scale-105">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-pink-500/20 to-rose-600/20 border border-rose-500/50 backdrop-blur-md flex flex-col items-center justify-center relative z-10 shadow-[0_0_30px_rgba(244,63,94,0.3)]">
                            <Users className="w-6 h-6 text-rose-400 mb-1" />
                            <span className="text-2xl font-bold text-white">{desirability?.score}%</span>
                        </div>
                        <span className="absolute -bottom-8 text-xs font-bold text-rose-400 uppercase tracking-wider">{t('ideo.desirability')}</span>
                        <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-2 w-48 bg-slate-800 p-3 rounded-lg text-xs text-slate-300 border border-slate-700 pointer-events-none transition-opacity z-20 text-center">
                            {desirability?.reason}
                        </div>
                    </div>

                    {/* Feasibility (Tech) - Top Center */}
                    <div className="absolute top-[10%] left-1/2 -translate-x-1/2 flex flex-col items-center group cursor-pointer transition-transform hover:scale-105">
                        <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-2 w-48 bg-slate-800 p-3 rounded-lg text-xs text-slate-300 border border-slate-700 pointer-events-none transition-opacity z-20 text-center">
                            {feasibility?.reason}
                        </div>
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-600/20 border border-cyan-500/50 backdrop-blur-md flex flex-col items-center justify-center relative z-10 shadow-[0_0_30px_rgba(6,182,212,0.3)]">
                            <Briefcase className="w-6 h-6 text-cyan-400 mb-1" />
                            <span className="text-2xl font-bold text-white">{feasibility?.score}%</span>
                        </div>
                        <span className="absolute -top-8 text-xs font-bold text-cyan-400 uppercase tracking-wider">{t('ideo.feasibility')}</span>
                    </div>

                    {/* Viability (Business) - Bottom Right */}
                    <div className="absolute bottom-[15%] right-[10%] flex flex-col items-center group cursor-pointer transition-transform hover:scale-105">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500/20 to-green-600/20 border border-emerald-500/50 backdrop-blur-md flex flex-col items-center justify-center relative z-10 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                            <DollarSign className="w-6 h-6 text-emerald-400 mb-1" />
                            <span className="text-2xl font-bold text-white">{viability?.score}%</span>
                        </div>
                        <span className="absolute -bottom-8 text-xs font-bold text-emerald-400 uppercase tracking-wider">{t('ideo.viability')}</span>
                        <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-2 w-48 bg-slate-800 p-3 rounded-lg text-xs text-slate-300 border border-slate-700 pointer-events-none transition-opacity z-20 text-center">
                            {viability?.reason}
                        </div>
                    </div>

                    {/* Sweet Spot */}
                    <div className="absolute top-[55%] left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
                        <div className="w-32 h-32 rounded-full bg-indigo-600/20 blur-xl animate-pulse"></div>
                        <div className="relative z-0 text-center">
                            <span className="text-[10px] text-indigo-300 uppercase tracking-widest opacity-80 font-bold glow-sm">{t('ideo.sweetSpot')}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const SwotTowsMatrix = ({ swot, tows, t }: { swot: any, tows: any, t: any }) => {
    const [mode, setMode] = useState<'SWOT' | 'TOWS'>('SWOT');

    // Helper to render lists
    const renderList = (items: string[], emptyText: string) => (
        <ul className="space-y-2">
            {items?.length > 0 ? items.map((item, i) => (
                <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                    <span className="mt-1.5 w-1 h-1 rounded-full bg-indigo-400 shrink-0"></span>
                    {item}
                </li>
            )) : <li className="text-sm text-slate-400 italic">{emptyText}</li>}
        </ul>
    );

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <Target className="w-5 h-5 text-indigo-600" />
                    {t('matrix.title')}
                </h3>
                <div className="flex bg-slate-200 p-1 rounded-lg">
                    <button
                        onClick={() => setMode('SWOT')}
                        className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${mode === 'SWOT' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        {t('matrix.swot')}
                    </button>
                    <button
                        onClick={() => setMode('TOWS')}
                        className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${mode === 'TOWS' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        {t('matrix.tows')}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                {/* Top Left: Strengths / SO */}
                <div className="p-6 bg-slate-50/30">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase mb-3 ${mode === 'SWOT' ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'}`}>
                        {mode === 'SWOT' ? t('matrix.swotStrengths') : t('matrix.towsSO')}
                    </span>
                    {renderList(mode === 'SWOT' ? swot?.strengths : tows?.so, t('matrix.strengths'))}
                </div>

                {/* Top Right: Weaknesses / WO */}
                <div className="p-6 bg-slate-50/30">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase mb-3 ${mode === 'SWOT' ? 'bg-rose-100 text-rose-700' : 'bg-indigo-100 text-indigo-700'}`}>
                        {mode === 'SWOT' ? t('matrix.swotWeaknesses') : t('matrix.towsWO')}
                    </span>
                    {renderList(mode === 'SWOT' ? swot?.weaknesses : tows?.wo, t('matrix.weaknesses'))}
                </div>

                {/* Bottom Left: Opportunities / ST */}
                <div className="p-6 bg-slate-50/30">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase mb-3 ${mode === 'SWOT' ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700'}`}>
                        {mode === 'SWOT' ? t('matrix.swotOpportunities') : t('matrix.towsST')}
                    </span>
                    {renderList(mode === 'SWOT' ? swot?.opportunities : tows?.st, t('matrix.opportunities'))}
                </div>

                {/* Bottom Right: Threats / WT */}
                <div className="p-6 bg-slate-50/30">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase mb-3 ${mode === 'SWOT' ? 'bg-slate-200 text-slate-700' : 'bg-rose-100 text-rose-700'}`}>
                        {mode === 'SWOT' ? t('matrix.swotThreats') : t('matrix.towsWT')}
                    </span>
                    {renderList(mode === 'SWOT' ? swot?.threats : tows?.wt, t('matrix.threats'))}
                </div>
            </div>
        </div>
    );
};

// --- Main Dashboard ---

const LABELS = {
    en: {
        executiveSummary: 'Executive Summary',
        tabs: { overview: 'Verdict & IDEO', market: 'Market Intelligence', strategy: 'SWOT / TOWS', financials: 'Unit Economics', sources: 'Sources' },
        ideo: { frameworkTitle: 'IDEO Validation Framework', desirability: 'Desirability', feasibility: 'Feasibility', viability: 'Viability', sweetSpot: 'Sweet Spot' },
        score: { analysisComplete: 'ANALYSIS COMPLETE', reason: 'AI Analysis' },
        market: { title: 'Market Size (TAM/SAM/SOM)', trendsTitle: 'Market Trends & Growth', cagr: 'CAGR (Annual Growth)' },
        matrix: {
            title: 'Strategic Matrix', swot: 'SWOT (Factors)', tows: 'TOWS (Strategies)',
            swotStrengths: 'INTERNAL (Strengths)', swotWeaknesses: 'INTERNAL (Weaknesses)', swotOpportunities: 'EXTERNAL (Opportunities)', swotThreats: 'EXTERNAL (Threats)',
            towsSO: 'STRATEGIES (Strengths + Opps)', towsWO: 'STRATEGIES (Weaknesses + Opps)', towsST: 'STRATEGIES (Strengths + Threats)', towsWT: 'STRATEGIES (Weaknesses + Threats)',
            strengths: 'No data.', weaknesses: 'No data.', opportunities: 'No data.', threats: 'No data.'
        },
        financials: {
            title: 'Unit Economics (LTV:CAC)', ratio: 'Ratio', breakevenTitle: 'Profitability Timeline',
            months: 'months', toBreakeven: 'To Break-even',
            healthyRatio: '✅ Healthy ratio (industry benchmark: ≥3x)', belowThreshold: '⚠️ Below healthy threshold (benchmark: ≥3x)'
        },
        sources: { tier: 'Tier' }
    },
    es: {
        executiveSummary: 'Resumen Ejecutivo',
        tabs: { overview: 'Veredicto & IDEO', market: 'Inteligencia de Mercado', strategy: 'Matriz FODA / TOWS', financials: 'Economía Unitaria', sources: 'Fuentes' },
        ideo: { frameworkTitle: 'Marco de Validación IDEO', desirability: 'Deseabilidad', feasibility: 'Factibilidad', viability: 'Viabilidad', sweetSpot: 'Sweet Spot' },
        score: { analysisComplete: 'ANÁLISIS COMPLETO', reason: 'Análisis IA' },
        market: { title: 'Tamaño del Mercado (TAM/SAM/SOM)', trendsTitle: 'Tendencias del Mercado y Crecimiento', cagr: 'CAGR (Crecimiento Anual)' },
        matrix: {
            title: 'Matriz Estratégica', swot: 'FODA (Factores)', tows: 'TOWS (Estrategias)',
            swotStrengths: 'INTERNO (Fortalezas)', swotWeaknesses: 'INTERNO (Debilidades)', swotOpportunities: 'EXTERNO (Oportunidades)', swotThreats: 'EXTERNO (Amenazas)',
            towsSO: 'ESTRATEGIAS (Fortalezas + Oportunidades)', towsWO: 'ESTRATEGIAS (Debilidades + Oportunidades)', towsST: 'ESTRATEGIAS (Fortalezas + Amenazas)', towsWT: 'ESTRATEGIAS (Debilidades + Amenazas)',
            strengths: 'Sin datos.', weaknesses: 'Sin datos.', opportunities: 'Sin datos.', threats: 'Sin datos.'
        },
        financials: {
            title: 'Economía Unitaria (LTV:CAC)', ratio: 'Ratio', breakevenTitle: 'Línea de Tiempo de Rentabilidad',
            months: 'meses', toBreakeven: 'Para el Punto de Equilibrio',
            healthyRatio: '✅ Ratio saludable (referencia industria: ≥3x)', belowThreshold: '⚠️ Por debajo del umbral saludable (referencia: ≥3x)'
        },
        sources: { tier: 'Nivel' }
    }
};

const StrategyAnalystDashboard: React.FC<StrategyDashboardProps> = ({ data, projectId, roleId, onConvertToMaster }) => {
    const { t, i18n } = useTranslation('strategy');
    const lang = (i18n.language || 'en').startsWith('es') ? 'es' : 'en';
    const L = LABELS[lang];
    const [activeTab, setActiveTab] = useState<'overview' | 'market' | 'strategy' | 'financials' | 'sources'>('overview');

    // Helper: Default data structure
    const getDefaultData = () => ({
        score: { value: 0, verdict: 'UNKNOWN', action: 'HALT', reason: 'No data available' },
        ideo: {
            desirability: { score: 0, reason: 'No data' },
            feasibility: { score: 0, reason: 'No data' },
            viability: { score: 0, reason: 'No data' }
        },
        market: { tam: 0, sam: 0, som: 0, cagr: 0, trends: [] },
        financials: { ltv: 0, cac: 0, ratio: 0, breakevenMonth: 0 },
        swot: { strengths: [], weaknesses: [], opportunities: [], threats: [] },
        tows: { so: [], wo: [], st: [], wt: [] },
        summary: 'No analysis generated.',
        sources: []
    });

    // 1. Safe Data Parsing - ALIGNED WITH SYSTEMPROMPT
    const safeData = useMemo(() => {
        try {
            if (!data) {
                console.warn('[StrategyAnalystDashboard] No data provided');
                return getDefaultData();
            }

            // The AI generates: { dashboard: {...}, sources: [...] }
            // SystemPrompt structure: dashboard.overallScore, dashboard.ideo, dashboard.marketIntelligence, etc.
            const dashboard = data.dashboard || data;

            // Normalize to internal structure
            const normalized = {
                score: {
                    value: dashboard.overallScore ?? 0,
                    verdict: dashboard.classification?.verdict || 'UNKNOWN',
                    action: dashboard.classification?.action || 'HALT',
                    reason: dashboard.classification?.reason || dashboard.metrics_rationale || 'No data available'
                },
                ideo: dashboard.ideo || {
                    desirability: { score: 0, reason: 'No data' },
                    feasibility: { score: 0, reason: 'No data' },
                    viability: { score: 0, reason: 'No data' }
                },
                market: {
                    tam: dashboard.marketIntelligence?.tam ?? 0,
                    sam: dashboard.marketIntelligence?.sam ?? 0,
                    som: dashboard.marketIntelligence?.som ?? 0,
                    cagr: dashboard.marketIntelligence?.cagr ?? 0,
                    trends: dashboard.marketIntelligence?.trends || []
                },
                financials: {
                    ltv: dashboard.unitEconomics?.estimatedLTV ?? 0,
                    cac: dashboard.unitEconomics?.estimatedCAC ?? 0,
                    ratio: dashboard.unitEconomics?.ltvCacRatio ?? 0,
                    breakevenMonth: dashboard.unitEconomics?.breakevenMonths ?? 0
                },
                swot: dashboard.swot || { strengths: [], weaknesses: [], opportunities: [], threats: [] },
                tows: dashboard.tows || { so: [], wo: [], st: [], wt: [] },
                summary: dashboard.executiveSummary || 'No analysis generated.',
                // Sources can be in data.sources OR dashboard.sources
                sources: data.sources || dashboard.sources || []
            };

            return normalized;
        } catch (error) {
            console.error('[StrategyAnalystDashboard] Parse error:', error);
            loggingService.logError('strategy-dashboard-parse', (error as Error).message, {
                projectId,
                dataSnapshot: JSON.stringify(data).substring(0, 500)
            });
            return getDefaultData();
        }
    }, [data, projectId]);

    // Source lookup helpers
    const marketSource = findSourceForKeyword(safeData.sources, ['market', 'tam', 'sam', 'mercado', 'tamaño']);
    const cagrSource = findSourceForKeyword(safeData.sources, ['cagr', 'growth', 'crecimiento']);
    const ltvCacSource = findSourceForKeyword(safeData.sources, ['ltv', 'cac', 'unit econom', 'economía unitaria']);

    const tabs = [
        { id: 'overview', label: t('tabs.overview'), icon: Target },
        { id: 'market', label: t('tabs.market'), icon: Globe },
        { id: 'strategy', label: t('tabs.strategy'), icon: Shield },
        { id: 'financials', label: t('tabs.financials'), icon: DollarSign },
        { id: 'sources', label: t('tabs.sources'), icon: Globe },
    ];

    return (
        <div className="space-y-3 animate-in fade-in duration-700">
            {/* 0. Executive Summary - GLOBAL (Now placed above tabs) */}
            {safeData.summary && (
                <div className="bg-white px-5 py-3 rounded-xl border border-slate-100 shadow-sm">
                    <h4 className="font-bold text-slate-800 mb-1 pb-1 flex items-center gap-2 text-sm">
                        <Globe className="w-3.5 h-3.5 text-indigo-500" />
                        {t('executiveSummary')}
                    </h4>
                    <p className="text-slate-700 leading-normal text-[12px] font-sans">
                        {safeData.summary}
                    </p>
                </div>
            )}

            {/* 1. Header Navigation */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-2 flex gap-1 overflow-x-auto">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap
                            ${activeTab === tab.id
                                ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200'
                                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                            }
                        `}
                    >
                        <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-indigo-600' : 'text-slate-400'}`} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* 2. Content Area */}
            <div className="min-h-[500px]">
                {activeTab === 'overview' && (
                    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                        {/* Score + IDEO Triangle */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <TrafficLightScore
                                score={safeData.score.value}
                                classification={safeData.score}
                                rationale={safeData.score.reason}
                                t={t}
                            />
                            <IdeoTriangle
                                desirability={safeData.ideo.desirability}
                                feasibility={safeData.ideo.feasibility}
                                viability={safeData.ideo.viability}
                                t={t}
                            />
                        </div>
                    </div>
                )}

                {activeTab === 'strategy' && (
                    <div className="animate-in slide-in-from-right-4 duration-500">
                        <SwotTowsMatrix swot={safeData.swot} tows={safeData.tows} t={t} />
                    </div>
                )}

                {activeTab === 'market' && (
                    <div className="space-y-4 animate-in slide-in-from-right-4 duration-500">
                    <p className="text-[11px] text-slate-400 text-right italic px-1">
                        {i18n.language.startsWith('es')
                            ? 'Estimaciones generadas por IA basadas en benchmarks de la industria. Verificar con datos de mercado propios.'
                            : 'AI-generated estimates based on industry benchmarks. Verify with your own market data.'}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* TAM SAM SOM — lazy-loaded chart to avoid blocking overview tab */}
                        <Suspense fallback={
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-center h-[400px]">
                                <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                            </div>
                        }>
                            <LazyMarketChart
                                market={safeData.market}
                                marketSource={marketSource}
                                t={t}
                            />
                        </Suspense>

                        {/* Trends & CAGR */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <h3 className="font-bold text-slate-800 mb-4">{t('market.trendsTitle')}</h3>
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 text-center">
                                    <div className="text-3xl font-black text-emerald-600">{safeData.market.cagr || 0}%</div>
                                    <div className="text-xs font-bold text-emerald-800 uppercase">{t('market.cagr')}</div>
                                </div>
                                {/* Source badge for CAGR */}
                                <SourceBadge source={cagrSource} t={t} />
                            </div>
                            <ul className="space-y-3">
                                {safeData.market.trends?.map((trend: string, idx: number) => (
                                    <li key={idx} className="flex items-start gap-3 text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                        <TrendingUp className="w-5 h-5 text-indigo-500 shrink-0" />
                                        {trend}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                    </div>
                )}

                {activeTab === 'financials' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-right-4 duration-500">
                        {/* LTV vs CAC */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center">
                            <h3 className="font-bold text-slate-800 mb-6 self-start">{t('financials.title')}</h3>
                            <div className="relative w-64 h-32 mb-4">
                                {/* Visual Scale - PROPORTIONAL to actual data */}
                                {(() => {
                                    const ltv = safeData.financials.ltv || 1;
                                    const cac = safeData.financials.cac || 1;
                                    const maxVal = Math.max(ltv, cac);
                                    const cacHeight = Math.max((cac / maxVal) * 100, 15);
                                    const ltvHeight = Math.max((ltv / maxVal) * 100, 15);
                                    return (
                                        <div className="flex items-end justify-center gap-8 h-full">
                                            <div className="w-16 bg-rose-400 rounded-t-lg relative group transition-all hover:bg-rose-500 hover:scale-105" style={{ height: `${cacHeight}%` }}>
                                                <span className="absolute -top-6 left-1/2 -translate-x-1/2 font-bold text-rose-600 whitespace-nowrap">${safeData.financials.cac.toLocaleString()}</span>
                                                <div className="absolute inset-x-0 bottom-2 text-center text-[10px] text-white font-bold opacity-80">CAC</div>
                                            </div>
                                            <div className="w-16 bg-emerald-400 rounded-t-lg relative group transition-all hover:bg-emerald-500 hover:scale-105" style={{ height: `${ltvHeight}%` }}>
                                                <span className="absolute -top-6 left-1/2 -translate-x-1/2 font-bold text-emerald-600 whitespace-nowrap">${safeData.financials.ltv.toLocaleString()}</span>
                                                <div className="absolute inset-x-0 bottom-2 text-center text-[10px] text-white font-bold opacity-80">LTV</div>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                            <div className="text-center bg-slate-50 px-6 py-2 rounded-full border border-slate-200 mb-3">
                                <span className="text-sm text-slate-500 font-medium mr-2">{t('financials.ratio')}:</span>
                                <span className="text-xl font-black text-slate-800">{safeData.financials.ratio || 0}x</span>
                            </div>
                            {/* Industry benchmark context */}
                            <div className={`text-[11px] font-medium px-3 py-1 rounded-full ${(safeData.financials.ratio || 0) >= 3
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}>
                                {(safeData.financials.ratio || 0) >= 3
                                    ? t('financials.healthyRatio')
                                    : t('financials.belowThreshold')
                                }
                            </div>
                            {/* Source badge for LTV/CAC */}
                            <SourceBadge source={ltvCacSource} t={t} />
                        </div>

                        {/* Break-even */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <h3 className="font-bold text-slate-800 mb-6">{t('financials.breakevenTitle')}</h3>
                            <div className="flex flex-col items-center justify-center h-[250px] bg-slate-50 rounded-xl m-2 border border-slate-100 border-dashed">
                                <HourglassIcon className="w-12 h-12 text-slate-300 mb-4" />
                                <div className="text-4xl font-black text-indigo-600 mb-1">
                                    {safeData.financials.breakevenMonth || "?"} <span className="text-lg text-slate-400 font-medium">{t('financials.months')}</span>
                                </div>
                                <div className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3">
                                    {t('financials.toBreakeven')}
                                </div>
                                {safeData.financials.cac > 0 && safeData.financials.ltv > 0 && (
                                    <p className="text-[11px] text-slate-400 text-center max-w-[200px]">
                                        Based on CAC ${safeData.financials.cac.toLocaleString()} & LTV ${safeData.financials.ltv.toLocaleString()}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Sources Tab */}
                {activeTab === 'sources' && (
                    <SourcesTab sources={(data as any)?.sources} />
                )}
            </div>
        </div>
    );
};

// Simple Icon component for the placeholder
const HourglassIcon = (props: any) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
    >
        <path d="M5 22h14" />
        <path d="M5 2h14" />
        <path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22" />
        <path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" />
    </svg>
)

export default StrategyAnalystDashboard;
