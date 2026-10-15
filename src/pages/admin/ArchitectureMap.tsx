import React from 'react';
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    Node,
    Edge,
    Position
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Share2, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const initialNodes: Node[] = [
    {
        id: '1',
        type: 'input',
        data: { label: '🏢 PILOTAI REACT CORE (Vite + TS)' },
        position: { x: 250, y: 5 },
        style: { background: '#0891b2', color: '#fff', border: '1px solid #22d3ee', fontWeight: 'bold', padding: '10px', borderRadius: '8px' },
    },
    {
        id: '2',
        data: { label: '🔐 FIREBASE AUTH (Security)' },
        position: { x: 50, y: 150 },
        style: { background: '#1e293b', color: '#38bdf8', border: '1px solid #38bdf8', borderRadius: '8px' },
    },
    {
        id: '3',
        data: { label: '📂 CLOUD FIRESTORE (Real-time DB)' },
        position: { x: 250, y: 150 },
        style: { background: '#1e293b', color: '#fbbf24', border: '1px solid #fbbf24', borderRadius: '8px' },
    },
    {
        id: '4',
        data: { label: '🧠 AI GATEKEEPER (Validation)' },
        position: { x: 450, y: 150 },
        style: { background: '#7c3aed', color: '#fff', border: '1px solid #a78bfa', borderRadius: '8px' },
    },
    {
        id: '5',
        data: { label: '🎬 CLAUDE HAIKU 4.5 (anthropic-proxy)' },
        position: { x: 450, y: 300 },
        style: { background: '#1e1b4b', color: '#c084fc', border: '1px solid #c084fc', borderRadius: '8px' },
    },
    {
        id: '6',
        data: { label: '🗣️ VOICE/TTS ENGINE (Audio System)' },
        position: { x: 250, y: 300 },
        style: { background: '#1e293b', color: '#22d3ee', border: '1px solid #22d3ee', borderRadius: '8px' },
    },
];

const initialEdges: Edge[] = [
    { id: 'e1-2', source: '1', target: '2', animated: true, label: 'Auth Token' },
    { id: 'e1-3', source: '1', target: '3', animated: true, label: 'Real-time Sync' },
    { id: 'e1-4', source: '1', target: '4', animated: true, label: 'Mission Context' },
    { id: 'e4-5', source: '4', target: '5', animated: true, label: 'Validated Query' },
    { id: 'e3-1', source: '3', target: '1', label: 'Push Updates' },
    { id: 'e5-1', source: '5', target: '1', label: 'Intelligence Stream' },
    { id: 'e5-6', source: '5', target: '6', label: 'Text to Speech' },
];

const ArchitectureMap: React.FC<{ isEmbedded?: boolean }> = ({ isEmbedded = false }) => {
    const { t, i18n } = useTranslation('translation');
    const navigate = useNavigate();
    const isSpanish = i18n.language === 'es';

    return (
        <div className="w-full h-full bg-slate-950 flex flex-col font-sans overflow-hidden">
            {/* Header (Only show if NOT embedded) */}
            {!isEmbedded && (
                <div className="h-16 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between px-6 backdrop-blur-md z-10">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/admin')}
                            className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent uppercase tracking-wider">
                                {isSpanish ? 'Mapa de Arquitectura Estratégica' : 'Strategic Architecture Map'}
                            </h1>
                            <p className="text-xs text-slate-500 font-medium">PILOT AI - CTO OVERVIEW v4.0</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1.5 text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded-full uppercase tracking-tighter">
                            <ShieldCheck size={12} />
                            SERVERLESS PROD-READY
                        </span>
                        <button className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg text-xs transition-colors">
                            <Share2 size={14} />
                            {isSpanish ? 'Exportar' : 'Export'}
                        </button>
                    </div>
                </div>
            )}

            {/* Explainer Overlay (Desktop Only) */}
            <div className={`absolute left-6 w-72 bg-slate-900/80 p-5 rounded-2xl border border-slate-800 backdrop-blur-xl z-20 shadow-2xl space-y-4 hidden md:block border-l-4 border-l-cyan-500 ${isEmbedded ? 'top-6' : 'top-24'}`}>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2">
                    {isSpanish ? 'Nota del Arquitecto' : 'Architect\'s Note'}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed italic">
                    {isSpanish
                        ? 'Esta arquitectura elimina cuellos de botella mediante orquestación serverless. Los agentes no son servidores, son micro-procesos de inteligencia activados por el orquestador React.'
                        : 'This architecture eliminates bottlenecks via serverless orchestration. Agents are not servers, but intelligence micro-processes triggered by the React orchestrator.'}
                </p>
                <div className="grid grid-cols-2 gap-2 pt-2">
                    <div className="bg-slate-800/50 p-2 rounded-lg border border-slate-700/50">
                        <div className="text-[10px] text-slate-500 uppercase tracking-tighter mb-1">Latency</div>
                        <div className="text-xs font-bold text-cyan-400">&lt; 150ms</div>
                    </div>
                    <div className="bg-slate-800/50 p-2 rounded-lg border border-slate-700/50">
                        <div className="text-[10px] text-slate-500 uppercase tracking-tighter mb-1">Scaling</div>
                        <div className="text-xs font-bold text-emerald-400">Elastic</div>
                    </div>
                </div>
            </div>

            {/* FLOW CANVAS */}
            <div className="flex-1 w-full relative">
                <ReactFlow
                    nodes={initialNodes}
                    edges={initialEdges}
                    fitView
                    className="bg-slate-950"
                >
                    <Background color="#1e293b" gap={20} size={1} />
                    <Controls className="bg-slate-900 border-slate-800 fill-white" />
                    <MiniMap
                        style={{ background: '#0f172a', border: '1px solid #1e293b' }}
                        nodeColor="#1e293b"
                        maskColor="rgba(0,0,0,0.5)"
                    />
                </ReactFlow>
            </div>

            {/* Footer / Labels Map */}
            <div className="h-10 bg-slate-900 border-t border-slate-800 flex items-center justify-center px-6 gap-8 text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-cyan-500"></span> Client Side</div>
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Backend Services</div>
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-purple-500"></span> Intelligence (LLM)</div>
            </div>
        </div>
    );
};

export default ArchitectureMap;
