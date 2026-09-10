import React from 'react';

export const SectionHeader = ({ icon: Icon, title, subtitle }: { icon: any, title: string, subtitle?: string }) => (
    <div className="flex items-center gap-2.5 mb-3 border-b border-slate-100 pb-2">
        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
            <Icon className="w-4 h-4" />
        </div>
        <div>
            <h2 className="text-sm font-bold text-slate-800">{title}</h2>
            {subtitle && <p className="text-[11px] text-slate-500 font-sans">{subtitle}</p>}
        </div>
    </div>
);
