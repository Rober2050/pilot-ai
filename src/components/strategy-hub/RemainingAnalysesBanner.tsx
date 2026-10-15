import { Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/utils';
import type { Project } from '../../types/blueprint';

interface RemainingAnalysesBannerProps {
    project: Project;
    trialCompleted: boolean;
    /** Role executions a trial user may run in one project. */
    maxSelectableRoles: number;
    /** Monthly analyses left after the trial (null while unknown). */
    remainingAnalyses: number | 'unlimited' | null;
}

/** How many analyses a non-admin user has left: per project in trial, per month after. */
export function RemainingAnalysesBanner({
    project, trialCompleted, maxSelectableRoles, remainingAnalyses,
}: RemainingAnalysesBannerProps) {
    const { t } = useTranslation('translation');

    let remaining: number;
    if (!trialCompleted) {
        const projectRoles = project.blueprint?.roles ?? {};
        const executedInProject = Object.values(projectRoles)
            .filter((r: any) => r?.status === 'completed' || r?.status === 'processing').length;
        remaining = Math.max(0, maxSelectableRoles - executedInProject);
    } else if (typeof remainingAnalyses === 'number') {
        remaining = remainingAnalyses;
    } else {
        return null;
    }

    const hasRemaining = remaining > 0;
    return (
        <div className={cn(
            "flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium border-b",
            hasRemaining
                ? "bg-indigo-50 text-indigo-700 border-indigo-100"
                : "bg-amber-50 text-amber-700 border-amber-100"
        )}>
            <Zap size={14} className={hasRemaining ? "text-indigo-500" : "text-amber-500"} />
            {hasRemaining
                ? t(trialCompleted ? 'dashboard.remainingAnalyses' : 'dashboard.remainingAnalysesTrial', { count: remaining })
                : t(trialCompleted ? 'dashboard.noRemainingAnalyses' : 'dashboard.noRemainingAnalysesTrial')
            }
        </div>
    );
}
