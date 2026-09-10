import { Clock, Hash, DollarSign, MessageSquare } from 'lucide-react';

interface StatsPanelProps {
    roundCount: number;
    maxRounds: number;
    totalTokens: number;
    estimatedCost: number;
    transcriptLength: number;
    language: 'es' | 'en';
}

export const StatsPanel: React.FC<StatsPanelProps> = ({
    roundCount,
    maxRounds,
    totalTokens,
    estimatedCost,
    transcriptLength,
    language
}) => {
    const isSpanish = language === 'es';

    const stats = [
        {
            icon: Clock,
            label: isSpanish ? 'Rondas' : 'Rounds',
            value: `${roundCount}/${maxRounds}`,
            color: 'text-cyan-400'
        },
        {
            icon: MessageSquare,
            label: isSpanish ? 'Mensajes' : 'Messages',
            value: transcriptLength.toString(),
            color: 'text-emerald-400'
        },
        {
            icon: Hash,
            label: isSpanish ? 'Tokens' : 'Tokens',
            value: totalTokens.toLocaleString(),
            color: 'text-purple-400'
        },
        {
            icon: DollarSign,
            label: isSpanish ? 'Costo Est.' : 'Est. Cost',
            value: `$${estimatedCost.toFixed(4)}`,
            color: 'text-orange-400'
        }
    ];

    return (
        <div className="p-6 space-y-4">
            <p className="text-sm text-slate-400 mb-4">
                {isSpanish
                    ? 'Estadísticas de la reunión actual'
                    : 'Current meeting statistics'}
            </p>

            <div className="grid grid-cols-2 gap-4">
                {stats.map((stat, index) => {
                    const Icon = stat.icon;

                    return (
                        <div
                            key={index}
                            className="bg-slate-800/50 rounded-xl p-4 border border-white/5"
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <Icon className={`w-4 h-4 ${stat.color}`} />
                                <span className="text-xs text-slate-400 uppercase tracking-wider">
                                    {stat.label}
                                </span>
                            </div>
                            <div className={`text-2xl font-bold font-mono ${stat.color}`}>
                                {stat.value}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Progress */}
            {roundCount > 0 && (
                <div className="pt-4 border-t border-white/10">
                    <div className="flex justify-between text-xs text-slate-400 mb-2">
                        <span>{isSpanish ? 'Progreso' : 'Progress'}</span>
                        <span>{Math.round((roundCount / maxRounds) * 100)}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-500"
                            style={{ width: `${(roundCount / maxRounds) * 100}%` }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
