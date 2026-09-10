import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { useTranslation } from 'react-i18next';
import { RoleConfig } from '../types/roles';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { SmartDiagram } from './SmartDiagram';
import { parseJSON } from '../utils/outputParser';

// Role dashboards are lazy-loaded: each dashboard + its deps only downloads
// when the user views results for that specific role (~300 KB deferred).
const UniversalRoleDashboard = React.lazy(() =>
    import('./dashboard/UniversalRoleDashboard').then(m => ({ default: m.UniversalRoleDashboard }))
);
const PlanningDashboard = React.lazy(() => import('./PlanningDashboard'));
const ProductManagerDashboard = React.lazy(() =>
    import('./dashboard/ProductManagerDashboard').then(m => ({ default: m.ProductManagerDashboard }))
);
const MarketingManagerDashboard = React.lazy(() => import('./dashboard/MarketingManagerDashboard'));
const QAEngineerDashboard = React.lazy(() => import('./dashboard/QAEngineerDashboard'));
const StrategyAnalystDashboard = React.lazy(() => import('./dashboard/StrategyAnalystDashboard'));
const UXDesignerDashboard = React.lazy(() =>
    import('./dashboard/UXDesignerDashboard').then(m => ({ default: m.UXDesignerDashboard }))
);

const DashboardLoader = () => (
    <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
    </div>
);
import { UniversalDashboardSchema, DashboardTab, DashboardKPI } from '../types/universalDashboard';
import { cn } from '../lib/utils';
import { ChevronRight, ArrowRight, LayoutDashboard, BarChart3, FileText, Globe, Maximize2, X, ExternalLink, Monitor } from 'lucide-react';

// ─── Prototype Viewer Card ─────────────────────────────────────────────────────
const PrototypeCard = ({ html }: { html: string }) => {
    const [blobUrl, setBlobUrl] = useState<string | null>(null);
    const [fullscreen, setFullscreen] = useState(false);
    const [iframeLoaded, setIframeLoaded] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);

    // Lazy-mount the iframe only when scrolled into view → prevents main-page CLS/LCP hit
    useEffect(() => {
        const el = cardRef.current;
        if (!el) return;
        const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { rootMargin: '200px' });
        obs.observe(el);
        return () => obs.disconnect();
    }, []);

    useEffect(() => {
        if (!visible) return;
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        setBlobUrl(url);
        return () => { URL.revokeObjectURL(url); };
    }, [html, visible]);

    const openNewTab = () => { if (blobUrl) window.open(blobUrl, '_blank'); };

    return (
        <>
            <div ref={cardRef} className="my-6 rounded-2xl overflow-hidden border border-slate-200 shadow-xl bg-white">
                {/* Toolbar */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                        <div className="flex gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-red-400" />
                            <div className="w-3 h-3 rounded-full bg-amber-400" />
                            <div className="w-3 h-3 rounded-full bg-emerald-400" />
                        </div>
                        <span className="text-xs text-slate-400 font-medium ml-2 flex items-center gap-1.5">
                            <Monitor size={11} />
                            Interactive Prototype
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setFullscreen(true)}
                            className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 transition-colors shadow-sm"
                        >
                            <Maximize2 size={11} />
                            Expand
                        </button>
                        <button
                            onClick={openNewTab}
                            className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm"
                        >
                            <ExternalLink size={11} />
                            Open
                        </button>
                    </div>
                </div>
                {/* Mini preview — fixed height prevents CLS; skeleton until loaded */}
                <div className="relative w-full bg-slate-50" style={{ height: '420px' }}>
                    {!iframeLoaded && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-50">
                            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                            <span className="text-xs text-slate-400 font-medium">Loading prototype…</span>
                        </div>
                    )}
                    {blobUrl && (
                        <iframe
                            src={blobUrl}
                            className={cn("w-full h-full border-0 transition-opacity duration-300", iframeLoaded ? 'opacity-100' : 'opacity-0')}
                            title="Prototype Preview"
                            sandbox="allow-scripts allow-same-origin"
                            onLoad={() => setIframeLoaded(true)}
                        />
                    )}
                </div>
            </div>

            {/* Fullscreen modal */}
            {fullscreen && blobUrl && (
                <div className="fixed inset-0 z-[200] bg-black flex flex-col">
                    <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-700 shrink-0">
                        <div className="flex items-center gap-2 text-slate-300 text-sm font-medium">
                            <Globe size={14} className="text-indigo-400" />
                            Interactive Prototype — Full Screen
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={openNewTab}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white border border-slate-600 hover:border-slate-400 transition-colors"
                            >
                                <ExternalLink size={11} />
                                New Tab
                            </button>
                            <button
                                onClick={() => setFullscreen(false)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>
                    <iframe
                        src={blobUrl}
                        className="flex-1 border-0 w-full"
                        title="Prototype Fullscreen"
                        sandbox="allow-scripts allow-same-origin"
                    />
                </div>
            )}
        </>
    );
};

interface RichContentRendererProps {
    content: any;
    docConfig?: RoleConfig['docConfig'];
    projectId?: string;
    roleId?: string;
    savedAnswers?: Record<string, string>;
    onConvertToMaster?: (node: any, subDiagram?: any) => void;
    methodology?: 'agile' | 'pmo' | 'hybrid';
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

// --- VISUALIZATION HELPERS ---
const FinancialCard = ({ title, value, subtext, color, icon }: { title: string, value: string, subtext?: string, color: string, icon?: React.ReactNode }) => (
    <div className="bg-slate-900/40 p-5 rounded-2xl border border-white/5 shadow-lg relative overflow-hidden group hover:border-white/10 transition-all duration-300 backdrop-blur-sm">
        <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: color }}></div>
        <div className="flex justify-between items-start mb-2">
            <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500 group-hover:text-slate-400">{title}</p>
            {icon && <div className="text-slate-600 group-hover:text-slate-400 transition-colors">{icon}</div>}
        </div>
        <p className="text-3xl font-bold text-slate-200 tracking-tight" style={{ color: color }}>{value}</p>
        {subtext && <p className="text-xs text-slate-500 mt-2 font-medium">{subtext}</p>}
    </div>
);

const SwotCard = ({ title, items, type }: { title: string, items: string[], type: 'S' | 'W' | 'O' | 'T' }) => {
    const styles = {
        S: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-300', title: 'text-emerald-400', icon: 'bg-emerald-500/20 text-emerald-400' },
        W: { bg: 'bg-rose-500/10', border: 'border-rose-500/20', text: 'text-rose-300', title: 'text-rose-400', icon: 'bg-rose-500/20 text-rose-400' },
        O: { bg: 'bg-sky-500/10', border: 'border-sky-500/20', text: 'text-sky-300', title: 'text-sky-400', icon: 'bg-sky-500/20 text-sky-400' },
        T: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-300', title: 'text-amber-400', icon: 'bg-amber-500/20 text-amber-400' }
    };
    const s = styles[type];

    return (
        <div className={`p-6 rounded-2xl border ${s.bg} ${s.border} h-full shadow-lg backdrop-blur-sm`}>
            <div className="flex items-center gap-3 mb-4">
                <div className={`w-8 h-8 rounded-lg ${s.icon} flex items-center justify-center font-bold shadow-inner`}>
                    {type}
                </div>
                <h4 className={`font-bold text-lg ${s.title}`}>{title}</h4>
            </div>
            <ul className="space-y-3">
                {items.map((item, idx) => (
                    <li key={idx} className={`text-sm flex gap-3 items-start ${s.text}`}>
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-current opacity-60 shrink-0" />
                        <span className="leading-relaxed font-medium opacity-90">{item}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
};

const TowsQuadrant = ({ title, items, colorClass, badge }: { title: string, items: string[], colorClass: string, badge: string }) => (
    <div className={`p-6 rounded-2xl border ${colorClass} h-full shadow-lg backdrop-blur-sm relative overflow-hidden group hover:bg-opacity-80 transition-all`}>
        <div className="absolute top-0 right-0 px-3 py-1 bg-black/20 backdrop-blur-sm rounded-bl-xl text-[10px] font-bold uppercase tracking-wider opacity-70 text-white">
            {badge}
        </div>
        <h4 className="font-bold text-sm mb-4 uppercase tracking-wide opacity-90 flex items-center gap-2 text-white">
            {title}
        </h4>
        <ul className="space-y-3">
            {items.map((item, idx) => (
                <li key={idx} className="text-sm flex gap-3 items-start text-white/80">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-current opacity-60 shrink-0" />
                    <span className="leading-relaxed">{item}</span>
                </li>
            ))}
        </ul>
    </div>
);

const ConfidenceBanner = ({ score, decision }: { score: number, decision: string }) => {
    const { t } = useTranslation('translation');
    let bgClass = 'bg-red-900/20 border-red-500/20 text-red-400';
    let barColor = 'bg-red-500';
    let label = t('businessAnalyst.highRisk');

    if (score >= 80) {
        bgClass = 'bg-emerald-900/20 border-emerald-500/20 text-emerald-400';
        barColor = 'bg-emerald-500';
        label = t('businessAnalyst.strongViability');
    } else if (score >= 50) {
        bgClass = 'bg-amber-900/20 border-amber-500/20 text-amber-400';
        barColor = 'bg-amber-500';
        label = t('businessAnalyst.moderateViability');
    }

    return (
        <div className={`w-full p-6 rounded-2xl border ${bgClass} mb-8 shadow-lg relative overflow-hidden`}>
            <div className={`absolute top-0 left-0 w-2 h-full ${barColor} shadow-[0_0_15px_rgba(0,0,0,0.5)]`}></div>
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="text-center md:text-left">
                    <h2 className="text-3xl font-bold tracking-tight mb-1 text-white">{decision}</h2>
                    <p className="text-sm font-medium opacity-80 uppercase tracking-wider">{label}</p>
                </div>
                <div className="flex items-center gap-4 bg-slate-900/40 px-6 py-3 rounded-xl backdrop-blur-sm border border-white/5">
                    <div className="text-right">
                        <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">{t('businessAnalyst.confidenceScore')}</span>
                        <span className="text-2xl font-black text-white">{score}%</span>
                    </div>
                    <div className="w-12 h-12 rounded-full border-4 border-current opacity-80 flex items-center justify-center text-xs font-bold text-white relative">
                        {score}
                        <div className="absolute inset-0 rounded-full bg-current opacity-10 animate-pulse"></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const RequirementCard = ({ req }: { req: any }) => {
    const { t } = useTranslation('translation');
    const priorityColors: any = {
        'Critical': 'bg-red-500/10 text-red-400 border-red-500/20',
        'High': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
        'Medium': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        'Low': 'bg-slate-500/10 text-slate-400 border-slate-500/20'
    };
    const pColor = priorityColors[req.priority] || priorityColors['Medium'];

    return (
        <div className="bg-slate-900/40 p-5 rounded-xl border border-white/5 shadow-md hover:border-white/10 transition-all duration-200 group">
            <div className="flex justify-between items-start mb-3">
                <span className="font-mono text-xs font-bold text-slate-400 bg-slate-800 px-2 py-1 rounded border border-white/5">{req.id}</span>
                <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full border ${pColor}`}>
                    {req.priority}
                </span>
            </div>
            <p className="text-slate-300 font-medium leading-relaxed mb-3">{req.description}</p>
            <div className="flex gap-4 text-xs text-slate-500">
                {req.source && <span>{t('businessAnalyst.source')}: {req.source}</span>}
                {req.category && <span>{t('businessAnalyst.category')}: {req.category}</span>}
            </div>
        </div>
    );
};

const UserStoryCard = ({ story }: { story: any }) => {
    const { t } = useTranslation('translation');
    return (
        <div className="bg-slate-900/40 rounded-xl border border-white/5 shadow-md overflow-hidden hover:border-white/10 transition-all duration-200">
            <div className="bg-slate-950/50 px-6 py-4 border-b border-white/5 flex justify-between items-center">
                <h4 className="font-bold text-indigo-400 text-lg">{story.id}</h4>
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{t('businessAnalyst.userStory')}</span>
            </div>
            <div className="p-6">
                <div className="text-lg text-slate-200 font-medium mb-6 leading-relaxed space-y-3">
                    {story.asA && story.iWant && story.soThat ? (
                        <>
                            <div className="flex gap-2">
                                <span className="font-bold text-indigo-400 min-w-[60px]">Como</span>
                                <span className="text-slate-300">{story.asA}</span>
                            </div>
                            <div className="flex gap-2">
                                <span className="font-bold text-indigo-400 min-w-[60px]">Quiero</span>
                                <span className="text-slate-300">{story.iWant}</span>
                            </div>
                            <div className="flex gap-2">
                                <span className="font-bold text-indigo-400 min-w-[60px]">Para</span>
                                <span className="text-slate-300">{story.soThat}</span>
                            </div>
                        </>
                    ) : (
                        story.title || story.description
                    )}
                </div>

                <div className="bg-slate-950/30 rounded-xl p-5 border border-white/5">
                    <h5 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                        {t('businessAnalyst.acceptanceCriteria')}
                    </h5>
                    <ul className="space-y-3">
                        {story.acceptanceCriteria && story.acceptanceCriteria.map((criteria: string, idx: number) => (
                            <li key={idx} className="text-sm flex gap-3 items-start text-slate-400">
                                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500/50 shrink-0" />
                                <span className="leading-relaxed">{criteria}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export const RichContentRenderer: React.FC<RichContentRendererProps> = ({ content, docConfig, projectId, roleId, savedAnswers, onConvertToMaster, methodology }) => {
    const { t } = useTranslation('translation');

    // AI Output Normalization Helper — ROBUST JSON VALIDATION
    const getEffectiveData = (input: any) => {
        if (typeof input !== 'string') return input;

        const parsed = parseJSON(input);
        if (parsed && typeof parsed === 'object') {
            return parsed;
        }

        // Fallback: if JSON parsing fails, return string as-is
        // Dashboard will handle gracefully and show error state
        console.warn('[RichContentRenderer] Failed to parse JSON for role:', roleId);
        return input;
    };

    const effectiveContent = getEffectiveData(content);

    // Special handling for Product Manager Role (New Modular Dashboard)

    if (roleId === 'product-manager') {
        return (
            <React.Suspense fallback={<DashboardLoader />}>
                <ProductManagerDashboard
                    data={effectiveContent}
                    projectId={projectId}
                    roleId={roleId}
                    savedAnswers={savedAnswers}
                    onConvertToMaster={onConvertToMaster}
                />
            </React.Suspense>
        );
    }

    // Special handling for Marketing Manager Role (CMO Command Center)
    if (roleId === 'marketing-manager') {
        const marketingData = effectiveContent?.dashboard || effectiveContent;
        return (
            <React.Suspense fallback={<DashboardLoader />}>
                <MarketingManagerDashboard
                    data={marketingData}
                    projectId={projectId}
                    roleId={roleId}
                    onConvertToMaster={onConvertToMaster}
                />
            </React.Suspense>
        );
    }

    // Special handling for QA Engineer Role (Master Quality Hub)
    if (roleId === 'qa-engineer') {
        const qaData = effectiveContent?.dashboard || effectiveContent;
        return (
            <React.Suspense fallback={<DashboardLoader />}>
                <QAEngineerDashboard
                    data={qaData}
                    projectId={projectId}
                    roleId={roleId}
                    onConvertToMaster={onConvertToMaster}
                />
            </React.Suspense>
        );
    }

    // Special handling for Strategy Analyst Role (Strategic Command Center)
    if (roleId === 'strategy-analyst') {
        return (
            <React.Suspense fallback={<DashboardLoader />}>
                <StrategyAnalystDashboard
                    data={effectiveContent}
                    projectId={projectId}
                    roleId={roleId}
                    onConvertToMaster={onConvertToMaster}
                />
            </React.Suspense>
        );
    }

    // Special handling for UX Designer Role (Design System Command Center)
    if (roleId === 'ux-designer') {
        return (
            <React.Suspense fallback={<DashboardLoader />}>
                <UXDesignerDashboard
                    data={effectiveContent}
                    projectId={projectId}
                    roleId={roleId}
                />
            </React.Suspense>
        );
    }

    // Helper to normalize data for the dashboard
    const normalizeDashboardData = (data: any) => {
        if (!data || typeof data !== 'object') return null;

        // Check if this looks like a project plan (has phases or resources)
        const hasPhases = data.projectPhases || data.Phases || data.phases || data.Project_Phases;
        const hasResources = data.resources || data.Resources || data.Team_Composition || data.teamComposition;

        if (!hasPhases && !hasResources) return null;

        // Normalize Phases to ensure tasks exist
        const rawPhases = Array.isArray(hasPhases) ? hasPhases : [];
        const normalizedPhases = rawPhases.map((phase: any) => ({
            ...phase,
            tasks: Array.isArray(phase.tasks) ? phase.tasks : (Array.isArray(phase.Tasks) ? phase.Tasks : [])
        }));

        // Normalize agileData if present (Fase 2 — AI-generated Agile content)
        const rawAgile = data.agileData || data.agile_data || data.AgileData;
        const agileData = rawAgile && Array.isArray(rawAgile.sprints) ? rawAgile : undefined;

        // Map to expected schema
        return {
            summary: data.summary || data.Project_summary || data.Executive_Summary || data.projectSummary || '',
            resources: Array.isArray(hasResources) ? hasResources : [],
            techStack: data.techStack || data.Tech_Stack || data.Technical_Architecture || data.architecture || {},
            projectPhases: normalizedPhases,
            agileData
        };
    };

    // Helper to normalize Universal Dashboard Data (Handle missing root 'dashboard' key)
    const normalizeUniversalData = (data: any): UniversalDashboardSchema | null => {
        if (!data || typeof data !== 'object') return null;

        // CRITICAL: Unwrap nested data (e.g., { product_analysis: { ... } })
        // Check if data has exactly one key and that key's value is an object (NOT an array)
        const keys = Object.keys(data);
        if (keys.length === 1 || keys.length === 2 && keys.includes('excel_data')) {
            const mainKey = keys.find(k => k !== 'excel_data');
            if (mainKey && typeof data[mainKey] === 'object' && data[mainKey] !== null && !Array.isArray(data[mainKey])) {
                data = data[mainKey]; // Unwrap!
            }
        }

        // Case 1: Already has root 'dashboard' key
        if (data.dashboard) return data.dashboard;

        // Case 2: Flat structure (has summary, kpis, or tabs at root)
        if (data.summary || data.kpis || data.tabs) {
            return {
                summary: data.summary || '',
                kpis: Array.isArray(data.kpis) ? data.kpis : [],
                tabs: Array.isArray(data.tabs) ? data.tabs : []
            };
        }

        // Case 3: Product Manager Specific (Aggressive Normalization)
        // CRITICAL: Use case-insensitive key detection
        const hasProductVision = Object.keys(data).some(k => k.toLowerCase().includes('productvision') || k.toLowerCase().includes('product_vision'));
        const hasSuccessMetrics = Object.keys(data).some(k => k.toLowerCase().includes('successmetrics') || k.toLowerCase().includes('success_metrics'));
        const hasKeyFeatures = Object.keys(data).some(k => k.toLowerCase().includes('keyfeatures') || k.toLowerCase().includes('key_features') || k.toLowerCase().includes('mvp'));
        const hasTargetAudience = Object.keys(data).some(k => k.toLowerCase().includes('targetaudience') || k.toLowerCase().includes('target_audience'));

        if (hasProductVision || hasSuccessMetrics || hasKeyFeatures || hasTargetAudience) {
            // Helper to find key case-insensitively
            const findKey = (patterns: string[]) => {
                for (const pattern of patterns) {
                    const key = Object.keys(data).find(k => k.toLowerCase().includes(pattern.toLowerCase()));
                    if (key) return data[key];
                }
                return null;
            };

            const tabs: DashboardTab[] = [];

            // 1. Discovery Tab (Interactive Questions)
            const discoveryQuestions = findKey(['DiscoveryQuestions', 'discovery_questions', 'questions']);
            if (discoveryQuestions) {
                tabs.push({
                    id: 'discovery',
                    label: 'Discovery',
                    type: 'interactive-questions' as const,
                    icon: 'MessageSquare',
                    data: discoveryQuestions
                });
            }

            // 2. Details Tab (Markdown)
            let markdownContent = '';
            const productVision = findKey(['ProductVision', 'product_vision']);
            if (productVision) markdownContent += `### Product Vision\n${productVision}\n\n`;

            const targetAudience = findKey(['TargetAudience', 'target_audience']);
            if (targetAudience) {
                markdownContent += `### Target Audience\n`;
                if (Array.isArray(targetAudience)) {
                    targetAudience.forEach((s: any) => markdownContent += `- **${s.segment || s.name}**: ${s.description}\n`);
                } else if (typeof targetAudience === 'object') {
                    Object.entries(targetAudience).forEach(([key, value]: [string, any]) => {
                        markdownContent += `#### ${key}\n`;
                        if (Array.isArray(value)) {
                            value.forEach((v: any) => markdownContent += `- ${v.description || v}\n`);
                        } else if (typeof value === 'string') {
                            markdownContent += `${value}\n`;
                        } else {
                            markdownContent += JSON.stringify(value) + '\n';
                        }
                        markdownContent += '\n';
                    });
                } else {
                    markdownContent += JSON.stringify(targetAudience, null, 2) + '\n';
                }
                markdownContent += '\n';
            }

            const keyFeatures = findKey(['KeyFeaturesMVP', 'KeyFeaturesForMVP', 'key_features', 'mvp_key_features', 'mvp_features']);
            if (keyFeatures) {
                markdownContent += `### Key Features (MVP)\n`;
                if (Array.isArray(keyFeatures)) {
                    keyFeatures.forEach((f: any) => markdownContent += `- **${f.feature || f.featureName || f.name}**: ${f.description}\n`);
                } else {
                    markdownContent += JSON.stringify(keyFeatures, null, 2) + '\n';
                }
                markdownContent += '\n';
            }

            tabs.push({
                id: 'details',
                label: 'Product Details',
                type: 'markdown' as const,
                icon: 'FileText',
                data: markdownContent
            });

            // 3. KPIs from Success Metrics
            const kpis: DashboardKPI[] = [];
            const successMetrics = findKey(['SuccessMetrics', 'success_metrics', 'metrics']);

            if (successMetrics) {
                if (Array.isArray(successMetrics)) {
                    // Handle array of metric objects
                    successMetrics.slice(0, 4).forEach((m: any) => {
                        // Try to find label and value using various common keys
                        const label = m.metric || m.name || m.label || m.kpi || m.indicator || m.measure || 'Metric';
                        const value = m.value || m.target || m.goal || m.score || m.result || 'TBD';

                        kpis.push({
                            label: String(label),
                            value: String(value),
                            trend: 'neutral' as const,
                            color: 'indigo' as const,
                            icon: 'TrendingUp'
                        });
                    });
                } else if (typeof successMetrics === 'object') {
                    // Handle object with key-value pairs
                    Object.entries(successMetrics).slice(0, 4).forEach(([key, value]: [string, any]) => {
                        // If value is an object, try to extract specific fields, otherwise use the value directly
                        let finalValue = 'TBD';
                        if (typeof value === 'object' && value !== null) {
                            const v: any = value;
                            finalValue = v.value || v.target || v.goal || v.score || v.result || JSON.stringify(value);
                        } else {
                            finalValue = String(value);
                        }

                        kpis.push({
                            label: key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim(),
                            value: finalValue,
                            trend: 'neutral' as const,
                            color: 'indigo' as const,
                            icon: 'TrendingUp'
                        });
                    });
                }
            }

            // Fallback: Create default KPIs if none found
            if (kpis.length === 0) {
                kpis.push(
                    { label: 'MVP Confidence', value: '85%', trend: 'up' as const, color: 'emerald' as const, icon: 'TrendingUp' },
                    { label: 'Time to Market', value: '3-6 months', trend: 'neutral' as const, color: 'blue' as const, icon: 'Clock' },
                    { label: 'Target Reach', value: 'High', trend: 'up' as const, color: 'purple' as const, icon: 'Globe' }
                );
            }

            return {
                summary: typeof productVision === 'string' ? productVision : 'Product Strategy & Vision',
                kpis: kpis,
                tabs: tabs
            };
        }

        return null;
    };

    // Helper to render sections
    const renderSection = (key: string, value: any, depth: number = 0) => {
        // 1. SWOT Analysis (2x2 Grid)
        if (key === 'swotAnalysis' && typeof value === 'object') {
            return (
                <div key={key} className="my-10 ppt-capture-target" data-title="SWOT Analysis">
                    <h3 className="text-2xl font-bold text-slate-200 mb-6 flex items-center gap-3">
                        <span className="w-2 h-8 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]"></span>
                        {t('businessAnalyst.swot')}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <SwotCard title={t('businessAnalyst.strengths')} items={value.strengths || []} type="S" />
                        <SwotCard title={t('businessAnalyst.weaknesses')} items={value.weaknesses || []} type="W" />
                        <SwotCard title={t('businessAnalyst.opportunities')} items={value.opportunities || []} type="O" />
                        <SwotCard title={t('businessAnalyst.threats')} items={value.threats || []} type="T" />
                    </div>
                </div>
            );
        }

        // 2. TOWS Matrix (2x2 Grid)
        if (key === 'towsMatrix') {
            return (
                <div key={key} className="my-10 ppt-capture-target" data-title="TOWS Matrix">
                    <h3 className="text-2xl font-bold text-slate-200 mb-6 flex items-center gap-3">
                        <span className="w-2 h-8 bg-purple-500 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)]"></span>
                        {t('businessAnalyst.tows')}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <TowsQuadrant title="SO Strategies (Maxi-Maxi)" items={value.strategies_FO || []} colorClass="bg-emerald-900/10 border-emerald-500/20 text-emerald-300" badge="Growth" />
                        <TowsQuadrant title="WO Strategies (Mini-Maxi)" items={value.strategies_DO || []} colorClass="bg-blue-900/10 border-blue-500/20 text-blue-300" badge="Development" />
                        <TowsQuadrant title="ST Strategies (Maxi-Mini)" items={value.strategies_FA || []} colorClass="bg-amber-900/10 border-amber-500/20 text-amber-300" badge="Defense" />
                        <TowsQuadrant title="WT Strategies (Mini-Mini)" items={value.strategies_DA || []} colorClass="bg-rose-900/10 border-rose-500/20 text-rose-300" badge="Survival" />
                    </div>
                </div>
            );
        }

        // 3. Financial Simulation (Premium Cards)
        if (key === 'financialSimulation') {
            return (
                <div key={key} className="my-10 bg-slate-900/40 p-8 rounded-[2rem] border border-white/5 ppt-capture-target shadow-lg backdrop-blur-sm" data-title="Financial Simulation">

                    <ConfidenceBanner score={value.confidenceScore} decision={value.criticalPhrase?.split('.')[0] || 'Analysis Complete'} />

                    <div className="mb-8">
                        <h3 className="text-2xl font-bold text-slate-200">{t('businessAnalyst.financialViability')}</h3>
                        <p className="text-slate-400 text-sm mt-1">AI-Projected Unit Economics & Projections</p>
                    </div>

                    <div className="bg-slate-900/60 p-6 rounded-xl border border-indigo-500/20 shadow-lg mb-8 relative overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500"></div>
                        <p className="text-slate-300 italic text-lg leading-relaxed">
                            "{value.criticalPhrase}"
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-4">
                        <FinancialCard title="Est. CAC" value={`$${value.CAC}`} subtext="Cost per Acquisition" color="#3b82f6" />
                        <FinancialCard title="Est. LTV" value={`$${value.LTV}`} subtext="Lifetime Value" color="#10b981" />
                        <FinancialCard title="Breakeven" value={`${value.breakevenPointMonths} mo`} subtext="Time to Profit" color="#f59e0b" />
                        <FinancialCard title="Target Vol" value={value.monthlyClientsNeeded} subtext="Monthly Clients Needed" color="#6366f1" />
                    </div>
                </div>
            );
        }

        // 3.5 Market Size Analysis
        const isMarketSizeArray = Array.isArray(value) && value.length > 0 && (value[0].year !== undefined || value[0].sizeUSD !== undefined);
        const isMarketSizeObject = value?.projection && Array.isArray(value.projection);

        if (key === 'marketSizeAnalysis' && (isMarketSizeArray || isMarketSizeObject)) {
            const chartData = isMarketSizeArray ? value : value.projection;

            return (
                <div key={key} className="my-10 bg-slate-900/40 p-6 rounded-2xl border border-white/5 shadow-lg ppt-capture-target" data-title="Market Size Analysis">
                    <h3 className="text-xl font-bold text-slate-200 mb-2 flex items-center gap-3">
                        <div className="w-1.5 h-8 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                        {t('businessAnalyst.marketSize')}
                    </h3>
                    {value.marketSizeSourceNote && <p className="text-sm text-slate-400 mb-6 italic">{value.marketSizeSourceNote}</p>}

                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                                <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} tickFormatter={(value) => `$${(value / 1000000).toFixed(0)}M`} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', border: '1px solid #334155', boxShadow: '0 4px 20px -4px rgba(0,0,0,0.5)', color: '#e2e8f0' }}
                                    cursor={{ fill: '#334155' }}
                                    formatter={(value: any) => [`$${Number(value).toLocaleString()}`, 'Market Size (USD)']}
                                />
                                <Legend wrapperStyle={{ color: '#94a3b8' }} />
                                <Bar dataKey="sizeUSD" name="Market Size (USD)" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={50} />
                                {/* Fallback for older data structure using sizeMillionsUSD */}
                                <Bar dataKey="sizeMillionsUSD" name="Market Size (M USD)" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={50} hide={true} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            );
        }

        // 3.6 Annual Projections (New Request)
        const isAnnualProjections = (key.toLowerCase().includes('annualprojections') || key.toLowerCase().includes('marketprojections')) && Array.isArray(value) && value.length > 0;

        if (isAnnualProjections) {
            return (
                <div key={key} className="my-10 bg-slate-900/40 p-6 rounded-2xl border border-white/5 shadow-lg ppt-capture-target" data-title="Annual Projections">
                    <h3 className="text-xl font-bold text-slate-200 mb-6 flex items-center gap-3">
                        <div className="w-1.5 h-8 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                    </h3>

                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={value} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                                <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8' }}
                                    tickFormatter={(val) => {
                                        if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
                                        if (val >= 1000) return `$${(val / 1000).toFixed(0)}k`;
                                        return `$${val}`;
                                    }}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', border: '1px solid #334155', boxShadow: '0 4px 20px -4px rgba(0,0,0,0.5)', color: '#e2e8f0' }}
                                    cursor={{ fill: '#334155' }}
                                    formatter={(val: any, name: string, props: any) => {
                                        const formattedVal = val >= 1000000 ? `$${(Number(val) / 1000000).toFixed(2)}M` : `$${Number(val).toLocaleString()}`;
                                        const growth = props.payload.growthRate ? ` (Growth: ${props.payload.growthRate})` : '';
                                        return [formattedVal + growth, 'Revenue Projection'];
                                    }}
                                />
                                <Legend wrapperStyle={{ color: '#94a3b8' }} />
                                <Bar
                                    dataKey="sizeUSD"
                                    name="Projected Revenue (USD)"
                                    fill="#6366f1"
                                    radius={[4, 4, 0, 0]}
                                    barSize={50}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            );
        }

        // 3.6 Charts
        if (key === 'charts' && docConfig?.charts && Array.isArray(value)) {
            return (
                <div key={key} className="my-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {value.map((chart: any, idx: number) => (
                        <div key={idx} className="bg-slate-900/40 p-4 rounded-xl border border-white/5 shadow-md ppt-capture-target" data-title={chart.title || `Chart ${idx + 1}`}>
                            <h4 className="text-sm font-bold text-slate-300 mb-4 text-center">{chart.title}</h4>
                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    {chart.type === 'pie' ? (
                                        <PieChart>
                                            <Pie
                                                data={chart.data}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                outerRadius={80}
                                                fill="#8884d8"
                                                dataKey="value"
                                                nameKey="name"
                                                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                                            >
                                                {chart.data.map((_: any, index: number) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#e2e8f0' }} />
                                        </PieChart>
                                    ) : (
                                        <BarChart data={chart.data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                                            <XAxis dataKey="name" tick={{ fill: '#94a3b8' }} />
                                            <YAxis tick={{ fill: '#94a3b8' }} />
                                            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#e2e8f0' }} />
                                            <Legend wrapperStyle={{ color: '#94a3b8' }} />
                                            <Bar dataKey="value" fill="#3b82f6" />
                                        </BarChart>
                                    )}
                                </ResponsiveContainer>
                            </div>
                            <p className="text-xs text-slate-500 mt-2 text-center">{chart.description}</p>
                        </div>
                    ))}
                </div>
            );
        }

        // 3. Confidence Score Banner (Fallback)
        if (key === 'confidenceScore') {
            return null;
        }

        // 4. Requirements List
        if (key === 'requirements' && Array.isArray(value)) {
            return (
                <div key={key} className="my-8 ppt-capture-target" data-title="Requirements">
                    <h3 className="text-xl font-bold text-slate-200 mb-4 flex items-center gap-2">
                        <span className="w-1.5 h-6 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"></span>
                        {t('businessAnalyst.requirements')}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {value.map((req: any, idx: number) => (
                            <RequirementCard key={idx} req={req} />
                        ))}
                    </div>
                </div>
            );
        }

        // 5. User Stories
        if (key === 'userStories' && Array.isArray(value)) {
            return (
                <div key={key} className="my-8 ppt-capture-target" data-title="User Stories">
                    <h3 className="text-xl font-bold text-slate-200 mb-4 flex items-center gap-2">
                        <span className="w-1.5 h-6 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]"></span>
                        {t('businessAnalyst.userStories') || 'Historias de Usuario'}
                    </h3>
                    <div className="space-y-6">
                        {value.map((story: any, idx: number) => (
                            <UserStoryCard key={idx} story={story} />
                        ))}
                    </div>
                </div>
            );
        }

        // 6. Diagrams (ReactFlow)
        if ((key === 'diagrams' || key === 'flowcharts' || key === 'architecture') && Array.isArray(value)) {
            return (
                <div key={key} className="my-8 space-y-8">
                    {value.map((diagram: any, idx: number) => {
                        const diagramData = typeof diagram === 'string' ? diagram : diagram.code || diagram;
                        return (
                            <SmartDiagram
                                key={idx}
                                data={diagramData}
                                title={diagram.title || 'Diagram'}
                                description={diagram.description}
                                className="ppt-capture-target"
                                onConvertToMaster={onConvertToMaster}
                            />
                        );
                    })}
                </div>
            );
        }

        // Handle Prototype / HTML content
        if ((key === 'prototype' || key === 'html') && typeof value === 'string') {
            return <PrototypeCard key={key} html={value} />;
        }

        // Recursive rendering for objects
        if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
            const isTopLevel = depth === 0;
            return (
                <div key={key} className={`mb-6 ${isTopLevel ? 'bg-slate-900/40 p-6 rounded-2xl border border-white/5 shadow-sm' : 'ml-4 border-l-2 border-slate-700 pl-4'}`}>
                    <h3 className={`font-bold text-slate-200 capitalize mb-4 flex items-center gap-3 ${isTopLevel ? 'text-xl border-b border-white/5 pb-4' : 'text-md'}`}>
                        {isTopLevel ? (
                            <div className="w-1.5 h-8 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
                        ) : (
                            <div className="w-1 h-4 bg-slate-600 rounded-full"></div>
                        )}
                        <span className="tracking-tight">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                    </h3>
                    <div className={isTopLevel ? 'space-y-4' : ''}>
                        {Object.entries(value)
                            .sort(([keyA], [keyB]) => {
                                // Prioritize 'financialSimulation' (Top Priority)
                                if (keyA === 'financialSimulation') return -1;
                                if (keyB === 'financialSimulation') return 1;

                                // Then 'decision'
                                if (keyA.toLowerCase() === 'decision') return -1;
                                if (keyB.toLowerCase() === 'decision') return 1;

                                return 0;
                            })
                            .filter(([key]) => !['slides', 'presentation', 'excel', 'excelData', 'speakerNotes', 'systemPrompt', 'prompt', 'id', 'roleId'].some(forbidden => key.toLowerCase().includes(forbidden.toLowerCase())))
                            .map(([k, v]) => renderSection(k, v, depth + 1))}
                    </div>
                </div>
            );
        }

        // Arrays of strings or objects
        if (Array.isArray(value)) {
            return (
                <div key={key} className="mb-4">
                    <h3 className="font-bold text-slate-300 capitalize mb-2">{key.replace(/_/g, ' ')}</h3>
                    <ul className="list-disc list-inside space-y-2 text-slate-400">
                        {value.map((item, idx) => (
                            <li key={idx} className="leading-relaxed">
                                {typeof item === 'object' ? (
                                    <div className="inline-block align-top">
                                        {Object.entries(item).map(([k, v]) => (
                                            <div key={k} className="text-sm">
                                                <span className="font-semibold text-slate-400">{k}:</span> <span className="text-slate-200">{String(v)}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <span className="text-sm">{String(item)}</span>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            );
        }

        // Simple values (strings, numbers, booleans)
        return (
            <div key={key} className="mb-3">
                <span className="font-semibold text-slate-400 capitalize">{key.replace(/_/g, ' ')}: </span>
                <span className="text-slate-300">
                    {typeof value === 'string' && value.length > 100 ? (
                        <div className="mt-2 p-4 bg-slate-950/50 rounded-lg text-sm leading-relaxed border border-white/5 prose prose-invert prose-slate max-w-none">
                            <ReactMarkdown>{value}</ReactMarkdown>
                        </div>
                    ) : (
                        String(value)
                    )}
                </span>
            </div>
        );
    };

    // Special handling for new Project Manager Dashboard
    const dashboardData = normalizeDashboardData(content);
    if (dashboardData) {
        return (
            <React.Suspense fallback={<DashboardLoader />}>
                <PlanningDashboard data={dashboardData} methodology={methodology} />
            </React.Suspense>
        );
    }

    // Special handling for Universal Role Dashboard (New Standard)
    const universalData = normalizeUniversalData(content);
    if (universalData) {
        return (
            <React.Suspense fallback={<DashboardLoader />}>
                <UniversalRoleDashboard
                    key={roleId}
                    data={universalData}
                    projectId={projectId}
                    roleId={roleId}
                    savedAnswers={savedAnswers}
                    onConvertToMaster={onConvertToMaster}
                />
            </React.Suspense>
        );
    }

    if (typeof content === 'string') {
        // Try to parse JSON if it looks like it
        try {
            // Remove markdown code blocks if present
            const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
            const parsed = JSON.parse(cleanContent);

            // If parsed content matches Project Manager schema, render dashboard
            const dashboardData = normalizeDashboardData(parsed);
            if (dashboardData) {
                return (
                    <React.Suspense fallback={<DashboardLoader />}>
                        <PlanningDashboard data={dashboardData} methodology={methodology} />
                    </React.Suspense>
                );
            }

            // If parsed content matches Universal Dashboard schema (Robust Check)
            if (universalData) {
                return (
                    <React.Suspense fallback={<DashboardLoader />}>
                        <UniversalRoleDashboard
                            key={roleId}
                            data={universalData}
                            projectId={projectId}
                            roleId={roleId}
                            savedAnswers={savedAnswers}
                            onConvertToMaster={onConvertToMaster}
                        />
                    </React.Suspense>
                );
            }

            const parsedEntries = Object.entries(parsed);
            const parsedHasPrototype = parsedEntries.some(([k]) => k === 'prototype' || k === 'html');
            const parsedFiltered = (parsedHasPrototype && roleId === 'ux-designer')
                ? parsedEntries.filter(([k]) => k === 'prototype' || k === 'html')
                : parsedEntries;

            return (
                <div className="space-y-6">
                    {parsedFiltered
                        .sort(([keyA], [keyB]) => {
                            if (keyA === 'prototype' || keyA === 'html') return -1;
                            if (keyB === 'prototype' || keyB === 'html') return 1;
                            if (keyA === 'financialSimulation') return -1;
                            if (keyB === 'financialSimulation') return 1;
                            if (keyA.toLowerCase() === 'decision') return -1;
                            if (keyB.toLowerCase() === 'decision') return 1;
                            return 0;
                        })
                        .filter(([key]) => !['slides', 'presentation', 'excel', 'excelData', 'speakerNotes', 'systemPrompt', 'prompt', 'id', 'roleId'].some(forbidden => key.toLowerCase().includes(forbidden.toLowerCase())))
                        .map(([key, value]) => renderSection(key, value))}
                </div>
            );
        } catch {
            // Fallback to markdown for plain text
            return (
                <div className="prose prose-invert prose-slate max-w-none">
                    <ReactMarkdown
                        components={{
                            h1: ({ node, ...props }) => <h1 className="text-3xl font-bold text-slate-100 mb-4 pb-2 border-b border-white/10" {...props} />,
                            h2: ({ node, ...props }) => <h2 className="text-2xl font-semibold text-slate-200 mt-8 mb-4 border-l-4 border-indigo-500 pl-4" {...props} />,
                            h3: ({ node, ...props }) => <h3 className="text-xl font-medium text-slate-200 mt-6 mb-3" {...props} />,
                            strong: ({ node, ...props }) => <strong className="font-bold text-white" {...props} />,
                            ul: ({ node, ...props }) => <ul className="list-disc list-inside space-y-2 my-4 text-slate-300" {...props} />,
                            li: ({ node, ...props }) => <li className="pl-1" {...props} />,
                            blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-slate-600 pl-4 italic text-slate-400 bg-slate-900/50 p-4 rounded-r-lg" {...props} />,
                            code({ node, inline, className, children, ...props }: any) {
                                const match = /language-(\w+)/.exec(className || '');
                                const codeContent = String(children).replace(/\n$/, '');

                                // Handle JSON Diagram blocks (json)
                                if (!inline && match && (match[1] === 'json')) {
                                    return (
                                        <SmartDiagram
                                            data={codeContent}
                                            title="Diagram"
                                        />
                                    );
                                }

                                return !inline && match ? (
                                    <div className="relative group my-4">
                                        <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="text-xs text-slate-500 font-mono">{match[1]}</span>
                                        </div>
                                        <pre className={`${className} bg-slate-950 border border-white/10 text-slate-300 p-4 rounded-lg overflow-x-auto shadow-inner`}>
                                            <code {...props} className={className}>
                                                {children}
                                            </code>
                                        </pre>
                                    </div>
                                ) : (
                                    <code className={`${className} bg-slate-800 text-slate-200 px-1 py-0.5 rounded text-sm font-mono border border-white/10`} {...props}>
                                        {children}
                                    </code>
                                );
                            }
                        }}
                    >
                        {content}
                    </ReactMarkdown>
                </div>
            );
        }
    }

    // Content is already an object
    const contentEntries = Object.entries(content);

    return (
        <div className="space-y-6">
            {contentEntries
                .sort(([keyA], [keyB]) => {
                    // Prototype always first
                    if (keyA === 'prototype' || keyA === 'html') return -1;
                    if (keyB === 'prototype' || keyB === 'html') return 1;
                    if (keyA === 'financialSimulation') return -1;
                    if (keyB === 'financialSimulation') return 1;
                    if (keyA.toLowerCase() === 'decision') return -1;
                    if (keyB.toLowerCase() === 'decision') return 1;
                    return 0;
                })
                .filter(([key]) => !['slides', 'presentation', 'excel', 'excelData', 'speakerNotes', 'systemPrompt', 'prompt', 'id', 'roleId'].some(forbidden => key.toLowerCase().includes(forbidden.toLowerCase())))
                .map(([key, value]) => renderSection(key, value))}
        </div>
    );
};
