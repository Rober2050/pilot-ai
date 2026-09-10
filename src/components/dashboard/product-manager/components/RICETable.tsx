import { useTranslation } from 'react-i18next';
import { RICEFeature } from '../utils/types';

const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-50';
    if (score >= 40) return 'text-indigo-600 bg-indigo-50';
    if (score >= 20) return 'text-amber-600 bg-amber-50';
    return 'text-slate-500 bg-slate-50';
};

const getBarWidth = (value: number, max: number = 10): string => {
    return `${Math.min((value / max) * 100, 100)}%`;
};

export const RICETable = ({ features }: { features: RICEFeature[] }) => {
    const { t } = useTranslation('product');
    const sorted = [...features].sort((a, b) => b.riceScore - a.riceScore);

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-[12px] font-sans">
                <thead>
                    <tr className="border-b border-slate-200">
                        <th className="text-left py-2 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">{t('rice.feature')}</th>
                        <th className="text-center py-2 px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">R</th>
                        <th className="text-center py-2 px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">I</th>
                        <th className="text-center py-2 px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">C</th>
                        <th className="text-center py-2 px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">E</th>
                        <th className="text-center py-2 px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">{t('rice.score')}</th>
                        <th className="text-center py-2 px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">{t('rice.mvp')}</th>
                    </tr>
                </thead>
                <tbody>
                    {sorted.map((feature, idx) => (
                        <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                            <td className="py-2.5 px-3">
                                <div className="font-semibold text-slate-800">{feature.name}</div>
                                {feature.description && (
                                    <div className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[200px]">{feature.description}</div>
                                )}
                            </td>
                            <td className="text-center py-2.5 px-2">
                                <div className="w-8 mx-auto">
                                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-400 rounded-full" style={{ width: getBarWidth(feature.reach) }} />
                                    </div>
                                    <span className="text-[10px] text-slate-500 mt-0.5">{feature.reach}</span>
                                </div>
                            </td>
                            <td className="text-center py-2.5 px-2">
                                <div className="w-8 mx-auto">
                                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-violet-400 rounded-full" style={{ width: getBarWidth(feature.impact) }} />
                                    </div>
                                    <span className="text-[10px] text-slate-500 mt-0.5">{feature.impact}</span>
                                </div>
                            </td>
                            <td className="text-center py-2.5 px-2">
                                <div className="w-8 mx-auto">
                                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-400 rounded-full" style={{ width: getBarWidth(feature.confidence) }} />
                                    </div>
                                    <span className="text-[10px] text-slate-500 mt-0.5">{feature.confidence}</span>
                                </div>
                            </td>
                            <td className="text-center py-2.5 px-2">
                                <div className="w-8 mx-auto">
                                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-amber-400 rounded-full" style={{ width: getBarWidth(feature.effort) }} />
                                    </div>
                                    <span className="text-[10px] text-slate-500 mt-0.5">{feature.effort}</span>
                                </div>
                            </td>
                            <td className="text-center py-2.5 px-2">
                                <span className={`inline-flex items-center justify-center w-10 h-6 rounded-md font-bold text-[11px] ${getScoreColor(feature.riceScore)}`}>
                                    {feature.riceScore}
                                </span>
                            </td>
                            <td className="text-center py-2.5 px-2">
                                {feature.inMVP ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                                        {t('rice.inMvp')}
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">
                                        {t('rice.outMvp')}
                                    </span>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
