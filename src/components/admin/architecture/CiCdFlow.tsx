import React, { useMemo } from 'react';
import ReactFlow, {
    Node,
    Edge,
    Controls,
    Background,
    MiniMap,
    useNodesState,
    useEdgesState,
    Position,
    MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';
import { GitBranch, Github, Server, Globe, Shield, User, Terminal, CheckCircle2, PlayCircle } from 'lucide-react';

const initialNodes: Node[] = [
    {
        id: 'dev',
        type: 'input',
        position: { x: 50, y: 150 },
        data: { label: '👨‍💻 DEVELOPER' },
        style: { background: '#0f172a', color: '#94a3b8', border: '1px solid #334155', borderRadius: '8px', width: 180, fontWeight: 'bold' }
    },
    {
        id: 'github',
        position: { x: 300, y: 150 },
        data: { label: '🐙 GITHUB REPO' },
        style: { background: '#1e1b4b', color: '#c084fc', border: '1px solid #7c3aed', borderRadius: '8px', width: 180, fontWeight: 'bold' }
    },
    {
        id: 'action-preview',
        position: { x: 550, y: 50 },
        data: { label: '⚡ WORKFLOW: PREVIEW' },
        style: { background: '#2a1b05', color: '#fbbf24', border: '1px solid #f59e0b', borderRadius: '8px', width: 200, fontWeight: 'bold' }
    },
    {
        id: 'action-prod',
        position: { x: 550, y: 250 },
        data: { label: '🚀 WORKFLOW: PROD' },
        style: { background: '#172554', color: '#60a5fa', border: '1px solid #3b82f6', borderRadius: '8px', width: 200, fontWeight: 'bold' }
    },
    {
        id: 'preview-url',
        type: 'output',
        position: { x: 850, y: 50 },
        data: { label: '🌐 PREVIEW CHANNEL' },
        style: { background: '#0f172a', color: '#fbbf24', border: '1px dashed #fbbf24', borderRadius: '8px', width: 180 }
    },
    {
        id: 'prod-hosting',
        type: 'output',
        position: { x: 850, y: 200 },
        data: { label: '🏢 FIREBASE HOSTING' },
        style: { background: '#0f172a', color: '#38bdf8', border: '1px solid #0ea5e9', borderRadius: '8px', width: 180 }
    },
    {
        id: 'prod-rules',
        type: 'output',
        position: { x: 850, y: 300 },
        data: { label: '🛡️ FIRESTORE RULES' },
        style: { background: '#0f172a', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '8px', width: 180 }
    }
];

const initialEdges: Edge[] = [
    { id: 'e1', source: 'dev', target: 'github', animated: true, label: 'Push / PR', style: { stroke: '#94a3b8' }, labelStyle: { fill: '#94a3b8' } },
    { id: 'e2', source: 'github', target: 'action-preview', animated: true, label: 'Pull Request', style: { stroke: '#fbbf24', strokeDasharray: '5,5' }, labelStyle: { fill: '#fbbf24' } },
    { id: 'e3', source: 'github', target: 'action-prod', animated: true, label: 'Merge Main', style: { stroke: '#60a5fa' }, labelStyle: { fill: '#60a5fa' } },
    { id: 'e4', source: 'action-preview', target: 'preview-url', animated: true, markerEnd: { type: MarkerType.ArrowClosed, color: '#fbbf24' }, style: { stroke: '#fbbf24' } },
    { id: 'e5', source: 'action-prod', target: 'prod-hosting', animated: true, markerEnd: { type: MarkerType.ArrowClosed, color: '#60a5fa' }, style: { stroke: '#60a5fa' } },
    { id: 'e6', source: 'action-prod', target: 'prod-rules', animated: true, markerEnd: { type: MarkerType.ArrowClosed, color: '#ef4444' }, style: { stroke: '#ef4444' } }
];

export const CiCdFlow: React.FC = () => {
    const [nodes, , onNodesChange] = useNodesState(initialNodes);
    const [edges, , onEdgesChange] = useEdgesState(initialEdges);

    return (
        <div className="w-full h-full bg-slate-950 flex font-sans relative overflow-hidden">
            {/* Sidebar Overlay */}
            <div className="absolute left-6 top-6 w-80 bg-slate-900/90 p-6 rounded-2xl border border-slate-800 backdrop-blur-xl z-20 shadow-2xl border-l-4 border-l-orange-500">
                <h3 className="text-lg font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-3 mb-4 flex items-center gap-2">
                    <GitBranch size={20} className="text-orange-500" />
                    CI/CD Process Guide
                </h3>

                <div className="space-y-6">
                    <div className="relative pl-6 border-l border-slate-700">
                        <div className="absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full bg-slate-500 ring-4 ring-slate-900" />
                        <h4 className="text-sm font-bold text-slate-300 mb-1">1. Development</h4>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            Developers work locally. When ready, they push code to GitHub.
                        </p>
                    </div>

                    <div className="relative pl-6 border-l border-slate-700">
                        <div className="absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full bg-amber-500 ring-4 ring-slate-900" />
                        <h4 className="text-sm font-bold text-amber-400 mb-1">2. Pull Request (Preview)</h4>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            Creating a PR triggers the <b>Preview Workflow</b>. A temporary URL is generated to test changes safely.
                        </p>
                    </div>

                    <div className="relative pl-6 border-l border-slate-700">
                        <div className="absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-slate-900" />
                        <h4 className="text-sm font-bold text-blue-400 mb-1">3. Merge to Production</h4>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            Approving and merging the PR triggers the <b>Prod Workflow</b>. Code is built and deployed to the Live Channel.
                        </p>
                    </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
                    <span>Status:</span>
                    <span className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20 font-bold">
                        <CheckCircle2 size={12} />
                        ACTIVE
                    </span>
                </div>
            </div>

            {/* Main Flow */}
            <div className="flex-1 h-full">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    fitView
                    className="bg-slate-950"
                >
                    <Background color="#1e293b" gap={20} size={1} />
                    <Controls className="bg-slate-900 border-slate-800 fill-white" />
                    <MiniMap
                        style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                        nodeColor={(n) => {
                            if (n.type === 'input') return '#0f172a';
                            if (n.type === 'output') return '#0f172a';
                            return '#1e1b4b';
                        }}
                        maskColor="rgba(0,0,0,0.6)"
                    />
                </ReactFlow>
            </div>

            {/* Legend Footer */}
            <div className="absolute bottom-0 w-full h-10 bg-slate-900 border-t border-slate-800 flex items-center justify-center gap-8 text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-slate-500"></span> Local</div>
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-purple-500"></span> GitHub</div>
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Preview Flow</div>
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Prod Flow</div>
            </div>
        </div>
    );
};
