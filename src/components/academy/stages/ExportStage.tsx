import React from 'react';
import { motion } from 'framer-motion';
import { FileDown, FileText, FileSpreadsheet, FileJson, FileCode } from 'lucide-react';

const EXPORT_FORMATS = [
    { icon: <FileText size={24} />, name: 'Word', ext: 'DOCX', color: 'blue', desc: 'Documentación completa' },
    { icon: <FileSpreadsheet size={24} />, name: 'Excel', ext: 'XLSX', color: 'emerald', desc: 'Datos tabulados' },
    { icon: <FileCode size={24} />, name: 'PowerPoint', ext: 'PPT', color: 'orange', desc: 'Presentación ejecutiva' },
    { icon: <FileJson size={24} />, name: 'JSON', ext: 'JSON', color: 'slate', desc: 'Formato estructurado' }
];

const colorMap: Record<string, string> = {
    blue: 'from-blue-500/20 to-blue-600/20 border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.2)]',
    emerald: 'from-emerald-500/20 to-emerald-600/20 border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.2)]',
    orange: 'from-orange-500/20 to-orange-600/20 border-orange-500/30 shadow-[0_0_20px_rgba(249,115,22,0.2)]',
    slate: 'from-slate-500/20 to-slate-600/20 border-slate-500/30 shadow-[0_0_20px_rgba(100,116,139,0.2)]'
};

export default function ExportStage() {
    return (
        <div className="h-full flex flex-col items-center justify-center p-4 gap-8">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
            >
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full mb-4">
                    <FileDown className="text-cyan-400" size={16} />
                    <span className="text-xs font-bold text-cyan-400 tracking-widest uppercase">Paso 6: Exportación</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Documentos Profesionales al Instante</h3>
                <p className="text-slate-400">Exporta en múltiples formatos con un clic</p>
            </motion.div>

            {/* Export Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-5xl">
                {EXPORT_FORMATS.map((format, index) => (
                    <motion.div
                        key={format.ext}
                        initial={{ opacity: 0, y: 30, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ delay: index * 0.15, type: 'spring' }}
                        className="group cursor-pointer"
                    >
                        <div className={`relative bg-gradient-to-br ${colorMap[format.color]} backdrop-blur-xl border rounded-2xl p-6 transition-all duration-300 hover:scale-105`}>
                            {/* Icon */}
                            <div className="w-16 h-16 mx-auto mb-4 bg-white/5 backdrop-blur-sm rounded-xl flex items-center justify-center text-white border border-white/10">
                                {format.icon}
                            </div>

                            {/* Info */}
                            <div className="text-center">
                                <div className="font-bold text-white mb-1">{format.name}</div>
                                <div className="text-xs text-slate-400 font-mono">.{format.ext}</div>
                                <div className="text-[10px] text-slate-500 mt-2">{format.desc}</div>
                            </div>

                            {/* Download Button */}
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                className="absolute -top-3 -right-3 w-10 h-10 bg-emerald-500 rounded-full shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border-2 border-white/20"
                            >
                                <FileDown size={18} className="text-white" />
                            </motion.button>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Export Stats */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="w-full max-w-3xl grid grid-cols-3 gap-4"
            >
                <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-xl p-4 text-center">
                    <div className="text-3xl font-bold text-cyan-400">247</div>
                    <div className="text-xs text-slate-400 mt-1">Documentos generados</div>
                </div>

                <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-xl p-4 text-center">
                    <div className="text-3xl font-bold text-emerald-400">&lt;2s</div>
                    <div className="text-xs text-slate-400 mt-1">Tiempo promedio</div>
                </div>

                <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-xl p-4 text-center">
                    <div className="text-3xl font-bold text-purple-400">100%</div>
                    <div className="text-xs text-slate-400 mt-1">Precisión</div>
                </div>
            </motion.div>

            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                className="text-slate-400 text-center"
            >
                Del concepto a la documentación ejecutiva sin fricción
            </motion.p>
        </div>
    );
}
