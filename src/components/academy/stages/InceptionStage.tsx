import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function InceptionStage() {
    const [text, setText] = useState('');
    const fullText = 'Crear una plataforma de delivery de habanos premium con IA y blockchain...';

    useEffect(() => {
        let index = 0;
        const interval = setInterval(() => {
            if (index <= fullText.length) {
                setText(fullText.slice(0, index));
                index++;
            } else {
                clearInterval(interval);
            }
        }, 50);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="h-full flex flex-col items-center justify-center p-4">
            {/* Label */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-8"
            >
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full mb-4">
                    <Sparkles className="text-cyan-400" size={16} />
                    <span className="text-xs font-bold text-cyan-400 tracking-widest uppercase">Paso 1: Tu Idea</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">De Idea a Proyecto</h3>
                <p className="text-slate-400">Todo comienza con una simple descripción...</p>
            </motion.div>

            {/* Input Box (Matching Strategy Hub aesthetic) */}
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="w-full max-w-3xl relative"
            >
                {/* Glow effect */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-[2rem] blur opacity-30 animate-pulse"></div>

                {/* Card */}
                <div className="relative bg-[#1e293b] rounded-[1.5rem] lg:rounded-[2rem] shadow-2xl overflow-hidden border border-slate-700/50">
                    {/* Header bar */}
                    <div className="px-6 py-3 bg-slate-800/50 border-b border-slate-700/30 flex justify-between items-center">
                        <div className="flex gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-400/60"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-400/60"></div>
                            <div className="w-3 h-3 rounded-full bg-green-400/60"></div>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-medium text-slate-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            Sistema En Línea
                        </div>
                    </div>

                    {/* Input Area */}
                    <div className="p-8">
                        <div className="relative">
                            <div className="text-xl lg:text-2xl text-white font-light tracking-wide min-h-[80px]">
                                {text}
                                <motion.span
                                    className="inline-block w-0.5 h-6 bg-cyan-400 ml-1"
                                    animate={{ opacity: [1, 0, 1] }}
                                    transition={{ repeat: Infinity, duration: 0.8 }}
                                />
                            </div>
                        </div>

                        {/* Bottom Actions */}
                        <div className="flex justify-between items-center mt-6 pt-6 border-t border-slate-700/30">
                            <div className="flex gap-4">
                                <button className="p-2 text-slate-400 hover:text-white transition-colors">
                                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                    </svg>
                                </button>
                                <button className="p-2 text-slate-400 hover:text-white transition-colors">
                                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </button>
                            </div>

                            {/* Analyze Button */}
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="group relative inline-flex items-center justify-center px-8 py-3 font-semibold text-white transition-all duration-200 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-full hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] focus:outline-none"
                            >
                                <div className="absolute inset-0 w-full h-full rounded-full opacity-0 group-hover:opacity-10 transition-opacity bg-white"></div>
                                <Zap size={18} className="mr-2 fill-white" />
                                <span>Analizar</span>
                            </motion.button>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Bottom hint */}
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2 }}
                className="mt-8 text-slate-400 text-center animate-pulse"
            >
                Detectando intención de negocio y extrayendo requisitos...
            </motion.p>
        </div>
    );
}
