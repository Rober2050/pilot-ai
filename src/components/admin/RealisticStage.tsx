import React from 'react';
import { RoleConfig } from '../../types/roles';
import { DecisionRadar } from './DecisionRadar';
import { DecisionResult } from '../../services/ai/decisionEngine';
import { SmartDiagram } from '../SmartDiagram';

interface RealisticStageProps {
    roles: RoleConfig[];
    activeSpeakerId: string | null;
    isSimulating: boolean;
    backgroundImage?: string;
    decisionResult?: DecisionResult | null;
    latestDiagramData?: any;
}

export const RealisticStage: React.FC<RealisticStageProps> = ({ roles, activeSpeakerId, isSimulating, backgroundImage, decisionResult, latestDiagramData }) => {
    // "Midnight City Boardroom" - Dark, Sleek, Professional
    const bgImage = backgroundImage || "/war_room_bg.png";

    return (
        <div className="relative w-full h-full overflow-hidden bg-slate-900 group perspective-[2000px]">
            {/* --- 1. AMBIENT ENVIRONMENT --- */}
            {/* Background Layer: City Skyline at Night */}
            <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-[60s] ease-linear group-hover:scale-110"
                style={{ backgroundImage: `url(${bgImage})` }}
            >
                <div className="absolute inset-0 bg-slate-900/80 mix-blend-multiply"></div> {/* Night filter */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div> {/* Floor shadow */}
            </div>

            {/* Ceiling Light (Spotlight effect) */}
            <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[60%] h-[40%] bg-indigo-500/20 blur-[100px] rounded-full pointer-events-none"></div>

            {/* --- 2. WALL SCREEN (DECISION DATA) --- */}
            <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[50%] h-[40%] transform-style-3d z-10">
                <div className="relative w-full h-full bg-black/40 backdrop-blur-md rounded-xl border border-slate-700/50 flex items-center justify-center overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)]">
                    {/* Screen Frame Glow */}
                    <div className="absolute inset-0 border border-indigo-500/20 rounded-xl"></div>

                    {/* Content */}
                    <div className="w-full h-full p-4">
                        {decisionResult ? (
                            <div className="w-full h-full animate-in fade-in duration-1000">
                                <DecisionRadar result={decisionResult} isLoading={false} mode="compact" />
                            </div>
                        ) : latestDiagramData ? (
                            <div className="w-full h-full animate-in zoom-in-95 duration-500 bg-white/90 rounded-lg overflow-hidden">
                                {/* Scale down specific diagram features for the wall */}
                                <SmartDiagram data={latestDiagramData} className="w-full h-full border-0 !my-0 !rounded-none !shadow-none" />
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full gap-3 opacity-30">
                                <div className="w-12 h-12 border-2 border-t-transparent border-indigo-400 rounded-full animate-spin"></div>
                                <div className="text-[10px] font-mono text-indigo-300 tracking-[0.3em] uppercase">
                                    Waiting for Signal
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* --- 3. THE TABLE (REALISTIC ASSET) --- */}
            <div
                className="absolute bottom-[-10%] left-1/2 -translate-x-1/2 w-[90%] h-[50%] bg-contain bg-no-repeat bg-top z-20 pointer-events-none opacity-90"
                style={{ backgroundImage: 'url(/glass_table.png)' }}
            >
                {/* Overlay to blend bottom if needed */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80"></div>
            </div>

            {/* --- 4. THE AGENTS (DIGITAL HUMANS) --- */}
            {/* Positioned in a semi-circle seating arrangement */}
            <div className="absolute inset-0 z-30 flex items-end justify-center pb-8 pointer-events-none">
                <div className="flex gap-4 sm:gap-12 w-full max-w-6xl justify-center items-end px-12">
                    {roles.map((role) => {
                        const isActive = role.roleId === activeSpeakerId;

                        // Calculate staggered depth/scale for "Seating" feel
                        // Center agents are closer, outer agents slightly further back? 
                        // Actually, simplified row is better for visibility.

                        return (
                            <div
                                key={role.roleId}
                                className={`
                                    relative flex flex-col items-center transition-all duration-500 ease-out transform-gpu
                                    ${isActive ? 'scale-110 -translate-y-4 z-40' : 'scale-95 opacity-70 z-30 grayscale-[50%]'}
                                `}
                            >
                                {/* 3D Holographic "Card" Body */}
                                <div className={`
                                    relative w-32 h-40 sm:w-40 sm:h-52 bg-gradient-to-b from-slate-800/90 to-black/90
                                    rounded-2xl border border-white/10 backdrop-blur-xl
                                    shadow-2xl flex flex-col items-center justify-start overflow-hidden
                                    transition-all duration-300
                                    ${isActive ? 'shadow-[0_0_50px_rgba(99,102,241,0.4)] border-indigo-500/50' : ''}
                                `}>
                                    {/* Hologram Scanlines */}
                                    <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 bg-[length:100%_2px,3px_100%] pointer-events-none opacity-20"></div>

                                    {/* Avatar/Face Area */}
                                    <div className={`
                                        w-full h-[60%] bg-cover bg-center relative
                                        ${isActive ? 'saturate-100' : 'saturate-0'}
                                    `}
                                        style={{
                                            // Use consistent realistic face based on role name
                                            backgroundImage: (() => {
                                                const hash = role.displayName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                                                const gender = hash % 2 === 0 ? 'men' : 'women';
                                                const id = hash % 70; // 0-70
                                                return `url(https://randomuser.me/api/portraits/${gender}/${id}.jpg)`;
                                            })()
                                        }}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent"></div>

                                        {/* Speaking Wave Overlay */}
                                        {isActive && isSimulating && (
                                            <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1 opacity-80">
                                                <div className="w-1 h-4 bg-indigo-400 animate-[bounce_1s_infinite]"></div>
                                                <div className="w-1 h-6 bg-indigo-400 animate-[bounce_1.2s_infinite]"></div>
                                                <div className="w-1 h-3 bg-indigo-400 animate-[bounce_0.8s_infinite]"></div>
                                                <div className="w-1 h-5 bg-indigo-400 animate-[bounce_1.1s_infinite]"></div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Info Area */}
                                    <div className="w-full h-[40%] p-3 flex flex-col items-center justify-center text-center bg-black/50 relative z-20">
                                        <div className="text-white font-bold text-sm leading-tight mb-1">{role.displayName}</div>
                                        <div className="text-[9px] text-indigo-300 uppercase tracking-widest font-mono border border-indigo-500/30 px-1.5 py-0.5 rounded">
                                            {role.model.split('-')[0]} AI
                                        </div>
                                    </div>
                                </div>

                                {/* Reflection on Table */}
                                <div className="mt-2 w-[80%] h-12 bg-black/20 blur-xl rounded-full transform scale-y-50"></div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div >
    );
};
