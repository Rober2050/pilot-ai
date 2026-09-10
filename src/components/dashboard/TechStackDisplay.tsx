import React from 'react';
import { Code, Cpu, Layout, Server, Database, Cloud } from 'lucide-react';

interface TechItem {
    name: string;
    reason: string;
    iconName: string;
    color: string;
}

interface TechStack {
    architecture: TechItem;
    frontend: TechItem;
    backend: TechItem;
    database: TechItem;
    infrastructure: TechItem;
}

interface TechStackDisplayProps {
    techStack: TechStack;
}

// --- ICON MAP ---
const iconMap: { [key: string]: React.ReactNode } = {
    Cpu: <Cpu className="w-5 h-5 text-purple-600" />,
    Layout: <Layout className="w-5 h-5 text-blue-600" />,
    Server: <Server className="w-5 h-5 text-emerald-600" />,
    Database: <Database className="w-5 h-5 text-amber-600" />,
    Cloud: <Cloud className="w-5 h-5 text-orange-600" />,
};

export const TechStackDisplay: React.FC<TechStackDisplayProps> = ({ techStack }) => {
    return (
        <div className="space-y-3">
            {Object.entries(techStack).map(([key, tech]) => (
                <div key={key} className="group p-3 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all bg-slate-50">
                    <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg shadow-sm border ${tech.color || 'bg-white'} group-hover:scale-105 transition-transform`}>
                            {iconMap[tech.iconName] || <Code className="w-5 h-5 text-slate-400" />}
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{key}</span>
                            </div>
                            <div className="text-sm font-bold text-slate-800 mb-1">{tech.name}</div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};
