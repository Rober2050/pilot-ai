import React from 'react';
import { motion } from 'framer-motion';
import { Target, TrendingUp } from 'lucide-react';
import { MetallicOrb, GlassCard } from '../PremiumComponents';

const CHART_DATA = [
    { quarter: 'Q1', market: 120, competition: 80 },
    { quarter: 'Q2', market: 180, competition: 95 },
    { quarter: 'Q3', market: 240, competition: 110 },
    { quarter: 'Q4', market: 320, competition: 125 },
];

export default function StrategyStage() {
    return (
        <div className="h-full flex flex-col items-center justify-center p-4 gap-8">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
            >
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-4">
                    <Target className="text-emerald-400" size={16} />
                    <span className="text-xs font-bold text-emerald-400 tracking-widest uppercase">Paso 2: Análisis Estratégico</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Refinamiento Inteligente</h3>
                <p className="text-slate-400">El Analista de Estrategia evalúa la viabilidad de mercado</p>
            </motion.div>

            {/* Main Content */}
            <div className="w-full max-w-5xl flex items-center justify-center gap-12">
                {/* Orb */}
                <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3, type: 'spring' }}
                >
                    <MetallicOrb
                        icon={<Target size={32} />}
                        label="ANALISTA DE ESTRATEGIA"
                        active={true}
                        size="lg"
                    />
                </motion.div>

                {/* Chart */}
                <motion.div
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="flex-1"
                >
                    <GlassCard glow glowColor="cyan" className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-white">Análisis de Viabilidad</h3>
                                <p className="text-slate-400 text-sm">Proyección de crecimiento estimada</p>
                            </div>
                            <div className="px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-full text-sm font-bold border border-emerald-500/20 flex items-center gap-2">
                                <TrendingUp size={16} />
                                +124% POTENCIAL
                            </div>
                        </div>

                        {/* Animated Chart */}
                        <div className="h-80 flex items-end justify-around gap-8 px-8">
                            {CHART_DATA.map((data, index) => (
                                <div key={data.quarter} className="flex-1 flex flex-col items-center gap-2">
                                    {/* Bars Container */}
                                    <div className="w-full flex gap-2 items-end" style={{ height: '240px' }}>
                                        {/* Market Bar */}
                                        <motion.div
                                            className="flex-1 bg-gradient-to-t from-cyan-500 to-cyan-400 rounded-t-lg relative"
                                            initial={{ height: 0 }}
                                            animate={{ height: `${(data.market / 320) * 100}%` }}
                                            transition={{
                                                delay: 1 + (index * 0.2),
                                                duration: 0.8,
                                                ease: 'easeOut'
                                            }}
                                        >
                                            <motion.div
                                                className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-cyan-400 whitespace-nowrap"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: 1.8 + (index * 0.2) }}
                                            >
                                                {data.market}
                                            </motion.div>
                                        </motion.div>

                                        {/* Competition Bar */}
                                        <motion.div
                                            className="flex-1 bg-gradient-to-t from-purple-600 to-purple-500 rounded-t-lg relative"
                                            initial={{ height: 0 }}
                                            animate={{ height: `${(data.competition / 320) * 100}%` }}
                                            transition={{
                                                delay: 1.1 + (index * 0.2),
                                                duration: 0.8,
                                                ease: 'easeOut'
                                            }}
                                        >
                                            <motion.div
                                                className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-purple-400 whitespace-nowrap"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: 1.9 + (index * 0.2) }}
                                            >
                                                {data.competition}
                                            </motion.div>
                                        </motion.div>
                                    </div>

                                    {/* Quarter Label */}
                                    <div className="text-sm text-slate-400 font-medium">{data.quarter}</div>
                                </div>
                            ))}
                        </div>

                        {/* Legend */}
                        <div className="flex justify-center gap-6 mt-6">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-cyan-400 rounded-sm"></div>
                                <span className="text-xs text-slate-400">Potencial de Mercado</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-purple-500 rounded-sm"></div>
                                <span className="text-xs text-slate-400">Competencia</span>
                            </div>
                        </div>
                    </GlassCard>
                </motion.div>
            </div>

            {/* Status */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                className="text-center"
            >
                <p className="text-emerald-400 font-semibold flex items-center gap-2 justify-center">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    Analizando nicho de mercado y viabilidad inicial...
                </p>
            </motion.div>
        </div>
    );
}
