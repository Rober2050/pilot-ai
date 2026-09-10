import React from 'react';
import { useTranslation } from 'react-i18next';
import { Activity, Link as LinkIcon } from 'lucide-react';

interface Task {
    name: string;
    role: string;
    days: number;
    critical: boolean;
    dependency?: string;
}

interface Phase {
    id: string;
    name: string;
    startWeek: number;
    duration: number;
    tasks: Task[];
}

interface GanttChartProps {
    projectPhases: Phase[];
    showCriticalPath: boolean;
    toggleCriticalPath: () => void;
}

export const GanttChart: React.FC<GanttChartProps> = ({ projectPhases, showCriticalPath, toggleCriticalPath }) => {
    const { t } = useTranslation('planning');
    // Calculate total duration dynamically
    const totalWeeks = Math.max(14, ...projectPhases.map(p => p.startWeek + p.duration));

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-2 px-1">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500 uppercase">{t('gantt.visualizationMode')}</span>
                    <div className="relative group/crit">
                        <button
                            onClick={toggleCriticalPath}
                            className={`px-3 py-1 rounded-full text-xs font-bold transition-all border flex items-center gap-2
               ${showCriticalPath ? 'bg-red-50 border-red-200 text-red-600 shadow-inner' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}
             `}
                        >
                            <Activity className="w-3 h-3" />
                            {showCriticalPath ? t('gantt.hideCriticalPath') : t('gantt.showCriticalPath')}
                        </button>
                        <div className="hidden group-hover/crit:block absolute top-8 left-0 z-50 w-72 bg-slate-900 text-white text-xs p-3 rounded-xl shadow-2xl pointer-events-none">
                            <div className="font-bold text-white mb-1.5 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse inline-block"></span>
                                {t('gantt.criticalPath.title')}
                            </div>
                            <p className="text-slate-300 leading-relaxed">
                                {t('gantt.criticalPath.description')}
                            </p>
                            <div className="mt-2 pt-2 border-t border-slate-700 text-slate-400">
                                {t('gantt.criticalPath.reference')}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex gap-4 text-[10px] font-medium text-slate-400 uppercase">
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-600"></div> {t('gantt.backend')}</div>
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> {t('gantt.frontend')}</div>
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div> {t('gantt.critical')}</div>
                </div>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                <div className="max-h-[500px] overflow-y-auto overflow-x-auto relative">
                    <div className="min-w-[800px] w-full">
                        <div className="flex border-b border-indigo-100 bg-white sticky top-0 z-30 shadow-sm">
                            <div className="w-64 flex-shrink-0 font-bold text-indigo-900 text-xs uppercase tracking-wider pl-4 py-3 sticky left-0 bg-white z-40 border-r border-indigo-50">
                                {t('gantt.phasesHeader')}
                            </div>
                            <div className="flex-1 flex text-xs text-indigo-800 font-bold text-center">
                                {[...Array(totalWeeks)].map((_, i) => (
                                    <div key={i} className="flex-1 border-l border-indigo-50 bg-indigo-50/30 py-3">{t('gantt.weekPrefix')} {i + 1}</div>
                                ))}
                            </div>
                        </div>

                        <div className="divide-y divide-indigo-50">
                            {projectPhases.map((phase) => (
                                <div key={phase.id} className="relative group/phase">
                                    <div className="flex items-center py-2 hover:bg-slate-50/50 transition-colors">
                                        <div className="w-64 flex-shrink-0 pr-4 pl-4 sticky left-0 bg-white z-20 border-r border-indigo-50 group-hover/phase:bg-slate-50/50 transition-colors">
                                            <h4 className="font-bold text-slate-900 text-sm">{phase.name}</h4>
                                            <span className="text-xs text-indigo-600 font-medium">{(phase.tasks || []).length} {t('gantt.technicalTasks')}</span>
                                        </div>
                                        <div className="flex-1 h-8 bg-slate-50 rounded-r-lg relative mx-2">
                                            <div
                                                className="absolute top-1 h-6 bg-indigo-600 rounded-md shadow-sm opacity-10"
                                                style={{
                                                    left: `${(phase.startWeek - 1) * (100 / totalWeeks)}%`,
                                                    width: `${phase.duration * (100 / totalWeeks)}%`
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1 py-1">
                                        {(phase.tasks || []).map((task, idx) => {
                                            const isCritical = showCriticalPath && task.critical;
                                            return (
                                                <div key={idx} className={`flex items-center group hover:bg-slate-50 rounded py-1 transition-colors ${isCritical ? 'bg-red-50/30' : ''}`}>
                                                    <div className="w-64 flex-shrink-0 flex items-center justify-between pr-4 pl-8 sticky left-0 bg-white z-20 border-r border-indigo-50 group-hover:bg-slate-50 transition-colors">
                                                        <span className={`text-xs font-medium truncate ${isCritical ? 'text-red-700 font-bold' : 'text-slate-700'}`}>
                                                            {task.name}
                                                        </span>
                                                        {task.dependency && (
                                                            <div className="group/dep relative">
                                                                <LinkIcon className="w-3 h-3 text-slate-300 hover:text-indigo-400 cursor-help" />
                                                                <div className="hidden group-hover/dep:block absolute left-4 bottom-0 bg-slate-800 text-white text-[10px] p-1 rounded whitespace-nowrap z-30">
                                                                    {t('gantt.blockedBy')} {task.dependency}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 h-6 relative mx-2">
                                                        <div
                                                            className={`absolute top-1.5 h-3 rounded-full shadow-sm text-[8px] flex items-center justify-center text-white font-bold transition-all duration-500
                              ${isCritical ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)] scale-105 z-10' :
                                                                    task.role === 'Backend' ? 'bg-blue-600' : task.role === 'Frontend' ? 'bg-emerald-500' : 'bg-purple-600'}
                            `}
                                                            style={{
                                                                left: `${(phase.startWeek - 1 + (idx * 0.3)) * (100 / totalWeeks)}%`,
                                                                width: `${(task.days / 5) * (100 / totalWeeks)}%`
                                                            }}
                                                        >
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
