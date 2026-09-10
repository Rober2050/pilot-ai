import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    LayoutDashboard, Target, Users, Zap, MessageSquare,
    Clock, CheckCircle2, CheckCircle, Map, BarChart2,
    Compass, Flag, ShieldAlert, Lightbulb, Package, PackageX, Star
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { projectsService } from '../../services/firebase/projectsService';
import { cn } from '../../lib/utils';

// --- Modular Imports ---
import { normalizeProductData } from './product-manager/utils/normalization';
import { ProductManagerDashboardProps } from './product-manager/utils/types';
import { KPICard } from './product-manager/components/KPICard';
import { EmptyState } from './product-manager/components/EmptyState';
import { SectionHeader } from './product-manager/components/SectionHeader';
import { DiscoveryQuestionCard } from './product-manager/components/DiscoveryQuestionCard';

import { OKRCard } from './product-manager/components/OKRCard';
import { AssumptionCard } from './product-manager/components/AssumptionCard';
import { RICETable } from './product-manager/components/RICETable';

// --- Strategy Components ---
import { RoadmapView } from './RoadmapView';
import { PrioritizationChart } from './PrioritizationChart';
import { RadarCompetitors } from './RadarCompetitors';

// --- Main Component ---

export const ProductManagerDashboard = ({ data, projectId, roleId, savedAnswers, onConvertToMaster }: ProductManagerDashboardProps) => {
    const { t, i18n } = useTranslation('product');
    const [activeTab, setActiveTab] = useState<'dna' | 'scope' | 'roadmap' | 'discovery'>('dna');
    const [answers, setAnswers] = useState<Record<string, string>>(savedAnswers || {});
    const [isSaving, setIsSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        if (savedAnswers) {
            setAnswers(savedAnswers);
        }
    }, [savedAnswers]);

    const handleAnswerChange = (id: string, value: string) => {
        setAnswers(prev => ({ ...prev, [id]: value }));
        setHasChanges(true);
    };

    const handleSave = async () => {
        if (!projectId || !roleId) return;
        setIsSaving(true);
        try {
            await projectsService.saveDiscoveryAnswers(projectId, roleId, answers);
            setHasChanges(false);
        } catch (error) {
            console.error("Error saving answers:", error);
        } finally {
            setIsSaving(false);
        }
    };

    // --- Normalization ---
    const normalized = normalizeProductData(data);

    // --- Render Helper ---
    const renderContent = (content: any) => {
        if (!content) return <span className="text-slate-400 italic">{t('noData')}</span>;
        if (typeof content === 'string') return <div className="prose prose-slate text-sm"><ReactMarkdown>{content}</ReactMarkdown></div>;
        if (Array.isArray(content)) {
            return (
                <ul className="space-y-1.5">
                    {content.map((item, idx) => (
                        <li key={idx} className="flex gap-2 items-start text-[12px] text-slate-700 font-sans leading-normal">
                            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500 mt-0.5 shrink-0" />
                            <span>{typeof item === 'object' ? renderContent(item) : item}</span>
                        </li>
                    ))}
                </ul>
            );
        }
        return <div className="text-[12px] text-slate-700 font-sans">{JSON.stringify(content)}</div>;
    };

    // --- Tab Config ---
    const tabs = [
        { id: 'dna', label: t('tabs.dna'), icon: Compass },
        { id: 'scope', label: t('tabs.scope'), icon: Package },
        { id: 'roadmap', label: t('tabs.roadmap'), icon: Map },
        { id: 'discovery', label: t('tabs.discovery'), icon: MessageSquare, count: normalized.discoveryQuestions.length },
    ];

    return (
        <div className="space-y-3 font-sans animate-in fade-in duration-700">
            {/* 1. Executive Summary */}
            {normalized.summary && (
                <div className="bg-white px-5 py-3 rounded-xl border border-slate-100 shadow-sm">
                    <h4 className="font-bold text-slate-800 mb-1 flex items-center gap-2 text-sm">
                        <LayoutDashboard className="w-3.5 h-3.5 text-indigo-500" />
                        {t('executiveSummary')}
                    </h4>
                    <p className="text-[12px] text-slate-700 leading-normal font-sans">
                        {typeof normalized.summary === 'object'
                            ? (normalized.summary.statement || JSON.stringify(normalized.summary))
                            : normalized.summary}
                    </p>

                    {/* North Star Metric badge */}
                    {normalized.northStarMetric && (
                        <div className="mt-2 inline-flex items-center gap-1.5 bg-violet-50 text-violet-700 px-3 py-1 rounded-full text-[11px] font-bold">
                            <Star className="w-3 h-3" />
                            {t('northStar')}: {typeof normalized.northStarMetric === 'string' ? normalized.northStarMetric : JSON.stringify(normalized.northStarMetric)}
                        </div>
                    )}
                </div>
            )}

            {/* 2. Navigation Tabs — PM Command Center */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex border-b border-slate-100 overflow-x-auto px-2 pt-2 gap-1">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`px-4 py-2 rounded-lg text-[12px] font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap font-sans
                                ${activeTab === tab.id
                                    ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200'
                                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                }
                            `}
                        >
                            <tab.icon className={`w-3.5 h-3.5 ${activeTab === tab.id ? 'text-indigo-600' : 'text-slate-400'}`} />
                            {tab.label}
                            {tab.count !== undefined && tab.count > 0 && (
                                <span className="bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full text-[10px] ml-0.5">
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}

                    {/* Save Action for Discovery */}
                    {activeTab === 'discovery' && (
                        <div className="ml-auto p-1">
                            <button
                                onClick={handleSave}
                                disabled={isSaving || !hasChanges}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 shadow-sm text-[12px]",
                                    hasChanges ? "bg-indigo-600 text-white hover:bg-indigo-700" : "bg-slate-100 text-slate-400 cursor-not-allowed"
                                )}
                            >
                                {isSaving ? <Clock className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                                {isSaving ? t('saving') : t('save')}
                            </button>
                        </div>
                    )}
                </div>

                {/* 3. KPI Cards — below tabs bar */}
                {normalized.kpis.length > 0 && (
                    <div className="px-4 pt-3">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                            {normalized.kpis.map((kpi, idx) => (
                                <KPICard key={idx} kpi={kpi} />
                            ))}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-2 text-right italic">
                            {i18n.language.startsWith('es')
                                ? 'Estimaciones generadas por IA basadas en benchmarks de la industria. Verificar con datos de mercado propios.'
                                : 'AI-generated estimates based on industry benchmarks. Verify with your own market data.'}
                        </p>
                    </div>
                )}

                {/* ============= TAB CONTENT ============= */}
                <div className="p-4">

                    {/* ───── TAB: PRODUCT DNA ───── */}
                    {activeTab === 'dna' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Left Column */}
                                <div className="space-y-5">
                                    {/* Product Vision */}
                                    <section>
                                        <SectionHeader icon={Target} title={t('sections.productVision')} />
                                        <div className="bg-indigo-50/30 p-4 rounded-xl border border-indigo-100 text-[12px] text-slate-700 leading-normal font-sans">
                                            {normalized.vision ? renderContent(normalized.vision) : <EmptyState message={t('empty.vision')} />}
                                        </div>
                                    </section>

                                    {/* Positioning Statement */}
                                    {normalized.positioningStatement && (
                                        <section>
                                            <SectionHeader icon={Flag} title={t('sections.positioningStatement')} />
                                            <div className="bg-gradient-to-br from-violet-50 to-indigo-50/50 p-4 rounded-xl border border-violet-100">
                                                <p className="text-[12px] text-slate-700 leading-normal font-sans italic">
                                                    "{typeof normalized.positioningStatement === 'string' ? normalized.positioningStatement : JSON.stringify(normalized.positioningStatement)}"
                                                </p>
                                            </div>
                                        </section>
                                    )}

                                    {/* Jobs-to-be-Done */}
                                    {normalized.jtbd.length > 0 && (
                                        <section>
                                            <SectionHeader icon={Lightbulb} title={t('sections.jtbd')} subtitle={t('sections.jtbdSubtitle')} />
                                            <div className="space-y-2">
                                                {normalized.jtbd.map((job, idx) => (
                                                    <div key={idx} className="flex items-start gap-2 p-2.5 bg-amber-50/50 border border-amber-100 rounded-lg">
                                                        <span className="text-amber-500 font-bold text-[11px] mt-0.5 shrink-0">J{idx + 1}</span>
                                                        <span className="text-[12px] text-slate-700 leading-normal font-sans">{job}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </section>
                                    )}
                                </div>

                                {/* Right Column */}
                                <div className="space-y-5">
                                    {/* ICP */}
                                    <section>
                                        <SectionHeader icon={Users} title={t('sections.icp')} />
                                        <div className="space-y-2">
                                            {normalized.targetAudience && normalized.targetAudience.length > 0
                                                ? renderContent(normalized.targetAudience)
                                                : <EmptyState message={t('empty.audience')} />}
                                        </div>
                                    </section>

                                    {/* Assumptions & Hypotheses */}
                                    {normalized.assumptions.length > 0 && (
                                        <section>
                                            <SectionHeader icon={ShieldAlert} title={t('sections.hypotheses')} subtitle={t('sections.hypothesesSubtitle')} />
                                            <div className="space-y-2">
                                                {normalized.assumptions.map((a, idx) => (
                                                    <AssumptionCard key={idx} assumption={a} index={idx} />
                                                ))}
                                            </div>
                                        </section>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ───── TAB: MVP SCOPE ───── */}
                    {activeTab === 'scope' && (
                        <div className="space-y-5">
                            {/* Row 1: Features (60%) + Competitive Landscape (40%) side by side */}
                            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-start">
                                {/* Left: RICE or Features fallback */}
                                {normalized.riceFeatures.length > 0 ? (
                                    <section className="lg:col-span-3">
                                        <SectionHeader icon={Zap} title={t('sections.riceTable')} subtitle={t('sections.riceTableSubtitle')} />
                                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                            <RICETable features={normalized.riceFeatures} />
                                        </div>
                                    </section>
                                ) : (
                                    <section className="lg:col-span-3">
                                        <SectionHeader icon={Zap} title={t('sections.mvpScope')} subtitle={t('sections.mvpScopeSubtitle')} />
                                        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
                                            {normalized.keyFeatures && normalized.keyFeatures.length > 0 ? (
                                                Array.isArray(normalized.keyFeatures) ? normalized.keyFeatures.map((feature, idx) => (
                                                    <div key={idx} className="p-3 hover:bg-slate-50 transition-colors">
                                                        <h4 className="font-semibold text-slate-800 mb-0.5 flex items-center gap-2 text-sm">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                                                            {feature.feature || feature.name || feature.featureName || t('rice.feature')}
                                                        </h4>
                                                        <p className="text-[12px] text-slate-600 pl-3.5 leading-normal font-sans">
                                                            {feature.description || feature.desc || (typeof feature === 'string' ? feature : '')}
                                                        </p>
                                                    </div>
                                                )) : renderContent(normalized.keyFeatures)
                                            ) : <EmptyState message={t('empty.features')} />}
                                        </div>
                                    </section>
                                )}

                                {/* Right: Competitive Landscape */}
                                {normalized.competitors && normalized.competitors.length > 0 && (
                                    <section className="lg:col-span-2">
                                        <SectionHeader icon={BarChart2} title={t('sections.competitive')} subtitle={t('sections.competitiveSubtitle')} />
                                        <RadarCompetitors data={normalized.competitors} />
                                    </section>
                                )}
                            </div>

                            {/* Row 2: In Scope / Out of Scope (when AI generates it) */}
                            {(normalized.mvpInScope.length > 0 || normalized.mvpOutOfScope.length > 0) && (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {/* IN SCOPE */}
                                    <section>
                                        <div className="flex items-center gap-2 mb-3">
                                            <Package className="w-4 h-4 text-emerald-500" />
                                            <h3 className="text-sm font-bold text-emerald-700">{t('sections.inScope')}</h3>
                                        </div>
                                        <div className="space-y-1.5">
                                            {normalized.mvpInScope.map((item, idx) => (
                                                <div key={idx} className="flex items-start gap-2 p-2.5 bg-emerald-50/50 border border-emerald-100 rounded-lg">
                                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                                                    <span className="text-[12px] text-slate-700 leading-normal font-sans">{item}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </section>

                                    {/* OUT OF SCOPE */}
                                    <section>
                                        <div className="flex items-center gap-2 mb-3">
                                            <PackageX className="w-4 h-4 text-slate-400" />
                                            <h3 className="text-sm font-bold text-slate-500">{t('sections.outScope')}</h3>
                                        </div>
                                        <div className="space-y-1.5">
                                            {normalized.mvpOutOfScope.map((item, idx) => (
                                                <div key={idx} className="flex items-start gap-2 p-2.5 bg-slate-50 border border-slate-100 rounded-lg">
                                                    <PackageX className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                                                    <span className="text-[12px] text-slate-500 leading-normal font-sans">{item}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ───── TAB: ROADMAP & OKRs ───── */}
                    {activeTab === 'roadmap' && (
                        <div className="space-y-6">
                            {/* Product Roadmap */}
                            <section>
                                <SectionHeader icon={Map} title={t('sections.roadmap')} subtitle={t('sections.roadmapSubtitle')} />
                                {normalized.roadmap && normalized.roadmap.length > 0
                                    ? <RoadmapView phases={normalized.roadmap} />
                                    : <EmptyState message={t('empty.roadmap')} icon={Map} />}
                            </section>

                            {/* OKRs */}
                            {normalized.okrs.length > 0 && (
                                <section>
                                    <SectionHeader icon={Target} title={t('sections.okrs')} subtitle={t('sections.okrsSubtitle')} />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {normalized.okrs.map((okr, idx) => (
                                            <OKRCard key={idx} okr={okr} index={idx} />
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Prioritization Matrix */}
                            {normalized.prioritization && normalized.prioritization.length > 0 && (
                                <section>
                                    <SectionHeader icon={Target} title={t('sections.prioritization')} subtitle={t('sections.prioritizationSubtitle')} />
                                    <PrioritizationChart data={normalized.prioritization} />
                                </section>
                            )}

                            {/* NOTE: Generic charts (IDEO, TAM/SAM/SOM, LTV/CAC) removed intentionally.
                               Those belong to Strategy Analyst. PM visualizations are:
                               RICE Table, Prioritization Matrix, Competitive Landscape, Roadmap, OKRs */}
                        </div>
                    )}

                    {/* ───── TAB: DISCOVERY ───── */}
                    {activeTab === 'discovery' && (
                        <div className="max-w-3xl mx-auto">
                            <div className="mb-4 text-center">
                                <h2 className="text-lg font-bold text-slate-800 mb-1">{t('sections.stakeholderDiscovery')}</h2>
                                <p className="text-[12px] text-slate-500 font-sans">{t('sections.stakeholderDiscoverySubtitle')}</p>
                            </div>
                            <div className="space-y-3">
                                {normalized.discoveryQuestions.length > 0 ? normalized.discoveryQuestions.map((q, idx) => (
                                    <DiscoveryQuestionCard
                                        key={q.id}
                                        q={q}
                                        index={idx}
                                        answer={answers[q.id] || ''}
                                        onAnswerChange={(val) => handleAnswerChange(q.id, val)}
                                    />
                                )) : <EmptyState message={t('empty.discovery')} icon={MessageSquare} />}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductManagerDashboard;
