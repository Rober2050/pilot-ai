import { useState, useEffect, Suspense, lazy } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n/config';
import { RoleConfig } from '../types/roles';
import { RoleOutput, Project } from '../types/blueprint';
import { Play, AlertCircle, Loader2, MessageSquare, RotateCcw } from 'lucide-react';
import { cn } from '../lib/utils';
import ChatBox from './ChatBox';
// ⚡ Lazy-load RichContentRenderer: it imports Recharts (~400KB) statically.
// Without this lazy boundary, the chain StrategyHub → ResultsWorkspace → RolePanel → RichContentRenderer
// forces ~400KB of chart code into the main bundle, blocking the initial render.
const RichContentRenderer = lazy(() =>
    import('./RichContentRenderer').then(m => ({ default: m.RichContentRenderer }))
);

interface RolePanelProps {
    role: RoleConfig;
    output?: RoleOutput;
    isActive: boolean;
    onRun: () => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onUpdate: (data: any) => void;
    project?: Project;
    onConvertToMaster?: (node: any, subDiagram?: any) => void;
    onUpgradeRequired?: () => void; // Trigger when locked role is clicked
    readOnly?: boolean;
    anotherRoleExecuting?: boolean; // True when a different role is actively executing
    executingRoleName?: string;     // Name of the role currently executing
}

const GENERIC_STEPS_KEYS = [
    'rolePanel.analysisStep1',
    'rolePanel.analysisStep2',
    'rolePanel.analysisStep3',
    'rolePanel.analysisStep4',
    'rolePanel.analysisStep5',
] as const;

const ROLE_STEP_PREFIXES: Record<string, string> = {
    'strategy-analyst':  'rolePanel.strategy-analyst',
    'strategy-manager':  'rolePanel.strategy-manager',
    'product-manager':   'rolePanel.product-manager',
    'business-analyst':  'rolePanel.ba',
    'project-manager':   'rolePanel.project-manager',
    'marketing-manager': 'rolePanel.marketing-manager',
    'architect':         'rolePanel.architect',
    'ux-designer':       'rolePanel.ux-designer',
    'qa-engineer':       'rolePanel.qa-engineer',
};

function getRoleStepKeys(roleId?: string): readonly string[] {
    if (!roleId || !ROLE_STEP_PREFIXES[roleId]) return GENERIC_STEPS_KEYS;
    const prefix = ROLE_STEP_PREFIXES[roleId];
    return [`${prefix}.step1`, `${prefix}.step2`, `${prefix}.step3`, `${prefix}.step4`, `${prefix}.step5`];
}

function AnalyzingPanel({ roleName, roleId, startedAt, t }: { roleName: string; roleId?: string; startedAt?: string; t: ReturnType<typeof useTranslation<'project'>>['t'] }) {
    // Calculate elapsed based on real startedAt timestamp from Firestore
    // This ensures elapsed is correct even when user navigates away and comes back
    const getElapsed = () => startedAt
        ? Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000)
        : 0;

    const [elapsed, setElapsed] = useState(getElapsed);

    useEffect(() => {
        const interval = setInterval(() => setElapsed(getElapsed()), 1000);
        return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [startedAt]);

    const steps = getRoleStepKeys(roleId);
    const stepIndex = Math.min(Math.floor(elapsed / 12), steps.length - 1);
    const progressPct = Math.min(Math.round((elapsed / 90) * 100), 94);
    const mins = Math.floor(elapsed / 60);
    const secs = elapsed % 60;
    const elapsedStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;

    return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            {/* Spinner */}
            <div className="relative w-16 h-16 mb-6">
                <div className="absolute inset-0 border-4 border-slate-200 rounded-full" />
                <div className="absolute inset-0 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin" />
            </div>

            {/* Role name */}
            <p className="text-slate-900 font-bold text-lg mb-1">{roleName}</p>

            {/* Current step — rotates every 12s */}
            <p className="text-indigo-600 text-sm font-medium mb-6 min-h-[1.25rem] transition-all duration-500">
                {t(steps[stepIndex])}
            </p>

            {/* Progress bar */}
            <div className="w-full max-w-xs bg-slate-100 rounded-full h-1.5 mb-3">
                <div
                    className="bg-indigo-500 h-1.5 rounded-full transition-all duration-1000"
                    style={{ width: `${progressPct}%` }}
                />
            </div>

            {/* Elapsed + note */}
            <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>{elapsedStr}</span>
                <span>·</span>
                <span>{t('rolePanel.analysisTimeNote')}</span>
            </div>
        </div>
    );
}

export default function RolePanel({ role, output, isActive: _isActive, onRun, onUpdate, project, onConvertToMaster, onUpgradeRequired, readOnly, anotherRoleExecuting, executingRoleName }: RolePanelProps) {
    const { t } = useTranslation('project');
    const [showChat, setShowChat] = useState(false);

    // Local "click-to-running" bridge: gives instant visual feedback the moment the
    // user clicks Run. Without this, the button just stays in its :active flash and
    // resets to normal until the async parent flow eventually flips output.status to
    // 'processing' — which the user perceives as "the click was lost".
    const [isStartingRun, setIsStartingRun] = useState(false);

    // Clear the bridge as soon as the parent state catches up to processing/error/etc.
    // This way AnalyzingPanel takes over seamlessly with no double-flash.
    useEffect(() => {
        if (output && output.status !== 'pending') {
            setIsStartingRun(false);
        }
    }, [output?.status]);

    const handleRunClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!role.isEnabled) {
            onUpgradeRequired?.();
            return;
        }
        // Optimistic feedback — flip immediately so the user sees the role engage.
        setIsStartingRun(true);
        onRun();
        // Safety: if for any reason the parent never flips status (silent guard like
        // hasAnyProcessingRole), release the bridge after a short window so the user
        // can click again rather than being stuck on "Iniciando...".
        setTimeout(() => setIsStartingRun(false), 4000);
    };

    return (
        <div className="animate-in fade-in duration-200">
            {!output || output.status === 'pending' ? (
                        <div className="text-center py-8">
                            {/* If another role is executing, show info banner instead of allowing execution */}
                            {anotherRoleExecuting ? (
                                <div className="inline-flex flex-col items-center gap-3 px-6 py-4 bg-amber-50 border border-amber-200 rounded-xl max-w-sm mx-auto animate-in fade-in duration-300">
                                    <Loader2 size={20} className="text-amber-500 animate-spin" />
                                    <p className="text-sm font-semibold text-amber-800 text-center">
                                        {t('rolePanel.executingBanner', { role: executingRoleName, defaultValue: `${executingRoleName} está ejecutándose` })}
                                    </p>
                                    <p className="text-xs text-amber-600 text-center">
                                        {t('rolePanel.executingBannerDesc', { defaultValue: 'Los roles se ejecutan en secuencia. Este rol comenzará automáticamente cuando el anterior termine, o puedes esperar y ejecutarlo manualmente.' })}
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <p className="text-slate-400 mb-4">{t('rolePanel.notProcessed')}</p>
                                    <button
                                        onClick={handleRunClick}
                                        disabled={isStartingRun}
                                        className={`btn-primary mx-auto ${isStartingRun ? 'opacity-80 cursor-wait' : ''}`}
                                    >
                                        {isStartingRun ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                {t('rolePanel.startingAnalysis', { defaultValue: 'Iniciando…' })}
                                            </>
                                        ) : (
                                            <>
                                                <Play className="h-4 w-4" />
                                                {role.isEnabled ? t('rolePanel.runAnalysis') : t('rolePanel.upgradePlan')}
                                            </>
                                        )}
                                    </button>
                                </>
                            )}
                            {!role.isEnabled && (
                                <p className="text-xs text-slate-500 mt-2">
                                    {t('rolePanel.upgradeToAccess')}
                                </p>
                            )}
                        </div>
                    ) : output.status === 'processing' ? (
                        <AnalyzingPanel roleName={role.displayName} roleId={role.roleId} startedAt={output.startedAt} t={t} />
                    ) : output.status === 'error' ? (
                        <div className="text-center py-8">
                            {anotherRoleExecuting ? (
                                <div className="inline-flex flex-col items-center gap-3 px-6 py-4 bg-amber-50 border border-amber-200 rounded-xl max-w-sm mx-auto animate-in fade-in duration-300">
                                    <Loader2 size={20} className="text-amber-500 animate-spin" />
                                    <p className="text-sm font-semibold text-amber-800 text-center">
                                        {t('rolePanel.executingBanner', { role: executingRoleName, defaultValue: `${executingRoleName} está ejecutándose` })}
                                    </p>
                                    <p className="text-xs text-amber-600 text-center">
                                        {t('rolePanel.executingBannerDesc', { defaultValue: 'Los roles se ejecutan en secuencia. Este rol comenzará automáticamente cuando el anterior termine, o puedes esperar y ejecutarlo manualmente.' })}
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <div className="bg-red-500/10 text-red-400 border border-red-500/20 p-4 rounded-lg mb-6 inline-block max-w-lg">
                                        <AlertCircle className="h-6 w-6 mx-auto mb-2" />
                                        <p className="font-medium">{t('rolePanel.analysisFailed')}</p>
                                        <p className="text-sm opacity-90 mt-1">{typeof output.content === 'string' ? output.content : 'Unknown error occurred'}</p>
                                    </div>
                                    <div>
                                        <button
                                            onClick={handleRunClick}
                                            disabled={isStartingRun}
                                            className={`btn-primary mx-auto bg-red-600 hover:bg-red-700 border-red-600 text-white ${isStartingRun ? 'opacity-80 cursor-wait' : ''}`}
                                        >
                                            {isStartingRun ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                    {t('rolePanel.startingAnalysis', { defaultValue: 'Iniciando…' })}
                                                </>
                                            ) : (
                                                <>
                                                    <RotateCcw className="h-4 w-4 mr-2" />
                                                    {t('rolePanel.retryAnalysis')}
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Main Analysis Content */}
                            <div id={`role-content-${role.roleId}`} className="prose prose-slate max-w-none">
                                <Suspense fallback={
                                    <div className="flex items-center justify-center py-12">
                                        <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                                    </div>
                                }>
                                    <RichContentRenderer
                                        content={output.content}
                                        docConfig={role.docConfig}
                                        projectId={project?.id}
                                        roleId={role.roleId}
                                        savedAnswers={output.discoveryAnswers}
                                        onConvertToMaster={onConvertToMaster}
                                        methodology={project?.blueprint?.meta?.methodology}
                                    />
                                </Suspense>
                            </div>

                            {/* Actions */}
                            {!readOnly && (
                                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                    <button
                                        onClick={() => setShowChat(!showChat)}
                                        className={cn(
                                            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors",
                                            showChat ? "bg-indigo-50 text-indigo-600 border border-indigo-200" : "bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100"
                                        )}
                                    >
                                        <MessageSquare className="h-4 w-4" />
                                        {showChat ? t('rolePanel.hideChat') : t('rolePanel.refineWithAI')}
                                    </button>

                                    <div className="text-xs text-slate-400">
                                        {t('rolePanel.lastUpdated')} {new Date(output.lastUpdated).toLocaleString()}
                                    </div>
                                </div>
                            )}

                            {/* Chat Interface */}
                            {!readOnly && showChat && (
                                <div className="mt-4 animate-in fade-in slide-in-from-bottom-4">
                                    <ChatBox
                                        roleId={role.roleId}
                                        modelName={role.aiModel || role.model}
                                        systemPrompt={role.systemPrompt}
                                        contextData={output.content}
                                        onUpdateBlueprint={onUpdate}
                                        lang={i18n.language === 'es' ? 'es' : 'en'}
                                    />
                                </div>
                            )}
                        </div>
                    )}
        </div>
    );
}
