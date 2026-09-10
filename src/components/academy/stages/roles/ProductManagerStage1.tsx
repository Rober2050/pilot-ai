import { motion } from 'framer-motion';
import { Lightbulb } from 'lucide-react';

export default function ProductManagerStage1() {
    const phases = [
        { name: 'Discovery', duration: 2, color: 'cyan', status: 'completed' },
        { name: 'MVP', duration: 4, color: 'purple', status: 'current' },
        { name: 'Growth', duration: 6, color: 'emerald', status: 'future' },
        { name: 'Scale', duration: 8, color: 'amber', status: 'future' }
    ];

    return (
        <div className="h-full flex flex-col items-center justify-center p-8">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full mb-4">
                    <Lightbulb className="text-purple-400" size={16} />
                    <span className="text-xs font-bold text-purple-400 tracking-widest uppercase">Stage 1: Product Roadmap</span>
                </div>
                <h3 className="text-3xl font-bold text-white mb-2">Strategic Roadmap</h3>
                <p className="text-slate-400">From vision to execution in phases</p>
            </motion.div>

            <div className="w-full max-w-4xl space-y-4">
                {phases.map((phase, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.2 }}
                        className="relative"
                    >
                        <div className={`p-4 rounded-xl border-2 ${phase.status === 'completed' ? 'bg-emerald-900/20 border-emerald-500/30' :
                                phase.status === 'current' ? 'bg-purple-900/20 border-purple-500/50' :
                                    'bg-slate-800/20 border-slate-700/30'
                            }`}>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-lg font-bold text-white">{phase.name}</span>
                                <span className="text-sm text-slate-400">{phase.duration} months</span>
                            </div>
                            <motion.div
                                className={`h-2 rounded-full ${phase.status === 'completed' ? 'bg-emerald-500' :
                                        phase.status === 'current' ? 'bg-gradient-to-r from-purple-500 to-purple-600' :
                                            'bg-slate-700'
                                    }`}
                                initial={{ width: 0 }}
                                animate={{ width: phase.status === 'completed' ? '100%' : phase.status === 'current' ? '60%' : '0%' }}
                                transition={{ delay: 0.5 + i * 0.2, duration: 0.8 }}
                            />
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
