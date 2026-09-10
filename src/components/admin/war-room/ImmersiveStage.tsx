import React from 'react';
import { RoleConfig } from '../../../types/roles';
import { User } from 'lucide-react';

interface ImmersiveStageProps {
    roles: RoleConfig[];
    activeSpeakerId: string | null;
    isSimulating: boolean;
    autoSummonedRoleIds?: string[]; // ✅ BATCH 4: Track auto-summoned roles for Guest badge
    language?: 'es' | 'en'; // ✅ BATCH 4: Language for Guest badge text
}

/**
 * ImmersiveStage - Unified Seating Grid
 * 
 * ✅ FINAL UX POLISH:
 * - Single flexbox container (bottom-aligned)
 * - Uniform AvatarCard dimensions (w-48 h-64)
 * - Glassmorphic fallback for synthetic roles
 * - Active speaker highlighting (cyan border + glow)
 */
export const ImmersiveStage: React.FC<ImmersiveStageProps> = ({
    roles,
    activeSpeakerId,
    isSimulating,
    autoSummonedRoleIds = [], // ✅ BATCH 4: Default empty array
    language = 'es' // ✅ BATCH 4: Default Spanish
}) => {
    const roleCount = roles.length;

    // Minimum validation only
    if (roleCount < 2) {
        return (
            <div className="w-full h-full bg-black flex items-center justify-center">
                <div className="text-white text-center">
                    <h3 className="text-xl font-bold mb-2">Configuración Inválida</h3>
                    <p className="text-slate-400">Por favor selecciona al menos 2 roles</p>
                    <p className="text-slate-500 text-sm mt-2">
                        Actual: {roleCount} rol{roleCount !== 1 ? 'es' : ''}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-end justify-center overflow-hidden p-8">

            {/* ✅ BATCH 4: UNIFIED SEATING GRID - All glassmorphic cards */}
            <div className="flex flex-wrap items-end justify-center gap-4 max-w-7xl">
                {roles.map((role) => {
                    const isActive = role.roleId === activeSpeakerId;
                    // ✅ BATCH 4: Check if role was auto-summoned (Guest)
                    const isGuest = autoSummonedRoleIds?.includes(role.roleId) || false;

                    return (
                        <div
                            key={role.roleId}
                            className={`
                                relative w-48 h-64 rounded-xl overflow-hidden
                                transition-all duration-300 ease-in-out
                                ${isActive
                                    ? 'border-2 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.5)] scale-105'
                                    : 'border border-slate-600/50 hover:border-slate-500'
                                }
                            `}
                        >
                            {/* ✅ BATCH 4: ALL roles use glassmorphic card (no photos) */}
                            <div className="absolute inset-0 bg-gradient-to-br from-slate-700/40 to-slate-800/40 backdrop-blur-md">
                                <div className="flex flex-col items-center justify-center h-full p-4">
                                    <div className="w-20 h-20 rounded-full bg-slate-600/50 flex items-center justify-center mb-3">
                                        <User className="w-10 h-10 text-slate-300" />
                                    </div>
                                    <p className="text-white text-sm font-semibold text-center leading-tight">
                                        {role.displayName}
                                    </p>

                                    {/* ✅ BATCH 4: Guest Badge for auto-summoned roles */}
                                    {isGuest && (
                                        <span className="mt-2 bg-yellow-500/90 text-black px-3 py-1 rounded-full text-xs font-bold">
                                            {language === 'es' ? 'Invitado' : 'Guest'}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Gradient overlay for depth */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                            {/* Role name label (bottom) */}
                            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                                <p className="text-white text-xs font-bold text-center truncate">
                                    {role.displayName}
                                </p>
                            </div>

                            {/* Active speaker indicator */}
                            {isActive && (
                                <div className="absolute top-2 right-2">
                                    <div className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
