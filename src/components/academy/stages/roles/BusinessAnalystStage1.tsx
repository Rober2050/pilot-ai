import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';

export default function BusinessAnalystStage1() {
    return (
        <div className="h-full flex flex-col items-center justify-center p-8">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full mb-4">
                    <FileText className="text-cyan-400" size={16} />
                    <span className="text-xs font-bold text-cyan-400 tracking-widest uppercase">Stage 1: User Story</span>
                </div>
                <h3 className="text-3xl font-bold text-white mb-2">JIRA User Story Format</h3>
                <p className="text-slate-400">Structured requirements for development</p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="w-full max-w-2xl bg-slate-900/50 border-2 border-cyan-500/30 rounded-2xl p-8"
            >
                <div className="flex items-center justify-between mb-6">
                    <div className="text-sm font-bold text-cyan-400">US-001</div>
                    <div className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-full text-xs font-bold text-emerald-400">
                        HIGH PRIORITY
                    </div>
                </div>

                <div className="space-y-6">
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
                        <div className="text-xs text-slate-500 uppercase mb-2">As a</div>
                        <div className="text-lg text-white">Platform User</div>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7 }}>
                        <div className="text-xs text-slate-500 uppercase mb-2">I want</div>
                        <div className="text-lg text-white">to create a new project with AI assistance</div>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.9 }}>
                        <div className="text-xs text-slate-500 uppercase mb-2">So that</div>
                        <div className="text-lg text-white">I can quickly validate my business idea</div>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1 }}>
                        <div className="text-xs text-slate-500 uppercase mb-3">Acceptance Criteria</div>
                        <div className="space-y-2">
                            {[
                                'User can input project description',
                                'AI generates initial analysis within 30 seconds',
                                'Results are displayed in dashboard format'
                            ].map((criteria, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 1.3 + i * 0.15 }}
                                    className="flex items-start gap-2 text-sm text-slate-300"
                                >
                                    <div className="w-5 h-5 rounded bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                                        <span className="text-emerald-400 text-xs">✓</span>
                                    </div>
                                    {criteria}
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
}
