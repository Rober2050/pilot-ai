import { useTranslation } from 'react-i18next';
import { Target, CheckCircle2 } from 'lucide-react';
import { OKR } from '../utils/types';

export const OKRCard = ({ okr, index }: { okr: OKR; index: number }) => {
    const { t } = useTranslation('product');
    return (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-start gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center shrink-0">
                    <Target className="w-4 h-4 text-violet-600" />
                </div>
                <div>
                    <span className="text-[10px] font-bold text-violet-500 uppercase tracking-wider">
                        {okr.timeline || `${t('okr.objective')} ${index + 1}`}
                    </span>
                    <h4 className="text-sm font-bold text-slate-800 mt-0.5">{okr.objective}</h4>
                </div>
            </div>
            {okr.keyResults.length > 0 && (
                <div className="space-y-1.5 pl-11">
                    {okr.keyResults.map((kr, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                            <span className="text-[12px] text-slate-600 font-sans leading-normal">{kr}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
