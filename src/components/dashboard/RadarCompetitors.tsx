import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface CompetitorData {
    attribute: string;
    ourProduct: number;
    competitorAvg: number;
    marketLeader: number;
}

interface RadarCompetitorsProps {
    data: CompetitorData[];
}

export const RadarCompetitors: React.FC<RadarCompetitorsProps> = ({ data }) => {
    if (!data || data.length === 0) return <div className="text-slate-500 italic">No competitor data available.</div>;

    return (
        <div className="h-[400px] w-full bg-white p-4 rounded-xl border border-slate-100">
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="attribute" tick={{ fill: '#64748b', fontSize: 12 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />

                    <Radar
                        name="Our Product"
                        dataKey="ourProduct"
                        stroke="#4f46e5"
                        strokeWidth={2}
                        fill="#4f46e5"
                        fillOpacity={0.5}
                    />
                    <Radar
                        name="Competitor Avg"
                        dataKey="competitorAvg"
                        stroke="#94a3b8"
                        strokeWidth={2}
                        fill="#94a3b8"
                        fillOpacity={0.3}
                    />
                    <Radar
                        name="Market Leader"
                        dataKey="marketLeader"
                        stroke="#f59e0b"
                        strokeWidth={2}
                        fill="#f59e0b"
                        fillOpacity={0.1}
                    />

                    <Legend />
                    <Tooltip
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px -4px rgba(0,0,0,0.1)' }}
                    />
                </RadarChart>
            </ResponsiveContainer>
        </div>
    );
};
