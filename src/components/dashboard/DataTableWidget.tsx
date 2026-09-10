import React from 'react';

interface DataTableWidgetProps {
    data: Record<string, any>[];
    description?: string;
}

const MONO_COLS = new Set([
    'quality gate', 'qualitygate', 'owasp/cis ref', 'owaspcisref', 'owasp', 'cis',
    'tool', 'trigger', 'approvals', 'status',
]);

const STATUS_BADGES: Record<string, string> = {
    automated:  'bg-emerald-50 text-emerald-700 border border-emerald-200',
    enforced:   'bg-blue-50 text-blue-700 border border-blue-200',
    manual:     'bg-amber-50 text-amber-700 border border-amber-200',
    required:   'bg-indigo-50 text-indigo-700 border border-indigo-200',
    optional:   'bg-slate-50 text-slate-500 border border-slate-200',
};

function getStatusBadge(value: string): string | null {
    return STATUS_BADGES[value.toLowerCase()] ?? null;
}

export const DataTableWidget: React.FC<DataTableWidgetProps> = ({ data, description }) => {
    if (!data || data.length === 0) return null;

    const columns = Object.keys(data[0]);

    return (
        <div className="space-y-3">
            {description && (
                <p className="text-[11px] text-slate-500 italic px-1">{description}</p>
            )}
            <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-[11px] border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                            {columns.map((col) => (
                                <th
                                    key={col}
                                    className="px-3 py-2.5 text-left font-semibold text-slate-600 whitespace-nowrap tracking-wide uppercase text-[10px]"
                                >
                                    {col}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, rowIdx) => (
                            <tr
                                key={rowIdx}
                                className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}
                            >
                                {columns.map((col, colIdx) => {
                                    const raw = String(row[col] ?? '');
                                    const isMono = MONO_COLS.has(col.toLowerCase());
                                    const badge = getStatusBadge(raw);
                                    const isFirstCol = colIdx === 0;

                                    return (
                                        <td
                                            key={col}
                                            className={`px-3 py-2.5 align-top border-b border-slate-100 ${
                                                isFirstCol
                                                    ? 'font-semibold text-slate-700 whitespace-nowrap'
                                                    : 'text-slate-600'
                                            }`}
                                        >
                                            {badge ? (
                                                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${badge}`}>
                                                    {raw}
                                                </span>
                                            ) : isMono ? (
                                                <span className="font-mono text-[10px] text-slate-500">{raw}</span>
                                            ) : (
                                                raw
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
