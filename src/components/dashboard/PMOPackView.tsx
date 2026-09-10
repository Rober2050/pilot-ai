import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    CheckCircle2, Circle, AlertCircle, Users, FileText,
    Target, MessageSquare, ChevronDown, ChevronUp
} from 'lucide-react';
import { Phase, Resource } from '../../types/project';

interface PMOPackViewProps {
    phases: Phase[];
    resources: Resource[];
    totalWeeks: number;
    totalCost: number;
    summary: string;
}

type RAGStatus = 'green' | 'amber' | 'red';

const RAG_COLORS: Record<RAGStatus, { bg: string; text: string; border: string; dot: string }> = {
    green: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-300', dot: 'bg-emerald-500' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-300', dot: 'bg-amber-400' },
    red: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-300', dot: 'bg-red-500' },
};

function deriveRAGStatus(
    phases: Phase[],
    resources: Resource[],
    totalWeeks: number,
    totalCost: number,
): { schedule: RAGStatus; budget: RAGStatus; scope: RAGStatus; risk: RAGStatus } {
    const allRisks = phases.flatMap(p => p.tasks ?? []).map(t => ({
        score: (t.risk?.prob ?? 1) * (t.risk?.impact ?? 1),
    }));
    const criticalRisks = allRisks.filter(r => r.score >= 7).length;
    const highRisks = allRisks.filter(r => r.score >= 5).length;

    const riskStatus: RAGStatus = criticalRisks >= 3 ? 'red' : criticalRisks >= 1 || highRisks >= 4 ? 'amber' : 'green';
    const scheduleStatus: RAGStatus = totalWeeks > 40 ? 'amber' : totalWeeks > 60 ? 'red' : 'green';
    const budgetStatus: RAGStatus = totalCost > 500000 ? 'amber' : totalCost > 1000000 ? 'red' : 'green';
    const scopeStatus: RAGStatus = phases.length > 6 ? 'amber' : 'green';

    return { schedule: scheduleStatus, budget: budgetStatus, scope: scopeStatus, risk: riskStatus };
}

function buildRACIMatrix(phases: Phase[], resources: Resource[]) {
    const roleNames = resources.map(r => r.role);
    const activities = [
        { activity: 'Aprobación de Scope', R: 'Project Manager', A: 'Sponsor', C: roleNames[0] ?? 'Tech Lead', I: 'Equipo' },
        { activity: 'Desarrollo de Features', R: roleNames.find(r => r.toLowerCase().includes('backend') || r.toLowerCase().includes('dev')) ?? roleNames[0] ?? 'Backend Dev', A: 'Project Manager', C: 'QA', I: 'Sponsor' },
        { activity: 'Revisión de Arquitectura', R: roleNames.find(r => r.toLowerCase().includes('arq') || r.toLowerCase().includes('architect') || r.toLowerCase().includes('senior')) ?? 'Tech Lead', A: 'Project Manager', C: roleNames[0] ?? 'Dev', I: 'Sponsor' },
        { activity: 'Testing y QA', R: roleNames.find(r => r.toLowerCase().includes('qa') || r.toLowerCase().includes('test')) ?? 'QA Engineer', A: 'Project Manager', C: 'Dev Team', I: 'Cliente' },
        { activity: 'Deploy a Producción', R: roleNames.find(r => r.toLowerCase().includes('devops') || r.toLowerCase().includes('infra')) ?? 'DevOps', A: 'Project Manager', C: 'Dev Team', I: 'Sponsor' },
        { activity: 'Gestión de Cambios', R: 'Project Manager', A: 'Sponsor', C: 'Dev Team', I: 'Todos' },
        { activity: 'Comunicación con Cliente', R: 'Project Manager', A: 'Sponsor', C: 'Tech Lead', I: 'Equipo' },
        { activity: 'Revisión de Riesgos', R: 'Project Manager', A: 'Sponsor', C: roleNames[0] ?? 'Tech Lead', I: 'Equipo' },
    ];
    return activities;
}

const PMO_DOCUMENTS = [
    { name: 'Project Charter', status: 'done', category: 'Inicio', note: 'Disponible en esta sección (expandir arriba)' },
    { name: 'Cronograma / WBS', status: 'done', category: 'Planificación', note: 'Disponible en solapa Cronograma' },
    { name: 'Registro de Riesgos', status: 'done', category: 'Planificación', note: 'Disponible en solapa Riesgos' },
    { name: 'Plan de Recursos', status: 'done', category: 'Planificación', note: 'Disponible en solapa Costos' },
    { name: 'RACI Matrix', status: 'done', category: 'Planificación', note: 'Disponible en esta sección' },
    { name: 'Matriz de Riesgos 5×5', status: 'partial', category: 'Planificación', note: 'Usar escala 1–5 para proyectos enterprise' },
    { name: 'Plan de Comunicación', status: 'partial', category: 'Planificación', note: 'Completar con frecuencia y canales del cliente' },
    { name: 'Registro de Supuestos', status: 'done', category: 'Planificación', note: 'Disponible en solapa Metodología' },
    { name: 'KPIs y Criterios de Éxito', status: 'pending', category: 'Ejecución', note: 'Definir con Product Owner antes del Sprint 1' },
    { name: 'Acta de Kickoff', status: 'pending', category: 'Inicio', note: 'Requiere participación del sponsor' },
    { name: 'Plan de Gestión de Cambios', status: 'pending', category: 'Ejecución', note: 'Definir proceso de CR antes del desarrollo' },
    { name: 'Informe de Estado Semanal (RAG)', status: 'partial', category: 'Seguimiento', note: 'Dashboard en esta sección. Automatizar en el futuro.' },
    { name: 'Acta de Cierre de Proyecto', status: 'pending', category: 'Cierre', note: 'Al finalizar todas las fases' },
    { name: 'Lessons Learned', status: 'pending', category: 'Cierre', note: 'Retrospectiva final con el equipo' },
];

const StatusIcon = ({ status }: { status: string }) => {
    if (status === 'done') return <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />;
    if (status === 'partial') return <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />;
    return <Circle className="w-4 h-4 text-slate-300 shrink-0" />;
};

const PendingField = ({ label }: { label: string }) => (
    <div className="flex items-center gap-2 bg-amber-50 rounded px-3 py-1.5 border border-amber-200 border-dashed">
        <span className="w-2 h-2 rounded-full bg-amber-300 shrink-0"></span>
        <span className="text-xs text-amber-700">{label}: <span className="text-amber-500 font-semibold">— Pendiente —</span></span>
    </div>
);

export const PMOPackView: React.FC<PMOPackViewProps> = ({ phases, resources, totalWeeks, totalCost, summary }) => {
    const { t } = useTranslation('planning');
    const [showFullRaci, setShowFullRaci] = useState(false);
    const [showCharter, setShowCharter] = useState(false);

    const RAG_LABELS: Record<RAGStatus, string> = {
        green: t('pmo.rag.onTrack'),
        amber: t('pmo.rag.attention'),
        red: t('pmo.rag.atRisk'),
    };

    const ragStatus = useMemo(() => deriveRAGStatus(phases, resources, totalWeeks, totalCost), [phases, resources, totalWeeks, totalCost]);
    const raciData = useMemo(() => buildRACIMatrix(phases, resources), [phases, resources]);

    const topRisks = useMemo(() => {
        return phases.flatMap(p => (p.tasks || []).filter(t => t.risk).map(t => ({
            score: (t.risk!.prob) * (t.risk!.impact),
            desc: t.risk!.desc,
            task: t.name,
        }))).sort((a, b) => b.score - a.score).slice(0, 5);
    }, [phases]);

    const totalFTEs = resources.reduce((s, r) => s + r.count, 0);

    const docDone = PMO_DOCUMENTS.filter(d => d.status === 'done').length;
    const docPartial = PMO_DOCUMENTS.filter(d => d.status === 'partial').length;
    const docPending = PMO_DOCUMENTS.filter(d => d.status === 'pending').length;

    return (
        <div className="animate-in fade-in zoom-in-95 duration-500 space-y-6">

            {/* ── 0. PROJECT CHARTER (PMBOK 4.1) ── */}
            <section>
                <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                        <FileText className="w-4 h-4 text-indigo-500" />
                        {t('pmo.charter.title')}
                        <span className="ml-1 text-[9px] font-medium text-slate-400 normal-case tracking-normal">{t('pmo.charter.reference')}</span>
                    </h4>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold border border-amber-200">{t('pmo.charter.draft')}</span>
                        <button
                            onClick={() => setShowCharter(!showCharter)}
                            className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 transition-colors"
                        >
                            {showCharter
                                ? <><ChevronUp className="w-3.5 h-3.5" />{t('pmo.charter.collapse')}</>
                                : <><ChevronDown className="w-3.5 h-3.5" />{t('pmo.charter.viewCharter')}</>}
                        </button>
                    </div>
                </div>

                {showCharter && (
                    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                        {/* Charter Header */}
                        <div className="bg-gradient-to-r from-slate-800 to-indigo-900 px-6 py-5">
                            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                                {t('pmo.charter.documentTitle')}
                            </div>
                            <div className="text-xl font-bold text-white">Plan de Desarrollo de Software</div>
                            <div className="flex flex-wrap gap-4 mt-2 text-xs text-slate-400">
                                <span>📅 {new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                <span>📋 {t('pmo.charter.version')}</span>
                                <span className="text-amber-400 font-semibold">⚡ {t('pmo.charter.status')}</span>
                            </div>
                        </div>

                        <div className="divide-y divide-slate-100 bg-white">
                            {/* Propósito */}
                            <div className="px-5 py-4">
                                <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 mb-1.5 flex items-center gap-1.5">
                                    🎯 {t('pmo.charter.purpose')}
                                    <span className="text-emerald-600 text-[9px] normal-case tracking-normal font-medium bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">{t('pmo.charter.aiGenerated')}</span>
                                </div>
                                <p className="text-xs text-slate-700 leading-relaxed">{summary || t('pmo.charter.noSummary')}</p>
                            </div>

                            {/* Objetivos SMART */}
                            <div className="px-5 py-4">
                                <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 mb-2">✅ {t('pmo.charter.smartObjectives')}</div>
                                <ul className="space-y-1.5">
                                    <li className="flex items-start gap-2 text-xs text-slate-700">
                                        <span className="text-emerald-500 mt-0.5 shrink-0">◆</span>
                                        {t('pmo.charter.completeIn')} <strong className="text-slate-900 mx-1">{totalWeeks} {t('pmo.charter.weeks')} ({(totalWeeks / 4.33).toFixed(1)} {t('pmo.charter.months')})</strong> {t('pmo.charter.accordingToWbs')}
                                    </li>
                                    <li className="flex items-start gap-2 text-xs text-slate-700">
                                        <span className="text-emerald-500 mt-0.5 shrink-0">◆</span>
                                        {t('pmo.charter.executeWithinBudget')} <strong className="text-slate-900 mx-1">${Math.round(totalCost * 1.15).toLocaleString()} USD</strong> {t('pmo.charter.budgetNote')}
                                    </li>
                                    {phases.slice(0, 3).map((p, i) => (
                                        <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
                                            <span className="text-emerald-500 mt-0.5 shrink-0">◆</span>
                                            {t('pmo.charter.deliver')} <strong className="text-slate-900 mx-1">{p.name}</strong> {t('pmo.charter.in')} <strong className="text-slate-900">{p.duration} {t('pmo.charter.weeks')}</strong> (Sem {p.startWeek})
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Alcance WBS */}
                            <div className="px-5 py-4">
                                <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 mb-2">📐 {t('pmo.charter.wbsScope')}</div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                    {phases.map((p, i) => (
                                        <div key={i} className="bg-slate-50 rounded-lg px-3 py-2 border border-slate-100 hover:border-indigo-100 transition-colors">
                                            <div className="text-xs font-semibold text-slate-700 truncate">{p.name}</div>
                                            <div className="text-[10px] text-slate-400 mt-0.5">{p.duration} {t('pmo.charter.weeks')} · {(p.tasks || []).length} {t('pmo.charter.tasks')}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Presupuesto */}
                            <div className="px-5 py-4 bg-emerald-50/30">
                                <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 mb-2">💰 {t('pmo.charter.budget')}</div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-center">
                                    <div className="bg-white rounded-lg p-3 border border-slate-100 shadow-sm">
                                        <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">{t('pmo.charter.baseCost')}</div>
                                        <div className="text-sm font-bold text-slate-800">${Math.round(totalCost).toLocaleString()}</div>
                                    </div>
                                    <div className="bg-amber-50 rounded-lg p-3 border border-amber-100 shadow-sm">
                                        <div className="text-[10px] text-amber-600 font-semibold uppercase tracking-wider mb-1">{t('pmo.charter.reserves')}</div>
                                        <div className="text-sm font-bold text-amber-700">${Math.round(totalCost * 0.15).toLocaleString()}</div>
                                    </div>
                                    <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200 shadow-sm">
                                        <div className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider mb-1">{t('pmo.charter.authorizedTotal')}</div>
                                        <div className="text-sm font-bold text-emerald-800">${Math.round(totalCost * 1.15).toLocaleString()}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Stakeholders */}
                            <div className="px-5 py-4">
                                <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 mb-2">👥 {t('pmo.charter.stakeholders')}</div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <PendingField label="Sponsor del Proyecto" />
                                    <PendingField label="Project Manager" />
                                    {resources.slice(0, 4).map((r, i) => (
                                        <div key={i} className="flex items-center gap-2 bg-slate-50 rounded px-3 py-1.5 border border-slate-100">
                                            <span className="w-2 h-2 rounded-full bg-indigo-400 shrink-0"></span>
                                            <span className="text-xs text-slate-700">{r.role} <span className="text-slate-400 font-medium">×{r.count}</span></span>
                                        </div>
                                    ))}
                                    <PendingField label="Cliente / Usuario Final" />
                                </div>
                            </div>

                            {/* Riesgos */}
                            <div className="px-5 py-4">
                                <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 mb-2">
                                    ⚠️ {t('pmo.charter.risks')} {Math.min(5, topRisks.length)})
                                </div>
                                {topRisks.length > 0 ? (
                                    <ul className="space-y-1.5">
                                        {topRisks.map((r, i) => (
                                            <li key={i} className={`flex items-start gap-2 text-xs rounded-lg px-3 py-2 border ${r.score >= 7 ? 'bg-red-50 text-red-700 border-red-100' : r.score >= 5 ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-slate-50 text-slate-600 border-slate-100'}`}>
                                                <span className="shrink-0 font-bold">[{r.score}/9]</span>
                                                <span>{r.desc || r.task}</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-xs text-slate-400 italic">{t('pmo.charter.noRisks')}</p>
                                )}
                            </div>

                            {/* Supuestos */}
                            <div className="px-5 py-4">
                                <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 mb-2">📋 {t('pmo.charter.assumptions')}</div>
                                <ul className="space-y-1.5">
                                    {[
                                        `El equipo de ${totalFTEs} FTEs estará disponible a tiempo completo durante el proyecto`,
                                        'Los requerimientos no experimentarán cambios mayores al 15% post-kickoff sin un proceso formal de Change Request',
                                        'Las aprobaciones de fase se realizarán en un máximo de 5 días hábiles por el sponsor',
                                        'La infraestructura base de desarrollo y staging es provista por el cliente o patrocinador',
                                    ].map((a, i) => (
                                        <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                                            <span className="text-slate-300 mt-0.5 shrink-0 font-bold">—</span>
                                            {a}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Firma */}
                        <div className="bg-slate-50 border-t border-slate-200 px-5 py-4 flex flex-col md:flex-row items-start justify-between gap-4">
                            <p className="text-[10px] text-slate-500 leading-relaxed max-w-lg">
                                <strong className="text-slate-600">⚡ {t('pmo.charter.warning')}</strong> {t('pmo.charter.warningText')}
                                {' '}{t('pmo.charter.signatureRequired')}
                                {' '}{t('pmo.charter.pmibokRef')}
                            </p>
                            <div className="flex gap-8 shrink-0">
                                <div className="flex flex-col items-center">
                                    <div className="w-28 border-b border-slate-400 mt-6"></div>
                                    <div className="text-[9px] text-slate-400 mt-1 text-center">{t('pmo.charter.sponsorSignature')}</div>
                                </div>
                                <div className="flex flex-col items-center">
                                    <div className="w-28 border-b border-slate-400 mt-6"></div>
                                    <div className="text-[9px] text-slate-400 mt-1 text-center">{t('pmo.charter.projectManager')}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </section>

            {/* ── 1. RAG STATUS DASHBOARD ── */}
            <section>
                <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Target className="w-4 h-4 text-indigo-500" /> {t('pmo.rag.title')}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    {([
                        { area: t('pmo.rag.schedule'), key: 'schedule' as const, icon: '📅', hint: t('pmo.rag.scheduleHint') },
                        { area: t('pmo.rag.budget'), key: 'budget' as const, icon: '💰', hint: t('pmo.rag.budgetHint') },
                        { area: t('pmo.rag.scope'), key: 'scope' as const, icon: '🎯', hint: t('pmo.rag.scopeHint') },
                        { area: t('pmo.rag.risks'), key: 'risk' as const, icon: '⚠️', hint: t('pmo.rag.riskHint') },
                    ]).map(item => {
                        const status = ragStatus[item.key];
                        const style = RAG_COLORS[status];
                        return (
                            <div key={item.key} className={`rounded-xl border p-4 shadow-sm ${style.bg} ${style.border}`} title={item.hint}>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-lg">{item.icon}</span>
                                    <div className={`w-3 h-3 rounded-full shadow-sm ${style.dot}`}></div>
                                </div>
                                <div className={`font-bold text-sm ${style.text}`}>{item.area}</div>
                                <div className={`text-xs font-semibold mt-0.5 ${style.text}`}>{RAG_LABELS[status]}</div>
                            </div>
                        );
                    })}
                </div>
                <p className="text-[10px] text-slate-400 mt-2">
                    {t('pmo.rag.explanation')}
                </p>
            </section>

            {/* ── 2. RACI MATRIX ── */}
            <section>
                <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                        <Users className="w-4 h-4 text-indigo-500" /> {t('pmo.raci.title')}
                    </h4>
                    <button
                        onClick={() => setShowFullRaci(!showFullRaci)}
                        className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-semibold transition-colors"
                    >
                        {showFullRaci ? <><ChevronUp className="w-3.5 h-3.5" />{t('pmo.charter.collapse')}</> : <><ChevronDown className="w-3.5 h-3.5" />{t('pmo.raci.showAll')}</>}
                    </button>
                </div>
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-xs">
                        <thead className="bg-slate-700 text-white">
                            <tr>
                                <th className="px-4 py-2.5 text-left font-bold w-1/2 text-white">{t('pmo.raci.activity')}</th>
                                <th className="px-3 py-2.5 text-center text-white">
                                    <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-blue-500 text-white font-bold text-[10px]">R</span>
                                    <div className="text-[10px] text-slate-300 mt-0.5">{t('pmo.raci.responsible')}</div>
                                </th>
                                <th className="px-3 py-2.5 text-center text-white">
                                    <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-purple-500 text-white font-bold text-[10px]">A</span>
                                    <div className="text-[10px] text-slate-300 mt-0.5">{t('pmo.raci.accountable')}</div>
                                </th>
                                <th className="px-3 py-2.5 text-center text-white">
                                    <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-amber-400 text-white font-bold text-[10px]">C</span>
                                    <div className="text-[10px] text-slate-300 mt-0.5">{t('pmo.raci.consulted')}</div>
                                </th>
                                <th className="px-3 py-2.5 text-center text-white">
                                    <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-slate-400 text-white font-bold text-[10px]">I</span>
                                    <div className="text-[10px] text-slate-300 mt-0.5">{t('pmo.raci.informed')}</div>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {(showFullRaci ? raciData : raciData.slice(0, 4)).map((row, idx) => (
                                <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                    <td className="px-4 py-2.5 font-medium text-slate-700">{row.activity}</td>
                                    <td className="px-3 py-2.5 text-center text-slate-600 text-[11px]">{row.R}</td>
                                    <td className="px-3 py-2.5 text-center text-slate-600 text-[11px]">{row.A}</td>
                                    <td className="px-3 py-2.5 text-center text-slate-600 text-[11px]">{row.C}</td>
                                    <td className="px-3 py-2.5 text-center text-slate-600 text-[11px]">{row.I}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5">
                    {t('pmo.raci.explanation')}
                </p>
            </section>

            {/* ── 3. COMMUNICATION PLAN ── */}
            <section>
                <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-indigo-500" /> {t('pmo.communication.title')}
                </h4>
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-xs">
                        <thead className="bg-slate-700 text-white font-bold">
                            <tr>
                                <th className="px-4 py-2.5 text-left text-white">{t('pmo.communication.event')}</th>
                                <th className="px-4 py-2.5 text-left text-white">{t('pmo.communication.frequency')}</th>
                                <th className="px-4 py-2.5 text-left text-white">{t('pmo.communication.participants')}</th>
                                <th className="px-4 py-2.5 text-left text-white">{t('pmo.communication.objective')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[
                                { event: 'Daily Standup', freq: 'Diaria (15 min)', who: 'Equipo técnico', obj: 'Avance, bloqueos, próximos pasos' },
                                { event: 'Sprint Review', freq: 'Cada 2 semanas', who: 'Equipo + Sponsor', obj: 'Demo de entregables, feedback' },
                                { event: 'Informe de Estado (RAG)', freq: 'Semanal', who: 'PM + Sponsor', obj: 'Estado Cronograma/Budget/Riesgos' },
                                { event: 'Risk Review', freq: 'Quincenal', who: 'PM + Tech Lead', obj: 'Revisión del registro de riesgos' },
                                { event: 'Steering Committee', freq: 'Mensual', who: 'Sponsor + PM + Stakeholders', obj: 'Decisiones estratégicas, cambios de scope' },
                            ].map((row, idx) => (
                                <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                    <td className="px-4 py-2.5 font-semibold text-slate-700">{row.event}</td>
                                    <td className="px-4 py-2.5 text-slate-500">{row.freq}</td>
                                    <td className="px-4 py-2.5 text-slate-500">{row.who}</td>
                                    <td className="px-4 py-2.5 text-slate-500">{row.obj}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* ── 4. PMO DOCUMENT TRACKER ── */}
            <section>
                <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                        <FileText className="w-4 h-4 text-indigo-500" /> {t('pmo.tracker.title')}
                    </h4>
                    <div className="flex gap-2 text-xs">
                        <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5" /> {docDone} {t('pmo.tracker.ready')}
                        </span>
                        <span className="flex items-center gap-1 text-amber-600 font-semibold">
                            <AlertCircle className="w-3.5 h-3.5" /> {docPartial} {t('pmo.tracker.partial')}
                        </span>
                        <span className="flex items-center gap-1 text-slate-400 font-semibold">
                            <Circle className="w-3.5 h-3.5" /> {docPending} {t('pmo.tracker.pending')}
                        </span>
                    </div>
                </div>

                <div className="mb-4">
                    <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                        <span>{t('pmo.tracker.completeness')}</span>
                        <span>{Math.round(((docDone + docPartial * 0.5) / PMO_DOCUMENTS.length) * 100)}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all"
                            style={{ width: `${Math.round(((docDone + docPartial * 0.5) / PMO_DOCUMENTS.length) * 100)}%` }}
                        ></div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {PMO_DOCUMENTS.map((doc, idx) => (
                        <div key={idx} className="flex items-start gap-2.5 bg-white rounded-lg border border-slate-100 p-3 hover:border-slate-200 transition-colors">
                            <StatusIcon status={doc.status} />
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-xs text-slate-700 truncate">{doc.name}</span>
                                    <span className="shrink-0 text-[9px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                                        {doc.category}
                                    </span>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">{doc.note}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};
