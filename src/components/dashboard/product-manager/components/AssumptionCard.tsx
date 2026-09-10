import { Shield, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Assumption } from '../utils/types';

const riskColors = {
    high: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: 'bg-red-100 text-red-700', icon: AlertTriangle },
    medium: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-700', icon: Shield },
    low: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
};

export const AssumptionCard = ({ assumption, index }: { assumption: Assumption; index: number }) => {
    const style = riskColors[assumption.risk] || riskColors.medium;
    const Icon = style.icon;

    return (
        <div className={`p-3 rounded-lg border ${style.border} ${style.bg} transition-all hover:shadow-sm`}>
            <div className="flex items-start gap-2">
                <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${style.text}`} />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-[12px] font-semibold text-slate-800 font-sans">H{index + 1}</span>
                        <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${style.badge}`}>
                            {assumption.risk}
                        </span>
                    </div>
                    <p className="text-[12px] text-slate-700 leading-normal font-sans mb-1">{assumption.hypothesis}</p>
                    {assumption.validation && (
                        <p className="text-[11px] text-slate-500 italic font-sans">
                            📐 {assumption.validation}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};
