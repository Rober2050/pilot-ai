import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ShieldCheck, Bug, Zap, Layers, AlertTriangle,
    CheckCircle, Info, FileText, Server, AlertOctagon,
    GitBranch, Map, Target, ArrowRight, Download,
    TrendingUp, Clock
} from 'lucide-react';
import { loggingService } from '../../services/firebase/loggingService';

interface QAEngineerDashboardProps {
    data: any;
    projectId?: string;
    roleId?: string;
    onConvertToMaster?: (node: any, subDiagram?: any) => void;
}

// ─── Micro-components ───────────────────────────────────────────────────────

const Tooltip = ({ text }: { text: string }) => (
    <div className="group relative inline-block ml-1.5 cursor-help">
        <Info className="w-3.5 h-3.5 text-slate-400 hover:text-indigo-500 transition-colors" />
        <div className="invisible group-hover:visible absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 text-white text-xs rounded-lg whitespace-normal min-w-[200px] z-50 shadow-xl border border-slate-700">
            {text}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
        </div>
    </div>
);

const PriorityBadge = ({ priority }: { priority: string }) => {
    const map: Record<string, string> = {
        High: 'bg-rose-100 text-rose-700 border-rose-200',
        Critical: 'bg-red-100 text-red-700 border-red-200',
        Medium: 'bg-amber-100 text-amber-700 border-amber-200',
        Low: 'bg-slate-100 text-slate-600 border-slate-200',
    };
    return (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${map[priority] || map.Low}`}>
            {priority}
        </span>
    );
};

// ─── Tab: Test Suites (BDD Gherkin) ─────────────────────────────────────────

const TestSuitesTab = ({ suites }: { suites: any[] }) => {
    const { t } = useTranslation('qa');
    const [expanded, setExpanded] = useState<string | null>(null);

    if (!suites?.length) {
        return (
            <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400">
                <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">{t('suites.noData')}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* BDD hint banner */}
            <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-lg flex items-start gap-3">
                <FileText className="w-5 h-5 text-indigo-600 mt-0.5 shrink-0" />
                <div>
                    <h4 className="font-bold text-indigo-800 text-sm">{t('suites.bannerTitle')}</h4>
                    <p className="text-sm text-indigo-700 mt-0.5">{t('suites.bannerDesc')}</p>
                </div>
            </div>

            {suites.map((suite: any, idx: number) => (
                <div key={idx} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                        <h4 className="font-bold text-indigo-900 flex items-center gap-2 text-sm">
                            <Layers className="w-4 h-4 text-indigo-500" />
                            {suite.name}
                        </h4>
                        <span className="text-xs font-mono bg-white px-2 py-1 border rounded text-slate-500">
                            {suite.cases?.length || 0} {t('suites.cases')}
                        </span>
                    </div>

                    <div className="divide-y divide-slate-100">
                        {suite.cases?.map((tc: any, cIdx: number) => {
                            const tcId = tc.id || `TC-${String(cIdx + 1).padStart(3, '0')}`;
                            const isOpen = expanded === `${idx}-${cIdx}`;
                            return (
                                <div key={cIdx} className="p-5 hover:bg-slate-50/50 transition-colors">
                                    {/* Header row */}
                                    <div
                                        className="flex items-start justify-between cursor-pointer"
                                        onClick={() => setExpanded(isOpen ? null : `${idx}-${cIdx}`)}
                                    >
                                        <div className="flex items-center gap-3 flex-1">
                                            <span className="text-xs font-mono bg-indigo-100 text-indigo-700 px-2 py-1 rounded font-bold shrink-0">{tcId}</span>
                                            <h5 className="font-bold text-slate-800 text-sm">{tc.title}</h5>
                                        </div>
                                        <div className="flex items-center gap-2 ml-4 shrink-0">
                                            {tc.priority && <PriorityBadge priority={tc.priority} />}
                                            {tc.automatable && (
                                                <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1 font-bold">
                                                    <Zap className="w-2.5 h-2.5" /> {t('suites.automatable')}
                                                </span>
                                            )}
                                            {tc.estimatedTime && (
                                                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />{tc.estimatedTime}
                                                </span>
                                            )}
                                            <ArrowRight className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                                        </div>
                                    </div>

                                    {/* BDD Gherkin body */}
                                    {isOpen && (
                                        <div className="mt-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                            {/* GIVEN */}
                                            {(tc.given || tc.preconditions?.length) && (
                                                <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded-r-lg">
                                                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest block mb-1">Given</span>
                                                    <p className="text-sm text-slate-700 leading-relaxed">
                                                        {tc.given || (Array.isArray(tc.preconditions) ? tc.preconditions.join('; ') : tc.preconditions)}
                                                    </p>
                                                </div>
                                            )}
                                            {/* WHEN / ACTION */}
                                            {(tc.when || tc.action || tc.steps?.length) && (
                                                <div className="bg-indigo-50 border-l-4 border-indigo-400 p-3 rounded-r-lg">
                                                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block mb-1">When</span>
                                                    {tc.steps?.length ? (
                                                        <ol className="space-y-1 list-decimal list-inside">
                                                            {tc.steps.map((s: string, si: number) => (
                                                                <li key={si} className="text-sm text-slate-700">{s}</li>
                                                            ))}
                                                        </ol>
                                                    ) : (
                                                        <p className="text-sm text-slate-700 leading-relaxed">{tc.when || tc.action}</p>
                                                    )}
                                                </div>
                                            )}
                                            {/* THEN / EXPECTED */}
                                            {(tc.then || tc.expectedResult) && (
                                                <div className="bg-emerald-50 border-l-4 border-emerald-400 p-3 rounded-r-lg">
                                                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest block mb-1">Then</span>
                                                    <p className="text-sm text-slate-700 leading-relaxed">{tc.then || tc.expectedResult}</p>
                                                </div>
                                            )}
                                            {/* Type tag */}
                                            {tc.type && (
                                                <div className="mt-2">
                                                    <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-mono">{tc.type}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
};

// ─── Tab: Risk Report ────────────────────────────────────────────────────────

const RiskTab = ({ risks }: { risks: any[] }) => {
    const { t } = useTranslation('qa');

    const impactColor = (impact: string) => {
        if (impact === 'Critical') return 'bg-red-100 text-red-700';
        if (impact === 'High') return 'bg-rose-100 text-rose-600';
        if (impact === 'Medium') return 'bg-amber-100 text-amber-600';
        return 'bg-blue-100 text-blue-600';
    };

    if (!risks?.length) return (
        <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400">
            <AlertOctagon className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">{t('risks.noData')}</p>
        </div>
    );

    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-5 flex items-center gap-2 text-sm">
                <AlertOctagon className="w-5 h-5 text-amber-500" />
                {t('risks.matrixTitle')}
            </h3>
            <div className="space-y-4">
                {risks.map((risk: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-4 p-4 rounded-lg bg-slate-50 border border-slate-100 hover:shadow-sm transition-shadow">
                        <div className={`p-2.5 rounded-lg shrink-0 ${impactColor(risk.impact)}`}>
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                                <h4 className="font-bold text-slate-800 text-sm">{risk.name || risk.risk}</h4>
                                {risk.owner && (
                                    <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded shrink-0">{risk.owner}</span>
                                )}
                            </div>
                            <p className="text-sm text-slate-600 mb-3">
                                <span className="font-semibold text-slate-700">{t('risks.mitigation')}: </span>{risk.mitigation}
                            </p>
                            <div className="flex items-center gap-4 text-[11px]">
                                <span className="uppercase text-slate-400 font-bold">{t('risks.impact')}:
                                    <span className={`ml-1 font-bold ${risk.impact === 'Critical' || risk.impact === 'High' ? 'text-rose-600' : risk.impact === 'Medium' ? 'text-amber-600' : 'text-blue-600'}`}>
                                        {risk.impact}
                                    </span>
                                </span>
                                <span className="uppercase text-slate-400 font-bold">{t('risks.probability')}:
                                    <span className="ml-1 font-bold text-slate-700">{risk.probability}</span>
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ─── Tab: CI/CD & Tools ──────────────────────────────────────────────────────

const CICDTab = ({ stack }: { stack: any }) => {
    const { t } = useTranslation('qa');
    const entries = Object.entries(stack || {});

    if (!entries.length) return (
        <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400">
            <Server className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">{t('cicd.noData')}</p>
        </div>
    );

    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2 text-sm">
                <Server className="w-5 h-5 text-slate-600" />
                {t('cicd.stackTitle')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {entries.map(([category, config]: [string, any], idx) => (
                    <div key={idx} className="bg-slate-50 p-4 rounded-lg border border-slate-200 hover:shadow-md transition-shadow">
                        <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                            {category.replace(/([A-Z])/g, ' $1').trim()}
                        </h4>
                        {config.recommended ? (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-indigo-600">{config.recommended}</span>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${config.cost === 'Free' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {config.cost || 'Free'}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-600 leading-relaxed">{config.rationale}</p>
                                {config.setup && (
                                    <div className="bg-slate-800 text-emerald-400 p-2.5 rounded font-mono text-[11px] overflow-x-auto">
                                        $ {config.setup}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-1.5">
                                {Array.isArray(config) ? config.map((tool, tIdx) => (
                                    <div key={tIdx} className="flex items-center gap-2 text-sm text-slate-700">
                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0"></div>
                                        {tool}
                                    </div>
                                )) : <p className="text-sm text-slate-600">{String(config)}</p>}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

// ─── Tab: Testing Pyramid ────────────────────────────────────────────────────

const PyramidTab = ({ pyramid, criticalPaths }: { pyramid: any; criticalPaths: any[] }) => {
    const { t } = useTranslation('qa');

    // Defaults if AI doesn't return pyramid
    const defaultPyramid = {
        unit: { pct: 70, label: t('pyramid.unit'), color: '#6366f1', desc: t('pyramid.unitDesc') },
        integration: { pct: 20, label: t('pyramid.integration'), color: '#8b5cf6', desc: t('pyramid.intDesc') },
        e2e: { pct: 10, label: t('pyramid.e2e'), color: '#ec4899', desc: t('pyramid.e2eDesc') },
    };

    const layers = pyramid ? [
        { key: 'unit', pct: pyramid.unit?.pct || 70, label: pyramid.unit?.label || t('pyramid.unit'), color: '#6366f1', desc: pyramid.unit?.rationale || t('pyramid.unitDesc') },
        { key: 'integration', pct: pyramid.integration?.pct || 20, label: pyramid.integration?.label || t('pyramid.integration'), color: '#8b5cf6', desc: pyramid.integration?.rationale || t('pyramid.intDesc') },
        { key: 'e2e', pct: pyramid.e2e?.pct || 10, label: pyramid.e2e?.label || t('pyramid.e2e'), color: '#ec4899', desc: pyramid.e2e?.rationale || t('pyramid.e2eDesc') },
    ] : Object.values(defaultPyramid).map((v, i) => ({ key: i.toString(), ...v }));

    return (
        <div className="space-y-6">
            {/* Pyramid Visualization */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2 text-sm">
                    <TrendingUp className="w-5 h-5 text-indigo-600" />
                    {t('pyramid.title')}
                </h3>
                <div className="flex flex-col items-center gap-2 mb-6">
                    {[...layers].reverse().map((layer, idx) => {
                        const widthMap = ['w-full', 'w-3/4', 'w-1/2'];
                        return (
                            <div key={layer.key} className={`${widthMap[idx]} rounded-lg p-3 text-white text-center transition-all hover:opacity-90`} style={{ backgroundColor: layer.color }}>
                                <div className="font-bold text-sm">{layer.label}</div>
                                <div className="text-xl font-black">{layer.pct}%</div>
                                <div className="text-[10px] opacity-80 mt-0.5">{layer.desc}</div>
                            </div>
                        );
                    })}
                </div>
                {/* Legend */}
                <div className="grid grid-cols-3 gap-3">
                    {layers.map((layer) => (
                        <div key={layer.key} className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-center">
                            <div className="w-3 h-3 rounded-full mx-auto mb-1" style={{ backgroundColor: layer.color }}></div>
                            <div className="text-xs font-bold text-slate-700">{layer.label}</div>
                            <div className="text-lg font-black text-slate-800">{layer.pct}%</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Critical User Journeys */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-5 flex items-center gap-2 text-sm">
                    <Map className="w-5 h-5 text-rose-500" />
                    {t('criticalPaths.title')}
                    <Tooltip text={t('criticalPaths.tooltip')} />
                </h3>
                {!criticalPaths?.length ? (
                    <div className="p-8 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl text-sm">
                        {t('criticalPaths.noData')}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {criticalPaths.map((path: any, idx: number) => (
                            <div key={idx} className="border border-slate-200 rounded-lg overflow-hidden hover:shadow-sm transition-shadow">
                                <div className="bg-slate-50 px-4 py-3 flex items-center justify-between border-b border-slate-100">
                                    <div className="flex items-center gap-2">
                                        <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-700 text-[11px] font-black flex items-center justify-center shrink-0">
                                            {idx + 1}
                                        </span>
                                        <h4 className="font-bold text-slate-800 text-sm">{path.journey || path.name}</h4>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {path.priority && <PriorityBadge priority={path.priority} />}
                                        {path.mustPassBeforeLaunch && (
                                            <span className="text-[10px] bg-rose-600 text-white px-2 py-0.5 rounded-full font-bold">{t('criticalPaths.mustPass')}</span>
                                        )}
                                    </div>
                                </div>
                                <div className="p-4">
                                    {path.description && <p className="text-sm text-slate-600 mb-3">{path.description}</p>}
                                    {path.steps?.length > 0 && (
                                        <div className="flex flex-wrap items-center gap-2">
                                            {path.steps.map((step: string, si: number) => (
                                                <React.Fragment key={si}>
                                                    <span className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded font-medium">{step}</span>
                                                    {si < path.steps.length - 1 && <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />}
                                                </React.Fragment>
                                            ))}
                                        </div>
                                    )}
                                    {path.testTypes && (
                                        <div className="mt-3 flex flex-wrap gap-1.5">
                                            {(Array.isArray(path.testTypes) ? path.testTypes : [path.testTypes]).map((tt: string, ti: number) => (
                                                <span key={ti} className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded border border-indigo-100">{tt}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

// ─── Tab: Overview ───────────────────────────────────────────────────────────

const OverviewTab = ({ scenarios }: { scenarios: any[] }) => {
    const { t } = useTranslation('qa');
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                    {t('scenarios.title')}
                    <Tooltip text={t('scenarios.tooltip')} />
                </h3>
            </div>
            {!scenarios?.length ? (
                <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-sm">
                    {t('scenarios.noData')}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {scenarios.map((sc: any, idx: number) => {
                        const coveragePct = sc.coverage || 0;
                        const coverageColor = coveragePct >= 80 ? 'bg-emerald-500' : coveragePct >= 50 ? 'bg-amber-500' : 'bg-rose-500';
                        return (
                            <div key={idx} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all border-l-4 border-l-rose-500">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-slate-800 text-sm pr-3">{sc.name}</h4>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase shrink-0 ${sc.priority === 'Critical' ? 'bg-red-100 text-red-700' : 'bg-rose-50 text-rose-600'}`}>
                                        {sc.priority || 'Critical'}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-600 mb-4 leading-relaxed">{sc.description}</p>
                                <div className="mt-auto">
                                    <div className="w-full bg-slate-100 rounded-full h-1.5 mb-1">
                                        <div className={`h-1.5 rounded-full ${coverageColor}`} style={{ width: `${coveragePct}%` }}></div>
                                    </div>
                                    <div className="flex justify-between text-[11px] text-slate-400">
                                        <span>{t('scenarios.coverage')}</span>
                                        <span className="font-semibold">{coveragePct}%</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

// ─── Main Component ──────────────────────────────────────────────────────────

const QAEngineerDashboard: React.FC<QAEngineerDashboardProps> = ({ data, projectId, roleId }) => {
    const { t } = useTranslation('qa');
    const [activeTab, setActiveTab] = useState('overview');

    const safeData = React.useMemo(() => {
        try {
            if (!data) throw new Error('No data provided to QA Dashboard');
            return data.dashboard || data;
        } catch (error) {
            loggingService.logError('qa-dashboard-render-error', (error as Error).message, { projectId, roleId });
            return {};
        }
    }, [data, projectId, roleId]);

    // AI-driven KPIs — only show if AI provided them
    const kpis = Array.isArray(safeData.kpis) ? safeData.kpis : [];
    const getKPI = (keys: string[], fallback = '—') => {
        const kpi = kpis.find((k: any) => keys.some(p => k.label?.toLowerCase().includes(p.toLowerCase())));
        return kpi?.value ?? fallback;
    };

    const tabs = [
        { id: 'overview', label: t('tabs.overview'), icon: ShieldCheck },
        { id: 'test-suites', label: t('tabs.testSuites'), icon: Layers },
        { id: 'risks', label: t('tabs.risks'), icon: AlertOctagon },
        { id: 'pyramid', label: t('tabs.pyramid'), icon: TrendingUp },
        { id: 'cicd', label: t('tabs.cicd'), icon: Server },
    ];

    const kpiCards = [
        {
            label: t('kpi.readiness'), key: ['readiness', 'madurez'], icon: ShieldCheck,
            color: 'border-t-indigo-500', iconColor: 'text-indigo-500',
            tooltip: t('kpi.readinessHint'),
        },
        {
            label: t('kpi.bugs'), key: ['risk', 'bug', 'riesgo', 'critical'], icon: Bug,
            color: 'border-t-rose-500', iconColor: 'text-rose-500',
            tooltip: t('kpi.bugsHint'),
        },
        {
            label: t('kpi.coverage'), key: ['coverage', 'cobertura'], icon: CheckCircle,
            color: 'border-t-emerald-500', iconColor: 'text-emerald-500',
            tooltip: t('kpi.coverageHint'),
        },
        {
            label: t('kpi.automation'), key: ['automation', 'automatiz', 'testabil'], icon: Zap,
            color: 'border-t-amber-500', iconColor: 'text-amber-500',
            tooltip: t('kpi.automationHint'),
        },
    ];

    return (
        <div className="text-slate-800 font-sans">

            {/* Executive Summary — Compact, same style as Strategy Analyst */}
            {safeData.summary && (
                <div className="bg-white px-5 py-3 rounded-xl border border-slate-100 shadow-sm mb-4">
                    <h4 className="font-bold text-slate-800 mb-1 pb-1 flex items-center gap-2 text-sm">
                        <FileText className="w-3.5 h-3.5 text-indigo-500" />
                        {t('summaryTitle')}
                    </h4>
                    <p className="text-slate-700 leading-normal text-[12px] font-[Arial,sans-serif]">
                        {safeData.summary}
                    </p>
                </div>
            )}

            {/* Compact header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5">
                <div className="flex items-center gap-3 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold bg-indigo-50 text-indigo-700 border-indigo-300">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        {t('dashboardTitle')}
                    </span>
                    <p className="text-[12px] text-slate-500 font-[Arial,sans-serif]">{t('dashboardSubtitle')}</p>
                </div>
            </div>

            {/* KPI Cards — AI-driven, no fallback fake numbers */}
            {kpis.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {kpiCards.map((card, idx) => {
                        const value = getKPI(card.key);
                        if (value === '—') return null;
                        return (
                            <div key={idx} className={`bg-white p-4 rounded-xl border border-slate-100 shadow-sm border-t-4 ${card.color}`}>
                                <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                                    {card.label}
                                    <Tooltip text={card.tooltip} />
                                </div>
                                <div className="text-3xl font-black text-slate-800">{value}</div>
                                <card.icon className={`w-5 h-5 mt-1 ${card.iconColor}`} />
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Tab Navigation */}
            <div className="flex flex-wrap bg-slate-100 rounded-lg p-1 gap-0.5 mb-6">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-3 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-1.5 ${activeTab === tab.id
                            ? 'bg-white text-indigo-700 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-indigo-500' : 'text-slate-400'}`} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {activeTab === 'overview' && <OverviewTab scenarios={safeData.criticalScenarios || safeData.scenarios} />}
                {activeTab === 'test-suites' && <TestSuitesTab suites={safeData.testSuites} />}
                {activeTab === 'risks' && <RiskTab risks={safeData.risks} />}
                {activeTab === 'pyramid' && <PyramidTab pyramid={safeData.testingPyramid} criticalPaths={safeData.criticalPaths} />}
                {activeTab === 'cicd' && <CICDTab stack={safeData.qaStack || safeData.techStack} />}
            </div>
        </div>
    );
};

export default QAEngineerDashboard;
