import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Label } from 'recharts';

interface PrioritizationItem {
    feature: string;
    impact: number; // 0-100
    effort: number; // 0-100
    priority: 'Must Have' | 'Should Have' | 'Could Have' | 'Won\'t Have';
}

interface PrioritizationChartProps {
    data: PrioritizationItem[];
}

export const PrioritizationChart: React.FC<PrioritizationChartProps> = ({ data }) => {
    if (!data || data.length === 0) return <div className="text-slate-500 italic">No prioritization data available.</div>;

    const COLORS = {
        'Must Have': '#10b981',   // Emerald (High Impact, Low Effort)
        'Should Have': '#3b82f6', // Blue (High Impact, High Effort)
        'Could Have': '#f59e0b',  // Amber (Low Impact, Low Effort)
        'Won\'t Have': '#ef4444'  // Red (Low Impact, High Effort)
    };

    return (
        <div className="h-[400px] w-full bg-white p-4 rounded-xl border border-slate-100 relative">
            {/* Quadrant Labels */}
            <div className="absolute top-4 right-4 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">Quick Wins</div>
            <div className="absolute top-4 left-16 text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">Major Projects</div>
            <div className="absolute bottom-12 right-4 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded">Fillers</div>
            <div className="absolute bottom-12 left-16 text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded">Time Sinks</div>

            <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" dataKey="effort" name="Effort" unit="%" domain={[0, 100]}>
                        <Label value="Effort (Cost/Complexity)" offset={-10} position="insideBottom" />
                    </XAxis>
                    <YAxis type="number" dataKey="impact" name="Impact" unit="%" domain={[0, 100]}>
                        <Label value="Impact (Value to User)" angle={-90} position="insideLeft" />
                    </YAxis>
                    <Tooltip
                        cursor={{ strokeDasharray: '3 3' }}
                        content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                                const data = payload[0].payload as PrioritizationItem;
                                return (
                                    <div className="bg-white p-3 border border-slate-200 shadow-lg rounded-lg">
                                        <p className="font-bold text-slate-800">{data.feature}</p>
                                        <p className="text-xs text-slate-500">Impact: {data.impact}% | Effort: {data.effort}%</p>
                                        <p className={`text-xs font-bold mt-1`} style={{ color: COLORS[data.priority] }}>
                                            {data.priority}
                                        </p>
                                    </div>
                                );
                            }
                            return null;
                        }}
                    />
                    <Scatter name="Features" data={data} fill="#8884d8">
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[entry.priority] || '#8884d8'} />
                        ))}
                    </Scatter>
                </ScatterChart>
            </ResponsiveContainer>
        </div>
    );
};
