import React, { useState, useEffect } from 'react';
import { RoleConfig } from '../../../../types/roles';
import { audioManager } from '../../../../services/audioManager';

// Deterministic color per role based on first char
const AVATAR_GRADIENTS = [
    'from-indigo-600 to-violet-700',
    'from-cyan-600 to-blue-700',
    'from-emerald-600 to-teal-700',
    'from-rose-600 to-pink-700',
    'from-amber-500 to-orange-600',
    'from-purple-600 to-fuchsia-700',
];
const getGradient = (roleId: string) => {
    const idx = roleId.charCodeAt(0) % AVATAR_GRADIENTS.length;
    return AVATAR_GRADIENTS[idx];
};

interface AgentAvatarProps {
    role: RoleConfig;
    isActive: boolean; // Turn-based activity (glow)
    isSimulating: boolean;
    position: { x: number; y: number; scale: number };
}

/**
 * AgentAvatar Component
 * 
 * Renders an AI agent's avatar with:
 * 1. Telepresence style (front-facing)
 * 2. Mouth animation (open/closed) synchronized with audioManager
 * 3. Robust image loading (WebP -> PNG Fallback)
 */
export const AgentAvatar: React.FC<AgentAvatarProps> = ({
    role,
    isActive,
    isSimulating,
    position
}) => {
    const [isActuallySpeaking, setIsActuallySpeaking] = useState(false);

    // Synchronize mouth with AudioManager
    useEffect(() => {
        const unsubscribe = audioManager.onStateChange((state) => {
            const speaking = state.isPlaying && state.currentRoleId === role.roleId;
            setIsActuallySpeaking(speaking);
        });

        return () => unsubscribe();
    }, [role.roleId]);

    // isActuallySpeaking drives the scale animation on initials

    const initials = role.displayName
        .split(' ')
        .slice(0, 2)
        .map((w: string) => w[0])
        .join('')
        .toUpperCase();
    const gradient = getGradient(role.roleId);

    return (
        <div
            className="absolute transition-all duration-700 ease-out"
            style={{
                left: `${position.x}%`,
                top: `${position.y}%`,
                transform: `translate(-50%, -50%) scale(${position.scale})`,
                zIndex: 10
            }}
        >
            {/* Avatar Container: Video Feed Window Style */}
            <div className="relative group flex flex-col items-center">

                {/* Glow Effect when speaking */}
                <div
                    className={`absolute -inset-4 rounded-xl bg-cyan-500 blur-2xl transition-opacity duration-300 ${isActive ? 'opacity-30' : 'opacity-0'
                        }`}
                />

                {/* Monitor Frame */}
                <div className={`relative w-56 h-72 overflow-hidden rounded-lg border-[3px] shadow-2xl transition-all duration-300 ${isActuallySpeaking
                    ? 'border-cyan-400/80 shadow-[0_0_30px_rgba(34,211,238,0.2)]'
                    : 'border-slate-700/60 bg-transparent'
                    }`}>
                    {/* Screen Glass Reflection / Scanline */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none z-20" />
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] z-20 bg-[length:100%_4px,6px_100%] pointer-events-none opacity-20" />

                    {/* Gradient initials avatar — no person images */}
                    <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center transition-all duration-500 ${isActive ? 'brightness-110' : 'brightness-90'}`}>
                        <span className={`text-5xl font-black text-white/90 select-none tracking-tight transition-transform duration-150 ${isActuallySpeaking ? 'scale-110' : 'scale-100'}`}>
                            {initials}
                        </span>
                    </div>
                </div>

                {/* Integration Bar (Name Tag) connected to frame */}
                <div className={`mt-2 flex items-center gap-2 px-3 py-1 rounded-full backdrop-blur-md border transition-all duration-300 ${isActive
                    ? 'bg-cyan-950/80 border-cyan-500/50 text-cyan-100'
                    : 'bg-black/60 border-white/10 text-slate-300'
                    }`}>
                    <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-slate-500'}`} />
                    <span className="text-xs font-medium tracking-wide">
                        {role.displayName}
                    </span>
                    {isActive && (
                        <span className="text-[9px] uppercase font-bold text-cyan-400 ml-1 opacity-80">
                            LIVE
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};
