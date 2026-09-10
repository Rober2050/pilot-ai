import React, { useState, useEffect } from 'react';
import {
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
    AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
    PieChart as RechartsPieChart, Pie, Cell, Legend
} from 'recharts';
import {
    Target, Users, DollarSign, TrendingUp, CheckCircle,
    Calendar, Zap, MousePointer, Filter, ChevronRight,
    UserCheck, HelpCircle, Lightbulb, AlertTriangle,
    FileText, Download, MessageSquare, PieChart,
    BarChart3, Map, Crosshair, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n/config';
import { loggingService } from '../../services/firebase/loggingService';

interface MarketingManagerDashboardProps {
    data: any;
    projectId?: string;
    roleId?: string;
    onConvertToMaster?: (node: any, subDiagram?: any) => void;
}

const MarketingManagerDashboard: React.FC<MarketingManagerDashboardProps> = ({ data, projectId, roleId, onConvertToMaster }) => {
    const { t } = useTranslation('marketing');

    // --- STATE ---
    const [activeTab, setActiveTab] = useState('simulacion');
    const [budget, setBudget] = useState(2000);
    const [ticketPromedio, setTicketPromedio] = useState(120);
    const [expandedWeek, setExpandedWeek] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [scenarioMode, setScenarioMode] = useState<'custom' | 'conservative' | 'base' | 'aggressive'>('custom');
    const [isExporting, setIsExporting] = useState(false);
    const [renderCharts, setRenderCharts] = useState(false);

    // --- RENDER DELAY FOR CHARTS ---
    // Fixes Recharts "width(-1) and height(-1)" warning caused by
    // ResponsiveContainer measuring the parent while CSS animation is starting.
    useEffect(() => {
        setRenderCharts(false);
        const timer = setTimeout(() => setRenderCharts(true), 150);
        return () => clearTimeout(timer);
    }, [activeTab]);

    // --- INITIALIZATION FROM AI DATA ---
    useEffect(() => {
        try {
            if (data) {
                // Initialize from AI-provided industry benchmarks
                if (data.industryBenchmarks) {
                    if (typeof data.industryBenchmarks.avgTicket === 'number') setTicketPromedio(data.industryBenchmarks.avgTicket);
                }
                if (typeof data.budget === 'number') setBudget(data.budget);
                if (typeof data.ticketPromedio === 'number') setTicketPromedio(data.ticketPromedio);
            }
        } catch (e) {
            const errMsg = e instanceof Error ? e.message : 'Unknown error initializing dashboard';
            setError(errMsg);
            loggingService.logError('MarketingManagerDashboard', 'Initialization Failed', { error: errMsg, projectId, roleId });
        }
    }, [data, projectId, roleId]);

    if (error) {
        return (
            <div className="p-8 text-center bg-red-50 rounded-xl border border-red-200">
                <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-red-800 mb-2">{t('dashboardError')}</h3>
                <code className="text-xs bg-red-100 p-2 rounded text-red-800">{error}</code>
            </div>
        );
    }

    // --- BUSINESS LOGIC ---
    const benchmarks = data?.industryBenchmarks || {};
    const cpcMeta = scenarioMode === 'custom'
        ? (benchmarks.avgCPC || 1.5)
        : (data?.roasScenarios?.[scenarioMode]?.cpc || benchmarks.avgCPC || 1.5);
    const convRate = scenarioMode === 'custom'
        ? (benchmarks.avgConversionRate || 0.03)
        : (data?.roasScenarios?.[scenarioMode]?.convRate || benchmarks.avgConversionRate || 0.03);

    const estimatedClicks = Math.floor(budget / cpcMeta);
    const estimatedLeads = Math.floor(estimatedClicks * 0.15);
    const estimatedSales = Math.floor(estimatedLeads * (convRate / 0.15)); // Adjusted by conv rate
    const revenue = estimatedSales * ticketPromedio;
    const roas = revenue > 0 ? revenue / budget : 0;

    // Unit Economics from AI (with fallback)
    const unitEcon = data?.unitEconomics || {};
    const cac = unitEcon.cac || Math.round(budget / Math.max(estimatedSales, 1));
    const ltv = unitEcon.ltv || (ticketPromedio * 12);
    const ltvCacRatio = unitEcon.ltvCacRatio || (ltv / Math.max(cac, 1));
    const paybackMonths = unitEcon.paybackMonths || Math.ceil(cac / Math.max(ticketPromedio, 1));
    const monthlyChurn = unitEcon.monthlyChurn || 0.05;
    const arpu = unitEcon.arpu || ticketPromedio;

    // Projection Data  
    const projectionData = [
        { month: t('months.m1'), ventas: revenue, acumulado: revenue },
        { month: t('months.m2'), ventas: revenue * 1.1, acumulado: revenue * 2.1 },
        { month: t('months.m3'), ventas: revenue * 1.2, acumulado: revenue * 3.3 },
        { month: t('months.m4'), ventas: revenue * 1.35, acumulado: revenue * 4.65 },
        { month: t('months.m5'), ventas: revenue * 1.5, acumulado: revenue * 6.15 },
        { month: t('months.m6'), ventas: revenue * 1.7, acumulado: revenue * 7.85 },
    ];

    // --- DATA SOURCES (AI-first, with fallbacks) ---
    const buyerPersona = data?.buyerPersona || {
        avatar: "The Anxious Entrepreneur",
        demographics: { age: "25 - 45", gender: "All", location: "Global", income: "Mid-High" },
        interests: ["Tech", "Marketing"],
        behaviors: ["Online Shopper"],
        painPoint: "Fear of spending without ROI.",
        goals: ["Scale revenue", "Validate product-market fit"],
        objections: ["Too expensive", "Not sure it works"]
    };

    const psychoData = Array.isArray(data?.psychoData) ? data.psychoData : [
        { subject: 'Price Sensitivity', A: 120, fullMark: 150 },
        { subject: 'Brand Loyalty', A: 80, fullMark: 150 },
        { subject: 'Innovation', A: 98, fullMark: 150 },
        { subject: 'Social Proof', A: 85, fullMark: 150 },
        { subject: 'Urgency', A: 65, fullMark: 150 },
    ];

    const tacticalFunnel = Array.isArray(data?.tacticalFunnel) ? data.tacticalFunnel : [
        { stage: 'TOFU', metric: t('funnel.reach'), value: estimatedClicks * 25, action: 'Paid Social Ads', icon: 'Zap', color: '#fbbf24' },
        { stage: 'MOFU', metric: t('funnel.visits'), value: estimatedClicks, action: 'Landing Page', icon: 'MousePointer', color: '#60a5fa' },
        { stage: 'BOFU', metric: t('funnel.sales'), value: estimatedSales, action: 'Email + Demo', icon: 'CheckCircle', color: '#34d399' },
    ];

    // --- ROBUST DATA NORMALIZATION ---
    // Handle AI output variations (camelCase vs snake_case) and provide safe fallbacks
    // for deep structures like messaging, calendar, and competitive maps.

    const messagingData = data?.messagingFramework || data?.messaging_framework || data?.messaging;
    const messagingFramework = messagingData || {
        valueProposition: data?.summary || '', // Fallback to summary if value prop is completely missing
        elevatorPitch: '',
        tagline: '',
        keyMessages: []
    };

    const compData = data?.competitiveMap || data?.competitive_map || data?.competitors || data?.competencia;
    const competitiveMap = Array.isArray(compData) ? compData : [];

    const calData = data?.gtmCalendar || data?.gtm_calendar || data?.go_to_market_calendar || data?.go_to_market_plan || data?.calendar;
    let gtmCalendar = Array.isArray(calData) && calData.length > 0 ? calData : [
        { week: 1, phase: 'Pre-Launch', tasks: ['Setup analytics', 'Configure pixels'], status: 'pending' },
        { week: 2, phase: 'Pre-Launch', tasks: ['Create landing page', 'Build email list'], status: 'pending' },
        { week: 3, phase: 'Pre-Launch', tasks: ['Design creative assets', 'Setup CRM'], status: 'pending' },
        { week: 4, phase: 'Pre-Launch', tasks: ['A/B test messaging', 'Validate audience'], status: 'pending' },
        { week: 5, phase: 'Launch', tasks: ['Launch campaigns', 'Monitor performance'], status: 'pending' },
        { week: 9, phase: 'Growth', tasks: ['Optimize CPL', 'Scale budget'], status: 'pending' }
    ];

    // Ensure all 3 phases exist in the calendar to prevent empty UI columns
    if (gtmCalendar.length > 0) {
        const hasPre = gtmCalendar.some((w: any) => {
            const p = (w.phase || '').toLowerCase();
            return p.includes('pre') || p.includes('infra');
        });
        const hasLaunch = gtmCalendar.some((w: any) => {
            const p = (w.phase || '').toLowerCase();
            return (p.includes('launch') || p.includes('lanz')) && !p.includes('pre');
        });
        const hasGrowth = gtmCalendar.some((w: any) => {
            const p = (w.phase || '').toLowerCase();
            return p.includes('growth') || p.includes('crecimiento') || p.includes('scale');
        });

        if (!hasPre) gtmCalendar.unshift({ week: 'Pre', phase: 'Pre-Launch', tasks: ['Preparar infraestructura y analíticas'], status: 'pending' });
        if (!hasLaunch) gtmCalendar.push({ week: 'Launch', phase: 'Launch', tasks: ['Ejecutar campañas iniciales'], status: 'pending' });
        if (!hasGrowth) gtmCalendar.push({ week: 'Growth', phase: 'Growth', tasks: ['Optimización de ROAS y escala'], status: 'pending' });
    }

    const iceMatrix = Array.isArray(data?.channelStrategy) ? data.channelStrategy
        : Array.isArray(data?.iceMatrix) ? data.iceMatrix
            : [
                { canal: 'Meta Ads', impact: 9, cost: 4, effort: 3, score: 24, recommended: true, budgetPct: 40, rationale: 'Highest ROAS for early stage' },
                { canal: 'Google Search', impact: 8, cost: 7, effort: 5, score: 20, recommended: false, budgetPct: 25, rationale: 'Intent-based traffic' },
            ];

    // Budget donut chart data from channelStrategy
    const budgetPieData = iceMatrix
        .filter((ch: any) => ch.budgetPct && ch.budgetPct > 0)
        .map((ch: any) => ({ name: ch.canal, value: ch.budgetPct }));
    const PIE_COLORS = ['#ec4899', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#84cc16'];

    const roasScenarios = data?.roasScenarios || null;

    // --- ACTIONS ---
    const handleExport = async () => {
        setIsExporting(true);
        try {
            const { gtmDocxGenerator } = await import('../../services/export/gtmDocxGenerator');
            const lang = i18n.language?.startsWith('es') ? 'es' : 'en';
            await gtmDocxGenerator.generate(
                {
                    projectName: data?.projectName || data?.meta?.projectName || 'GTM Plan',
                    summary: data?.summary,
                    industryBenchmarks: data?.industryBenchmarks,
                    buyerPersona: data?.buyerPersona,
                    messagingFramework: data?.messagingFramework,
                    channelStrategy: data?.channelStrategy,
                    roasScenarios: data?.roasScenarios,
                    unitEconomics: data?.unitEconomics,
                    gtmCalendar: Array.isArray(data?.gtmCalendar) ? data.gtmCalendar : undefined,
                    tacticalFunnel: Array.isArray(data?.tacticalFunnel) ? data.tacticalFunnel : undefined,
                },
                lang
            );
        } catch (e) {
            console.error('Export GTM Plan failed:', e);
            loggingService.logError('MarketingManagerDashboard', 'Export Failed', { error: String(e), projectId, roleId });
        } finally {
            setIsExporting(false);
        }
    };

    // Helper for dynamic icons
    const getIcon = (iconName: string) => {
        switch (iconName) {
            case 'Zap': return <Zap className="w-4 h-4 text-yellow-500" />;
            case 'MousePointer': return <MousePointer className="w-4 h-4 text-blue-500" />;
            case 'CheckCircle': return <CheckCircle className="w-4 h-4 text-green-500" />;
            default: return <Target className="w-4 h-4" />;
        }
    };

    return (
        <div className="text-slate-800 font-sans">

            {/* Executive Summary - Compact, matching Strategy Analyst style */}
            {data?.summary && (
                <div className="bg-white px-5 py-3 rounded-xl border border-slate-100 shadow-sm mb-4">
                    <h4 className="font-bold text-slate-800 mb-1 pb-1 flex items-center gap-2 text-sm">
                        <FileText className="w-3.5 h-3.5 text-pink-500" />
                        {t('summaryTitle')}
                    </h4>
                    <p className="text-slate-700 leading-normal text-[12px] font-[Arial,sans-serif]">
                        {data.summary}
                    </p>
                </div>
            )}

            {/* Compact header: subtitle + export button */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold bg-pink-50 text-pink-700 border-pink-300">
                        <Target className="w-3.5 h-3.5" />
                        {t('dashboardTitle')}
                    </span>
                    <p className="text-[12px] text-slate-500 font-[Arial,sans-serif]">{t('dashboardSubtitle')}</p>
                    {benchmarks.vertical && (
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200 font-medium">
                            {benchmarks.vertical}
                        </span>
                    )}
                </div>

                <button
                    onClick={handleExport}
                    disabled={isExporting}
                    className="flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-pink-200 font-semibold text-sm shrink-0"
                >
                    {isExporting ? (
                        <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> {t('exporting')}</>
                    ) : (
                        <><Download className="w-4 h-4" /> {t('exportGTM')}</>
                    )}
                </button>
            </div>

            {/* KPI Cards - Dynamic from AI */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm border-t-4 border-t-pink-500">
                    <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">ROAS</div>
                    <div className={`text-3xl font-black ${roas >= 3 ? 'text-green-600' : roas >= 1.5 ? 'text-yellow-500' : 'text-red-500'}`}>
                        {roas.toFixed(1)}x
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm border-t-4 border-t-emerald-500">
                    <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">CAC</div>
                    <div className="text-3xl font-bold text-slate-800">${cac.toLocaleString()}</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm border-t-4 border-t-blue-500">
                    <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">LTV / CAC</div>
                    <div className={`text-3xl font-bold ${ltvCacRatio >= 3 ? 'text-green-600' : ltvCacRatio >= 1 ? 'text-yellow-500' : 'text-red-500'}`}>
                        {ltvCacRatio.toFixed(1)}x
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm border-t-4 border-t-purple-500">
                    <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">{t('grossSales')}</div>
                    <div className="text-3xl font-bold text-slate-800">${revenue.toLocaleString()}</div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex flex-wrap bg-slate-100 rounded-lg p-1 gap-0.5 mb-6">
                {[
                    { id: 'simulacion', label: t('tabs.simulation'), icon: DollarSign },
                    { id: 'estrategia', label: t('tabs.strategy'), icon: UserCheck },
                    { id: 'messaging', label: t('tabs.messaging'), icon: MessageSquare },
                    { id: 'economics', label: t('tabs.economics'), icon: PieChart },
                    { id: 'ejecucion', label: t('tabs.execution'), icon: Calendar },
                    { id: 'canales', label: t('tabs.channels'), icon: Filter },
                    { id: 'competitive', label: t('tabs.competitive'), icon: Map },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-3 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-1.5 ${activeTab === tab.id
                            ? 'bg-white text-pink-700 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* --- TAB: SIMULATION & ROAS --- */}
            {activeTab === 'simulacion' && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

                    {/* Left Panel: Controls */}
                    <div className="md:col-span-4 space-y-4">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-sm">
                                <Filter className="w-4 h-4 text-slate-400" />
                                {t('simulation.variables')}
                            </h3>

                            {/* Scenario Toggle (Option C) */}
                            {roasScenarios && (
                                <div className="mb-5 pb-4 border-b border-slate-100">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">{t('simulation.scenarioToggle')}</label>
                                    <div className="grid grid-cols-4 gap-1 bg-slate-50 rounded-lg p-1">
                                        {(['custom', 'conservative', 'base', 'aggressive'] as const).map(mode => (
                                            <button
                                                key={mode}
                                                onClick={() => setScenarioMode(mode)}
                                                className={`text-[10px] font-semibold py-1.5 rounded-md transition-all ${scenarioMode === mode
                                                    ? 'bg-white text-pink-700 shadow-sm'
                                                    : 'text-slate-500 hover:text-slate-700'
                                                    }`}
                                            >
                                                {t(`simulation.scenario${mode.charAt(0).toUpperCase() + mode.slice(1)}`)}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Budget Slider */}
                            <div className="mb-6">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">
                                    {t('simulation.monthlyBudget')}
                                </label>
                                <div className="flex justify-between items-end mb-2">
                                    <span className="text-3xl font-bold text-slate-900 tracking-tight">${budget}</span>
                                    <span className="text-xs text-slate-400 mb-2">USD</span>
                                </div>
                                <input
                                    type="range" min="500" max="10000" step="100"
                                    value={budget} onChange={(e) => { setBudget(Number(e.target.value)); setScenarioMode('custom'); }}
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-pink-600"
                                />
                            </div>

                            {/* Ticket Slider */}
                            <div className="mb-6 pt-4 border-t border-slate-100">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex justify-between">
                                    <span>{t('simulation.avgTicket')}</span>
                                    <span className="text-pink-600 font-bold">${ticketPromedio}</span>
                                </label>
                                <input
                                    type="range" min="10" max="500" step="10"
                                    value={ticketPromedio} onChange={(e) => { setTicketPromedio(Number(e.target.value)); setScenarioMode('custom'); }}
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-pink-400"
                                />
                                <p className="text-[10px] text-slate-400 mt-1">{t('simulation.ticketHint')}</p>
                            </div>

                            {/* Static Indicators */}
                            <div className="grid grid-cols-2 gap-4 text-sm mt-2">
                                <div className="bg-slate-50 p-3 rounded-lg group relative cursor-help">
                                    <div className="flex items-center gap-1 mb-1">
                                        <span className="block text-slate-500 text-xs">CPC</span>
                                        <HelpCircle className="w-3 h-3 text-slate-400" />
                                    </div>
                                    <span className="font-semibold text-slate-800">${cpcMeta.toFixed(2)}</span>
                                    {benchmarks.source && (
                                        <p className="text-[9px] text-slate-400 mt-0.5">{benchmarks.source}</p>
                                    )}
                                    <div className="absolute bottom-full left-0 mb-2 w-48 bg-slate-800 text-white text-xs p-2 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                                        {t('simulation.cpcTooltip')}
                                    </div>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-lg">
                                    <span className="block text-slate-500 text-xs">{t('simulation.convRate')}</span>
                                    <span className="font-semibold text-slate-800">{(convRate * 100).toFixed(1)}%</span>
                                </div>
                            </div>
                        </div>

                        {/* Expert Tip Card */}
                        <div className="bg-gradient-to-br from-pink-600 to-purple-700 p-5 rounded-xl shadow-md text-white">
                            <div className="flex items-start gap-3 mb-3">
                                <div className="p-2 bg-white/20 rounded-lg shrink-0">
                                    <Lightbulb className="w-5 h-5 text-yellow-300" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm">{t('tips.title')}</h4>
                                    <p className="text-[11px] text-pink-100 opacity-90 leading-tight mt-1">{t('tips.subtitle')}</p>
                                </div>
                            </div>
                            <ul className="space-y-2 text-xs">
                                <li className="flex gap-2 items-start">
                                    <TrendingUp className="w-4 h-4 text-green-300 shrink-0 mt-0.5" />
                                    <span className="opacity-90">{t('tips.roasHint')}</span>
                                </li>
                                <li className="flex gap-2 items-start">
                                    <Zap className="w-4 h-4 text-yellow-300 shrink-0 mt-0.5" />
                                    <span className="opacity-90">{t('tips.volumeHint')}</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Right Panel: Results */}
                    <div className="md:col-span-8 space-y-6">

                        {/* ROAS Card */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                            <div className="flex items-center gap-2 mb-6">
                                <TrendingUp className="w-5 h-5 text-green-600" />
                                <h3 className="font-bold text-slate-800 text-sm">{t('roasTitle')}</h3>
                            </div>

                            <div className="flex flex-col md:flex-row md:items-end gap-2 md:gap-8 mb-6">
                                <div>
                                    <span className="text-sm text-slate-500 block">{t('projectedRoas')}</span>
                                    <span className={`text-5xl font-black ${roas >= 3 ? 'text-green-600' : roas >= 2 ? 'text-yellow-500' : 'text-red-500'}`}>
                                        {roas.toFixed(1)}x
                                    </span>
                                </div>
                                <div className="pb-2">
                                    <span className="text-sm text-slate-500 block">{t('grossSales')}</span>
                                    <span className="text-2xl font-bold text-slate-800">${revenue.toLocaleString()}</span>
                                </div>
                                <div className="pb-2">
                                    <span className="text-sm text-slate-500 block">{t('grossProfit')}</span>
                                    <span className="text-2xl font-bold text-slate-800">${(revenue - budget).toLocaleString()}</span>
                                </div>
                            </div>

                            {/* ROAS Progress Bar */}
                            <div className="space-y-2 mb-4">
                                <div className="flex justify-between text-xs font-bold uppercase text-slate-400">
                                    <span>{t('loss')} (&lt;1x)</span>
                                    <span>{t('breakeven')} (1.5x)</span>
                                    <span>{t('profitable')} (3x+)</span>
                                </div>
                                <div className="h-4 bg-slate-100 rounded-full overflow-hidden flex relative">
                                    <div className="h-full bg-red-400" style={{ width: '30%' }}></div>
                                    <div className="h-full bg-yellow-400" style={{ width: '30%' }}></div>
                                    <div className="h-full bg-green-500" style={{ width: '40%' }}></div>
                                    <div
                                        className="absolute top-0 bottom-0 w-1 bg-slate-900 border-x border-white shadow-sm transition-all duration-500 z-10"
                                        style={{ left: `${Math.min((roas / 5) * 100, 100)}%` }}
                                    ></div>
                                </div>
                                <p className="text-xs text-slate-500 text-right pt-1">
                                    {roas < 2 ? t('roasAdvice.low') : t('roasAdvice.high')}
                                </p>
                            </div>
                        </div>

                        {/* Growth Projection Chart */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-[300px]">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                                    <Calendar className="w-5 h-5 text-pink-600" />
                                    {t('growthProjection')}
                                </h3>
                                <span className="text-xs bg-pink-50 text-pink-700 px-2 py-1 rounded border border-pink-100 font-medium">{t('scenario')}</span>
                            </div>
                            {renderCharts ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={projectionData} margin={{ top: 10, right: 30, left: 0, bottom: 25 }}>
                                        <defs>
                                            <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} tickFormatter={(val) => `$${val / 1000}k`} />
                                        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            formatter={(value) => [`$${Number(value).toLocaleString()}`, '']}
                                        />
                                        <Area type="monotone" dataKey="acumulado" stroke="#ec4899" strokeWidth={3} fillOpacity={1} fill="url(#colorVentas)" name={t('accumulatedRevenue')} />
                                        <Area type="monotone" dataKey="ventas" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" fill="transparent" name={t('monthlySales')} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-slate-50 rounded-lg animate-pulse" />
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* --- TAB: STRATEGY & PERSONA --- */}
            {activeTab === 'estrategia' && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

                    <div className="md:col-span-12 bg-white p-6 rounded-xl shadow-sm border-l-4 border-pink-500 flex flex-col md:flex-row gap-6">
                        <div className="md:w-1/3 border-r border-slate-100 pr-6">
                            <div className="flex items-center gap-2 mb-3">
                                <UserCheck className="w-5 h-5 text-pink-600" />
                                <h3 className="font-bold text-slate-800 text-sm">{t('buyerPersona')}</h3>
                            </div>
                            <div className="text-2xl font-bold text-slate-900 mb-1">{buyerPersona.avatar}</div>
                            <p className="text-sm text-slate-500 italic">"{buyerPersona.painPoint}"</p>

                            {/* Buyer Goals */}
                            {buyerPersona.goals && buyerPersona.goals.length > 0 && (
                                <div className="mt-4">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t('goals')}</h4>
                                    <ul className="space-y-1">
                                        {buyerPersona.goals.map((g: string, i: number) => (
                                            <li key={i} className="text-xs text-slate-600 flex items-start gap-1.5">
                                                <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 shrink-0" />
                                                {g}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Buyer Objections */}
                            {buyerPersona.objections && buyerPersona.objections.length > 0 && (
                                <div className="mt-3">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t('objections')}</h4>
                                    <ul className="space-y-1">
                                        {buyerPersona.objections.map((o: string, i: number) => (
                                            <li key={i} className="text-xs text-red-600 flex items-start gap-1.5">
                                                <AlertTriangle className="w-3 h-3 text-red-400 mt-0.5 shrink-0" />
                                                {o}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>

                        <div className="md:w-2/3 grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t('demographics')}</h4>
                                <ul className="text-sm space-y-1 text-slate-700">
                                    <li><strong>{t('age')}:</strong> {buyerPersona.demographics.age}</li>
                                    <li><strong>{t('gender')}:</strong> {buyerPersona.demographics.gender}</li>
                                    <li><strong>{t('location')}:</strong> {buyerPersona.demographics.location}</li>
                                    {buyerPersona.demographics.income && (
                                        <li><strong>{t('income')}:</strong> {buyerPersona.demographics.income}</li>
                                    )}
                                </ul>
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t('interests')}</h4>
                                <div className="flex flex-wrap gap-2">
                                    {buyerPersona.interests.map((int: string, i: number) => (
                                        <span key={i} className="px-2 py-1 bg-pink-50 text-pink-700 text-xs rounded-md font-medium border border-pink-100">
                                            {int}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t('behavior')}</h4>
                                <ul className="text-sm space-y-1 text-slate-600 list-disc list-inside">
                                    {buyerPersona.behaviors.map((beh: string, i: number) => (
                                        <li key={i}>{beh}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="md:col-span-6 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                        <div className="flex items-center gap-2 mb-4">
                            <Users className="w-5 h-5 text-purple-600" />
                            <h3 className="font-bold text-slate-800 text-sm">{t('empathyMap')}</h3>
                        </div>
                        <div className="h-64">
                            {renderCharts ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={psychoData}>
                                        <PolarGrid stroke="#e2e8f0" />
                                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 11 }} />
                                        <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                                        <Radar name="User" dataKey="A" stroke="#ec4899" fill="#f472b6" fillOpacity={0.4} />
                                        <Tooltip />
                                    </RadarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-slate-50 rounded-full animate-pulse" />
                            )}
                        </div>
                    </div>

                    <div className="md:col-span-6 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                        <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2 text-sm">
                            <Filter className="w-5 h-5 text-blue-500" />
                            {t('tacticalFunnel')}
                        </h3>
                        <div className="space-y-4">
                            {tacticalFunnel.map((step: any, idx: number) => (
                                <div key={idx} className="flex items-center gap-4 group">
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm" style={{ backgroundColor: step.color || '#e2e8f0' }}>
                                        <div className="text-white">{typeof step.icon === 'string' ? getIcon(step.icon) : step.icon}</div>
                                    </div>
                                    <div className="flex-1 bg-slate-50 border border-slate-100 rounded-lg p-3 hover:bg-white hover:shadow-md transition-all">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-xs font-bold text-slate-400 uppercase">{step.stage}</span>
                                            <span className="text-xs font-medium px-2 py-0.5 bg-white border rounded text-slate-600">{step.action}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="font-semibold text-slate-700">{step.metric}</span>
                                            <span className="font-bold text-slate-900">{typeof step.value === 'number' ? step.value.toLocaleString() : step.value}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* --- TAB: MESSAGING FRAMEWORK --- */}
            {activeTab === 'messaging' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

                    {/* Value Proposition */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-pink-500">
                        <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2 text-sm">
                            <Target className="w-5 h-5 text-pink-600" />
                            {t('messaging.valueProp')}
                        </h3>
                        <p className="text-slate-700 text-sm leading-relaxed bg-pink-50 p-4 rounded-lg border border-pink-100 italic">
                            {messagingFramework.valueProposition || 'No value proposition generated yet. Re-run the analysis to generate.'}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Elevator Pitch */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                            <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2 text-sm">
                                <MessageSquare className="w-5 h-5 text-blue-600" />
                                {t('messaging.pitch')}
                            </h3>
                            <p className="text-slate-700 text-sm leading-relaxed">
                                {messagingFramework.elevatorPitch || '—'}
                            </p>
                        </div>

                        {/* Tagline */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                            <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2 text-sm">
                                <Zap className="w-5 h-5 text-yellow-500" />
                                {t('messaging.tagline')}
                            </h3>
                            <p className="text-2xl font-bold text-slate-900">
                                {messagingFramework.tagline ? `"${messagingFramework.tagline}"` : '—'}
                            </p>
                        </div>
                    </div>

                    {/* Key Messages by Audience */}
                    {messagingFramework.keyMessages && messagingFramework.keyMessages.length > 0 && (
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-sm">
                                <Users className="w-5 h-5 text-purple-600" />
                                {t('messaging.keyMessages')}
                            </h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-slate-700 text-white">
                                            <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider rounded-tl-lg">{t('messaging.audience')}</th>
                                            <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider">{t('messaging.message')}</th>
                                            <th className="text-center px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider rounded-tr-lg">{t('messaging.tone')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {messagingFramework.keyMessages.map((msg: any, idx: number) => (
                                            <tr key={idx} className={`border-b border-slate-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                                                <td className="px-4 py-3 font-semibold text-slate-800">{msg.audience}</td>
                                                <td className="px-4 py-3 text-slate-600">{msg.message}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className="text-[10px] bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full font-bold border border-pink-200">
                                                        {msg.tone}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* --- TAB: UNIT ECONOMICS --- */}
            {activeTab === 'economics' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

                    {/* Main Metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">{t('economics.cac')}</div>
                            <div className="text-3xl font-bold text-slate-800">${cac.toLocaleString()}</div>
                        </div>
                        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">{t('economics.ltv')}</div>
                            <div className="text-3xl font-bold text-slate-800">${ltv.toLocaleString()}</div>
                        </div>
                        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">{t('economics.ltvCacRatio')}</div>
                            <div className={`text-3xl font-bold ${ltvCacRatio >= 3 ? 'text-green-600' : ltvCacRatio >= 1 ? 'text-yellow-500' : 'text-red-500'}`}>
                                {ltvCacRatio.toFixed(1)}x
                            </div>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${ltvCacRatio >= 3 ? 'bg-green-100 text-green-700' : ltvCacRatio >= 1 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                                }`}>
                                {ltvCacRatio >= 3 ? t('economics.healthy') : ltvCacRatio >= 1 ? t('economics.warning') : t('economics.critical')}
                            </span>
                        </div>
                        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">{t('economics.payback')}</div>
                            <div className="text-3xl font-bold text-slate-800">{paybackMonths} <span className="text-sm font-normal text-slate-500">{t('economics.months')}</span></div>
                        </div>
                        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">{t('economics.churn')}</div>
                            <div className="text-3xl font-bold text-slate-800">{(monthlyChurn * 100).toFixed(1)}%</div>
                        </div>
                        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">{t('economics.arpu')}</div>
                            <div className="text-3xl font-bold text-slate-800">${arpu.toLocaleString()}</div>
                        </div>
                    </div>

                    {/* Industry Benchmarks */}
                    {benchmarks.vertical && (
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-sm">
                                <BarChart3 className="w-5 h-5 text-pink-600" />
                                {t('benchmarks.title')}
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">{t('benchmarks.vertical')}</div>
                                    <div className="text-sm font-bold text-slate-800">{benchmarks.vertical}</div>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">{t('benchmarks.avgCPC')}</div>
                                    <div className="text-sm font-bold text-slate-800">${benchmarks.avgCPC?.toFixed(2) || '—'}</div>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">{t('benchmarks.avgConversion')}</div>
                                    <div className="text-sm font-bold text-slate-800">{benchmarks.avgConversionRate ? `${(benchmarks.avgConversionRate * 100).toFixed(1)}%` : '—'}</div>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">{t('benchmarks.source')}</div>
                                    <div className="text-xs text-slate-600">{benchmarks.source || '—'}</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* --- TAB: GTM CALENDAR — Kanban 3-Column --- */}
            {activeTab === 'ejecucion' && (() => {
                // Group weeks by phase
                const phases: Record<string, { label: string; color: string; bg: string; border: string; weeks: any[] }> = {
                    preLaunch: { label: t('gtmPhases.preLaunch'), color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', weeks: [] },
                    launch: { label: t('gtmPhases.launch'), color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200', weeks: [] },
                    growth: { label: t('gtmPhases.growth'), color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200', weeks: [] },
                };
                gtmCalendar.forEach((week: any) => {
                    const p = (week.phase || '').toLowerCase();
                    if (p.includes('pre') || p.includes('infraestructura') || p.includes('infrastructure')) phases.preLaunch.weeks.push(week);
                    else if (p.includes('launch') || p.includes('lanz')) phases.launch.weeks.push(week);
                    else phases.growth.weeks.push(week);
                });
                // If AI didn't split by phase, put all in growth
                if (!phases.preLaunch.weeks.length && !phases.launch.weeks.length && !phases.growth.weeks.length) {
                    phases.growth.weeks.push(...gtmCalendar);
                }
                return (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center gap-2 mb-6">
                            <Calendar className="w-5 h-5 text-orange-500" />
                            <h3 className="font-bold text-slate-800 text-sm">{t('gtmCalendar')}</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {Object.values(phases).map((phase) => (
                                <div key={phase.label} className={`rounded-xl border ${phase.border} ${phase.bg} p-4`}>
                                    <div className={`font-bold text-sm mb-4 pb-2 border-b ${phase.border} ${phase.color} flex items-center justify-between`}>
                                        <span>{phase.label}</span>
                                        <span className="text-[10px] font-normal bg-white px-2 py-0.5 rounded-full border">{phase.weeks.length} {phase.weeks.length === 1 ? 'week' : 'weeks'}</span>
                                    </div>
                                    <div className="space-y-3">
                                        {phase.weeks.length === 0 && (
                                            <p className="text-[11px] text-slate-400 italic">—</p>
                                        )}
                                        {phase.weeks.map((week: any, wIdx: number) => (
                                            <div key={wIdx} className="bg-white rounded-lg shadow-sm border border-slate-100 p-3 hover:shadow-md transition-all">
                                                <div className="font-semibold text-slate-800 text-xs mb-2">
                                                    {typeof week.week === 'number' ? `Week ${week.week}` : week.week}
                                                    {week.task ? `: ${week.task}` : ''}
                                                </div>
                                                <ul className="space-y-1">
                                                    {(week.tasks || week.subtasks || []).map((task: string, tIdx: number) => (
                                                        <li key={tIdx} className="flex items-start gap-1.5 text-[11px] text-slate-600">
                                                            <div className="w-3 h-3 border border-slate-300 rounded mt-0.5 shrink-0"></div>
                                                            {task}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })()}

            {/* --- TAB: CHANNELS (ICE + Budget Mix) --- */}
            {activeTab === 'canales' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

                    {/* Budget Mix Donut + ICE Table side by side on large screens */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

                        {/* Donut chart */}
                        {budgetPieData.length > 0 && (
                            <div className="md:col-span-4 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-sm">
                                    <PieChart className="w-5 h-5 text-pink-600" />
                                    {t('channelMix')}
                                </h3>
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RechartsPieChart>
                                            <Pie
                                                data={budgetPieData}
                                                cx="50%" cy="50%"
                                                innerRadius={55}
                                                outerRadius={85}
                                                paddingAngle={3}
                                                dataKey="value"
                                                label={({ name, value }) => `${name}: ${value}%`}
                                                labelLine={false}
                                            >
                                                {budgetPieData.map((_: any, index: number) => (
                                                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(val) => `${val}%`} />
                                        </RechartsPieChart>
                                    </ResponsiveContainer>
                                </div>
                                {/* Legend */}
                                <div className="mt-2 space-y-1">
                                    {budgetPieData.map((item: any, idx: number) => (
                                        <div key={idx} className="flex items-center justify-between text-xs">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}></div>
                                                <span className="text-slate-600">{item.name}</span>
                                            </div>
                                            <span className="font-semibold text-slate-700">{item.value}%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ICE Table */}
                        <div className={`${budgetPieData.length > 0 ? 'md:col-span-8' : 'md:col-span-12'} bg-white p-6 rounded-xl shadow-sm border border-slate-100`}>
                            <div className="flex items-center gap-2 mb-4">
                                <Filter className="w-5 h-5 text-pink-600" />
                                <h3 className="font-bold text-slate-800 text-sm">{t('iceMatrix')}</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                                        <tr>
                                            <th className="px-4 py-3 rounded-l-lg">{t('col.channel')}</th>
                                            <th className="px-4 py-3 text-center">{t('col.impact')}</th>
                                            <th className="px-4 py-3 text-center">{t('col.cost')}</th>
                                            <th className="px-4 py-3 text-center">{t('col.effort')}</th>
                                            <th className="px-4 py-3 text-center">{t('col.score')}</th>
                                            <th className="px-4 py-3 text-center">{t('col.budget')}</th>
                                            <th className="px-4 py-3 text-left rounded-r-lg">{t('col.rationale')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {iceMatrix.map((item: any, idx: number) => {
                                            const maxScore = Math.max(...iceMatrix.map((i: any) => i.score || 0), 1);
                                            const barWidth = Math.round((item.score / maxScore) * 100);
                                            return (
                                                <tr key={idx} className={`${item.recommended ? 'bg-pink-50/40' : 'bg-white'} hover:bg-slate-50 transition-colors`}>
                                                    <td className="px-4 py-3 font-medium text-slate-900">
                                                        <div className="flex items-center gap-2">
                                                            {item.canal}
                                                            {item.recommended && <span className="text-[9px] bg-pink-100 text-pink-700 px-1.5 py-0.5 rounded font-bold">{t('recommended')}</span>}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-center text-slate-600">{item.impact}</td>
                                                    <td className="px-4 py-3 text-center text-slate-600">{item.cost}</td>
                                                    <td className="px-4 py-3 text-center text-slate-600">{item.effort}</td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                                                                <div className="h-1.5 rounded-full bg-pink-500 transition-all" style={{ width: `${barWidth}%` }}></div>
                                                            </div>
                                                            <span className={`font-bold text-sm w-8 text-right ${item.recommended ? 'text-pink-600' : 'text-slate-500'}`}>{item.score}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        {item.budgetPct ? <span className="text-sm font-semibold text-slate-700">{item.budgetPct}%</span> : '—'}
                                                    </td>
                                                    <td className="px-4 py-3 text-[11px] text-slate-500 max-w-[180px]">{item.rationale || '—'}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- TAB: COMPETITIVE MAP --- */}
            {activeTab === 'competitive' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                        <div className="flex items-center gap-2 mb-6">
                            <Map className="w-5 h-5 text-indigo-600" />
                            <h3 className="font-bold text-slate-800 text-sm">{t('competitive.title')}</h3>
                        </div>

                        {competitiveMap.length === 0 ? (
                            <div className="text-center py-12">
                                <Crosshair className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                                <p className="text-slate-400 text-sm">{t('competitive.noData')}</p>
                                <p className="text-slate-300 text-xs mt-1">{t('competitive.hint')}</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* 2x2 Positioning Map */}
                                <div className="relative bg-slate-50 rounded-xl border border-slate-200 overflow-hidden" style={{ height: '380px' }}>
                                    {/* Axis labels */}
                                    <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('competitive.highValue')}</div>
                                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('competitive.lowValue')}</div>
                                    <div className="absolute left-2 top-1/2 -translate-y-1/2 -rotate-90 text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('competitive.highPrice')}</div>
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 rotate-90 text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('competitive.lowPrice')}</div>

                                    {/* Quadrant lines */}
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <div className="absolute top-0 bottom-0 left-1/2 w-px bg-slate-200"></div>
                                        <div className="absolute left-0 right-0 top-1/2 h-px bg-slate-200"></div>
                                    </div>

                                    {/* Quadrant labels */}
                                    <div className="absolute top-8 right-8 text-[9px] text-slate-300 font-semibold">PREMIUM</div>
                                    <div className="absolute top-8 left-8 text-[9px] text-slate-300 font-semibold">OVERPRICED</div>
                                    <div className="absolute bottom-8 right-8 text-[9px] text-slate-300 font-semibold">VALUE</div>
                                    <div className="absolute bottom-8 left-8 text-[9px] text-slate-300 font-semibold">BUDGET</div>

                                    {/* Competitors */}
                                    {competitiveMap.map((comp: any, idx: number) => {
                                        // x = price (0-100), y = value (0-100) → convert to CSS positions
                                        const xPct = 100 - (comp.price || 50); // invert: left=high price, right=low price
                                        const yPct = 100 - (comp.value || 50); // invert: top=high value, bottom=low value
                                        const isUs = comp.isUs || comp.name?.toLowerCase().includes('our') || idx === 0;
                                        return (
                                            <div
                                                key={idx}
                                                className="absolute group"
                                                style={{ left: `${xPct}%`, top: `${yPct}%`, transform: 'translate(-50%,-50%)' }}
                                            >
                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all group-hover:scale-125 cursor-pointer shadow-sm ${isUs
                                                    ? 'bg-pink-600 border-pink-700'
                                                    : 'bg-slate-600 border-slate-700'
                                                    }`}>
                                                    {isUs && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                                </div>
                                                {/* Tooltip */}
                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none">
                                                    <div className="font-bold">{comp.name}</div>
                                                    {comp.strength && <div className="text-slate-300">{comp.strength}</div>}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Competitor Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {competitiveMap.map((comp: any, idx: number) => {
                                        const isUs = comp.isUs || idx === 0;
                                        return (
                                            <div key={idx} className={`p-4 rounded-xl border ${isUs ? 'bg-pink-50 border-pink-200' : 'bg-white border-slate-100'} shadow-sm`}>
                                                <div className="flex items-start justify-between mb-2">
                                                    <div className="font-bold text-slate-800 text-sm">{comp.name}</div>
                                                    {isUs && <span className="text-[9px] bg-pink-600 text-white px-1.5 py-0.5 rounded font-bold">US</span>}
                                                </div>
                                                {comp.strength && (
                                                    <div className="flex items-start gap-1 text-xs text-green-700 mb-1">
                                                        <ArrowUpRight className="w-3 h-3 mt-0.5 shrink-0" />
                                                        {comp.strength}
                                                    </div>
                                                )}
                                                {comp.weakness && (
                                                    <div className="flex items-start gap-1 text-xs text-red-600 mb-1">
                                                        <ArrowDownRight className="w-3 h-3 mt-0.5 shrink-0" />
                                                        {comp.weakness}
                                                    </div>
                                                )}
                                                {comp.differentiation && (
                                                    <p className="text-[10px] text-slate-500 italic mt-2">{comp.differentiation}</p>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

        </div>
    );
};

export default MarketingManagerDashboard;
