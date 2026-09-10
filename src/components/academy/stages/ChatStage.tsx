
import { motion } from 'framer-motion';
import { MessageSquare, Send } from 'lucide-react';
import { GlassCard } from '../PremiumComponents';

export default function ChatStage() {
    return (
        <div className="h-full flex flex-col items-center justify-center p-4">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-8"
            >
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full mb-4">
                    <MessageSquare className="text-blue-400" size={16} />
                    <span className="text-xs font-bold text-blue-400 tracking-widest uppercase">Paso 4: Consulta IA</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Refinamiento con Chat Especializado</h3>
                <p className="text-slate-400">Cada rol tiene su propia IA consultable</p>
            </motion.div>

            {/* Chat Window */}
            <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="w-full max-w-2xl"
            >
                <GlassCard className="overflow-hidden">
                    {/* Chat Header */}
                    <div className="bg-slate-800/80 p-4 flex items-center gap-3 border-b border-slate-700/50">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                            <span className="text-white font-bold text-lg">PM</span>
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-white">Product Manager</h4>
                            <span className="text-xs text-green-400 flex items-center gap-1.5">
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]"></span>
                                Online
                            </span>
                        </div>
                        <div className="text-xs text-slate-500">
                            Modelo: GPT-4 Turbo
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="p-6 space-y-4 font-mono text-sm min-h-[300px]">
                        {/* User Message */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.6 }}
                            className="flex justify-start"
                        >
                            <div className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 p-4 rounded-tr-2xl rounded-bl-2xl rounded-br-2xl max-w-[85%] shadow-lg">
                                <div className="text-slate-300">
                                    ¿Podemos reducir el alcance del MVP para lanzar más rápido?
                                </div>
                                <div className="text-[10px] text-slate-500 mt-2">Usuario · Ahora</div>
                            </div>
                        </motion.div>

                        {/* AI Typing Indicator */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: [0, 1, 0] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                            className="flex items-center gap-2 text-slate-500"
                        >
                            <div className="flex gap-1">
                                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                            <span className="text-xs">Product Manager está escribiendo...</span>
                        </motion.div>

                        {/* AI Response */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 2 }}
                            className="flex justify-end"
                        >
                            <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-sm border border-purple-500/30 p-4 rounded-tl-2xl rounded-bl-2xl rounded-br-2xl max-w-[85%] shadow-[0_0_20px_rgba(168,85,247,0.3)]">
                                <div className="text-purple-100">
                                    Excelente pregunta. Analizando el scope actual, sugiero:
                                    <ul className="mt-2 space-y-1 list-disc list-inside">
                                        <li>Eliminar módulo de fidelización (Fase 2)</li>
                                        <li>Simplificar dashboard de analytics</li>
                                        <li>Mantener flujo de pago core</li>
                                    </ul>
                                    <div className="mt-3 text-sm">Esto reduce TTM en ~6 semanas.</div>
                                </div>
                                <div className="text-[10px] text-purple-300 mt-2">PM AI · Ahora</div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-slate-950/50 border-t border-slate-800/50">
                        <div className="flex items-center gap-3">
                            <input
                                type="text"
                                placeholder="Escribe tu pregunta..."
                                className="flex-1 bg-slate-800/50 border border-slate-700/50 rounded-full px-4 py-2.5 text-sm text-slate-300 placeholder-slate-500 focus:outline-none focus:border-purple-500/50 transition-colors"
                            />
                            <button className="p-2.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full text-white hover:shadow-[0_0_20px_rgba(168,85,247,0.5)] transition-all">
                                <Send size={18} />
                            </button>
                        </div>
                    </div>
                </GlassCard>
            </motion.div>

            {/* Hint */}
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.5 }}
                className="mt-6 text-slate-400 text-center"
            >
                Refina y ajusta cada entregable con consultas inteligentes
            </motion.p>
        </div>
    );
}
