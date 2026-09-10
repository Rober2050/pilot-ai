import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

interface CompletionIndicatorProps {
    onClose: () => void;
}

export default function CompletionIndicator({ onClose }: CompletionIndicatorProps) {
    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm">
            <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                onClick={onClose}
                className="cursor-pointer"
            >
                <div className="bg-slate-900/90 backdrop-blur-xl border-2 border-emerald-500/50 rounded-2xl px-8 py-6 shadow-2xl shadow-emerald-500/20">
                    <div className="flex items-center gap-4">
                        <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ delay: 0.2, type: "spring", stiffness: 150 }}
                        >
                            <CheckCircle2 size={48} className="text-emerald-400" />
                        </motion.div>

                        <div>
                            <h3 className="text-2xl font-bold text-white mb-1">Tour Complete!</h3>
                            <p className="text-sm text-slate-400">Click to continue</p>
                        </div>
                    </div>
                </div>

                <motion.div
                    className="absolute inset-0 rounded-2xl border-2 border-emerald-500/30 pointer-events-none"
                    animate={{ scale: [1, 1.05, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                />
            </motion.div>
        </div>
    );
}
