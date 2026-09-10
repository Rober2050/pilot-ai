import React from 'react';
import { motion } from 'framer-motion';
import { Layout, CheckCircle } from 'lucide-react';

export default function PrototypeStage() {
    return (
        <div className="h-full flex flex-col items-center justify-center p-4">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-8"
            >
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-pink-500/10 border border-pink-500/20 rounded-full mb-4">
                    <Layout className="text-pink-400" size={16} />
                    <span className="text-xs font-bold text-pink-400 tracking-widest uppercase">Paso 5: Ejecución</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Generación de Prototipo</h3>
                <p className="text-slate-400">De wireframes a UI interactiva en minutos</p>
            </motion.div>

            {/* Browser Mockup */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
                className="w-full max-w-5xl h-[500px] bg-white/5 rounded-2xl overflow-hidden shadow-2xl border border-slate-700/50"
            >
                {/* Browser Top Bar */}
                <div className="bg-slate-800/80 backdrop-blur-sm border-b border-slate-700/50 px-4 py-3 flex items-center gap-3">
                    <div className="flex gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-400/80"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-400/80"></div>
                        <div className="w-3 h-3 rounded-full bg-green-400/80"></div>
                    </div>
                    <div className="flex-1 bg-slate-900/50 rounded-md h-7 px-3 flex items-center text-xs text-slate-400">
                        https://habanos-premium.app
                    </div>
                </div>

                {/* Mockup Content */}
                <div className="p-8 h-full bg-gradient-to-br from-slate-900 to-slate-950">
                    <div className="grid grid-cols-12 gap-6 h-full">
                        {/* Sidebar */}
                        <motion.div
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="col-span-3 bg-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-700/30"
                        ></motion.div>

                        {/* Main Content */}
                        <div className="col-span-9 space-y-4">
                            {/* Hero Section */}
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.7 }}
                                className="h-40 bg-gradient-to-r from-amber-500/20 to-orange-500/20 backdrop-blur-sm rounded-2xl border border-amber-500/30 shadow-[0_0_40px_rgba(245,158,11,0.2)]"
                            ></motion.div>

                            {/* Cards Grid */}
                            <div className="grid grid-cols-3 gap-4">
                                {[1, 2, 3].map((i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ y: 20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.9 + i * 0.1 }}
                                        className="h-48 bg-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-700/30"
                                    ></motion.div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Badge */}
            <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1.5 }}
                className="mt-8 inline-flex items-center gap-3 bg-black/80 backdrop-blur-xl text-white px-6 py-3 rounded-full border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.3)]"
            >
                <CheckCircle className="text-emerald-400" size={24} />
                <span className="font-bold text-lg">Prototype Generated</span>
            </motion.div>

            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2 }}
                className="mt-4 text-slate-400 text-center"
            >
                UI de alta fidelidad lista para validación con usuarios
            </motion.p>
        </div>
    );
}
