import React from 'react';
import { motion } from 'framer-motion';
import { Users, Package, Briefcase, Palette, Layers, ShieldCheck } from 'lucide-react';
import { MetallicOrb } from '../PremiumComponents';

const ROLES = [
    { id: 'pm', icon: <Package size={24} />, label: 'PRODUCT MANAGER' },
    { id: 'ba', icon: <Briefcase size={24} />, label: 'BUSINESS ANALYST' },
    { id: 'ux', icon: <Palette size={24} />, label: 'UX DESIGNER' },
    { id: 'arch', icon: <Layers size={24} />, label: 'SOFTWARE ARCHITECT' },
    { id: 'qa', icon: <ShieldCheck size={24} />, label: 'QA ENGINEER' }
];

export default function RoleFactoryStage() {
    return (
        <div className="h-full flex flex-col items-center justify-center p-4 gap-8">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
            >
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full mb-4">
                    <Users className="text-purple-400" size={16} />
                    <span className="text-xs font-bold text-purple-400 tracking-widest uppercase">Paso 3: La Fábrica de Roles</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Especialistas en Acción</h3>
                <p className="text-slate-400">11 roles de IA trabajando simultáneamente en tu proyecto</p>
            </motion.div>

            {/* Orb Grid */}
            <div className="flex flex-wrap gap-x-12 gap-y-16 justify-center max-w-4xl">
                {ROLES.map((role, index) => (
                    <motion.div
                        key={role.id}
                        initial={{ opacity: 0, scale: 0, y: 50 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{
                            delay: index * 0.15,
                            type: 'spring',
                            stiffness: 200
                        }}
                    >
                        <MetallicOrb
                            icon={role.icon}
                            label={role.label}
                            active={index === 0}
                            completed={index > 0}
                            size="md"
                        />
                    </motion.div>
                ))}
            </div>

            {/* Deliverable Preview (Mini cards appearing below orbs) */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
                className="w-full max-w-4xl grid grid-cols-3 gap-4 mt-8"
            >
                <div className="bg-slate-900/50 backdrop-blur-xl border border-emerald-500/30 rounded-xl p-4 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                    <div className="text-xs font-bold text-emerald-400 mb-2">✓ PRD Documento</div>
                    <div className="text-[10px] text-slate-400">Requisitos del producto completos</div>
                </div>

                <div className="bg-slate-900/50 backdrop-blur-xl border border-cyan-500/30 rounded-xl p-4 shadow-[0_0_20px_rgba(34,211,238,0.2)]">
                    <div className="text-xs font-bold text-cyan-400 mb-2">✓ Diagramas de Flujo</div>
                    <div className="text-[10px] text-slate-400">Procesos de negocio mapeados</div>
                </div>

                <div className="bg-slate-900/50 backdrop-blur-xl border border-purple-500/30 rounded-xl p-4 shadow-[0_0_20px_rgba(168,85,247,0.2)]">
                    <div className="text-xs font-bold text-purple-400 mb-2">✓ Casos de Prueba</div>
                    <div className="text-[10px] text-slate-400">157 escenarios validados</div>
                </div>
            </motion.div>

            {/* Status */}
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
                className="text-slate-400 text-center"
            >
                Cada rol genera documentación específica y de alto valor al instante
            </motion.p>
        </div>
    );
}
