import { motion } from 'framer-motion';
import { Users } from 'lucide-react';

export default function ProjectManagerStage2() {
    const team = [
        { name: 'Frontend Dev', allocated: 80, skills: ['React', 'TypeScript', 'CSS'] },
        { name: 'Backend Dev', allocated: 100, skills: ['Node.js', 'PostgreSQL', 'API'] },
        { name: 'Designer', allocated: 60, skills: ['Figma', 'UI/UX', 'Branding'] },
        { name: 'QA Engineer', allocated: 50, skills: ['Testing', 'Automation', 'Selenium'] }
    ];

    return (
        <div className="h-full flex flex-col items-center justify-center p-8">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full mb-4">
                    <Users className="text-purple-400" size={16} />
                    <span className="text-xs font-bold text-purple-400 tracking-widest uppercase">Stage 2: Resource Allocation</span>
                </div>
                <h3 className="text-3xl font-bold text-white mb-2">Team Resources</h3>
                <p className="text-slate-400">Capacity planning and skill distribution</p>
            </motion.div>

            <div className="grid grid-cols-2 gap-6 w-full max-w-4xl">
                {team.map((member, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 + i * 0.15 }}
                        className="bg-slate-900/50 border border-slate-700/50 rounded-2xl p-6"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-lg font-bold text-white">{member.name}</h4>
                            <div className={`px-3 py-1 rounded-full text-xs font-bold ${member.allocated === 100 ? 'bg-red-500/20 text-red-400' :
                                    member.allocated >= 80 ? 'bg-amber-500/20 text-amber-400' :
                                        'bg-emerald-500/20 text-emerald-400'
                                }`}>
                                {member.allocated}%
                            </div>
                        </div>

                        <div className="mb-4">
                            <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                                <motion.div
                                    className={`h-full ${member.allocated === 100 ? 'bg-red-500' :
                                            member.allocated >= 80 ? 'bg-amber-500' :
                                                'bg-emerald-500'
                                        }`}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${member.allocated}%` }}
                                    transition={{ delay: 0.4 + i * 0.15, duration: 0.8 }}
                                />
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {member.skills.map((skill, j) => (
                                <motion.div
                                    key={j}
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.6 + i * 0.15 + j * 0.1 }}
                                    className="px-2 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded text-xs text-cyan-400"
                                >
                                    {skill}
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
