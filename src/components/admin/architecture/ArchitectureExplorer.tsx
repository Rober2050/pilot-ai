import React, { useState } from 'react';
import ArchitectureMap from '../../../pages/admin/ArchitectureMap';
import { useTranslation } from 'react-i18next';
import { Layers, FileText, Cpu, Server, Code2, Database, Zap, Lock, BarChart3, Cloud, GitBranch } from 'lucide-react';
import { CiCdFlow } from './CiCdFlow';

import ReactMarkdown from 'react-markdown';

// --- EMBEDDED CONTENT (SOURCE OF TRUTH) ---
const TECH_STACK_DATA = [
    {
        category: "Frontend Core",
        icon: <Code2 className="text-cyan-400" />,
        items: [
            { name: "React 18", desc: "UI Library (Concurrent Mode)" },
            { name: "TypeScript", desc: "Static Typing & Safety" },
            { name: "Vite", desc: "Next-Gen Bundler" },
            { name: "Tailwind CSS", desc: "Utility-First Styling" },
            { name: "Framer Motion", desc: "Production Animations" }
        ]
    },
    {
        category: "Backend & Cloud (BaaS)",
        icon: <Cloud className="text-amber-400" />,
        items: [
            { name: "Firebase Auth", desc: "Identity & Security" },
            { name: "Cloud Firestore", desc: "NoSQL Real-time DB" },
            { name: "Cloud Functions", desc: "Serverless Compute" },
            { name: "Hosting", desc: "Global CDN" }
        ]
    },
    {
        category: "Intelligence Engine",
        icon: <Cpu className="text-purple-400" />,
        items: [
            { name: "Google Gemini 2.0", desc: "Primary Reasoning Brain" },
            { name: "OpenAI SDK", desc: "Secondary/Fallback Brain" },
            { name: "Vector Search", desc: "Semantic Retrieval (Planned)" }
        ]
    }
];

const CTO_BRIEF_CONTENT = `
# PILOTAI: Strategic Technical Brief

**Status:** Production Baseline
**Architecture:** Serverless AI Orchestration

## 1. Executive Summary
PILOTAI leverages **Serverless Infrastructure** and **AI-as-a-Service** to eliminate backend bottlenecks. 
The architecture is decoupled, event-driven, and optimized for real-time collaboration.

## 2. Infrastructure & Data Layer
- **No-Server Ops**: Utilizing **Firebase** (Google Cloud) as Backend-as-a-Service (BaaS).
- **Persistence**: **Cloud Firestore** for millisecond-latency state propagation.
- **Micro-Integrations**: Logic is injected via stateless AI inputs, not heavy containers.

## 3. Intelligence Orchestration
- **Engine**: Gemini 2.0 Flash (Latency < 200ms).
- **Validation**: "Gatekeeper Protocols" strictly filter inputs before processing.
- **Safety**: Client-side semantic validation prevents injection attacks.

## 4. Scalability Logic
- **Horizontal Scaling**: Handled natively by Google's infrastructure.
- **Cost Efficiency**: Pay-per-execution model (Serverless) vs Fixed Server Costs.
`;

export const ArchitectureExplorer: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'map' | 'stack' | 'brief' | 'cicd'>('map');
    const { t } = useTranslation('translation');

    return (
        <div className="h-[calc(100vh-140px)] flex flex-col bg-slate-50 rounded-xl overflow-hidden border border-slate-200 shadow-sm">
            {/* Header Tabs */}
            <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center gap-6">
                <button
                    onClick={() => setActiveTab('map')}
                    className={`flex items-center gap-2 pb-2 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 ${activeTab === 'map' ? 'border-cyan-500 text-cyan-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                >
                    <Layers size={18} />
                    {t('admin.visualMap', 'Visual Map')}
                </button>
                <button
                    onClick={() => setActiveTab('stack')}
                    className={`flex items-center gap-2 pb-2 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 ${activeTab === 'stack' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                >
                    <Server size={18} />
                    {t('admin.techStack', 'Tech Stack')}
                </button>
                <button
                    onClick={() => setActiveTab('brief')}
                    className={`flex items-center gap-2 pb-2 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 ${activeTab === 'brief' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                >
                    <FileText size={18} />
                    {t('admin.strategicBrief', 'Strategic Brief')}
                </button>
                <button
                    onClick={() => setActiveTab('cicd')}
                    className={`flex items-center gap-2 pb-2 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 ${activeTab === 'cicd' ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                >
                    <GitBranch size={18} />
                    {t('admin.cicdPipeline', 'CI/CD Pipeline')}
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden relative bg-slate-100">
                {activeTab === 'map' && (
                    <div className="absolute inset-0 z-0">
                        {/* We reuse the ArchitectureMap but modify styling slightly via CSS if needed, 
                            or just render it directly. Since it has its own header return button, 
                            we might want to hide that if reused, but for now direct reuse is fine. */}
                        <ArchitectureMap isEmbedded={true} />
                    </div>
                )}

                {activeTab === 'stack' && (
                    <div className="h-full overflow-y-auto p-8">
                        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
                            {TECH_STACK_DATA.map((stack, idx) => (
                                <div key={idx} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                                            {stack.icon}
                                        </div>
                                        <h3 className="font-bold text-slate-800">{stack.category}</h3>
                                    </div>
                                    <div className="space-y-4">
                                        {stack.items.map((item, i) => (
                                            <div key={i} className="border-b border-slate-50 last:border-0 pb-3 last:pb-0">
                                                <div className="font-bold text-sm text-slate-700">{item.name}</div>
                                                <div className="text-xs text-slate-400">{item.desc}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'brief' && (
                    <div className="h-full overflow-y-auto p-8 flex justify-center">
                        <div className="max-w-3xl w-full bg-white p-10 rounded-xl shadow-sm border border-slate-200">
                            <ReactMarkdown
                                components={{
                                    p: ({ node, ...props }) => <p className="text-slate-900 mb-4 leading-relaxed font-medium" {...props} />,
                                    h1: ({ node, ...props }) => <h1 className="text-slate-900 text-3xl font-bold mb-6 border-b border-slate-200 pb-2" {...props} />,
                                    h2: ({ node, ...props }) => <h2 className="text-slate-900 text-xl font-bold mt-8 mb-4 flex items-center gap-2" {...props} />,
                                    h3: ({ node, ...props }) => <h3 className="text-slate-900 text-lg font-bold mt-6 mb-3" {...props} />,
                                    ul: ({ node, ...props }) => <ul className="list-disc list-outside ml-6 space-y-2 mb-4 marker:text-indigo-500" {...props} />,
                                    li: ({ node, ...props }) => <li className="text-slate-900 pl-2" {...props} />,
                                    strong: ({ node, ...props }) => <strong className="text-indigo-700 font-bold" {...props} />,
                                }}
                            >
                                {CTO_BRIEF_CONTENT}
                            </ReactMarkdown>
                        </div>
                    </div>
                )}

                {activeTab === 'cicd' && (
                    <div className="h-full w-full relative">
                        <CiCdFlow />
                    </div>
                )}
            </div>
        </div>
    );
};
