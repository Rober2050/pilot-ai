import React from 'react';
import { DecisionRadar } from '../../DecisionRadar';
import { SmartDiagram } from '../../../SmartDiagram';
import { DecisionResult } from '../../../../services/ai/decisionEngine';

interface WallScreenProps {
    decisionResult?: DecisionResult | null;
    latestDiagramData?: any;
}

export const WallScreen: React.FC<WallScreenProps> = ({ decisionResult, latestDiagramData }) => {
    // Completely hide if no data to display
    if (!decisionResult && !latestDiagramData) return null;

    return (
        <div className="w-full h-full transform-style-3d z-10 transition-all duration-700">
            <div className="relative w-full h-full bg-black/40 backdrop-blur-md rounded-lg border border-slate-700/30 flex items-center justify-center overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                {/* Screen Frame Glow */}
                <div className="absolute inset-0 border border-indigo-500/20 rounded-xl pointer-events-none"></div>

                {/* Content */}
                <div className="w-full h-full p-4">
                    {decisionResult ? (
                        <div className="w-full h-full animate-in fade-in duration-1000">
                            <DecisionRadar result={decisionResult} isLoading={false} mode="compact" />
                        </div>
                    ) : latestDiagramData && (
                        <div className="w-full h-full animate-in zoom-in-95 duration-500 bg-white/90 rounded-lg overflow-hidden">
                            <SmartDiagram data={latestDiagramData} className="w-full h-full border-0 !my-0 !rounded-none !shadow-none" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
