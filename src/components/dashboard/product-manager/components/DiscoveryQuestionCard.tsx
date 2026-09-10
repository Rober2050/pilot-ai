import { useTranslation } from 'react-i18next';
import { Info } from 'lucide-react';
import { DiscoveryQuestion } from '../utils/types';

export const DiscoveryQuestionCard = ({ q, index, answer, onAnswerChange }: { q: DiscoveryQuestion, index: number, answer: string, onAnswerChange: (val: string) => void }) => {
    const { t } = useTranslation('product');
    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 group focus-within:ring-2 focus-within:ring-indigo-500/20">
            <div className="flex items-start gap-4 mb-4">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm shrink-0">
                    {index + 1}
                </div>
                <div>
                    <h4 className="font-bold text-slate-800 text-lg leading-snug mb-1">{q.question}</h4>
                    {q.context && (
                        <p className="text-sm text-slate-500 italic flex items-center gap-1.5">
                            <Info className="w-3.5 h-3.5" />
                            {q.context}
                        </p>
                    )}
                </div>
            </div>
            <textarea
                className="w-full p-4 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-700 transition-all resize-y min-h-[100px]"
                placeholder={t('discovery.placeholder')}
                value={answer}
                onChange={(e) => onAnswerChange(e.target.value)}
            />
        </div>
    );
};
