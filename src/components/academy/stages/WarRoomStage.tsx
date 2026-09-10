import GovernanceVisuals from '../GovernanceVisuals';
import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';

export default function WarRoomStage() {
    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-6"
            >
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-full mb-4">
                    <Shield className="text-red-400" size={16} />
                    <span className="text-xs font-bold text-red-400 tracking-widest uppercase">Paso 7: War Room - Gobernanza</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Auditoría con el Triángulo de IDEO</h3>
                <p className="text-slate-400">Validación de Factibilidad, Viabilidad y Deseabilidad</p>
            </motion.div>

            {/* Governance Component */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="flex-1 overflow-hidden"
            >
                <GovernanceVisuals />
            </motion.div>
        </div>
    );
}
