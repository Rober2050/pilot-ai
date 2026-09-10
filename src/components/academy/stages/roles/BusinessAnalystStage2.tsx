import { motion } from 'framer-motion';
import { GitBranch } from 'lucide-react';

export default function BusinessAnalystStage2() {
    return (
        <div className="h-full flex flex-col items-center justify-center p-8">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full mb-4">
                    <GitBranch className="text-purple-400" size={16} />
                    <span className="text-xs font-bold text-purple-400 tracking-widest uppercase">Stage 2: Process Flow</span>
                </div>
                <h3 className="text-3xl font-bold text-white mb-2">Process Diagram</h3>
                <p className="text-slate-400">Visual workflow representation</p>
            </motion.div>

            <svg className="w-full max-w-5xl h-64" viewBox="0 0 1000 200">
                <defs>
                    <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                        <polygon points="0 0, 10 3, 0 6" fill="url(#line-gradient)" />
                    </marker>
                    <linearGradient id="line-gradient">
                        <stop offset="0%" stopColor="#06b6d4" />
                        <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                    <linearGradient id="node-gradient">
                        <stop offset="0%" stopColor="#06b6d4" />
                        <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                </defs>

                {/* Lines with arrows */}
                <motion.line x1="80" y1="100" x2="160" y2="100" stroke="url(#line-gradient)" strokeWidth="3" markerEnd="url(#arrowhead)" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.3, duration: 0.5 }} />
                <motion.line x1="260" y1="100" x2="340" y2="100" stroke="url(#line-gradient)" strokeWidth="3" markerEnd="url(#arrowhead)" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.6, duration: 0.5 }} />
                <motion.line x1="440" y1="100" x2="490" y2="100" stroke="url(#line-gradient)" strokeWidth="3" markerEnd="url(#arrowhead)" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.9, duration: 0.5 }} />
                <motion.line x1="590" y1="100" x2="640" y2="100" stroke="url(#line-gradient)" strokeWidth="3" markerEnd="url(#arrowhead)" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 1.2, duration: 0.5 }} />
                <motion.line x1="740" y1="100" x2="820" y2="100" stroke="url(#line-gradient)" strokeWidth="3" markerEnd="url(#arrowhead)" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 1.5, duration: 0.5 }} />
                <motion.line x1="920" y1="100" x2="970" y2="100" stroke="url(#line-gradient)" strokeWidth="3" markerEnd="url(#arrowhead)" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 1.8, duration: 0.5 }} />

                {/* Decision NO path (loop back) */}
                <motion.path d="M 540 130 L 540 160 L 210 160 L 210 130" stroke="#ef4444" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)" strokeDasharray="5,5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 1.3, duration: 0.8 }} />

                {/* Start Circle */}
                <motion.circle cx="50" cy="100" r="30" fill="url(#node-gradient)" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0, type: "spring" }} />
                <text x="50" y="105" textAnchor="middle" className="text-xs fill-white font-bold">Start</text>

                {/* User Input Rectangle */}
                <motion.rect x="160" y="75" width="100" height="50" rx="8" fill="url(#node-gradient)" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: "spring" }} />
                <text x="210" y="105" textAnchor="middle" className="text-xs fill-white font-bold">User Input</text>

                {/* AI Analysis Rectangle */}
                <motion.rect x="340" y="75" width="100" height="50" rx="8" fill="url(#node-gradient)" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.6, type: "spring" }} />
                <text x="390" y="105" textAnchor="middle" className="text-xs fill-white font-bold">AI Analysis</text>

                {/* Decision Diamond */}
                <motion.path d="M 540 70 L 590 100 L 540 130 L 490 100 Z" fill="#f59e0b" stroke="#f59e0b" strokeWidth="2" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.9, type: "spring" }} />
                <text x="540" y="105" textAnchor="middle" className="text-xs fill-white font-bold">Valid?</text>
                <text x="540" y="150" textAnchor="middle" className="text-[10px] fill-emerald-400 font-bold">YES</text>
                <text x="540" y="60" textAnchor="middle" className="text-[10px] fill-red-400 font-bold">NO</text>

                {/* Generate Report Rectangle */}
                <motion.rect x="640" y="75" width="100" height="50" rx="8" fill="url(#node-gradient)" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.2, type: "spring" }} />
                <text x="690" y="100" textAnchor="middle" className="text-[10px] fill-white font-bold">Generate</text>
                <text x="690" y="112" textAnchor="middle" className="text-[10px] fill-white font-bold">Report</text>

                {/* Save Data Rectangle */}
                <motion.rect x="820" y="75" width="100" height="50" rx="8" fill="url(#node-gradient)" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.5, type: "spring" }} />
                <text x="870" y="105" textAnchor="middle" className="text-xs fill-white font-bold">Save Data</text>

                {/* End Circle */}
                <motion.circle cx="990" cy="100" r="30" fill="url(#node-gradient)" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.8, type: "spring" }} />
                <text x="990" y="105" textAnchor="middle" className="text-xs fill-white font-bold">End</text>
            </svg>
        </div>
    );
}
