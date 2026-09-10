import React from 'react';
import {
    PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line
} from 'recharts';

export const ChartView = ({ chart }: { chart: any }) => {
    if (!chart) return null;

    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h4 className="font-bold text-slate-800 mb-4 text-center">{chart.title || 'Chart'}</h4>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    {chart.type === 'pie' ? (
                        <PieChart>
                            <Pie
                                data={chart.data}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {chart.data.map((_: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={['#6366f1', '#8b5cf6', '#ec4899', '#10b981'][index % 4]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    ) : chart.type === 'bar' ? (
                        <BarChart data={chart.data}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} />
                            <YAxis axisLine={false} tickLine={false} />
                            <Tooltip
                                cursor={{ fill: '#f1f5f9' }}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    ) : chart.type === 'line' ? (
                        <LineChart data={chart.data}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} />
                            <YAxis axisLine={false} tickLine={false} />
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Line type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                        </LineChart>
                    ) : (
                        <div className="flex items-center justify-center h-full text-slate-400">
                            Unsupported chart type: {chart.type}
                        </div>
                    )}
                </ResponsiveContainer>
            </div>
        </div>
    );
};
