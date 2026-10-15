import { CheckCircle2, AlertTriangle, Shield, AlertCircle, PauseCircle, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/utils';
import type { SynthesisOutput } from '../../types/blueprint';

interface SynthesisDashboardProps {
    synthesis: SynthesisOutput;
    onRefresh?: () => void;
}

const VERDICT_CONFIG = {
    PROCEED: {
        color: 'text-green-700',
        bg: 'bg-green-50',
        border: 'border-green-200',
        icon: <CheckCircle2 size={32} className="text-green-600 shrink-0" />,
        label: 'PROCEED',
    },
    PIVOT: {
        color: 'text-amber-700',
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        icon: <PauseCircle size={32} className="text-amber-600 shrink-0" />,
        label: 'PIVOT',
    },
    HALT: {
        color: 'text-red-700',
        bg: 'bg-red-50',
        border: 'border-red-200',
        icon: <XCircle size={32} className="text-red-600 shrink-0" />,
        label: 'HALT',
    },
} as const;

const ROLE_LABELS: Record<string, { en: string; es: string }> = {
    'strategy-analyst':  { en: 'Strategy Analyst',  es: 'Estrategia' },
    'product-manager':   { en: 'Product Manager',   es: 'Producto' },
    'business-analyst':  { en: 'Business Analyst',  es: 'Negocio' },
    'project-manager':   { en: 'Project Manager',   es: 'Proyecto' },
    'marketing-manager': { en: 'Marketing Manager', es: 'Marketing' },
    'architect':         { en: 'Software Architect',es: 'Arquitectura' },
    'ux-designer':       { en: 'UX/UI Designer',    es: 'UX/UI' },
    'qa-engineer':       { en: 'QA Engineer',       es: 'QA' },
    'devops-engineer':   { en: 'DevOps Engineer',   es: 'DevOps' },
};

type RoleCoherence = 'coherent' | 'warning' | 'blocker';

function classifyRoles(synthesis: SynthesisOutput): Record<string, RoleCoherence> {
    const map: Record<string, RoleCoherence> = {};
    for (const id of synthesis.rolesAnalyzed) map[id] = 'coherent';
    for (const t of synthesis.tensions) {
        for (const rid of [t.roleA, t.roleB]) {
            if (!rid) continue;
            if (t.severity === 'high') {
                map[rid] = 'blocker';
            } else if (t.severity === 'medium' && map[rid] !== 'blocker') {
                map[rid] = 'warning';
            }
        }
    }
    return map;
}

function getHealthLabel(confidence: number, lang: 'en' | 'es'): string {
    if (confidence <= 40) return lang === 'es' ? 'Crítico' : 'Critical';
    if (confidence <= 60) return lang === 'es' ? 'Con riesgos' : 'At risk';
    if (confidence <= 80) return lang === 'es' ? 'Viable con atención' : 'Viable with caution';
    return lang === 'es' ? 'Alta viabilidad' : 'Highly viable';
}

function getHealthColor(confidence: number): string {
    if (confidence <= 40) return 'bg-red-500';
    if (confidence <= 60) return 'bg-amber-500';
    if (confidence <= 80) return 'bg-yellow-400';
    return 'bg-emerald-500';
}

// Defensive: legacy synthesis in Firestore may have Spanish enum values ("PROCEDER", "PIVOTAR", "DETENER")
// because old protocol allowed translation. Map them to canonical English keys for VERDICT_CONFIG lookup.
function normalizeVerdictKey(raw: unknown): 'PROCEED' | 'PIVOT' | 'HALT' {
    if (typeof raw !== 'string') return 'PIVOT';
    const v = raw.trim().toUpperCase();
    if (v === 'PROCEDER' || v === 'PROCEED' || v === 'AVANZAR' || v === 'CONTINUAR') return 'PROCEED';
    if (v === 'PIVOT' || v === 'PIVOTAR' || v === 'AJUSTAR' || v === 'GIRAR') return 'PIVOT';
    if (v === 'HALT' || v === 'DETENER' || v === 'PARAR' || v === 'ABANDONAR') return 'HALT';
    return 'PIVOT';
}

export default function SynthesisDashboard({ synthesis, onRefresh: _ }: SynthesisDashboardProps) {
    const { t, i18n } = useTranslation('project');
    const lang = i18n.language === 'es' ? 'es' : 'en';
    const verdictKey = normalizeVerdictKey(synthesis.teamVerdict);
    const verdict = VERDICT_CONFIG[verdictKey];
    const roleCoherence = classifyRoles(synthesis);

    const tensionsHigh = synthesis.tensions.filter(t => t.severity === 'high').length;
    const tensionsMedium = synthesis.tensions.filter(t => t.severity === 'medium').length;

    return (
        <div className="space-y-4">

            {/* ── ZONA 1: Hero Header ── */}
            <div className={cn('rounded-2xl border p-6', verdict.bg, verdict.border)}>
                <div className="flex items-start justify-between gap-6">
                    {/* Left: Verdict */}
                    <div className="flex items-start gap-4 min-w-0">
                        {verdict.icon}
                        <div className="min-w-0">
                            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">
                                {lang === 'es' ? 'Veredicto del Equipo' : 'Team Verdict'}
                            </div>
                            <div className="text-2xl font-black mb-1" style={{ color: verdict.label === 'PROCEED' ? '#15803d' : verdict.label === 'PIVOT' ? '#b45309' : '#dc2626' }}>
                                {verdict.label}
                            </div>
                            <p className={cn('text-sm font-medium leading-relaxed', verdict.color)}>
                                {synthesis.verdictRationale}
                            </p>
                        </div>
                    </div>

                    {/* Right: Confidence Score + Bar — independent from verdict */}
                    <div className="flex flex-col items-end gap-2 shrink-0">
                        <div className="text-right">
                            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">
                                {lang === 'es' ? 'Confianza del Análisis' : 'Analysis Confidence'}
                            </div>
                            <div className="text-3xl font-black text-slate-900">{synthesis.verdictConfidence}<span className="text-lg font-semibold text-slate-400">/100</span></div>
                        </div>
                        <div className="w-48 space-y-1">
                            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                    className={cn('h-full rounded-full transition-all', getHealthColor(synthesis.verdictConfidence))}
                                    style={{ width: `${synthesis.verdictConfidence}%` }}
                                />
                            </div>
                            <div className="text-xs text-slate-500 text-right">
                                {getHealthLabel(synthesis.verdictConfidence, lang)}
                            </div>
                        </div>
                        <p className="text-[10px] text-slate-400 text-right max-w-[180px] leading-tight">
                            {lang === 'es'
                                ? 'Mide cuán sólido es el análisis. El veredicto indica la dirección estratégica.'
                                : 'Measures analysis solidity. Verdict indicates the strategic direction.'}
                        </p>
                    </div>
                </div>
            </div>

            {/* ── ZONA 2: Roles Analizados ── */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        {t('synthesis.rolesAnalyzedLabel')}
                    </h3>
                    <span className="text-[10px] text-slate-400">
                        {lang === 'es' ? '⚠ = tensión detectada  ✕ = bloqueo crítico' : '⚠ = tension detected  ✕ = critical blocker'}
                    </span>
                </div>
                <div className="flex flex-wrap gap-2">
                    {synthesis.rolesAnalyzed.map(roleId => {
                        const coherence = roleCoherence[roleId];
                        const label = ROLE_LABELS[roleId] || { en: roleId, es: roleId };
                        const displayName = lang === 'es' ? label.es : label.en;

                        const coherenceConfig = {
                            coherent: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', icon: '✓' },
                            warning: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', icon: '⚠' },
                            blocker: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', icon: '✕' },
                        }[coherence];

                        // Build tooltip for non-coherent roles
                        const tensions = synthesis.tensions.filter(ten =>
                            (ten.roleA === roleId || ten.roleB === roleId) && ten.severity !== 'low'
                        );
                        const tooltipLines = tensions.map(ten => ten.description.substring(0, 80));
                        const tooltip = tooltipLines.length > 0 ? tooltipLines.join(' / ') : undefined;

                        return (
                            <div
                                key={roleId}
                                title={tooltip}
                                className={cn(
                                    'inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold',
                                    coherence !== 'coherent' && 'cursor-help',
                                    coherenceConfig.bg,
                                    coherenceConfig.border,
                                    coherenceConfig.text
                                )}
                            >
                                <span className="text-base">{coherenceConfig.icon}</span>
                                {displayName}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ── ZONA 3: Stats Grid (3 columnas) ── */}
            <div className="grid grid-cols-3 gap-4">

                {/* Consensos */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4">
                    <div className="text-2xl font-black text-slate-900 mb-1">{synthesis.alignments.length}</div>
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                        {t('synthesis.consensus')}
                    </h3>
                    {synthesis.alignments.length > 0 ? (
                        <ul className="space-y-1.5">
                            {synthesis.alignments.slice(0, 3).map((a, i) => (
                                <li key={i} className="flex items-start gap-1.5 text-xs text-slate-600">
                                    <span className="text-green-600 mt-0.5 shrink-0">✓</span>
                                    <span className="line-clamp-2">{a.topic}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-xs text-slate-400">{lang === 'es' ? 'Sin consensos' : 'No alignments'}</p>
                    )}
                </div>

                {/* Tensiones */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4">
                    <div className="flex gap-3 mb-1">
                        {tensionsHigh > 0 && (
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-black text-red-600">{tensionsHigh}</span>
                                <span className="text-xs text-red-600 font-semibold">▲</span>
                            </div>
                        )}
                        {tensionsMedium > 0 && (
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-black text-amber-600">{tensionsMedium}</span>
                                <span className="text-xs text-amber-600 font-semibold">⚠</span>
                            </div>
                        )}
                        {tensionsHigh === 0 && tensionsMedium === 0 && (
                            <div className="text-2xl font-black text-green-600">0</div>
                        )}
                    </div>
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                        {t('synthesis.tensions')}
                    </h3>
                    {synthesis.tensions.length > 0 ? (
                        <div className="space-y-2">
                            {synthesis.tensions.slice(0, 2).map((ten, i) => (
                                <p key={i} className="text-xs text-slate-600 line-clamp-4 leading-relaxed">
                                    {ten.description}
                                </p>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs text-slate-400">{lang === 'es' ? 'Sin tensiones' : 'No tensions'}</p>
                    )}
                </div>

                {/* Top Riesgos */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4">
                    <div className="text-2xl font-black text-slate-900 mb-1">{Math.min(3, synthesis.topRisks.length)}</div>
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                        {t('synthesis.topRisks')}
                    </h3>
                    {synthesis.topRisks.length > 0 ? (
                        <ol className="space-y-1.5">
                            {synthesis.topRisks.slice(0, 3).map(risk => (
                                <li key={risk.rank} className="flex items-start gap-1.5">
                                    <span className="shrink-0 w-5 h-5 rounded-full bg-red-100 text-red-700 text-xs font-bold flex items-center justify-center">
                                        {risk.rank}
                                    </span>
                                    <span className="text-xs text-slate-600 line-clamp-4 leading-relaxed">{risk.description}</span>
                                </li>
                            ))}
                        </ol>
                    ) : (
                        <p className="text-xs text-slate-400">{lang === 'es' ? 'Sin riesgos' : 'No risks'}</p>
                    )}
                </div>
            </div>

            {/* ── ZONA 4: Recomendación ── */}
            <div className="bg-indigo-50 rounded-2xl border border-indigo-200 p-5">
                <h3 className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-2">
                    {t('synthesis.recommendation')}
                </h3>
                <p className="text-indigo-800 text-sm font-medium leading-relaxed">
                    {synthesis.recommendation}
                </p>
                <div className="mt-3 text-xs text-indigo-500">
                    {t('synthesis.generatedOn')} {new Date(synthesis.generatedAt).toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                </div>
            </div>

        </div>
    );
}
