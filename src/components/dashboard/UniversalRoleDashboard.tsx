import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { UniversalDashboardSchema, DashboardKPI } from '../../types/universalDashboard';
import { SchemaVisualizer } from './SchemaVisualizer';
import { DataTableWidget } from './DataTableWidget';
import { SmartDiagram } from '../SmartDiagram';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
    Zap, DollarSign, CheckCircle, AlertTriangle, Clock,
    Database, Server, Layout, Shield, Globe, Cpu,
    TrendingUp, TrendingDown, Minus, Info, BookOpen, X,
    PieChart, BarChart2, List, MessageSquare, LayoutDashboard,
    FileText, Target, Radio, ChevronDown, ChevronUp, ArrowRight
} from 'lucide-react';
import { cn } from '../../lib/utils';
// Charts removed — not used in current architect/role protocols

import { projectsService } from '../../services/firebase/projectsService';

interface UniversalRoleDashboardProps {
    data: UniversalDashboardSchema;
    projectId?: string;
    roleId?: string;
    savedAnswers?: Record<string, string>;
    onConvertToMaster?: (node: any, subDiagram?: any) => void;
}

// --- Icon Mapper ---
const IconMap: Record<string, React.ElementType> = {
    Zap, DollarSign, CheckCircle, AlertTriangle, Clock,
    Database, Server, Layout, Shield, Globe, Cpu,
    TrendingUp, TrendingDown, Minus, Info, BookOpen,
    PieChart, BarChart2, List, MessageSquare
};

const getIcon = (name?: string) => {
    if (!name) return Info;
    return IconMap[name] || Info;
};

// --- KPI Card ---
const KPICard = ({ kpi }: { kpi: DashboardKPI }) => {
    const { t: tBA } = useTranslation('businessAnalyst');
    const Icon = getIcon(kpi.icon);

    const colorStyles: Record<string, string> = {
        slate: 'bg-white border-slate-200 text-slate-600',
        blue: 'bg-blue-50 border-blue-200 text-blue-700',
        emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700',
        indigo: 'bg-indigo-50 border-indigo-200 text-indigo-700',
        purple: 'bg-purple-50 border-purple-200 text-purple-700',
        amber: 'bg-amber-50 border-amber-200 text-amber-700',
        rose: 'bg-rose-50 border-rose-200 text-rose-700',
        sky: 'bg-sky-50 border-sky-200 text-sky-700',
    };

    const style = colorStyles[kpi.color || 'slate'];
    const iconColor = kpi.color && kpi.color !== 'slate' ? `text-${kpi.color}-600` : 'text-slate-500';
    const kpiLabel = kpi.id ? tBA(`kpi.${kpi.id}`, { defaultValue: kpi.label }) : kpi.label;

    return (
        <div className={cn("p-4 rounded-xl border flex flex-col justify-between transition-all hover:shadow-md bg-white", style)}>
            <div className="flex justify-between items-start mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">{kpiLabel}</span>
                <Icon className={cn("w-4 h-4 opacity-70 shrink-0", iconColor)} />
            </div>
            <div className="flex items-end gap-2 mt-1">
                <span className="text-2xl font-bold tracking-tight text-slate-800">{kpi.value}</span>
                {kpi.trend && (
                    <div className={cn("flex items-center text-xs font-medium mb-0.5",
                        kpi.trend === 'up' ? "text-emerald-600" :
                            kpi.trend === 'down' ? "text-rose-600" : "text-slate-500"
                    )}>
                        {kpi.trend === 'up' && <TrendingUp className="w-3 h-3 mr-0.5" />}
                        {kpi.trend === 'down' && <TrendingDown className="w-3 h-3 mr-0.5" />}
                        {kpi.trendValue}
                    </div>
                )}
            </div>
        </div>
    );
};

const KeyValueGrid = ({ data }: { data: { label: string, value: string, icon?: string, color?: string }[] }) => {
    if (!Array.isArray(data)) return <div className="text-rose-500 font-medium p-4 bg-rose-50 rounded-lg text-[12px]">Invalid Data Format</div>;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.map((item, idx) => {
                const Icon = getIcon(item.icon);
                return (
                    <div key={idx} className={cn("flex items-start gap-3 p-4 rounded-xl border bg-white shadow-sm hover:shadow-md transition-all",
                        item.color ? `border-${item.color}-100 bg-${item.color}-50/30` : "border-slate-100"
                    )}>
                        <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                            item.color ? `bg-${item.color}-100 text-${item.color}-600` : "bg-slate-100 text-slate-500"
                        )}>
                            <Icon className="w-4 h-4" />
                        </div>
                        <div>
                            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">{item.label}</h4>
                            <p className="font-semibold text-slate-800 text-[12px] leading-snug">{item.value}</p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

const TechStackDisplay = ({ data }: { data: any }) => {
    if (!data) return null;
    const categories = Array.isArray(data) ? data : Object.entries(data).map(([key, value]) => ({
        category: key,
        items: Array.isArray(value) ? value : [value]
    }));

    return (
        <div className="space-y-6">
            {categories.map((cat: any, idx: number) => (
                <div key={idx} className="relative pl-5 border-l-2 border-indigo-100 ml-2">
                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-indigo-500 border-4 border-white shadow-sm" />
                    <h3 className="text-sm font-bold text-slate-800 mb-3 capitalize">{cat.category || cat.name}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {cat.items && cat.items.map((item: any, iIdx: number) => (
                            <div key={iIdx} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center gap-2.5 hover:border-indigo-300 hover:shadow-md transition-all group">
                                {item.icon && <img src={item.icon} alt="" loading="lazy" decoding="async" className="w-7 h-7 object-contain p-1 rounded-lg bg-slate-50 group-hover:bg-indigo-50 transition-colors" />}
                                <div>
                                    <div className="font-bold text-slate-700 text-[12px] group-hover:text-indigo-700 transition-colors">{item.name || item}</div>
                                    {item.description && <div className="text-[11px] text-slate-500">{item.description}</div>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

// ChartWidget removed — charts no longer part of Architect/role protocols

// Lazy-load C4 Diagram to avoid blocking render on diagram mount
const LazyC4DiagramWidget = ({ data, description }: { data: any; description?: string }) => {
    const [isVisible, setIsVisible] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isVisible) return; // Already rendered
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.1 }
        );
        if (containerRef.current) observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, [isVisible]);

    return (
        <div ref={containerRef} className="space-y-2">
            {description && (
                <div className="flex items-center gap-2 px-1">
                    <div className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border bg-indigo-50 text-indigo-600 border-indigo-100 flex items-center gap-1.5 shadow-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                        C4 Model
                    </div>
                    <span className="text-[12px] text-slate-500 italic">{description}</span>
                </div>
            )}
            <div className="h-[700px] w-full bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {isVisible ? (
                    <SmartDiagram data={data} title="C4 Architecture View" className="h-full border-0" />
                ) : (
                    <div className="h-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                        <div className="text-center">
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-slate-200 mb-2">
                                <div className="w-6 h-6 border-2 border-slate-400 border-t-slate-600 rounded-full animate-spin" />
                            </div>
                            <p className="text-[12px] text-slate-500">Loading diagram...</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const C4DiagramWidget = LazyC4DiagramWidget;

const InteractiveDiscoveryWidget = ({ data, onSave, savedAnswers, tBA }: {
    data: any[];
    onSave: (answers: Record<string, string>) => void;
    savedAnswers?: Record<string, string>;
    tBA: (key: string) => string;
}) => {
    const [answers, setAnswers] = useState<Record<string, string>>(savedAnswers || {});
    const [isSaving, setIsSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    const handleAnswerChange = (id: string, value: string) => {
        setAnswers(prev => ({ ...prev, [id]: value }));
        setHasChanges(true);
    };

    const handleSave = async () => {
        setIsSaving(true);
        await onSave(answers);
        setIsSaving(false);
        setHasChanges(false);
    };

    const handleCancel = () => {
        setAnswers(savedAnswers || {});
        setHasChanges(false);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between bg-indigo-50 p-3 rounded-xl border border-indigo-100">
                <h3 className="text-sm font-bold text-indigo-900 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-indigo-600" />
                    {tBA('discoveryQuestions')}
                </h3>
                <div className="flex gap-2">
                    {hasChanges && (
                        <button onClick={handleCancel} className="px-3 py-1.5 text-indigo-600 hover:text-indigo-800 font-medium transition-colors text-[12px]">
                            {tBA('cancel')}
                        </button>
                    )}
                    <button
                        onClick={handleSave}
                        disabled={isSaving || !hasChanges}
                        className={cn(
                            "px-4 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 text-[12px]",
                            hasChanges ? "bg-indigo-600 text-white hover:bg-indigo-700" : "bg-slate-200 text-slate-400 cursor-not-allowed"
                        )}
                    >
                        {isSaving ? <Clock className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                        {isSaving ? tBA('savingAnswers') : tBA('saveAnswers')}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {data.map((item, idx) => (
                    <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-300">
                        <div className="flex items-start gap-3 mb-3">
                            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-[12px] shrink-0 border border-indigo-100">
                                {idx + 1}
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800 text-sm leading-snug">{item.question}</h4>
                                {item.context && (
                                    <p className="text-[12px] text-slate-500 mt-1.5 italic flex items-start gap-1.5 bg-slate-50 p-2 rounded-lg border border-slate-100">
                                        <Info className="w-3 h-3 mt-0.5 shrink-0" />
                                        {item.context}
                                    </p>
                                )}
                            </div>
                        </div>
                        <textarea
                            className="w-full p-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-0 focus:border-indigo-500 outline-none text-slate-700 transition-all resize-y min-h-[100px] placeholder:text-slate-400 text-[12px]"
                            placeholder={tBA('saveAnswers')}
                            value={answers[item.id] || ''}
                            onChange={(e) => handleAnswerChange(item.id, e.target.value)}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

const MatrixWidget = ({ data }: { data: any }) => {
    const quadrants = [
        { title: 'Strengths', data: data.strengths, color: 'emerald' },
        { title: 'Weaknesses', data: data.weaknesses, color: 'rose' },
        { title: 'Opportunities', data: data.opportunities, color: 'blue' },
        { title: 'Threats', data: data.threats, color: 'amber' }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {quadrants.map((quad, idx) => (
                <div key={idx} className={`p-5 rounded-xl border shadow-sm bg-white border-${quad.color}-100`}>
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
                        <div className={`w-2.5 h-2.5 rounded-full bg-${quad.color}-500`} />
                        <h4 className={`font-bold text-${quad.color}-700 uppercase tracking-wider text-[11px]`}>{quad.title}</h4>
                    </div>
                    <ul className="space-y-2">
                        {quad.data && quad.data.map((item: string, i: number) => (
                            <li key={i} className="text-slate-700 flex items-start gap-2 leading-relaxed text-[12px]">
                                <span className={`w-1.5 h-1.5 rounded-full bg-${quad.color}-300 mt-1.5 shrink-0`} />
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
        </div>
    );
};

const BusinessModelCanvasWidget = ({ data }: { data: any }) => {
    const Section = ({ title, items, color, className }: { title: string, items: string[], color: string, className?: string }) => (
        <div className={cn(`p-3 rounded-xl border shadow-sm bg-white h-full hover:shadow-md transition-shadow border-${color}-100`, className)}>
            <h4 className={`font-bold text-${color}-700 mb-2 uppercase tracking-wider text-[10px]`}>{title}</h4>
            <ul className="space-y-1.5">
                {items && items.map((item: string, i: number) => (
                    <li key={i} className="text-[11px] text-slate-600 flex items-start gap-1.5 leading-relaxed">
                        <div className={`w-1 h-1 rounded-full bg-${color}-400 mt-1.5 shrink-0`} />
                        {item}
                    </li>
                ))}
            </ul>
        </div>
    );

    return (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 auto-rows-fr">
            <div className="md:col-span-1 md:row-span-2"><Section title="Key Partners" items={data.keyPartners} color="slate" /></div>
            <div className="md:col-span-1"><Section title="Key Activities" items={data.keyActivities} color="indigo" /></div>
            <div className="md:col-span-1 md:row-span-2"><Section title="Value Propositions" items={data.valuePropositions} color="emerald" /></div>
            <div className="md:col-span-1"><Section title="Customer Relationships" items={data.customerRelationships} color="blue" /></div>
            <div className="md:col-span-1 md:row-span-2"><Section title="Customer Segments" items={data.customerSegments} color="purple" /></div>
            <div className="md:col-span-1"><Section title="Key Resources" items={data.keyResources} color="amber" /></div>
            <div className="md:col-span-1"><Section title="Channels" items={data.channels} color="cyan" /></div>
            <div className="md:col-span-2"><Section title="Cost Structure" items={data.costStructure} color="rose" /></div>
            <div className="md:col-span-2"><Section title="Revenue Streams" items={data.revenueStreams} color="teal" /></div>
        </div>
    );
};

const MarketAnalysisWidget = ({ data, tBA }: { data: any; tBA: (key: string) => string }) => (
    <div className="space-y-5">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h4 className="font-bold text-slate-800 mb-2 text-sm">{tBA('marketOverview')}</h4>
            <p className="text-slate-600 leading-relaxed text-[12px] mb-3">{data.summary || data.marketSizeSourceNote}</p>
            {data.cagr && (
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[12px] font-bold">
                    CAGR: {data.cagr}
                </div>
            )}
        </div>
        {data.projection && Array.isArray(data.projection) && data.projection.length > 0 && (
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <h4 className="font-bold text-slate-700 mb-4 text-[11px] uppercase tracking-wider">{tBA('marketGrowthProjection')}</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                    {data.projection.map((p: any, i: number) => (
                        <div key={i} className="text-center p-3 rounded-xl border border-slate-100 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 transition-all">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{p.year}</div>
                            <div className="text-[15px] font-extrabold text-slate-800 mt-1">${(p.value / 1_000_000_000 >= 1 ? (p.value / 1_000_000_000).toFixed(1) + 'B' : (p.value / 1_000_000).toFixed(0) + 'M')}</div>
                        </div>
                    ))}
                </div>
            </div>
        )}
    </div>
);

const BusinessRuleCard = ({ rule, tBA }: { rule: any; tBA: (key: string) => string }) => {
    const complianceColors: Record<string, string> = {
        'Legal': 'bg-rose-50 text-rose-700 border-rose-200',
        'Financial': 'bg-amber-50 text-amber-700 border-amber-200',
        'Security': 'bg-indigo-50 text-indigo-700 border-indigo-200',
        'Operational': 'bg-slate-50 text-slate-600 border-slate-200',
        'Regulatory': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    };
    const priorityColors: Record<string, string> = {
        'Must Have': 'bg-red-50 text-red-700 border-red-200',
        'Should Have': 'bg-orange-50 text-orange-700 border-orange-200',
    };
    const cColor = complianceColors[rule.compliance] || complianceColors['Operational'];
    const pColor = priorityColors[rule.priority] || 'bg-slate-50 text-slate-500 border-slate-200';

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group hover:border-slate-300">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 bg-slate-50/50 group-hover:bg-slate-50 transition-colors">
                <span className="font-mono text-[11px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">{rule.id}</span>
                <div className="flex items-center gap-1.5">
                    {rule.compliance && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wide ${cColor}`}>
                            {rule.compliance}
                        </span>
                    )}
                    {rule.priority && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wide ${pColor}`}>
                            {rule.priority}
                        </span>
                    )}
                </div>
            </div>
            <div className="px-4 pt-3 pb-2">
                <p className="text-slate-800 font-semibold leading-relaxed text-[13px] italic border-l-[3px] border-indigo-400 pl-3">
                    &ldquo;{rule.rule}&rdquo;
                </p>
            </div>
            {rule.rationale && (
                <div className="mx-4 mb-3 bg-amber-50/60 rounded-lg p-2.5 border border-amber-100">
                    <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <Info className="w-3 h-3" />
                        {tBA('rationale')}
                    </p>
                    <p className="text-[12px] text-slate-600 leading-relaxed">{rule.rationale}</p>
                </div>
            )}
        </div>
    );
};

const BusinessRulesWidget = ({ data, tBA }: { data: any[]; tBA: (key: string) => string }) => {
    if (!Array.isArray(data) || data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-32 text-slate-400">
                <Shield className="w-8 h-8 mb-2 opacity-20" />
                <p className="text-[12px]">{tBA('noBusinessRules')}</p>
            </div>
        );
    }
    return (
        <div className="space-y-3">
            <div className="flex items-start gap-2 text-[11px] text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{tBA('businessRulesNote')}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {data.map((rule, idx) => (
                    <BusinessRuleCard key={idx} rule={rule} tBA={tBA} />
                ))}
            </div>
        </div>
    );
};

const RequirementCard = ({ req, tBA }: { req: any; tBA: (key: string) => string }) => {
    const priorityColors: Record<string, string> = {
        'Critical': 'bg-red-50 text-red-700 border-red-200',
        'High': 'bg-orange-50 text-orange-700 border-orange-200',
        'Medium': 'bg-blue-50 text-blue-700 border-blue-200',
        'Low': 'bg-slate-50 text-slate-600 border-slate-200',
        'Must Have': 'bg-red-50 text-red-700 border-red-200',
        'Should Have': 'bg-orange-50 text-orange-700 border-orange-200',
        'Could Have': 'bg-blue-50 text-blue-700 border-blue-200',
        "Won't Have": 'bg-slate-50 text-slate-500 border-slate-200',
    };
    const pColor = priorityColors[req.priority] || priorityColors['Medium'];

    return (
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 group">
            <div className="flex justify-between items-start mb-2">
                <span className="font-mono text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{req.id}</span>
                <span className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full border ${pColor}`}>{req.priority}</span>
            </div>
            <p className="text-slate-700 font-medium leading-relaxed mb-3 text-[12px]">{req.description}</p>
            {req.acceptanceCriteria && Array.isArray(req.acceptanceCriteria) && req.acceptanceCriteria.length > 0 && (
                <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100 mb-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">{tBA('acceptanceCriteria')}</p>
                    <ul className="space-y-1">
                        {req.acceptanceCriteria.map((ac: string, i: number) => (
                            <li key={i} className="text-[11px] text-slate-600 flex items-start gap-1.5">
                                <span className="text-emerald-500 mt-0.5 shrink-0 font-bold">›</span>
                                {ac}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            <div className="flex gap-3 text-[11px] text-slate-400 border-t border-slate-50 pt-2 flex-wrap">
                {req.source && <span className="flex items-center gap-1"><Info size={9} /> {tBA('source')}: {req.source}</span>}
                {req.category && <span>{tBA('category')}: {req.category}</span>}
            </div>
        </div>
    );
};

const UserStoryCard = ({ story, tBA }: { story: any; tBA: (key: string) => string }) => {
    const renderStoryText = () => {
        if (story.asA && story.iWant && story.soThat) {
            return (
                <div className="space-y-2.5 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100/50">
                    <div className="flex flex-col sm:flex-row gap-1.5">
                        <span className="font-bold text-indigo-700 min-w-[70px] uppercase text-[10px] tracking-wider mt-0.5 shrink-0">{tBA('storyAs')}</span>
                        <span className="text-slate-700 font-medium text-[12px]">{story.asA}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-1.5">
                        <span className="font-bold text-indigo-700 min-w-[70px] uppercase text-[10px] tracking-wider mt-0.5 shrink-0">{tBA('storyWant')}</span>
                        <span className="text-slate-700 font-medium text-[12px]">{story.iWant}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-1.5">
                        <span className="font-bold text-indigo-700 min-w-[70px] uppercase text-[10px] tracking-wider mt-0.5 shrink-0">{tBA('storySoThat')}</span>
                        <span className="text-slate-700 font-medium text-[12px]">{story.soThat}</span>
                    </div>
                </div>
            );
        }
        return <p className="text-slate-700 font-medium text-[12px]">{story.title || story.description || story.asA}</p>;
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-all duration-200 hover:border-indigo-200 group">
            <div className="bg-white px-4 py-3 border-b border-slate-100 flex justify-between items-center group-hover:bg-slate-50 transition-colors">
                <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded text-[11px] border border-indigo-100">{story.id}</span>
                    {story.title && <span className="text-slate-700 font-semibold text-[12px]">{story.title}</span>}
                </h4>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{tBA('userStory')}</span>
            </div>
            <div className="p-4">
                <div className="mb-4">{renderStoryText()}</div>
                {story.acceptanceCriteria && Array.isArray(story.acceptanceCriteria) && story.acceptanceCriteria.length > 0 && (
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/60">
                        <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                            {tBA('acceptanceCriteria')}
                        </h5>
                        <ul className="space-y-2">
                            {story.acceptanceCriteria.map((criteria: string, idx: number) => (
                                <li key={idx} className="text-[12px] flex gap-2 items-start text-slate-600 bg-white p-2.5 rounded-lg border border-slate-100 shadow-sm">
                                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                                    <span className="leading-relaxed">{criteria}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};

// ─── ADR Widget ────────────────────────────────────────────────────────────

const ADRCard = ({ adr, tBA }: { adr: any; tBA: (key: string, opts?: any) => string }) => {
    const [open, setOpen] = useState(false);

    const statusColors: Record<string, string> = {
        'Accepted': 'bg-emerald-50 text-emerald-700 border-emerald-200',
        'Proposed': 'bg-blue-50 text-blue-700 border-blue-200',
        'Superseded': 'bg-amber-50 text-amber-700 border-amber-200',
        'Deprecated': 'bg-rose-50 text-rose-700 border-rose-200',
    };
    const statusColor = statusColors[adr.status] || statusColors['Proposed'];

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-all duration-200 group">
            {/* Header */}
            <button
                className="w-full flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors text-left"
                onClick={() => setOpen(v => !v)}
            >
                <div className="flex items-center gap-2.5 min-w-0">
                    <span className="font-mono text-[11px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200 shrink-0">{adr.id}</span>
                    <span className="font-semibold text-slate-800 text-[13px] truncate">{adr.title}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                    {adr.status && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wide ${statusColor}`}>
                            {adr.status}
                        </span>
                    )}
                    {adr.date && <span className="text-[10px] text-slate-400 hidden sm:block">{adr.date}</span>}
                    {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </div>
            </button>

            {open && (
                <div className="p-4 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
                    {/* Context */}
                    {adr.context && (
                        <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                <Info className="w-3 h-3" />{tBA('adr.context')}
                            </p>
                            <p className="text-[12px] text-slate-700 leading-relaxed">{adr.context}</p>
                        </div>
                    )}
                    {/* Decision */}
                    {adr.decision && (
                        <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-100">
                            <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                <FileText className="w-3 h-3" />{tBA('adr.decision')}
                            </p>
                            <p className="text-[12px] text-indigo-900 font-semibold leading-relaxed italic">
                                &ldquo;{adr.decision}&rdquo;
                            </p>
                        </div>
                    )}
                    {/* Consequences */}
                    {adr.consequences && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            {adr.consequences.positive?.length > 0 && (
                                <div className="bg-emerald-50 rounded-lg p-2.5 border border-emerald-100">
                                    <p className="text-[10px] font-bold text-emerald-700 uppercase mb-1.5">{tBA('adr.positive')}</p>
                                    <ul className="space-y-1">
                                        {adr.consequences.positive.map((c: string, i: number) => (
                                            <li key={i} className="text-[11px] text-emerald-900 flex items-start gap-1.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />{c}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {adr.consequences.negative?.length > 0 && (
                                <div className="bg-rose-50 rounded-lg p-2.5 border border-rose-100">
                                    <p className="text-[10px] font-bold text-rose-700 uppercase mb-1.5">{tBA('adr.tradeoffs')}</p>
                                    <ul className="space-y-1">
                                        {adr.consequences.negative.map((c: string, i: number) => (
                                            <li key={i} className="text-[11px] text-rose-900 flex items-start gap-1.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />{c}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {adr.consequences.neutral?.length > 0 && (
                                <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-200">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-1.5">{tBA('adr.neutral')}</p>
                                    <ul className="space-y-1">
                                        {adr.consequences.neutral.map((c: string, i: number) => (
                                            <li key={i} className="text-[11px] text-slate-700 flex items-start gap-1.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />{c}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                    {/* Alternatives */}
                    {adr.alternatives?.length > 0 && (
                        <div className="bg-amber-50/60 rounded-lg p-2.5 border border-amber-100">
                            <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                <ArrowRight className="w-3 h-3" />{tBA('adr.alternatives')}
                            </p>
                            <ul className="space-y-1">
                                {adr.alternatives.map((a: string, i: number) => (
                                    <li key={i} className="text-[11px] text-slate-700 flex items-start gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />{a}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const ADRsWidget = ({ data, tBA }: { data: any[]; tBA: (key: string, opts?: any) => string }) => {
    if (!Array.isArray(data) || data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-32 text-slate-400">
                <FileText className="w-8 h-8 mb-2 opacity-20" />
                <p className="text-[12px]">{tBA('adr.empty')}</p>
            </div>
        );
    }
    return (
        <div className="space-y-3">
            <div className="flex items-start gap-2 text-[11px] text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2.5">
                <Info className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{tBA('adr.note')}</span>
            </div>
            <div className="space-y-2">
                {data.map((adr, idx) => <ADRCard key={idx} adr={adr} tBA={tBA} />)}
            </div>
        </div>
    );
};

// ─── Quality Attributes Widget ──────────────────────────────────────────────

const QualityAttributesWidget = ({ data, tBA }: { data: any[]; tBA: (key: string, opts?: any) => string }) => {
    if (!Array.isArray(data) || data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-32 text-slate-400">
                <Target className="w-8 h-8 mb-2 opacity-20" />
                <p className="text-[12px]">{tBA('qa.empty')}</p>
            </div>
        );
    }

    const priorityColors: Record<string, string> = {
        'Critical': 'bg-rose-50 text-rose-700 border-rose-200',
        'High': 'bg-orange-50 text-orange-700 border-orange-200',
        'Medium': 'bg-blue-50 text-blue-700 border-blue-200',
        'Low': 'bg-slate-50 text-slate-500 border-slate-200',
    };
    const categoryColors: Record<string, string> = {
        'Runtime': 'bg-indigo-100 text-indigo-700',
        'Development': 'bg-emerald-100 text-emerald-700',
        'Security': 'bg-rose-100 text-rose-700',
        'Operations': 'bg-amber-100 text-amber-700',
    };

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {data.map((qa, idx) => {
                    const pColor = priorityColors[qa.priority] || priorityColors['Medium'];
                    const cColor = categoryColors[qa.category] || 'bg-slate-100 text-slate-600';
                    return (
                        <div key={idx} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
                            <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 bg-slate-50/50">
                                <div className="flex items-center gap-2">
                                    <Target className="w-3.5 h-3.5 text-indigo-500" />
                                    <span className="font-bold text-slate-800 text-[13px]">{qa.attribute}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    {qa.category && (
                                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${cColor}`}>
                                            {qa.category}
                                        </span>
                                    )}
                                    {qa.priority && (
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wide ${pColor}`}>
                                            {qa.priority}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="p-3 space-y-2.5">
                                {qa.scenario && (
                                    <p className="text-[12px] text-slate-700 leading-relaxed italic border-l-[3px] border-indigo-300 pl-2.5 bg-indigo-50/30 py-1 rounded-r-lg">
                                        {qa.scenario}
                                    </p>
                                )}
                                {qa.measure && (
                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-lg">
                                        <CheckCircle className="w-3 h-3 text-emerald-600 shrink-0" />
                                        <span className="text-[11px] font-bold text-emerald-800 font-mono">{qa.measure}</span>
                                    </div>
                                )}
                                {qa.tactics?.length > 0 && (
                                    <div>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">{tBA('qa.tactics')}</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {qa.tactics.map((t: string, i: number) => (
                                                <span key={i} className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full border border-slate-200">
                                                    {t}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// ─── Tech Radar Widget ──────────────────────────────────────────────────────

const TechRadarWidget = ({ data, tBA }: { data: any[]; tBA: (key: string, opts?: any) => string }) => {
    if (!Array.isArray(data) || data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-32 text-slate-400">
                <Radio className="w-8 h-8 mb-2 opacity-20" />
                <p className="text-[12px]">{tBA('radar.empty')}</p>
            </div>
        );
    }

    // Normalize ring names: AI may respond in Spanish or with variants
    const normalizeRing = (ring: string): string => {
        const r = (ring || '').trim().toLowerCase();
        if (['adopt', 'adoptar', 'adopción', 'adopcion', 'use'].includes(r)) return 'Adopt';
        if (['trial', 'prueba', 'probar', 'evaluar con cautela'].includes(r)) return 'Trial';
        if (['assess', 'evaluar', 'evaluación', 'evaluacion', 'analizar'].includes(r)) return 'Assess';
        if (['hold', 'retener', 'pausar', 'no usar', 'evitar'].includes(r)) return 'Hold';
        return 'Assess'; // safe default
    };

    const normalizedData = data.map((d: any) => ({ ...d, ring: normalizeRing(d.ring) }));

    const ringConfig: Record<string, { color: string; bg: string; border: string; desc: string }> = {
        'Adopt': { color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', desc: tBA('radar.adoptDesc') },
        'Trial': { color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', desc: tBA('radar.trialDesc') },
        'Assess': { color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', desc: tBA('radar.assessDesc') },
        'Hold': { color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200', desc: tBA('radar.holdDesc') },
    };
    const rings = ['Adopt', 'Trial', 'Assess', 'Hold'];

    return (
        <div className="space-y-4">
            {rings.map(ring => {
                const items = normalizedData.filter((d: any) => d.ring === ring);
                if (items.length === 0) return null;
                const cfg = ringConfig[ring] || ringConfig['Assess'];
                return (
                    <div key={ring} className={`rounded-xl border ${cfg.border} ${cfg.bg} overflow-hidden`}>
                        <div className={`flex items-center gap-2.5 px-4 py-2.5 border-b ${cfg.border}`}>
                            <Radio className={`w-4 h-4 ${cfg.color}`} />
                            <span className={`font-extrabold text-[13px] uppercase tracking-wide ${cfg.color}`}>{ring}</span>
                            <span className="text-[11px] text-slate-500 italic">{cfg.desc}</span>
                            <span className={`ml-auto text-[11px] font-bold ${cfg.color}`}>{items.length}</span>
                        </div>
                        <div className="p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                            {items.map((item, idx) => (
                                <div key={idx} className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm hover:shadow-md transition-all duration-200">
                                    <div className="flex items-start justify-between gap-2 mb-1.5">
                                        <span className="font-bold text-slate-800 text-[12px] leading-snug">{item.name}</span>
                                        {item.quadrant && (
                                            <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-medium shrink-0 uppercase">
                                                {item.quadrant}
                                            </span>
                                        )}
                                    </div>
                                    {item.description && (
                                        <p className="text-[11px] text-slate-600 leading-relaxed mb-1.5">{item.description}</p>
                                    )}
                                    {item.rationale && (
                                        <p className="text-[10px] text-indigo-700 italic bg-indigo-50/50 px-2 py-1 rounded border border-indigo-100">{item.rationale}</p>
                                    )}
                                    {item.alternatives?.length > 0 && (
                                        <div className="mt-1.5 flex flex-wrap gap-1">
                                            {item.alternatives.map((a: string, i: number) => (
                                                <span key={i} className="text-[9px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{a}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

// --- Lazy Process Diagram ---

const LazyProcessDiagram = ({
    diagramTab,
    showDescription,
    setShowDescription,
    tBA,
    onConvertToMaster,
}: {
    diagramTab: any;
    showDescription: boolean;
    setShowDescription: (show: boolean) => void;
    tBA: any; // i18next TFunction
    onConvertToMaster?: (node: any, subDiagram?: any) => void;
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isVisible) return; // Already rendered
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.05 }
        );
        if (containerRef.current) observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, [isVisible]);

    return (
        <div ref={containerRef} className="space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Layout className="w-4 h-4 text-indigo-600" />
                    {tBA(`tab.${diagramTab.id}`, { defaultValue: diagramTab.label || 'Process Diagram' })}
                </h3>
                {diagramTab.description && (
                    <button
                        onClick={() => setShowDescription(!showDescription)}
                        className="text-[12px] text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
                    >
                        <BookOpen className="w-3.5 h-3.5" />
                        {showDescription ? tBA('hideExplanation') : tBA('viewExplanation')}
                    </button>
                )}
            </div>

            {showDescription && diagramTab.description && (
                <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-xl animate-in slide-in-from-top-2 duration-300 relative">
                    <button onClick={() => setShowDescription(false)} className="absolute top-2 right-2 text-indigo-400 hover:text-indigo-600">
                        <X className="w-4 h-4" />
                    </button>
                    <h4 className="text-[12px] font-bold text-indigo-900 mb-1 flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5" />
                        {tBA('aboutProcess')}
                    </h4>
                    <p className="text-indigo-800 text-[12px] leading-relaxed">{diagramTab.description}</p>
                </div>
            )}

            <div className="bg-white p-1 rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {isVisible ? (
                    <SmartDiagram
                        data={diagramTab.data}
                        title={diagramTab.label}
                        description={diagramTab.description}
                        className="border-0 shadow-none my-0"
                        onConvertToMaster={onConvertToMaster}
                    />
                ) : (
                    <div className="h-[500px] flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                        <div className="text-center">
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-slate-200 mb-2">
                                <div className="w-6 h-6 border-2 border-slate-400 border-t-slate-600 rounded-full animate-spin" />
                            </div>
                            <p className="text-[12px] text-slate-500">Loading diagram...</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Main Component ---

export const UniversalRoleDashboard: React.FC<UniversalRoleDashboardProps> = ({ data, projectId, roleId, savedAnswers, onConvertToMaster }) => {
    const { t: tBA } = useTranslation('businessAnalyst');
    const [showDescription, setShowDescription] = useState(false);

    // SMART FILTERING
    // `data` can be null while a role has no output yet: hooks run before the
    // early return below, so every read here must be null-safe.
    const visibleTabs = useMemo(() => data?.tabs?.filter(t =>
        !['slides', 'speakerNotes', 'layout', 'presentation', 'export'].some(forbidden => t.id.toLowerCase().includes(forbidden)) &&
        t.type !== 'hidden'
    ) || [], [data?.tabs]);

    // 'diagram' = generic process/swimlane flowchart → shown at bottom as large panel
    // 'c4-diagram' = C4 architecture tab → shown inside regularTabs tab strip + content
    const diagramTab = useMemo(() => visibleTabs.find(t => t.type === 'diagram'), [visibleTabs]);
    const regularTabs = useMemo(() => visibleTabs.filter(t => t.type !== 'diagram'), [visibleTabs]);

    const [activeTab, setActiveTab] = useState<string>(regularTabs[0]?.id || '');

    // Reset activeTab when tabs change (e.g. switching roles)
    // Without this, activeTab holds a stale ID from the previous role
    useEffect(() => {
        const firstTabId = regularTabs[0]?.id || '';
        setActiveTab(prev => {
            // Only reset if the current activeTab doesn't exist in the new tabs
            const existsInNewTabs = regularTabs.some(t => t.id === prev);
            return existsInNewTabs ? prev : firstTabId;
        });
    }, [regularTabs]);

    const normalizeTabData = useCallback((type: string, tabData: any) => {
        if (!tabData) return tabData;
        if (type === 'schema-visualizer') {
            if (Array.isArray(tabData)) return { tables: tabData };
            if (tabData.tables) return tabData;
            const arrayProp = Object.values(tabData).find(v => Array.isArray(v));
            if (arrayProp) return { tables: arrayProp };
            return { tables: [] };
        }
        if (type === 'key-value-grid') {
            if (Array.isArray(tabData)) return tabData;
            if (tabData.items && Array.isArray(tabData.items)) return tabData.items;
            if (tabData.grid && Array.isArray(tabData.grid)) return tabData.grid;
            if (tabData.decisions && Array.isArray(tabData.decisions)) return tabData.decisions;
            return Object.entries(tabData).map(([key, value]) => ({
                label: key, value: String(value), icon: 'Info', color: 'slate'
            }));
        }
        return tabData;
    }, []);

    const handleSaveDiscovery = useCallback(async (answers: any) => {
        if (projectId && roleId) await projectsService.saveDiscoveryAnswers(projectId, roleId, answers);
    }, [projectId, roleId]);

    if (!data) return null;
    const currentTab = regularTabs.find(t => t.id === activeTab);

    return (
        <div className="space-y-3 font-sans animate-in fade-in duration-700">

            {/* 1. Executive Summary — compact, no blue bar */}
            {data.summary && (
                <div className="bg-white px-5 py-3 rounded-xl border border-slate-100 shadow-sm">
                    <h4 className="font-bold text-slate-800 mb-1 flex items-center gap-2 text-sm">
                        <LayoutDashboard className="w-3.5 h-3.5 text-indigo-500" />
                        {tBA('executiveSummary')}
                    </h4>
                    <div className="text-[12px] text-slate-700 leading-relaxed font-sans">
                        {data.summary}
                    </div>
                </div>
            )}

            {/* 2. Tabs + KPIs + Content */}
            {regularTabs.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    {/* Tab Navigation */}
                    <div className="flex border-b border-slate-100 overflow-x-auto px-2 pt-2 gap-1">
                        {regularTabs.map((tab) => {
                            const isActive = activeTab === tab.id;
                            const Icon = getIcon(tab.icon);
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={cn(
                                        "px-4 py-2 rounded-lg text-[12px] font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap font-sans",
                                        isActive
                                            ? "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200"
                                            : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                                    )}
                                >
                                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                                    {tBA(`tab.${tab.id}`, { defaultValue: tab.label })}
                                </button>
                            );
                        })}
                    </div>

                    {/* KPI Cards — below tab nav */}
                    {data.kpis && data.kpis.length > 0 && (
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 px-4 pt-3">
                            {data.kpis.map((kpi, idx) => (
                                <KPICard key={idx} kpi={kpi} />
                            ))}
                        </div>
                    )}

                    {/* Tab Content */}
                    <div className="p-4">
                        {currentTab ? (
                            <div className="animate-in fade-in zoom-in-99 duration-200" key={currentTab.id}>
                                {currentTab.type === 'schema-visualizer' && <SchemaVisualizer data={normalizeTabData(currentTab.type, currentTab.data)} />}
                                {currentTab.type === 'tech-stack' && <TechStackDisplay data={currentTab.data} />}
                                {currentTab.type === 'key-value-grid' && <KeyValueGrid data={normalizeTabData(currentTab.type, currentTab.data)} />}

                                {currentTab.type === 'markdown' && (
                                    <div className="prose prose-slate max-w-none text-[12px]
                                        prose-headings:font-bold prose-headings:text-slate-900
                                        prose-li:text-slate-800
                                        prose-strong:text-indigo-700 prose-strong:font-bold
                                        prose-a:text-indigo-600 prose-a:font-bold">
                                        <ReactMarkdown
                                            remarkPlugins={[remarkGfm]}
                                            components={{
                                                h1: ({ node, ...props }) => <h1 className="text-2xl border-b-2 border-slate-200 pb-2 mb-6 text-slate-900 font-extrabold" {...props} />,
                                                h2: ({ node, ...props }) => <h2 className="text-xl mt-8 mb-4 text-indigo-900 border-b border-indigo-100 pb-2" {...props} />,
                                                h3: ({ node, ...props }) => <h3 className="text-base mt-6 mb-3 text-slate-900 bg-slate-100/50 p-2.5 rounded-lg border-l-4 border-indigo-500 inline-block pr-5" {...props} />,
                                                p: ({ node, ...props }) => <p className="text-slate-800 leading-relaxed mb-4 text-[12px]" {...props} />,
                                                ul: ({ node, ...props }) => <ul className="list-none space-y-2 ml-1 mb-5" {...props} />,
                                                ol: ({ node, ...props }) => <ol className="list-decimal list-outside space-y-2 ml-5 mb-5 marker:text-indigo-700 marker:font-bold" {...props} />,
                                                li: ({ node, ...props }) => (
                                                    <li className="flex gap-2.5 text-slate-800 leading-relaxed text-[12px]" {...props}>
                                                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 shrink-0" />
                                                        <div>{props.children}</div>
                                                    </li>
                                                ),
                                                blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-indigo-400 bg-indigo-50 p-4 rounded-r-xl italic text-slate-700 my-5" {...props} />,
                                                table: ({ node, ...props }) => <div className="overflow-x-auto my-5 rounded-xl border border-slate-200 shadow-sm"><table className="w-full text-left text-[12px]" {...props} /></div>,
                                                th: ({ node, ...props }) => <th className="bg-slate-50 p-3 font-bold text-slate-900 border-b border-slate-200 uppercase tracking-wider text-[10px]" {...props} />,
                                                td: ({ node, ...props }) => <td className="p-3 border-b border-slate-100 text-slate-800 text-[12px]" {...props} />,
                                                strong: ({ node, ...props }) => <strong className="text-indigo-700 font-bold" {...props} />,
                                            }}
                                        >
                                            {currentTab.data}
                                        </ReactMarkdown>
                                    </div>
                                )}

                                {currentTab.type === 'c4-diagram' && <C4DiagramWidget data={currentTab.data} description={currentTab.description} />}
                                {currentTab.type === 'interactive-questions' && (
                                    <InteractiveDiscoveryWidget
                                        data={currentTab.data}
                                        savedAnswers={savedAnswers}
                                        onSave={handleSaveDiscovery}
                                        tBA={tBA}
                                    />
                                )}
                                {currentTab.type === 'user-stories' && (
                                    <div className="space-y-4">
                                        {Array.isArray(currentTab.data) && currentTab.data.map((story: any, idx: number) => (
                                            <UserStoryCard key={idx} story={story} tBA={tBA} />
                                        ))}
                                    </div>
                                )}
                                {currentTab.type === 'requirements' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {Array.isArray(currentTab.data) && currentTab.data.map((req: any, idx: number) => (
                                            <RequirementCard key={idx} req={req} tBA={tBA} />
                                        ))}
                                    </div>
                                )}
                                {currentTab.type === 'business-rules' && (
                                    <BusinessRulesWidget data={currentTab.data} tBA={tBA} />
                                )}
                                {currentTab.type === 'matrix' && <MatrixWidget data={currentTab.data} />}
                                {currentTab.type === 'business-model-canvas' && <BusinessModelCanvasWidget data={currentTab.data} />}
                                {currentTab.type === 'market-analysis' && <MarketAnalysisWidget data={currentTab.data} tBA={tBA} />}
                                {currentTab.type === 'adrs' && <ADRsWidget data={currentTab.data} tBA={tBA} />}
                                {currentTab.type === 'quality-attributes' && <QualityAttributesWidget data={currentTab.data} tBA={tBA} />}
                                {currentTab.type === 'tech-radar' && <TechRadarWidget data={currentTab.data} tBA={tBA} />}
                                {currentTab.type === 'table' && Array.isArray(currentTab.data) && (
                                    <DataTableWidget data={currentTab.data} description={currentTab.description} />
                                )}
                                {currentTab.type === 'custom' && (
                                    <div className="p-4 bg-amber-50 text-amber-800 rounded-lg border border-amber-200 text-[12px]">
                                        Custom content type not yet implemented.
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                                <Info className="w-10 h-10 mb-3 opacity-20" />
                                <p className="text-[12px]">{tBA('selectTabPrompt')}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* 3. Process Diagram — lazy-load at bottom */}
            {diagramTab && <LazyProcessDiagram
                diagramTab={diagramTab}
                showDescription={showDescription}
                setShowDescription={setShowDescription}
                tBA={tBA}
                onConvertToMaster={onConvertToMaster}
            />}
        </div>
    );
};
