import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

export default function BusinessAnalystStage3() {
    const requirements = [
        { category: 'Functional', items: ['User authentication', 'Project creation', 'AI analysis', 'Report generation'] },
        { category: 'Non-Functional', items: ['Response time < 3s', '99.9% uptime', 'GDPR compliance', 'Mobile responsive'] }
    ];

    return (
        <div className="h-full flex flex-col items-center justify-center p-8">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-4">
                    <CheckCircle2 className="text-emerald-400" size={16} />
                    <span className="text-xs font-bold text-emerald-400 tracking-widest uppercase">Stage 3: Requirements</span>
                </div>
                <h3 className="text-3xl font-bold text-white mb-2">Requirements Specification</h3>
                <p className="text-slate-400">Comprehensive functional and non-functional requirements</p>
            </motion.div>

            <div className="grid grid-cols-2 gap-8 w-full max-w-4xl">
                {requirements.map((req, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + idx * 0.2 }}
                        className="bg-slate-900/50 border border-slate-700/50 rounded-2xl p-6"
                    >
                        <h4 className="text-lg font-bold text-cyan-400 mb-4">{req.category}</h4>
                        <div className="space-y-3">
                            {req.items.map((item, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.5 + idx * 0.2 + i * 0.1 }}
                                    className="flex items-start gap-2"
                                >
                                    <CheckCircle2 size={16} className="text-emerald-400 mt-0.5 shrink-0" />
                                    <span className="text-sm text-slate-300">{item}</span>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
