import React from 'react';
import { RoleConfig } from '../../types/roles';
import { User } from 'lucide-react';

interface HolographicStageProps {
    roles: RoleConfig[];
    activeSpeakerId: string | null;
    isSimulating: boolean;
}

export const HolographicStage: React.FC<HolographicStageProps> = ({ roles, activeSpeakerId, isSimulating }) => {
    // Calculate positions for a circular/oval table layout
    const getPosition = (index: number, total: number) => {
        const angle = (index / total) * 2 * Math.PI;
        const radiusX = 120; // Horizontal radius
        const radiusY = 60;  // Vertical radius (compressed for isometric look)
        const x = Math.cos(angle) * radiusX;
        const y = Math.sin(angle) * radiusY;
        return { x, y };
    };

    return (
        <div className="relative w-full h-64 flex items-center justify-center overflow-hidden bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl perspective-1000">
            {/* Background Grid / Floor */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(30,41,59,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(30,41,59,0.5)_1px,transparent_1px)] bg-[size:40px_40px] [transform:rotateX(60deg)_scale(2)] opacity-20"></div>

            {/* Central Hologram Emitter */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="w-32 h-32 bg-indigo-500/10 rounded-full blur-xl animate-pulse"></div>
                <div className="w-24 h-12 border-2 border-indigo-500/30 rounded-[100%] [transform:rotateX(60deg)] shadow-[0_0_15px_rgba(99,102,241,0.3)]"></div>
            </div>

            {/* Avatars */}
            <div className="relative w-full h-full [transform-style:preserve-3d]">
                {roles.map((role, index) => {
                    const pos = getPosition(index, roles.length);
                    const isActive = role.roleId === activeSpeakerId;

                    return (
                        <div
                            key={role.roleId}
                            className={`absolute top-1/2 left-1/2 transition-all duration-500 ease-in-out`}
                            style={{
                                transform: `translate(${pos.x}px, ${pos.y}px)`,
                                zIndex: Math.round(pos.y + 100) // Simple z-sorting based on Y position
                            }}
                        >
                            {/* Avatar Card */}
                            <div className={`
                                flex flex-col items-center gap-2 transform -translate-x-1/2 -translate-y-1/2
                                transition-all duration-300
                                ${isActive ? 'scale-110 z-50' : 'scale-90 opacity-70'}
                            `}>
                                {/* Holographic Body */}
                                <div className={`
                                    relative w-12 h-12 rounded-xl flex items-center justify-center
                                    backdrop-blur-sm border
                                    ${isActive
                                        ? 'bg-indigo-500/20 border-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.5)] animate-bounce-slight'
                                        : 'bg-slate-800/40 border-slate-600'}
                                `}>
                                    <User className={`w-6 h-6 ${isActive ? 'text-indigo-300' : 'text-slate-400'}`} />

                                    {/* Speaking Indicator */}
                                    {isActive && isSimulating && (
                                        <div className="absolute -top-1 -right-1">
                                            <span className="relative flex h-3 w-3">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Name Label */}
                                <div className={`
                                    px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider whitespace-nowrap
                                    ${isActive ? 'bg-indigo-900/80 text-indigo-200 border border-indigo-500/30' : 'bg-slate-900/60 text-slate-500'}
                                `}>
                                    {role.displayName}
                                </div>

                                {/* Connection Line to Center (Optional visual) */}
                                {isActive && (
                                    <div className="absolute top-full left-1/2 w-px h-8 bg-gradient-to-b from-indigo-500/50 to-transparent origin-top transform rotate-180"></div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
