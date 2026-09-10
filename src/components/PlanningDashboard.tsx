import React, { useState, useMemo, useEffect } from 'react';

import { useTranslation } from 'react-i18next';

import {

    Play, Calculator,

    AlertTriangle, Download, FileText, FolderOpen,

    BarChart3, Zap, Layers, ListChecks, BookOpen, ChevronRight

} from 'lucide-react';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

import { GanttChart } from './dashboard/GanttChart';

import { RiskMatrix } from './dashboard/RiskMatrix';

import { FinancialView } from './dashboard/FinancialView';

import { MethodologyView } from './dashboard/MethodologyView';

import { AgileMethodologyView } from './dashboard/AgileMethodologyView';

import { PMOPackView } from './dashboard/PMOPackView';



import { excelGenerator } from '../services/export/excelGenerator';

import { calculateTotalWeeks, calculateRecalculatedWeeks } from '../utils/projectUtils';

import { Resource, TechStack, Phase, Task, AgileData } from '../types/project';



type ActiveMode = 'pmo' | 'agile';



interface PlanningDashboardProps {

    data: {

        summary: string;

        resources: Resource[];

        techStack: TechStack;

        projectPhases: Phase[];

        agileData?: AgileData;

    };

    methodology?: 'agile' | 'pmo' | 'hybrid';

}



interface SprintItem {

    task: Task;

    phaseName: string;

}



interface Sprint {

    number: number;

    weekStart: number;

    weekEnd: number;

    goal: string;

    items: SprintItem[];

    capacityHours: number;

    plannedHours: number;

}



interface BacklogItem {

    task: Task;

    phaseName: string;

    phaseIndex: number;

    sprintNumber: number;

}



const SPRINT_WEEKS = 2;



const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (

    <div className={`bg-white rounded-xl shadow-sm border border-slate-200 ${className}`}>

        {children}

    </div>

);



const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];



const PlanningDashboard: React.FC<PlanningDashboardProps> = ({ data, methodology }) => {

    const { t } = useTranslation('planning');



    // Determine initial active mode from methodology

    const initialMode: ActiveMode = methodology === 'agile' ? 'agile' : 'pmo';

    const [activeMode, setActiveMode] = useState<ActiveMode>(initialMode);



    // Update mode if methodology prop changes

    useEffect(() => {

        if (methodology === 'agile') setActiveMode('agile');

        else if (methodology === 'pmo' || !methodology) setActiveMode('pmo');

        // hybrid: keep current or default pmo

    }, [methodology]);



    type ViewType = 'gantt' | 'risks' | 'financial' | 'calculation' | 'pmo' | 'sprints' | 'backlog' | 'scrum' | 'agile-methodology';



    const [view, setView] = useState<ViewType>(initialMode === 'agile' ? 'sprints' : 'gantt');

    const [isSimulating, setIsSimulating] = useState(false);

    const [showPlan, setShowPlan] = useState(true);

    const [isEditingResources, setIsEditingResources] = useState(false);

    const [showCriticalPath, setShowCriticalPath] = useState(false);

    const [isExporting, setIsExporting] = useState(false);



    // Reset view when mode changes

    const handleModeChange = (mode: ActiveMode) => {

        setActiveMode(mode);

        setView(mode === 'agile' ? 'sprints' : 'gantt');

    };



    const projectPhases = data?.projectPhases || [];



    const [resources, setResources] = useState<Resource[]>([]);

    const [backupResources, setBackupResources] = useState<Resource[]>([]);

    const [initialResources, setInitialResources] = useState<Resource[]>([]);



    useEffect(() => {

        if (data?.resources) {

            const mappedResources = data.resources.map((r, index) => ({ ...r, id: index + 1 }));

            setResources(mappedResources);

            setInitialResources(JSON.parse(JSON.stringify(mappedResources)));

        }

    }, [data]);



    const handleUpdateResource = (id: number, field: keyof Resource, value: any) => {

        setResources(prev => prev.map(res =>

            res.id === id ? { ...res, [field]: value } : res

        ));

    };



    const handleAddResource = () => {

        const newId = Math.max(...resources.map(r => r.id), 0) + 1;

        setResources(prev => [...prev, {

            id: newId,

            role: "Nuevo Rol",

            seniority: "Mid-Level",

            count: 1,

            rate: 40

        }]);

    };



    const handleRemoveResource = (id: number) => {

        setResources(prev => prev.filter(res => res.id !== id));

    };



    const planningPhases = useMemo(() => {

        return projectPhases.filter(p =>

            !p.name.toLowerCase().includes('post-lanzamiento') &&

            !p.name.toLowerCase().includes('post-launch')

        );

    }, [projectPhases]);



    const totalWeeks = useMemo(() => calculateTotalWeeks(planningPhases), [planningPhases]);



    const recalculatedData = useMemo(() => {

        const initialHeadcount = initialResources.reduce((acc, res) => acc + Number(res.count), 0);

        const currentHeadcount = resources.reduce((acc, res) => acc + Number(res.count), 0);

        const finalWeeks = calculateRecalculatedWeeks(totalWeeks, initialHeadcount, currentHeadcount);

        const isReplanned = initialHeadcount !== currentHeadcount;

        return {

            weeks: Math.round(finalWeeks * 10) / 10,

            months: Math.round((finalWeeks / 4.33) * 10) / 10,

            days: Math.round(finalWeeks * 5),

            isReplanned

        };

    }, [resources, initialResources, totalWeeks]);



    const financialData = useMemo(() => {

        const monthlyCost = resources.reduce((acc, res) => acc + (res.rate * 160 * res.count), 0);

        const durationMonths = recalculatedData.weeks / 4.33;

        const totalCost = monthlyCost * durationMonths;

        const teamSize = resources.reduce((acc, res) => acc + Number(res.count), 0);

        return { monthlyCost, totalCost, teamSize };

    }, [resources, recalculatedData.weeks]);



    // ── Agile: Sprint calculation ──────────────────────────────────────────────

    const sprints = useMemo((): Sprint[] => {

        if (totalWeeks === 0 || planningPhases.length === 0) return [];

        const sprintCapacityHours = Math.round(financialData.teamSize * SPRINT_WEEKS * 40 * 0.7);

        const result: Sprint[] = [];

        let sprintNumber = 1;



        for (let startWeek = 1; startWeek <= totalWeeks; startWeek += SPRINT_WEEKS) {

            const endWeek = Math.min(startWeek + SPRINT_WEEKS - 1, totalWeeks);

            const sprintItems: SprintItem[] = [];



            planningPhases.forEach(phase => {

                const tasks = phase.tasks || [];

                const totalPhaseTasks = tasks.length;

                tasks.forEach((task, idx) => {

                    const taskStartWeek = phase.startWeek + Math.floor(

                        (idx / Math.max(totalPhaseTasks, 1)) * phase.duration

                    );

                    if (taskStartWeek >= startWeek && taskStartWeek <= endWeek) {

                        sprintItems.push({ task, phaseName: phase.name });

                    }

                });

            });



            const dominantPhase = planningPhases.find(p =>

                p.startWeek <= endWeek && (p.startWeek + p.duration) > startWeek

            );



            const plannedHours = sprintItems.reduce((acc, { task }) => acc + (task.days * 8), 0);



            result.push({

                number: sprintNumber++,

                weekStart: startWeek,

                weekEnd: endWeek,

                goal: dominantPhase?.name ?? `Sprint ${sprintNumber}`,

                items: sprintItems,

                capacityHours: sprintCapacityHours,

                plannedHours

            });

        }

        return result;

    }, [planningPhases, totalWeeks, financialData.teamSize]);



    // ── Agile: Backlog ─────────────────────────────────────────────────────────

    const backlogItems = useMemo((): BacklogItem[] => {

        const items: BacklogItem[] = [];

        planningPhases.forEach((phase, phaseIdx) => {

            const tasks = phase.tasks || [];

            const totalPhaseTasks = tasks.length;

            tasks.forEach((task, taskIdx) => {

                const taskStartWeek = phase.startWeek + Math.floor(

                    (taskIdx / Math.max(totalPhaseTasks, 1)) * phase.duration

                );

                const sprintNumber = Math.ceil(taskStartWeek / SPRINT_WEEKS);

                items.push({ task, phaseName: phase.name, phaseIndex: phaseIdx, sprintNumber });

            });

        });

        return items.sort((a, b) => {

            if (a.phaseIndex !== b.phaseIndex) return a.phaseIndex - b.phaseIndex;

            if (a.task.critical !== b.task.critical) return a.task.critical ? -1 : 1;

            return 0;

        });

    }, [planningPhases]);



    // Chart data

    const effortByPhaseData = useMemo(() => {

        return planningPhases.map(phase => ({

            name: phase.name,

            value: (phase.tasks || []).reduce((sum, t) => sum + (t.days || 0), 0)

        })).filter(p => p.value > 0);

    }, [planningPhases]);



    const RISK_COLORS_CHART = ['#EF4444', '#F97316', '#F59E0B', '#10B981'];

    const riskDistributionData = useMemo(() => {

        const counts: Record<string, number> = { Crítico: 0, Alto: 0, Medio: 0, Bajo: 0 };

        planningPhases.flatMap(p => p.tasks || []).forEach(t => {

            const score = (t.risk?.prob ?? 1) * (t.risk?.impact ?? 1);

            if (score >= 7) counts['Crítico']++;

            else if (score >= 5) counts['Alto']++;

            else if (score >= 3) counts['Medio']++;

            else counts['Bajo']++;

        });

        return Object.entries(counts).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value }));

    }, [planningPhases]);



    const runSimulation = () => {

        setIsSimulating(true);

        setTimeout(() => { setIsSimulating(false); setShowPlan(true); setView('gantt'); }, 1500);

    };



    const handleStartEditing = () => {

        setBackupResources(JSON.parse(JSON.stringify(resources)));

        setIsEditingResources(true);

    };

    const handleCancelEditing = () => { setResources(backupResources); setIsEditingResources(false); };

    const handleSaveEditing = () => { setIsEditingResources(false); };



    const handleExport = async () => {

        setIsExporting(true);

        try {

            const blueprintData = {

                meta: {

                    projectName: "Estimación de Desarrollo",

                    version: "1.0",

                    createdAt: new Date().toISOString(),

                    projectId: "estimacion-demo",

                    language: "es" as "es" | "en",

                    updatedAt: new Date().toISOString()

                },

                ideaOriginal: "Estimación generada desde Dashboard",

                documentationConfig: {

                    "project-manager": { text: true, charts: true, excel: true, flowDiagrams: true, swimlanes: false, c4: false, architecture: true, otherFormats: [] }

                },

                roles: {

                    "project-manager": {

                        content: { ...data, resources },

                        status: "completed" as const,

                        lastUpdated: new Date().toISOString()

                    }

                }

            };

            const dummyRoleConfig: any = { roleId: 'project-manager', displayName: 'Project Manager' };

            await excelGenerator.generateSpreadsheet(blueprintData, [dummyRoleConfig]);

        } catch (error) {

            console.error("Export failed:", error);

            alert("Hubo un error al generar el reporte. Por favor intente nuevamente.");

        } finally {

            setIsExporting(false);

        }

    };



    // ── Methodology badge config ───────────────────────────────────────────────

    const methodologyBadge = {

        pmo: { icon: <BarChart3 className="w-3.5 h-3.5" />, bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' },

        agile: { icon: <Zap className="w-3.5 h-3.5" />, bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-300' },

        hybrid: { icon: <Layers className="w-3.5 h-3.5" />, bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-300' },

    };

    const badgeConfig = methodologyBadge[methodology ?? 'pmo'];

    const badgeLabel = t(`methodology.mode.badge.${methodology ?? 'pmo'}`);



    // ── DoD / DoR arrays ───────────────────────────────────────────────────────

    const dodItems = t('scrumInfo.dod', { returnObjects: true }) as string[];

    const dorItems = t('scrumInfo.dor', { returnObjects: true }) as string[];





    return (

        <div className="text-slate-800 font-sans">



            {/* Executive Summary - Compact, matching Strategy Analyst style */}

            {showPlan && data.summary && (

                <div className="bg-white px-5 py-3 rounded-xl border border-slate-100 shadow-sm mb-4">

                    <h4 className="font-bold text-slate-800 mb-1 pb-1 flex items-center gap-2 text-sm">

                        <FileText className="w-3.5 h-3.5 text-indigo-500" />

                        {t('dashboard.summaryTitle', 'Project Manager Summary')}

                    </h4>

                    <p className="text-slate-700 leading-normal text-[12px] font-sans">

                        {data.summary}

                    </p>

                </div>

            )}



            {/* Compact header: Algorithm subtitle + badges + export button */}

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">

                <div className="flex items-center gap-3 flex-wrap">

                    {/* Methodology badge */}

                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${badgeConfig.bg} ${badgeConfig.text} ${badgeConfig.border}`}>

                        {badgeConfig.icon}

                        {badgeLabel}

                    </span>

                    {/* Hybrid mode toggle */}

                    {methodology === 'hybrid' && (

                        <div className="flex bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">

                            <button

                                onClick={() => handleModeChange('pmo')}

                                className={`flex items-center gap-1 px-3 py-1 text-xs font-semibold transition-colors ${activeMode === 'pmo' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-700'}`}

                            >

                                <BarChart3 className="w-3 h-3" /> PMO

                            </button>

                            <button

                                onClick={() => handleModeChange('agile')}

                                className={`flex items-center gap-1 px-3 py-1 text-xs font-semibold transition-colors ${activeMode === 'agile' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-700'}`}

                            >

                                <Zap className="w-3 h-3" /> Agile

                            </button>

                        </div>

                    )}

                    <p className="text-[12px] text-slate-500 font-sans">{t('dashboard.subtitle', 'Algorithm: COCOMO II + Weighted PERT (Executive Mode)')}</p>

                </div>



                <div className="flex gap-3 shrink-0">

                    {showPlan && (

                        <button

                            onClick={handleExport}

                            disabled={isExporting}

                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-200 font-semibold text-sm"

                        >

                            {isExporting ? (

                                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> {t('dashboard.exporting', 'Generating...')}</>

                            ) : (

                                <><Download className="w-4 h-4" /> {t('dashboard.export', 'Export Report')}</>

                            )}

                        </button>

                    )}

                    {!showPlan && (

                        <button

                            onClick={runSimulation}

                            disabled={isSimulating}

                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 text-white px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-200 font-semibold text-sm"

                        >

                            {isSimulating ? (

                                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> {t('dashboard.calculating', 'Calculating...')}</>

                            ) : (

                                <><Play className="w-5 h-5" /> {t('dashboard.generate', 'Generate Plan')}</>

                            )}

                        </button>

                    )}

                </div>

            </div>



            {showPlan && (

                <div className="animate-in slide-in-from-bottom-4 duration-700">



                    {/* KPI Cards */}

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">

                        <Card className="p-5 border-t-4 border-t-blue-500">

                            <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1 flex justify-between items-center">

                                <span>Tiempo Total</span>

                                {recalculatedData.isReplanned && (

                                    <span className="bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded-full font-bold animate-pulse">REPLANIFICADO</span>

                                )}

                            </div>

                            <div className="text-3xl font-bold text-slate-800 flex flex-col">

                                <span className="flex items-baseline gap-1">{recalculatedData.weeks} <span className="text-sm font-normal text-slate-500">Semanas</span></span>

                                <div className="flex gap-3 mt-1">

                                    <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-md">{recalculatedData.months} Meses</span>

                                    <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-md">{recalculatedData.days} Días</span>

                                </div>

                            </div>

                        </Card>

                        <Card className="p-5 border-t-4 border-t-emerald-500">

                            <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Costo Total Est.</div>

                            <div className="text-3xl font-bold text-slate-800">${financialData.totalCost.toLocaleString()}</div>

                        </Card>

                        <Card className="p-5 border-t-4 border-t-purple-500">

                            <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Equipo</div>

                            <div className="text-3xl font-bold text-slate-800">{financialData.teamSize} <span className="text-sm font-normal text-slate-500">Personas</span></div>

                        </Card>

                        <Card className="p-5 border-t-4 border-t-indigo-500">

                            <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Burn Rate</div>

                            <div className="text-3xl font-bold text-slate-800">${financialData.monthlyCost.toLocaleString()}</div>

                        </Card>

                    </div>



                    <div className="space-y-8">

                        {/* Main tab area */}

                        <Card className="p-6 min-h-[500px] transition-all">

                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">

                                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">

                                    {view === 'gantt' && 'Planificación por Fases'}

                                    {view === 'risks' && 'Registro y Matriz de Riesgos'}

                                    {view === 'financial' && 'Desglose de Recursos y Costos'}

                                    {view === 'calculation' && 'Metodología de Cálculo'}

                                    {view === 'pmo' && 'PMO Pack – Documentación Ejecutiva'}

                                    {view === 'sprints' && t('sprints.title')}

                                    {view === 'backlog' && t('backlog.title')}

                                    {view === 'scrum' && t('scrumInfo.title')}

                                    {view === 'agile-methodology' && t('agileMethodology.engineTitle')}

                                </h3>





                                {/* Tab bar */}

                                <div className="flex flex-wrap bg-slate-100 rounded-lg p-1 gap-0.5">

                                    {activeMode === 'pmo' ? (

                                        <>

                                            <button onClick={() => setView('gantt')} className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${view === 'gantt' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>

                                                Cronograma

                                            </button>

                                            <button onClick={() => setView('risks')} className={`px-3 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-1 ${view === 'risks' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>

                                                <AlertTriangle className="w-4 h-4" /> Riesgos

                                            </button>

                                            <button onClick={() => setView('financial')} className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${view === 'financial' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>

                                                Costos

                                            </button>

                                            <button onClick={() => setView('calculation')} className={`px-3 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-1 ${view === 'calculation' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>

                                                <Calculator className="w-4 h-4" /> Metodología

                                            </button>

                                            <button onClick={() => setView('pmo')} className={`px-3 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-1 ${view === 'pmo' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>

                                                <FolderOpen className="w-4 h-4" /> PMO Pack

                                            </button>

                                        </>

                                    ) : (

                                        <>

                                            <button onClick={() => setView('sprints')} className={`px-3 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-1 ${view === 'sprints' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>

                                                <Zap className="w-4 h-4" /> Sprints

                                            </button>

                                            <button onClick={() => setView('backlog')} className={`px-3 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-1 ${view === 'backlog' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>

                                                <ListChecks className="w-4 h-4" /> Backlog

                                            </button>

                                            <button onClick={() => setView('risks')} className={`px-3 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-1 ${view === 'risks' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>

                                                <AlertTriangle className="w-4 h-4" /> Riesgos

                                            </button>

                                            <button onClick={() => setView('financial')} className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${view === 'financial' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>

                                                Costos

                                            </button>

                                            <button onClick={() => setView('scrum')} className={`px-3 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-1 ${view === 'scrum' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>

                                                <BookOpen className="w-4 h-4" /> Scrum

                                            </button>

                                            <button onClick={() => setView('agile-methodology')} className={`px-3 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-1 ${view === 'agile-methodology' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>

                                                <Calculator className="w-4 h-4" /> Metodología

                                            </button>



                                        </>

                                    )}

                                </div>

                            </div>



                            {/* ── PMO views ── */}

                            {view === 'gantt' && (

                                <GanttChart

                                    projectPhases={planningPhases}

                                    showCriticalPath={showCriticalPath}

                                    toggleCriticalPath={() => setShowCriticalPath(!showCriticalPath)}

                                />

                            )}

                            {view === 'risks' && <RiskMatrix projectPhases={projectPhases} />}

                            {view === 'financial' && (

                                <FinancialView

                                    resources={resources}

                                    totalWeeks={recalculatedData.weeks}

                                    isEditingResources={isEditingResources}

                                    onStartEditing={handleStartEditing}

                                    onSaveEditing={handleSaveEditing}

                                    onCancelEditing={handleCancelEditing}

                                    onUpdateResource={handleUpdateResource}

                                    onAddResource={handleAddResource}

                                    onRemoveResource={handleRemoveResource}

                                />

                            )}

                            {view === 'calculation' && (

                                <MethodologyView

                                    phases={planningPhases}

                                    resources={resources}

                                    totalWeeks={recalculatedData.weeks}

                                    totalCost={financialData.totalCost}

                                    teamSize={financialData.teamSize}

                                />

                            )}

                            {view === 'pmo' && (

                                <PMOPackView

                                    phases={planningPhases}

                                    resources={resources}

                                    totalWeeks={recalculatedData.weeks}

                                    totalCost={financialData.totalCost}

                                    summary={data.summary}

                                />

                            )}



                            {/* ── Agile: Sprint Board ── */}

                            {view === 'sprints' && (

                                <div>

                                    <p className="text-xs text-slate-400 mb-4">{t('sprints.subtitle')}</p>

                                    {!data.agileData && (

                                        <div className="flex items-start gap-2 bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-3 mb-5 text-xs text-indigo-700">

                                            <Zap className="w-3.5 h-3.5 mt-0.5 shrink-0 text-indigo-500" />

                                            <span>{t('sprints.phase2Banner')}</span>

                                        </div>

                                    )}

                                    <div className="space-y-4">

                                        {data.agileData ? (

                                            data.agileData.sprints.map(sprint => {

                                                const totalHours = sprint.userStories.reduce((acc: number, s: any) => acc + s.estimate, 0);

                                                const capacityHours = data.agileData!.teamVelocity || 0;

                                                const utilizationPct = capacityHours > 0 ? Math.min(Math.round((totalHours / capacityHours) * 100), 100) : 0;

                                                const utilizationColor = utilizationPct > 90 ? 'bg-red-500' : utilizationPct > 70 ? 'bg-amber-500' : 'bg-emerald-500';

                                                return (

                                                    <div key={sprint.number} className="border border-slate-200 rounded-xl overflow-hidden">

                                                        <div className="flex items-center justify-between px-4 py-3 bg-indigo-600 text-white">

                                                            <div className="flex items-center gap-3">

                                                                <span className="font-bold text-sm">{t('sprints.sprintLabel')} {sprint.number}</span>

                                                                <span className="text-indigo-200 text-xs">{t('sprints.weeks')} {sprint.weekStart}–{sprint.weekEnd}</span>

                                                            </div>

                                                            <span className="text-[10px] bg-white/20 text-white border border-white/30 px-2 py-0.5 rounded-full font-bold">{t('sprints.status')}</span>

                                                        </div>

                                                        <div className="px-4 py-2 bg-slate-50 border-b border-slate-100">

                                                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t('sprints.goal')}: </span>

                                                            <span className="text-xs text-slate-700 font-medium">{sprint.goal}</span>

                                                        </div>

                                                        <div className="px-4 py-3">

                                                            {sprint.userStories.length === 0 ? (

                                                                <p className="text-xs text-slate-400 italic">{t('sprints.noTasks')}</p>

                                                            ) : (

                                                                <div className="space-y-2">

                                                                    {sprint.userStories.map((story: any) => (

                                                                        <div key={story.id} className="border border-slate-100 rounded-lg p-2.5 hover:border-indigo-200 transition-colors">

                                                                            <div className="flex items-start justify-between gap-2 mb-1">

                                                                                <div className="flex items-center gap-2 min-w-0">

                                                                                    <ChevronRight className="w-3 h-3 text-indigo-400 shrink-0" />

                                                                                    <span className="text-xs text-slate-700">{story.title}</span>

                                                                                </div>

                                                                                <div className="flex items-center gap-1.5 shrink-0">

                                                                                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${

                                                                                        story.priority === 'high' ? 'bg-red-100 text-red-600 border border-red-200' :

                                                                                        story.priority === 'medium' ? 'bg-amber-100 text-amber-600 border border-amber-200' :

                                                                                        'bg-slate-100 text-slate-500 border border-slate-200'

                                                                                    }`}>{t(`backlog.${story.priority}`)}</span>

                                                                                    <span className="text-[10px] text-slate-400">{story.estimate}{t('sprints.hours')}</span>

                                                                                </div>

                                                                            </div>

                                                                            {story.acceptanceCriteria.length > 0 && (

                                                                                <ul className="pl-5 mt-1 space-y-0.5">

                                                                                    {story.acceptanceCriteria.map((ac: string, i: number) => (

                                                                                        <li key={i} className="text-[10px] text-slate-500 flex items-start gap-1.5">

                                                                                            <span className="text-emerald-400 mt-0.5 shrink-0">✓</span>

                                                                                            <span>{ac}</span>

                                                                                        </li>

                                                                                    ))}

                                                                                </ul>

                                                                            )}

                                                                        </div>

                                                                    ))}

                                                                </div>

                                                            )}

                                                        </div>

                                                        <div className="px-4 py-3 bg-slate-50 border-t border-slate-100">

                                                            <div className="flex justify-between text-[10px] text-slate-500 mb-1.5">

                                                                <span>{t('sprints.capacity')}: {capacityHours}{t('sprints.hours')}</span>

                                                                <span>{t('sprints.planned')}: ~{totalHours}{t('sprints.hours')}</span>

                                                                <span className="font-bold">{t('sprints.utilization')}: {utilizationPct}%</span>

                                                            </div>

                                                            <div className="w-full bg-slate-200 rounded-full h-1.5">

                                                                <div className={`h-1.5 rounded-full transition-all ${utilizationColor}`} style={{ width: `${utilizationPct}%` }} />

                                                            </div>

                                                        </div>

                                                    </div>

                                                );

                                            })

                                        ) : (

                                            sprints.map(sprint => {

                                                const utilizationPct = sprint.capacityHours > 0 ? Math.min(Math.round((sprint.plannedHours / sprint.capacityHours) * 100), 100) : 0;

                                                const utilizationColor = utilizationPct > 90 ? 'bg-red-500' : utilizationPct > 70 ? 'bg-amber-500' : 'bg-emerald-500';

                                                return (

                                                    <div key={sprint.number} className="border border-slate-200 rounded-xl overflow-hidden">

                                                        <div className="flex items-center justify-between px-4 py-3 bg-indigo-600 text-white">

                                                            <div className="flex items-center gap-3">

                                                                <span className="font-bold text-sm">{t('sprints.sprintLabel')} {sprint.number}</span>

                                                                <span className="text-indigo-200 text-xs">{t('sprints.weeks')} {sprint.weekStart}–{sprint.weekEnd}</span>

                                                            </div>

                                                            <span className="text-[10px] bg-white/20 text-white border border-white/30 px-2 py-0.5 rounded-full font-bold">{t('sprints.status')}</span>

                                                        </div>

                                                        <div className="px-4 py-2 bg-slate-50 border-b border-slate-100">

                                                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t('sprints.goal')}: </span>

                                                            <span className="text-xs text-slate-700 font-medium">{sprint.goal}</span>

                                                        </div>

                                                        <div className="px-4 py-3">

                                                            {sprint.items.length === 0 ? (

                                                                <p className="text-xs text-slate-400 italic">{t('sprints.noTasks')}</p>

                                                            ) : (

                                                                <div className="space-y-1.5">

                                                                    {sprint.items.map(({ task, phaseName: _phaseName }, idx) => (

                                                                        <div key={idx} className="flex items-center justify-between gap-2 py-1 border-b border-slate-50 last:border-0">

                                                                            <div className="flex items-center gap-2 min-w-0">

                                                                                <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />

                                                                                <span className="text-xs text-slate-700 truncate">{task.name}</span>

                                                                                {task.critical && (

                                                                                    <span className="shrink-0 text-[9px] bg-red-100 text-red-600 border border-red-200 px-1.5 py-0.5 rounded font-bold uppercase">{t('sprints.critical')}</span>

                                                                                )}

                                                                            </div>

                                                                            <span className="text-[10px] text-slate-400 shrink-0">{task.days}{t('sprints.days')}</span>

                                                                        </div>

                                                                    ))}

                                                                </div>

                                                            )}

                                                        </div>

                                                        <div className="px-4 py-3 bg-slate-50 border-t border-slate-100">

                                                            <div className="flex justify-between text-[10px] text-slate-500 mb-1.5">

                                                                <span>{t('sprints.capacity')}: {sprint.capacityHours}{t('sprints.hours')}</span>

                                                                <span>{t('sprints.planned')}: ~{sprint.plannedHours}{t('sprints.hours')}</span>

                                                                <span className="font-bold">{t('sprints.utilization')}: {utilizationPct}%</span>

                                                            </div>

                                                            <div className="w-full bg-slate-200 rounded-full h-1.5">

                                                                <div className={`h-1.5 rounded-full transition-all ${utilizationColor}`} style={{ width: `${utilizationPct}%` }} />

                                                            </div>

                                                        </div>

                                                    </div>

                                                );

                                            })

                                        )}

                                    </div>

                                </div>

                            )}



                            {/* â”€â”€ Agile: Backlog â”€â”€ */}

                            {view === 'backlog' && (

                                <div>

                                    <p className="text-xs text-slate-400 mb-4">{t('backlog.subtitle')}</p>

                                    {data.agileData ? (

                                        <div className="overflow-x-auto">

                                            <table className="w-full text-sm">

                                                <thead>

                                                    <tr className="bg-slate-700 text-white">

                                                        <th className="text-left px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider rounded-tl-lg text-white">{t('backlog.colSprint')}</th>

                                                        <th className="text-left px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-white">{t('backlog.colStory')}</th>

                                                        <th className="text-center px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-white">{t('backlog.colEstimate')}</th>

                                                        <th className="text-center px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-white">{t('backlog.colPriority')}</th>

                                                        <th className="text-left px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider rounded-tr-lg text-white">{t('backlog.colCriteria')}</th>

                                                    </tr>

                                                </thead>

                                                <tbody>

                                                    {data.agileData.sprints.flatMap((sprint: any, si: number) =>

                                                        sprint.userStories.map((story: any, sIdx: number) => (

                                                            <tr key={`${si}-${sIdx}`} className={`border-b border-slate-100 ${sIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-indigo-50/40 transition-colors`}>

                                                                <td className="px-3 py-2.5">

                                                                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">S{sprint.number}</span>

                                                                </td>

                                                                <td className="px-3 py-2.5 text-xs text-slate-700 max-w-[260px]">{story.title}</td>

                                                                <td className="px-3 py-2.5 text-center text-xs font-medium text-slate-600">{story.estimate}{t('sprints.hours')}</td>

                                                                <td className="px-3 py-2.5 text-center">

                                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${

                                                                        story.priority === 'high' ? 'bg-red-100 text-red-700 border-red-200' :

                                                                        story.priority === 'medium' ? 'bg-amber-100 text-amber-700 border-amber-200' :

                                                                        'bg-slate-100 text-slate-500 border-slate-200'

                                                                    }`}>{t(`backlog.${story.priority}`)}</span>

                                                                </td>

                                                                <td className="px-3 py-2.5">

                                                                    <ul className="space-y-0.5">

                                                                        {story.acceptanceCriteria.slice(0, 2).map((ac: string, i: number) => (

                                                                            <li key={i} className="text-[10px] text-slate-500 flex items-start gap-1">

                                                                                <span className="text-emerald-400 shrink-0">✓</span>

                                                                                <span className="truncate max-w-[200px]">{ac}</span>

                                                                            </li>

                                                                        ))}

                                                                        {story.acceptanceCriteria.length > 2 && (

                                                                            <li className="text-[10px] text-slate-400 italic">+{story.acceptanceCriteria.length - 2} {t('backlog.moreCriteria')}</li>

                                                                        )}

                                                                    </ul>

                                                                </td>

                                                            </tr>

                                                        ))

                                                    )}

                                                </tbody>

                                            </table>

                                        </div>

                                    ) : (

                                        <div className="overflow-x-auto">

                                            <table className="w-full text-sm">

                                                <thead>

                                                    <tr className="bg-slate-700 text-white">

                                                        <th className="text-left px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider rounded-tl-lg text-white">{t('backlog.colSprint')}</th>

                                                        <th className="text-left px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-white">{t('backlog.colTask')}</th>

                                                        <th className="text-left px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-white">{t('backlog.colPhase')}</th>

                                                        <th className="text-center px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-white">{t('backlog.colDays')}</th>

                                                        <th className="text-center px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider rounded-tr-lg text-white">{t('backlog.colPriority')}</th>

                                                    </tr>

                                                </thead>

                                                <tbody>

                                                    {backlogItems.map((item, idx) => (

                                                        <tr key={idx} className={`border-b border-slate-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-indigo-50/40 transition-colors`}>

                                                            <td className="px-3 py-2.5">

                                                                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">S{item.sprintNumber}</span>

                                                            </td>

                                                            <td className="px-3 py-2.5">

                                                                <div className="flex items-center gap-1.5">

                                                                    <span className="text-xs text-slate-700">{item.task.name}</span>

                                                                    {item.task.critical && (

                                                                        <span className="text-[9px] bg-red-100 text-red-600 border border-red-200 px-1.5 py-0.5 rounded font-bold uppercase">{t('sprints.critical')}</span>

                                                                    )}

                                                                </div>

                                                            </td>

                                                            <td className="px-3 py-2.5 text-xs text-slate-500 max-w-[160px] truncate">{item.phaseName}</td>

                                                            <td className="px-3 py-2.5 text-center text-xs font-medium text-slate-600">{item.task.days}d</td>

                                                            <td className="px-3 py-2.5 text-center">

                                                                {item.task.critical ? (

                                                                    <span className="text-[10px] bg-red-100 text-red-700 border border-red-200 px-2 py-0.5 rounded-full font-bold">{t('backlog.high')}</span>

                                                                ) : (item.task.risk?.prob ?? 1) * (item.task.risk?.impact ?? 1) >= 4 ? (

                                                                    <span className="text-[10px] bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-bold">{t('backlog.medium')}</span>

                                                                ) : (

                                                                    <span className="text-[10px] bg-slate-100 text-slate-500 border border-slate-200 px-2 py-0.5 rounded-full font-medium">{t('backlog.low')}</span>

                                                                )}

                                                            </td>

                                                        </tr>

                                                    ))}

                                                </tbody>

                                            </table>

                                        </div>

                                    )}

                                </div>

                            )}



                            {/* â”€â”€ Agile: Scrum Info â”€â”€ */}

                            {view === 'scrum' && (

                                <div className="space-y-6">

                                    <p className="text-xs text-slate-400">{t('scrumInfo.subtitle')}</p>



                                    <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">

                                        <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 mb-1">{t('scrumInfo.velocityTitle')}</div>

                                        <div className="flex items-baseline gap-2">

                                            <span className="text-3xl font-bold text-indigo-700">

                                                {Math.round(financialData.teamSize * SPRINT_WEEKS * 40 * 0.7)}{t('sprints.hours')}

                                            </span>

                                            <span className="text-sm text-indigo-500">{t('scrumInfo.perSprint')}</span>

                                        </div>

                                        <p className="text-xs text-indigo-600 mt-1">{t('scrumInfo.velocityDesc')}</p>

                                    </div>



                                    <div>

                                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3">{t('scrumInfo.ceremoniesTitle')}</div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                                            {(['planning', 'daily', 'review', 'retro'] as const).map(key => (

                                                <div key={key} className="border border-slate-200 rounded-lg p-3 bg-white">

                                                    <div className="flex items-start justify-between gap-2 mb-1">

                                                        <span className="text-sm font-bold text-slate-800">{t(`scrumInfo.ceremonies.${key}.name`)}</span>

                                                        <span className="text-[10px] bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-full font-medium shrink-0">

                                                            {t(`scrumInfo.ceremonies.${key}.duration`)}

                                                        </span>

                                                    </div>

                                                    <p className="text-xs text-slate-500">{t(`scrumInfo.ceremonies.${key}.desc`)}</p>

                                                </div>

                                            ))}

                                        </div>

                                    </div>



                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                        <div className="border border-emerald-200 rounded-xl p-4 bg-emerald-50">

                                            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 mb-3">✅ {t('scrumInfo.dodTitle')}</div>

                                            <ul className="space-y-1.5">

                                                {(Array.isArray(dodItems) ? dodItems : []).map((item, i) => (

                                                    <li key={i} className="flex items-start gap-2 text-xs text-emerald-900">

                                                        <span className="text-emerald-500 mt-0.5 shrink-0">•</span>

                                                        <span>{item}</span>

                                                    </li>

                                                ))}

                                            </ul>

                                        </div>

                                        <div className="border border-blue-200 rounded-xl p-4 bg-blue-50">

                                            <div className="text-[10px] font-bold uppercase tracking-wider text-blue-700 mb-3">&#x1F4CB; {t('scrumInfo.dorTitle')}</div>

                                            <ul className="space-y-1.5">

                                                {(Array.isArray(dorItems) ? dorItems : []).map((item, i) => (

                                                    <li key={i} className="flex items-start gap-2 text-xs text-blue-900">

                                                        <span className="text-blue-500 mt-0.5 shrink-0">•</span>

                                                        <span>{item}</span>

                                                    </li>

                                                ))}

                                            </ul>

                                        </div>

                                    </div>



                                    <p className="text-[11px] text-slate-400 italic border-t border-slate-100 pt-4">{t('scrumInfo.phase2Note')}</p>

                                </div>

                            )}



                            {/* ── Agile: Methodology Explanation ── */}

                            {view === 'agile-methodology' && (

                                <AgileMethodologyView

                                    phases={planningPhases}

                                    resources={resources}

                                    totalWeeks={recalculatedData.weeks}

                                    totalCost={financialData.totalCost}

                                    teamSize={financialData.teamSize}

                                    sprints={sprints}

                                />

                            )}

                        </Card>





                        {/* Charts Section */}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            <Card className="p-6 h-[420px] flex flex-col">

                                <div className="mb-4">

                                    <h3 className="font-bold text-slate-800 text-lg">Carga de Trabajo por Fase</h3>

                                    <p className="text-[11px] text-slate-400 mt-0.5">Días totales de trabajo estimados por fase (suma de task.days)</p>

                                </div>

                                <div className="flex items-center h-full">

                                    <div className="w-5/12 space-y-3 pr-2 overflow-y-auto max-h-[320px]">

                                        {effortByPhaseData.map((entry, index) => (

                                            <div key={`legend-${index}`} className="flex items-start gap-2.5 group cursor-default">

                                                <div className="w-3 h-3 rounded-full mt-1 shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />

                                                <div className="flex flex-col">

                                                    <span className="text-xs font-semibold text-slate-700 leading-tight">{entry.name}</span>

                                                    <span className="text-[10px] text-slate-400 font-medium">{entry.value} días</span>

                                                </div>

                                            </div>

                                        ))}

                                    </div>

                                    <div className="w-7/12 h-full">

                                        <ResponsiveContainer width="100%" height="100%">

                                            <PieChart>

                                                <Pie data={effortByPhaseData} cx="50%" cy="50%" innerRadius={65} outerRadius={95} paddingAngle={3} dataKey="value" stroke="none">

                                                    {effortByPhaseData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}

                                                </Pie>

                                                <Tooltip formatter={(value: number) => [`${value} días`, 'Esfuerzo']} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px' }} />

                                            </PieChart>

                                        </ResponsiveContainer>

                                    </div>

                                </div>

                            </Card>



                            <Card className="p-6 flex flex-col min-h-[420px]">

                                <div className="mb-4">

                                    <h3 className="font-bold text-slate-800 text-lg">Distribución de Riesgos</h3>

                                    <p className="text-[11px] text-slate-400 mt-0.5">Score = Probabilidad × Impacto (PMI Risk Standard). Crítico ≥7, Alto 5–6, Medio 3–4, Bajo 1–2</p>

                                </div>

                                <div className="flex-1" style={{ height: '320px' }}>

                                    <ResponsiveContainer width="100%" height="100%">

                                        <PieChart>

                                            <Pie data={riskDistributionData} cx="50%" cy="45%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value" stroke="none">

                                                {riskDistributionData.map((entry, index) => {

                                                    const riskColorMap: Record<string, string> = { 'Crítico': '#EF4444', 'Alto': '#F97316', 'Medio': '#F59E0B', 'Bajo': '#10B981' };

                                                    return <Cell key={`cell-${index}`} fill={riskColorMap[entry.name] ?? COLORS[index % COLORS.length]} />;

                                                })}

                                            </Pie>

                                            <Tooltip formatter={(value: number, name: string) => [`${value} riesgos`, name]} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px' }} />

                                            <Legend layout="horizontal" verticalAlign="bottom" align="center" iconType="circle" iconSize={10} wrapperStyle={{ paddingTop: '8px', fontSize: '12px', fontWeight: 600 }} />

                                        </PieChart>

                                    </ResponsiveContainer>

                                </div>

                            </Card>

                        </div>

                    </div>

                </div>

            )}

        </div>

    );

};



export default PlanningDashboard;

