import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { DecisionResult } from '../../services/ai/decisionEngine';
import { ShieldCheck, AlertTriangle, XCircle, CheckCircle } from 'lucide-react';

interface DecisionRadarProps {
    result: DecisionResult | null;
    isLoading: boolean;
    mode?: 'full' | 'compact'; // 'compact' is for the Wall Screen (Dark Mode)
}

export const DecisionRadar: React.FC<DecisionRadarProps> = ({ result, isLoading, mode = 'full' }) => {
    const isCompact = mode === 'compact';
    const gridColor = isCompact ? 'rgba(255,255,255,0.2)' : '#e2e8f0';
    const axisColor = isCompact ? '#cbd5e1' : '#64748b';
    if (isLoading) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 animate-pulse">
                <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                <p className="text-sm font-bold uppercase tracking-wider">Analyzing Consensus...</p>
                <p className="text-xs">Calculating Feasibility, Desirability, Viability</p>
            </div>
        );
    }

    if (!result) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 p-6 text-center">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4 border border-slate-200">
                    <ShieldCheck className="w-10 h-10 text-slate-300" />
                </div>
                <h4 className="text-sm font-bold text-slate-600 mb-2">Ready to Analyze</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                    Start a debate and click <strong>"Force Verdict"</strong> to generate the Decision Matrix.
                </p>
            </div>
        );
    }

    const data = [
        { subject: 'Feasibility', A: result.score.feasibility, fullMark: 100 },
        { subject: 'Desirability', A: result.score.desirability, fullMark: 100 },
        { subject: 'Viability', A: result.score.viability, fullMark: 100 },
    ];

    const verdictColor =
        result.verdict === 'GO' ? 'text-green-600 bg-green-100 border-green-200' :
            result.verdict === 'NO GO' ? 'text-red-600 bg-red-100 border-red-200' :
                'text-amber-600 bg-amber-100 border-amber-200';

    const VerdictIcon =
        result.verdict === 'GO' ? CheckCircle :
            result.verdict === 'NO GO' ? XCircle :
                AlertTriangle;

    const chartStroke = isCompact ? '#818cf8' : '#6366f1';
    const chartFill = isCompact ? '#4f46e5' : '#818cf8';

    return (
        <div className="h-full flex flex-col p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
                <h3 className={`text-sm font-bold uppercase tracking-wider ${isCompact ? 'text-indigo-300' : 'text-slate-700'}`}>
                    Decision Matrix
                </h3>
                <div className={`px-3 py-1 rounded-full border flex items-center gap-2 text-xs font-bold ${verdictColor} ${isCompact ? 'border-none shadow-[0_0_15px_currentColor]' : ''}`}>
                    <VerdictIcon className="w-3 h-3" />
                    {result.verdict}
                </div>
            </div>

            {/* Chart */}
            <div className="flex-1 min-h-0 relative">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius={isCompact ? "80%" : "70%"} data={data}>
                        <PolarGrid stroke={gridColor} />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: axisColor, fontSize: isCompact ? 12 : 10, fontWeight: 'bold' }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                        <Radar
                            name="Score"
                            dataKey="A"
                            stroke={chartStroke}
                            strokeWidth={3}
                            fill={chartFill}
                            fillOpacity={0.6}
                        />
                    </RadarChart>
                </ResponsiveContainer>

                {/* Score Overlay */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                    <div className={`text-3xl font-black ${isCompact ? 'text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'text-indigo-900'}`}>
                        {result.finalScore}
                    </div>
                    <div className={`text-[10px] font-bold uppercase ${isCompact ? 'text-indigo-300' : 'text-indigo-400'}`}>Score</div>
                </div>
            </div>

            {/* Analysis Text (Hidden in Compact Mode) */}
            {!isCompact && (
                <div className="mt-4 space-y-3">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-1">Executive Summary</h4>
                        <p className="text-xs text-slate-700 leading-relaxed">{result.reasoning}</p>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-1">Risk Analysis</h4>
                        <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">{result.riskAnalysis}</p>
                    </div>
                </div>
            )}
        </div>
    );
};
