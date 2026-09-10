
import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import ReactFlow, {
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    ReactFlowProvider,
    MiniMap,
    Panel,
    addEdge,
    reconnectEdge,
    Connection,
    Edge,
    useReactFlow,
    MarkerType,
    Node,
    getNodesBounds,
    getViewportForBounds,
} from 'reactflow';
import 'reactflow/dist/style.css';
import '../styles/print.css'; // Ensure this exists or add inline styles if preferred
import { getLayoutedElements, DiagramData } from '../utils/diagramLayout';
import { AlertCircle, Maximize2, Minimize2, RefreshCw, Image as ImageIcon, Edit3, Save, Trash2, X, Check, Info, Lightbulb, Plus, Minus, Link2, ShieldAlert, ClipboardCheck, ScanSearch, Zap, FileCode2 } from 'lucide-react';
import { toPng } from 'html-to-image';
import { loggingService } from '../services/firebase/loggingService';
import { ContextMenu } from './diagram/ContextMenu';
import { CustomNode, C4PersonNode, C4SoftwareSystemNode, C4ContainerNode, C4ExternalSystemNode } from './diagram/CustomNode';
import { cn } from '../lib/utils';
import { intelligenceService } from '../services/ai/intelligenceService';
import { Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// ... (previous imports)



// ... (render return)


class DiagramErrorBoundary extends React.Component<{ children: React.ReactNode, onError: (error: Error) => void }, { hasError: boolean }> {
    constructor(props: { children: React.ReactNode, onError: (error: Error) => void }) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(_: Error) {
        return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("DiagramErrorBoundary caught an error:", error, errorInfo);
        this.props.onError(error);
    }

    render() {
        if (this.state.hasError) {
            return null; // Handled by parent state
        }
        return this.props.children;
    }
}

// --- Sidebar Component ---
interface SidebarProps {
    isConnectMode: boolean;
    onToggleConnect: () => void;
    connectSource: Node | null;
    isReconnectMode: boolean;
    onToggleReconnect: () => void;
    isDeleteEdgeMode: boolean;
    onToggleDeleteEdge: () => void;
}

const Sidebar = ({ isConnectMode, onToggleConnect, connectSource, isReconnectMode, onToggleReconnect, isDeleteEdgeMode, onToggleDeleteEdge }: SidebarProps) => {
    const onDragStart = (event: React.DragEvent, nodeType: string, label: string) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.setData('application/reactflow-label', label);
        event.dataTransfer.effectAllowed = 'move';
    };

    return (
        <div className="w-48 bg-white border-r border-slate-200 p-4 flex flex-col gap-3 shrink-0 animate-in slide-in-from-left-2 duration-300">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Toolbox</h4>

            <div className="space-y-2">
                <div className="text-xs text-slate-400 font-medium mb-1">Nodes</div>
                <div className="dndnode input p-2 border border-emerald-200 bg-emerald-50 text-emerald-700 rounded cursor-grab hover:shadow-md transition-all text-xs font-medium flex items-center gap-2" onDragStart={(event) => onDragStart(event, 'start', 'Start')} draggable>
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    Start / Input
                </div>
                <div className="dndnode default p-2 border border-slate-200 bg-white text-slate-700 rounded cursor-grab hover:shadow-md transition-all text-xs font-medium flex items-center gap-2" onDragStart={(event) => onDragStart(event, 'default', 'Process')} draggable>
                    <div className="w-2 h-2 rounded bg-slate-400"></div>
                    Process Step
                </div>
                <div className="dndnode output p-2 border border-orange-200 bg-orange-50 text-orange-700 rounded cursor-grab hover:shadow-md transition-all text-xs font-medium flex items-center gap-2" onDragStart={(event) => onDragStart(event, 'condition', 'Decision')} draggable>
                    <div className="w-2 h-2 rotate-45 bg-orange-400 transform origin-center"></div>
                    Decision
                </div>
                <div className="dndnode output p-2 border border-red-200 bg-red-50 text-red-700 rounded cursor-grab hover:shadow-md transition-all text-xs font-medium flex items-center gap-2" onDragStart={(event) => onDragStart(event, 'end', 'End')} draggable>
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    End / Output
                </div>
            </div>

            <div className="mt-4 space-y-2">
                <div className="text-xs text-slate-400 font-medium mb-1">Infrastructure</div>
                <div className="dndnode output p-2 border border-blue-200 bg-blue-50 text-blue-700 rounded cursor-grab hover:shadow-md transition-all text-xs font-medium flex items-center gap-2" onDragStart={(event) => onDragStart(event, 'database', 'Database')} draggable>
                    <div className="w-2 h-2 rounded-t-sm bg-blue-500"></div>
                    Database
                </div>
                <div className="dndnode output p-2 border border-cyan-200 bg-cyan-50 text-cyan-700 rounded cursor-grab hover:shadow-md transition-all text-xs font-medium flex items-center gap-2" onDragStart={(event) => onDragStart(event, 'cloud', 'Cloud')} draggable>
                    <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
                    Cloud Service
                </div>
            </div>

            <div className="mt-auto pt-4 border-t border-slate-100 space-y-2">
                {/* Connect Mode button */}
                <button
                    onClick={onToggleConnect}
                    className={cn(
                        "w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-tight transition-all",
                        isConnectMode
                            ? "bg-indigo-600 text-white shadow-md"
                            : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                    )}
                >
                    <Plus className="h-3 w-3 shrink-0" />
                    {isConnectMode ? (connectSource ? 'Clic en destino…' : 'Clic en origen…') : 'Agregar línea'}
                </button>
                {isConnectMode && (
                    <p className="text-[10px] text-indigo-600 font-medium px-1 leading-snug animate-in fade-in duration-200">
                        {connectSource
                            ? <>Origen: <b>"{connectSource.data.label}"</b> — ahora clic en el nodo destino.</>
                            : 'Clic en el nodo de ORIGEN de la línea.'}
                    </p>
                )}
                {!isConnectMode && (
                    <p className="text-[10px] text-slate-400 leading-snug px-1">
                        O arrastrá el conector <span className="font-bold text-slate-500">(●)</span> de un nodo al otro.
                    </p>
                )}

                {/* Reconnect Edge Mode button */}
                <button
                    onClick={onToggleReconnect}
                    className={cn(
                        "w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-tight transition-all",
                        isReconnectMode
                            ? "bg-violet-600 text-white shadow-md"
                            : "bg-violet-50 text-violet-700 hover:bg-violet-100"
                    )}
                >
                    <Link2 className="h-3 w-3 shrink-0" />
                    {isReconnectMode ? 'Cancelar modo' : 'Mover línea'}
                </button>
                {isReconnectMode && (
                    <p className="text-[10px] text-violet-600 font-medium px-1 leading-snug animate-in fade-in duration-200">
                        Arrastrá cualquier extremo de una línea hacia otro nodo.
                    </p>
                )}
                {!isReconnectMode && (
                    <p className="text-[10px] text-slate-400 leading-snug px-1">
                        Activa el modo y arrastrá el extremo de una línea.
                    </p>
                )}

                {/* Delete Edge Mode button */}
                <button
                    onClick={onToggleDeleteEdge}
                    className={cn(
                        "w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-tight transition-all",
                        isDeleteEdgeMode
                            ? "bg-red-600 text-white shadow-md"
                            : "bg-red-50 text-red-700 hover:bg-red-100"
                    )}
                >
                    <Minus className="h-3 w-3 shrink-0" />
                    {isDeleteEdgeMode ? 'Cancelar modo' : 'Eliminar línea'}
                </button>
                {isDeleteEdgeMode && (
                    <p className="text-[10px] text-red-600 font-medium px-1 leading-snug animate-in fade-in duration-200">
                        Clic en cualquier línea roja para eliminarla.
                    </p>
                )}
                {!isDeleteEdgeMode && (
                    <p className="text-[10px] text-slate-400 leading-snug px-1">
                        Activa el modo y clic en la línea a eliminar.
                    </p>
                )}
            </div>
        </div>
    );
};

interface SmartDiagramProps {
    data: DiagramData | string; // Can be object or JSON string
    title?: string;
    description?: string;
    className?: string;
    onConvertToMaster?: (node: Node, subDiagram?: DiagramData) => void;
}

const SmartDiagramContent: React.FC<SmartDiagramProps> = ({ data, title, description, className, onConvertToMaster }) => {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [error, setError] = useState<string | null>(null);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);

    // Automation overlay
    const [automationMap, setAutomationMap] = useState<Record<string, 'auto' | 'hybrid' | 'manual'> | null>(null);
    const [isAutomationOverlay, setIsAutomationOverlay] = useState(false);

    // Edge tool modes
    const [isConnectMode, setIsConnectMode] = useState(false);
    const [connectSource, setConnectSource] = useState<Node | null>(null);
    const [isReconnectMode, setIsReconnectMode] = useState(false);
    const [isDeleteEdgeMode, setIsDeleteEdgeMode] = useState(false);

    // Rename State
    const [editingNode, setEditingNode] = useState<Node | null>(null);
    const [editLabel, setEditLabel] = useState("");

    const flowRef = useRef<HTMLDivElement>(null);
    const { project, deleteElements, getNodes, fitView } = useReactFlow();

    // Context Menu State
    const [menu, setMenu] = useState<{ id: string; top?: number; left?: number; right?: number; bottom?: number; node: Node } | null>(null);

    // level calculation (Visual Counter)
    const currentLevel = useMemo(() => {
        const maxLevel = nodes.reduce((max, node) => {
            const level = (node.data?.expandLevel as number) || 1;
            return Math.max(max, level);
        }, 1);
        return maxLevel;
    }, [nodes]);

    useEffect(() => {
        console.log(`DEBUG: SmartDiagramContent mounted. Level: ${currentLevel}, has onConvertToMaster: ${!!onConvertToMaster}`);
    }, [currentLevel, !!onConvertToMaster]);

    const onNodeContextMenu = useCallback(
        (event: React.MouseEvent, node: Node) => {
            event.preventDefault();

            if (!flowRef.current) return;

            const pane = flowRef.current.getBoundingClientRect();
            setMenu({
                id: node.id,
                top: event.clientY < pane.height - 200 ? event.clientY - pane.top : undefined,
                left: event.clientX < pane.width - 200 ? event.clientX - pane.left : undefined,
                right: event.clientX >= pane.width - 200 ? pane.width - (event.clientX - pane.left) : undefined,
                bottom: event.clientY >= pane.height - 200 ? pane.height - (event.clientY - pane.top) : undefined,
                node: node,
            });
        },
        []
    );

    const onPaneClick = useCallback(() => setMenu(null), []);

    // Intelligence State
    const [intelligenceResult, setIntelligenceResult] = useState<{ title: string; content: string | DiagramData; type: 'text' | 'diagram'; kind?: 'risks' | 'checklist' | 'gaps' } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [limitReachedNode, setLimitReachedNode] = useState<Node | null>(null);
    const [errorToast, setErrorToast] = useState<{ title: string; message: string } | null>(null);

    const handleMenuAction = async (action: string, node: Node) => {
        setMenu(null);
        setIsLoading(true);
        try {
            if (action === 'expand') {
                const nodeLevel = (node.data?.expandLevel as number) || 1;
                console.log(`DEBUG: Expanding node "${node.data.label}" at Level ${nodeLevel}. (Global Level: ${currentLevel})`);

                if (nodeLevel >= 3) {
                    console.warn(`DEBUG: Depth limit reached for node "${node.data.label}" (Level ${nodeLevel})`);
                    setLimitReachedNode(node);
                    setIsLoading(false);
                    return;
                }

                const subDiagram = await intelligenceService.expandSubProcess(node, nodes, edges, nodeLevel);
                setIntelligenceResult({ title: `Sub-process (${nodeLevel + 1}): ${node.data.label}`, content: subDiagram, type: 'diagram' });
            } else if (action === 'checklist') {
                const text = await intelligenceService.generateChecklist(node);
                setIntelligenceResult({ title: `Checklist: ${node.data.label}`, content: text, type: 'text', kind: 'checklist' });
            } else if (action === 'risks') {
                const text = await intelligenceService.analyzeRisks(node);
                setIntelligenceResult({ title: `Risk Analysis: ${node.data.label}`, content: text, type: 'text', kind: 'risks' });
            }
        } catch (err: any) {
            console.error("Intelligence action failed", err);
            const actionLabel = action === 'expand' ? 'expansión del sub-proceso'
                : action === 'checklist' ? 'generación del checklist'
                : 'análisis de riesgos';
            const detail = err?.message?.slice(0, 200) || 'El servicio de IA no respondió.';
            setErrorToast({
                title: `No se pudo completar la ${actionLabel}`,
                message: `${detail}\n\nPuedes reintentar la acción haciendo clic derecho sobre el nodo.`,
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Auto-dismiss the error toast after 8 seconds so the user doesn't have to click.
    useEffect(() => {
        if (!errorToast) return;
        const timer = setTimeout(() => setErrorToast(null), 8000);
        return () => clearTimeout(timer);
    }, [errorToast]);

    // Register custom node types (BPMN + C4 Architecture)
    const nodeTypes = useMemo(() => ({
        // BPMN / Process flow types
        start: CustomNode,
        end: CustomNode,
        condition: CustomNode,
        database: CustomNode,
        cloud: CustomNode,
        default: CustomNode,
        group: CustomNode,
        // C4 Architecture types
        person: C4PersonNode,
        'software-system': C4SoftwareSystemNode,
        container: C4ContainerNode,
        'external-system': C4ExternalSystemNode,
    }), []);

    // Parse and Layout Data
    const processData = useCallback(() => {
        try {
            let parsedData: DiagramData;

            if (!data) {
                throw new Error("No diagram data provided.");
            }

            if (typeof data === 'string') {
                // Attempt 1: Direct parse (after basic cleaning)
                let cleanJson = data.replace(/```json|```/g, '').trim();

                try {
                    parsedData = JSON.parse(cleanJson);
                } catch (e) {
                    // Attempt 2: Extract JSON object/array from text
                    const jsonMatch = cleanJson.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
                    if (jsonMatch) {
                        try {
                            parsedData = JSON.parse(jsonMatch[0]);
                        } catch (e2) {
                            throw new Error("Failed to extract valid JSON from content.");
                        }
                    } else {
                        throw new Error("No JSON structure found in content.");
                    }
                }
            } else {
                // Handle case where data is wrapped in { code: ... } or { diagram: ... }
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const anyData = data as any;
                if (anyData.code && typeof anyData.code === 'object' && !Array.isArray(anyData.code)) {
                    parsedData = anyData.code;
                } else if (anyData.diagram && typeof anyData.diagram === 'object') {
                    parsedData = anyData.diagram;
                } else {
                    parsedData = data;
                }
            }

            // Validate basic structure
            if (!parsedData.nodes || !Array.isArray(parsedData.nodes)) {
                throw new Error("Invalid diagram data: 'nodes' array is missing.");
            }

            const layouted = getLayoutedElements(parsedData);

            // Normalize nodes to ensure data.label exists
            const normalizedNodes = layouted.nodes.map((node: any) => ({
                ...node,
                data: {
                    ...node.data,
                    label: node.data?.label || node.label || node.id // Fallback to top-level label or ID
                }
            }));

            setNodes(normalizedNodes);
            setEdges(layouted.edges);
            setError(null);

            // Re-fit viewport after data loads (fitView prop only fires on mount
            // when nodes are still empty; this ensures nodes are always centered)
            requestAnimationFrame(() => fitView({ padding: 0.12, duration: 300 }));

        } catch (err: any) {
            console.error("SmartDiagram Error:", err);
            setError(err.message || "Failed to render diagram.");
            loggingService.logError('SmartDiagram', 'Failed to process diagram data', { error: err.message, data }, 'system');
        }
    }, [data, setNodes, setEdges, fitView]);

    useEffect(() => {
        processData();
        // Reset automation overlay when diagram data changes
        setAutomationMap(null);
        setIsAutomationOverlay(false);
    }, [processData]);

    // Handle Escape key for fullscreen
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isFullScreen) {
                setIsFullScreen(false);
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isFullScreen]);

    const onConnect = useCallback((params: Connection) => {
        setEdges((eds: Edge[]) => addEdge({ ...params, type: 'smoothstep', animated: true, markerEnd: { type: MarkerType.ArrowClosed } }, eds));
    }, [setEdges]);

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault();

            const type = event.dataTransfer.getData('application/reactflow');
            const label = event.dataTransfer.getData('application/reactflow-label');

            // check if the dropped element is valid
            if (typeof type === 'undefined' || !type) {
                return;
            }

            const reactFlowBounds = flowRef.current?.getBoundingClientRect();

            if (!reactFlowBounds) return;

            const position = project({
                x: event.clientX - reactFlowBounds.left,
                y: event.clientY - reactFlowBounds.top,
            });

            const newNode = {
                id: `node_${Date.now()}`,
                type,
                position,
                data: { label: label },
            };

            setNodes((nds: Node[]) => nds.concat(newNode));
        },
        [project, setNodes]
    );

    const onNodeDoubleClick = useCallback((_: React.MouseEvent, node: Node) => {
        if (!isEditMode) return;
        setEditingNode(node);
        setEditLabel(node.data.label);
    }, [isEditMode]);

    const handleRename = () => {
        if (!editingNode) return;
        setNodes((nds: Node[]) =>
            nds.map((node: Node) => {
                if (node.id === editingNode.id) {
                    return { ...node, data: { ...node.data, label: editLabel } };
                }
                return node;
            })
        );
        setEditingNode(null);
        setEditLabel("");
    };

    const handleDeleteSelected = useCallback(() => {
        const selectedNodes = nodes.filter((node: Node) => node.selected);
        const selectedEdges = edges.filter((edge: Edge) => edge.selected);
        deleteElements({ nodes: selectedNodes, edges: selectedEdges });
    }, [nodes, edges, deleteElements]);

    // ── Connect Mode: click source → click target → edge created ─────────────
    const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
        if (!isConnectMode || node.type === 'group') return;
        if (!connectSource) {
            setConnectSource(node);
        } else {
            if (connectSource.id !== node.id) {
                const newEdge: Edge = {
                    id: `e_${connectSource.id}_${node.id}_${Date.now()}`,
                    source: connectSource.id,
                    target: node.id,
                    type: 'smoothstep',
                    markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' },
                    style: { stroke: '#94a3b8' },
                };
                setEdges(eds => [...eds, newEdge]);
            }
            setConnectSource(null);
            setIsConnectMode(false);
        }
    }, [isConnectMode, connectSource, setEdges]);

    // ── Delete Edge Mode: click any edge → deleted immediately ────────────────
    const onEdgeClick = useCallback((_: React.MouseEvent, edge: Edge) => {
        if (isDeleteEdgeMode) {
            setEdges(eds => eds.filter(e => e.id !== edge.id));
        }
    }, [isDeleteEdgeMode, setEdges]);

    // ── Reconnect Mode: drag edge endpoint to new node ────────────────────────
    const handleEdgeReconnect = useCallback((oldEdge: Edge, newConnection: Connection) => {
        setEdges(eds => reconnectEdge(oldEdge, newConnection, eds));
    }, [setEdges]);

    // ── Visual overlays for current tool mode ─────────────────────────────────
    // Highlight connect source node with an indigo ring
    const displayNodes = useMemo(() => {
        let result = connectSource
            ? nodes.map(n => n.id === connectSource.id
                ? { ...n, style: { ...n.style, outline: '3px solid #6366f1', outlineOffset: '3px', borderRadius: '10px', zIndex: 999 } }
                : n)
            : nodes;
        if (isAutomationOverlay && automationMap) {
            result = result.map(n => ({
                ...n,
                data: { ...n.data, automationLevel: automationMap[n.id] ?? undefined },
            }));
        }
        return result;
    }, [nodes, connectSource, isAutomationOverlay, automationMap]);

    // Tint edges red + animate when in delete-edge mode
    const displayEdges = useMemo(() =>
        isDeleteEdgeMode
            ? edges.map(e => ({ ...e, animated: true, style: { ...e.style, stroke: '#ef4444', strokeWidth: 2, cursor: 'pointer' } }))
            : edges,
        [edges, isDeleteEdgeMode]);

    // Exit all edge tool modes when edit mode is turned off
    const handleEditToggle = useCallback(() => {
        if (isEditMode) {
            setIsConnectMode(false);
            setIsReconnectMode(false);
            setIsDeleteEdgeMode(false);
            setConnectSource(null);
        }
        setIsEditMode(prev => !prev);
    }, [isEditMode]);

    const handleDownloadImage = async () => {
        if (flowRef.current === null) return;

        try {
            const IMAGE_WIDTH = 2400;
            const IMAGE_HEIGHT = 1600;
            const PADDING = 80; // px padding around all nodes

            // Get all content nodes (exclude swimlane group containers)
            const allNodes = getNodes().filter(n => n.type !== 'group');
            if (allNodes.length === 0) return;

            // Compute the bounding box of ALL nodes regardless of current viewport
            const bounds = getNodesBounds(allNodes);

            // Add padding to bounds
            const paddedBounds = {
                x: bounds.x - PADDING,
                y: bounds.y - PADDING,
                width: bounds.width + PADDING * 2,
                height: bounds.height + PADDING * 2,
            };

            // Calculate the transform that fits all content into IMAGE_WIDTH × IMAGE_HEIGHT
            const { x: tx, y: ty, zoom } = getViewportForBounds(
                paddedBounds,
                IMAGE_WIDTH,
                IMAGE_HEIGHT,
                0.01,  // minZoom
                10,    // maxZoom
            );

            const viewportEl = flowRef.current.querySelector('.react-flow__viewport') as HTMLElement;
            if (!viewportEl) return;

            const dataUrl = await toPng(viewportEl, {
                backgroundColor: '#f8fafc',
                width: IMAGE_WIDTH,
                height: IMAGE_HEIGHT,
                style: {
                    width: `${IMAGE_WIDTH}px`,
                    height: `${IMAGE_HEIGHT}px`,
                    transform: `translate(${tx}px, ${ty}px) scale(${zoom})`,
                    transformOrigin: '0 0',
                },
                pixelRatio: 2,
            });

            const link = document.createElement('a');
            link.download = `${title || 'diagram'}.png`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error('Failed to download diagram', err);
            alert('Failed to download diagram as PNG.');
        }
    };

    // ── Feature: Gap Analysis ────────────────────────────────────────────────
    const handleGapAnalysis = async () => {
        setIsLoading(true);
        try {
            const contentNodes = nodes.filter(n => n.type !== 'group');
            const text = await intelligenceService.analyzeGaps(contentNodes, edges);
            setIntelligenceResult({ title: 'Análisis de Brechas del Flujo', content: text, type: 'text', kind: 'gaps' });
        } catch (err) {
            console.error('Gap analysis failed', err);
            alert('No se pudo analizar las brechas. Por favor intenta de nuevo.');
        } finally {
            setIsLoading(false);
        }
    };

    // ── Feature: Automation Overlay ──────────────────────────────────────────
    const handleAutomationToggle = async () => {
        if (isAutomationOverlay) {
            setIsAutomationOverlay(false);
            return;
        }
        if (automationMap) {
            setIsAutomationOverlay(true);
            return;
        }
        setIsLoading(true);
        try {
            const contentNodes = nodes.filter(n => n.type !== 'group');
            const result = await intelligenceService.analyzeAutomation(contentNodes, edges);
            setAutomationMap(result);
            setIsAutomationOverlay(true);
        } catch (err) {
            console.error('Automation analysis failed', err);
            alert('No se pudo analizar el potencial de automatización. Por favor intenta de nuevo.');
        } finally {
            setIsLoading(false);
        }
    };

    // ── Feature: BPMN 2.0 XML Export ────────────────────────────────────────
    const handleBpmnExport = () => {
        const contentNodes = nodes.filter(n => n.type !== 'group');
        if (contentNodes.length === 0) return;

        const esc = (s: string) => s
            .replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

        const bpmnType = (t?: string) => {
            switch (t) {
                case 'start': return 'startEvent';
                case 'end': return 'endEvent';
                case 'condition': return 'exclusiveGateway';
                case 'database': return 'dataStoreReference';
                case 'cloud': return 'serviceTask';
                default: return 'task';
            }
        };

        const dims = (t?: string) => {
            if (t === 'start' || t === 'end') return { w: 36, h: 36 };
            if (t === 'condition') return { w: 50, h: 50 };
            if (t === 'database') return { w: 50, h: 50 };
            return { w: 100, h: 60 };
        };

        const nodeMap = Object.fromEntries(contentNodes.map(n => [n.id, n]));

        const processElements = contentNodes.map(n => {
            const bt = bpmnType(n.type);
            const nm = esc((n.data as any)?.label || n.id);
            return `    <${bt} id="${n.id}" name="${nm}"/>`;
        }).join('\n');

        const seqFlows = edges.map((e, i) => {
            const lbl = e.label ? ` name="${esc(String(e.label))}"` : '';
            return `    <sequenceFlow id="sf_${i}" sourceRef="${e.source}" targetRef="${e.target}"${lbl}/>`;
        }).join('\n');

        const shapes = contentNodes.map(n => {
            const bt = bpmnType(n.type);
            const { w, h } = dims(n.type);
            const x = Math.round((n.position?.x ?? 0));
            const y = Math.round((n.position?.y ?? 0));
            const marker = bt === 'exclusiveGateway' ? ' isMarkerVisible="true"' : '';
            return `      <bpmndi:BPMNShape id="${n.id}_di" bpmnElement="${n.id}"${marker}>\n        <dc:Bounds x="${x}" y="${y}" width="${w}" height="${h}"/>\n      </bpmndi:BPMNShape>`;
        }).join('\n');

        const diEdges = edges.map((e, i) => {
            const src = nodeMap[e.source];
            const tgt = nodeMap[e.target];
            const { w: sw, h: sh } = dims(src?.type);
            const { w: tw, h: th } = dims(tgt?.type);
            const x1 = Math.round((src?.position?.x ?? 0) + sw / 2);
            const y1 = Math.round((src?.position?.y ?? 0) + sh);
            const x2 = Math.round((tgt?.position?.x ?? 0) + tw / 2);
            const y2 = Math.round((tgt?.position?.y ?? 0));
            return `      <bpmndi:BPMNEdge id="sf_${i}_di" bpmnElement="sf_${i}">\n        <di:waypoint x="${x1}" y="${y1}"/>\n        <di:waypoint x="${x2}" y="${y2}"/>\n      </bpmndi:BPMNEdge>`;
        }).join('\n');

        const processName = esc(title || 'Process');
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<definitions
  xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
  targetNamespace="http://pilotai.app/bpmn"
  id="Definitions_1">
  <process id="Process_1" name="${processName}" isExecutable="false">
${processElements}
${seqFlows}
  </process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
${shapes}
${diEdges}
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</definitions>`;

        const blob = new Blob([xml], { type: 'application/xml' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${title || 'diagram'}.bpmn`;
        link.click();
        URL.revokeObjectURL(link.href);
    };

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center my-4">
                <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                <h3 className="text-red-800 font-semibold">Diagram Error</h3>
                <p className="text-red-600 text-sm mb-4">{error}</p>
                <button
                    onClick={processData}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
                >
                    <RefreshCw className="h-4 w-4" /> Retry
                </button>
                <div className="mt-4 text-left">
                    <p className="text-xs text-slate-500 mb-1">Debug Info:</p>
                    <pre className="text-xs bg-white p-2 rounded border border-red-100 overflow-auto max-h-32">
                        {typeof data === 'string' ? data : JSON.stringify(data, null, 2)}
                    </pre>
                </div>
            </div>
        );
    }

    const containerStyle: React.CSSProperties = isFullScreen ? {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 999999, // Above all modals (Intelligence modal is 100000)
        backgroundColor: '#f8fafc', // slate-50
        display: 'flex',
        flexDirection: 'column'
    } : {};

    const diagramContent = (
        <div
            className={cn(
                isFullScreen ? "animate-in fade-in duration-200" : `bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col my-6 ${className || ''}`,
                isEditMode ? "ring-2 ring-primary-500 ring-offset-2" : ""
            )}
            style={containerStyle}
        >
            {/* Header / Toolbar */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-white shadow-sm z-10 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                        {title && <h3 className="font-bold text-slate-800 text-lg">{title}</h3>}

                        {/* Level Counter Badge */}
                        <div className={cn(
                            "px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border flex items-center gap-1.5 shadow-sm",
                            currentLevel >= 3
                                ? "bg-amber-100 text-amber-700 border-amber-200 animate-pulse"
                                : "bg-indigo-50 text-indigo-600 border-indigo-100"
                        )}>
                            <div className={cn("w-1.5 h-1.5 rounded-full", currentLevel >= 3 ? "bg-amber-500" : "bg-indigo-500")}></div>
                            Nivel {currentLevel}
                        </div>
                    </div>
                    {description && !isFullScreen && <p className="text-sm text-slate-500 truncate max-w-md">{description}</p>}
                </div>
                <div className="flex items-center gap-2">
                    {/* Edit Mode Toggle */}
                    <button
                        onClick={handleEditToggle}
                        className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                            isEditMode
                                ? "bg-primary-600 text-white shadow-md hover:bg-primary-700"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        )}
                        title={isEditMode ? "Finish Editing" : "Edit Diagram"}
                    >
                        {isEditMode ? <Save className="h-4 w-4" /> : <Edit3 className="h-4 w-4" />}
                        {isEditMode ? "Done" : "Edit"}
                    </button>

                    {/* Edit-mode action buttons */}
                    {isEditMode && (
                        <div className="flex items-center gap-1 ml-1 mr-2">
                            {/* Connect Mode */}
                            <button
                                onClick={() => {
                                    const next = !isConnectMode;
                                    setIsConnectMode(next);
                                    if (next) { setIsDeleteEdgeMode(false); }
                                    if (!next) setConnectSource(null);
                                }}
                                className={cn(
                                    "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all",
                                    isConnectMode
                                        ? "bg-indigo-600 text-white shadow-md"
                                        : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                                )}
                                title="Modo Conectar: clic en origen → clic en destino"
                            >
                                <Plus className="h-3.5 w-3.5" />
                                Línea
                            </button>

                            {/* Reconnect Edge Mode */}
                            <button
                                onClick={() => {
                                    const next = !isReconnectMode;
                                    setIsReconnectMode(next);
                                    if (next) { setIsConnectMode(false); setIsDeleteEdgeMode(false); setConnectSource(null); }
                                }}
                                className={cn(
                                    "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all",
                                    isReconnectMode
                                        ? "bg-violet-600 text-white shadow-md"
                                        : "bg-violet-50 text-violet-700 hover:bg-violet-100"
                                )}
                                title="Modo Mover: arrastrá el extremo de una línea para reconectarla"
                            >
                                <Link2 className="h-3.5 w-3.5" />
                                Mover
                            </button>

                            {/* Delete Edge Mode */}
                            <button
                                onClick={() => {
                                    const next = !isDeleteEdgeMode;
                                    setIsDeleteEdgeMode(next);
                                    if (next) { setIsConnectMode(false); setIsReconnectMode(false); setConnectSource(null); }
                                }}
                                className={cn(
                                    "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all",
                                    isDeleteEdgeMode
                                        ? "bg-red-600 text-white shadow-md"
                                        : "bg-red-50 text-red-700 hover:bg-red-100"
                                )}
                                title="Modo Cortar: clic en una línea para eliminarla"
                            >
                                <Minus className="h-3.5 w-3.5" />
                                Cortar
                            </button>

                            {/* Delete selected nodes */}
                            <button
                                onClick={handleDeleteSelected}
                                className="p-1.5 bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                                title="Eliminar nodos seleccionados (Backspace)"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    )}

                    {/* Export group: PNG + BPMN */}
                    <div className="flex bg-slate-100 rounded-lg p-1 gap-0.5">
                        <button
                            onClick={handleDownloadImage}
                            className="p-2 hover:bg-white hover:shadow-sm rounded-md text-slate-600 transition-all"
                            title="Exportar diagrama completo (PNG)"
                        >
                            <ImageIcon className="h-4 w-4" />
                        </button>
                        <button
                            onClick={handleBpmnExport}
                            className="p-2 hover:bg-white hover:shadow-sm rounded-md text-slate-600 transition-all"
                            title="Exportar como BPMN 2.0 XML (Camunda, Bizagi, Visio)"
                        >
                            <FileCode2 className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="w-px bg-slate-300 h-6 mx-2"></div>

                    {/* AI Analysis group: Gap Analysis + Automation Overlay */}
                    <div className="flex items-center gap-1">
                        <button
                            onClick={handleGapAnalysis}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg text-xs font-semibold transition-all"
                            title="Análisis de Brechas — detecta caminos faltantes y oportunidades de mejora"
                        >
                            <ScanSearch className="h-3.5 w-3.5" />
                            Brechas
                        </button>
                        <button
                            onClick={handleAutomationToggle}
                            className={cn(
                                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all",
                                isAutomationOverlay
                                    ? "bg-emerald-600 text-white shadow-md"
                                    : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            )}
                            title="Potencial de Automatización — colorea nodos por nivel de automatizabilidad"
                        >
                            <Zap className="h-3.5 w-3.5" />
                            {isAutomationOverlay ? 'Ocultar' : 'Automatización'}
                        </button>
                    </div>

                    <div className="w-px bg-slate-300 h-6 mx-2"></div>

                    <button
                        onClick={() => setIsFullScreen(!isFullScreen)}
                        className={`p-2 rounded-lg transition-colors ${isFullScreen ? 'bg-primary-100 text-primary-700' : 'hover:bg-slate-100 text-slate-600'}`}
                        title={isFullScreen ? "Exit Full Screen" : "Full Screen"}
                    >
                        {isFullScreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
                    </button>
                </div>
            </div>

            {/* Discoverability Banner */}
            <div className="bg-gradient-to-r from-primary-50 to-indigo-50 border-b border-indigo-100 px-4 py-2 flex items-center justify-between shrink-0 animate-in slide-in-from-top duration-500">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-white rounded-full shadow-sm">
                        <Lightbulb className="h-4 w-4 text-primary-600 animate-pulse" />
                    </div>
                    <div>
                        <span className="text-xs font-bold text-indigo-900">TIP DE INTELIGENCIA:</span>
                        <span className="text-xs text-indigo-700 ml-2">Haz <b>Clic Derecho</b> en cualquier nodo para Expandir Sub-Procesos, Analizar Riesgos o Generar Checklists. Para editar nodos y conexiones, presiona <b>EDITAR</b>.</span>
                    </div>
                </div>
                {!isFullScreen && (
                    <div className="text-[10px] font-bold text-indigo-400 bg-indigo-100/50 px-2 py-0.5 rounded uppercase tracking-wider">
                        Power by Gemini 1.5
                    </div>
                )}
            </div>

            {/* Automation Overlay Legend */}
            {isAutomationOverlay && (
                <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2 flex items-center gap-4 shrink-0 animate-in slide-in-from-top duration-300">
                    <Zap className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span className="text-xs font-bold text-emerald-800">Potencial de Automatización:</span>
                    <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1.5 text-xs text-slate-700">
                            <span className="px-1.5 py-0.5 bg-emerald-500 text-white rounded-full text-[8px] font-black">AUTO</span>
                            Automatizable 100%
                        </span>
                        <span className="flex items-center gap-1.5 text-xs text-slate-700">
                            <span className="px-1.5 py-0.5 bg-amber-400 text-white rounded-full text-[8px] font-black">MIX</span>
                            Híbrido (parcial)
                        </span>
                        <span className="flex items-center gap-1.5 text-xs text-slate-700">
                            <span className="px-1.5 py-0.5 bg-slate-400 text-white rounded-full text-[8px] font-black">MAN</span>
                            Requiere persona
                        </span>
                    </div>
                    <button onClick={() => setIsAutomationOverlay(false)} className="ml-auto text-emerald-500 hover:text-emerald-700 transition-colors">
                        <X className="h-3.5 w-3.5" />
                    </button>
                </div>
            )}

            {/* Main Content Area (Flex Row) */}
            <div className="flex flex-1 min-h-0 relative">
                {/* Sidebar (Only in Edit Mode) */}
                {isEditMode && (
                    <Sidebar
                        isConnectMode={isConnectMode}
                        onToggleConnect={() => {
                            const next = !isConnectMode;
                            setIsConnectMode(next);
                            if (next) { setIsDeleteEdgeMode(false); setIsReconnectMode(false); }
                            if (!next) setConnectSource(null);
                        }}
                        connectSource={connectSource}
                        isReconnectMode={isReconnectMode}
                        onToggleReconnect={() => {
                            const next = !isReconnectMode;
                            setIsReconnectMode(next);
                            if (next) { setIsConnectMode(false); setIsDeleteEdgeMode(false); setConnectSource(null); }
                        }}
                        isDeleteEdgeMode={isDeleteEdgeMode}
                        onToggleDeleteEdge={() => {
                            const next = !isDeleteEdgeMode;
                            setIsDeleteEdgeMode(next);
                            if (next) { setIsConnectMode(false); setIsReconnectMode(false); setConnectSource(null); }
                        }}
                    />
                )}

                {/* Diagram Area */}
                <div className={`${isFullScreen ? "flex-1 min-h-0" : "h-[600px]"} flex-1 relative bg-slate-50`} ref={flowRef}>
                    <ReactFlow
                        nodes={displayNodes}
                        edges={displayEdges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={isEditMode && !isConnectMode && !isReconnectMode ? onConnect : undefined}
                        onDragOver={isEditMode ? onDragOver : undefined}
                        onDrop={isEditMode ? onDrop : undefined}
                        onNodeDoubleClick={isEditMode && !isConnectMode && !isReconnectMode ? onNodeDoubleClick : undefined}
                        onNodeClick={isConnectMode ? onNodeClick : undefined}
                        onEdgeClick={onEdgeClick}
                        onNodeContextMenu={onNodeContextMenu}
                        onPaneClick={onPaneClick}
                        nodeTypes={nodeTypes}
                        fitView
                        attributionPosition="bottom-right"
                        minZoom={0.1}
                        maxZoom={4}
                        snapToGrid={true}
                        snapGrid={[15, 15]}
                        nodesDraggable={isEditMode && !isConnectMode && !isReconnectMode}
                        nodesConnectable={isEditMode && !isConnectMode && !isReconnectMode}
                        elementsSelectable={true}
                        deleteKeyCode={isEditMode && !isConnectMode && !isReconnectMode && !isDeleteEdgeMode ? ['Backspace', 'Delete'] : []}
                        edgesUpdatable={isReconnectMode}
                        onReconnect={isReconnectMode ? handleEdgeReconnect : undefined}
                        style={{ cursor: isConnectMode ? 'crosshair' : isDeleteEdgeMode ? 'not-allowed' : isReconnectMode ? 'grab' : undefined }}
                    >
                        <Background color="#cbd5e1" gap={20} size={1} />
                        <Controls className="bg-white shadow-lg border border-slate-200 rounded-lg overflow-hidden !left-4 !bottom-4" />
                        <MiniMap
                            className="!bottom-4 !right-4 border-2 border-slate-200 rounded-lg shadow-lg overflow-hidden"
                            style={{ width: 200, height: 150 }}
                            nodeColor={(node) => {
                                switch (node.type) {
                                    case 'group': return '#f1f5f9';
                                    case 'start': return '#dcfce7';
                                    case 'end': return '#fee2e2';
                                    default: return '#e2e8f0';
                                }
                            }}
                            maskColor="rgba(248, 250, 252, 0.7)"
                        />
                        {menu && <ContextMenu {...menu} onAction={handleMenuAction} onClose={() => setMenu(null)} />}

                        {/* Connect Mode indicator */}
                        {isConnectMode && (
                            <Panel position="top-center">
                                <div className="flex items-center gap-2 bg-indigo-600 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg animate-in fade-in duration-200">
                                    <div className="w-2 h-2 rounded-full bg-white animate-pulse shrink-0" />
                                    {connectSource
                                        ? <span>Origen: <b>"{connectSource.data.label}"</b> — clic en el nodo destino</span>
                                        : <span>Clic en el nodo de <b>origen</b> de la línea</span>
                                    }
                                    <button
                                        onClick={() => { setIsConnectMode(false); setConnectSource(null); }}
                                        className="ml-1 hover:text-indigo-200 transition-colors"
                                        title="Cancelar"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            </Panel>
                        )}

                        {/* Reconnect Mode indicator */}
                        {isReconnectMode && (
                            <Panel position="top-center">
                                <div className="flex items-center gap-2 bg-violet-600 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg animate-in fade-in duration-200">
                                    <div className="w-2 h-2 rounded-full bg-white animate-pulse shrink-0" />
                                    <span>Arrastrá el extremo de cualquier línea hacia otro nodo</span>
                                    <button
                                        onClick={() => setIsReconnectMode(false)}
                                        className="ml-1 hover:text-violet-200 transition-colors"
                                        title="Cancelar"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            </Panel>
                        )}

                        {/* Delete Edge Mode indicator */}
                        {isDeleteEdgeMode && (
                            <Panel position="top-center">
                                <div className="flex items-center gap-2 bg-red-600 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg animate-in fade-in duration-200">
                                    <div className="w-2 h-2 rounded-full bg-white animate-pulse shrink-0" />
                                    <span>Clic en cualquier línea roja para eliminarla</span>
                                    <button
                                        onClick={() => setIsDeleteEdgeMode(false)}
                                        className="ml-1 hover:text-red-200 transition-colors"
                                        title="Cancelar"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            </Panel>
                        )}

                        {isFullScreen && !isConnectMode && !isDeleteEdgeMode && (
                            <Panel position="top-center" className="bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-slate-200 shadow-sm text-xs font-medium text-slate-500">
                                Press Esc to exit full screen
                            </Panel>
                        )}
                    </ReactFlow>
                </div>
            </div>

            {isFullScreen && description && (
                <div className="p-4 border-t border-slate-200 bg-white shrink-0">
                    <p className="text-sm text-slate-600 max-w-4xl mx-auto text-center">{description}</p>
                </div>
            )}


        </div>
    );

    if (isFullScreen) {
        return createPortal(diagramContent, document.body);
    }

    return (
        <>
            {diagramContent}

            {/* Rename Modal */}
            {editingNode && (
                <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Edit Node Label</h3>
                        <input
                            type="text"
                            value={editLabel}
                            onChange={(e) => setEditLabel(e.target.value)}
                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none mb-6"
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleRename();
                                if (e.key === 'Escape') setEditingNode(null);
                            }}
                        />
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setEditingNode(null)}
                                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRename}
                                className="px-4 py-2 bg-primary-600 text-white hover:bg-primary-700 rounded-lg font-medium transition-colors flex items-center gap-2"
                            >
                                <Check className="h-4 w-4" />
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Intelligence Result Modal */}
            {intelligenceResult && (() => {
                const kind = intelligenceResult.kind;
                const headerGradient = kind === 'risks'
                    ? 'from-rose-600 to-rose-500'
                    : kind === 'checklist'
                    ? 'from-emerald-600 to-emerald-500'
                    : kind === 'gaps'
                    ? 'from-amber-500 to-orange-500'
                    : 'from-indigo-600 to-indigo-500';
                const theadBg = kind === 'risks' ? 'bg-rose-600' : kind === 'checklist' ? 'bg-emerald-600' : kind === 'gaps' ? 'bg-amber-500' : 'bg-indigo-600';
                const h2Color = kind === 'risks' ? 'text-rose-700 border-rose-400' : kind === 'checklist' ? 'text-emerald-700 border-emerald-400' : kind === 'gaps' ? 'text-amber-700 border-amber-400' : 'text-indigo-700 border-indigo-400';
                const bulletColor = kind === 'risks' ? 'bg-rose-400' : kind === 'checklist' ? 'bg-emerald-500' : kind === 'gaps' ? 'bg-amber-400' : 'bg-indigo-400';
                const kindLabel = kind === 'risks' ? 'Análisis de Riesgos' : kind === 'checklist' ? 'Checklist Operativo' : kind === 'gaps' ? 'Análisis de Brechas' : 'Sub-proceso';
                const KindIcon = kind === 'risks' ? ShieldAlert : kind === 'checklist' ? ClipboardCheck : kind === 'gaps' ? ScanSearch : RefreshCw;
                // Strip prefix from title for the headline
                const nodeTitle = intelligenceResult.title.replace(/^(Risk Analysis|Checklist|Sub-process \(\d+\)):\s*/i, '');

                const mdComponents: object = {
                    h1: ({ children }: any) => (
                        <h1 className="text-2xl font-black text-slate-900 mb-6 pb-3 border-b-2 border-slate-200">{children}</h1>
                    ),
                    h2: ({ children }: any) => (
                        <h2 className={`text-base font-bold mb-2 mt-6 pl-3 border-l-4 ${h2Color}`}>{children}</h2>
                    ),
                    h3: ({ children }: any) => (
                        <h3 className="text-sm font-semibold text-slate-800 mb-2 mt-4">{children}</h3>
                    ),
                    p: ({ children }: any) => (
                        <p className="text-sm text-slate-700 leading-relaxed mb-3">{children}</p>
                    ),
                    ul: ({ children }: any) => <ul className="my-2 space-y-1.5">{children}</ul>,
                    ol: ({ children }: any) => <ol className="my-2 space-y-1.5 list-none">{children}</ol>,
                    li: ({ children }: any) => (
                        <li className="flex items-start gap-2.5 text-sm text-slate-700">
                            <span className={`mt-2 w-1.5 h-1.5 rounded-full ${bulletColor} shrink-0`} />
                            <span className="leading-relaxed">{children}</span>
                        </li>
                    ),
                    strong: ({ children }: any) => (
                        <strong className="font-semibold text-slate-900">{children}</strong>
                    ),
                    hr: () => <hr className="my-6 border-slate-200" />,
                    code: ({ children }: any) => (
                        <code className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-xs font-mono">{children}</code>
                    ),
                    blockquote: ({ children }: any) => (
                        <blockquote className="pl-4 border-l-4 border-slate-300 text-slate-500 italic my-4 text-sm">{children}</blockquote>
                    ),
                    table: ({ children }: any) => (
                        <div className="overflow-x-auto my-6 rounded-xl border border-slate-200 shadow-sm">
                            <table className="w-full text-sm border-collapse">{children}</table>
                        </div>
                    ),
                    thead: ({ children }: any) => (
                        <thead className={`${theadBg} text-white`}>{children}</thead>
                    ),
                    tbody: ({ children }: any) => (
                        <tbody className="divide-y divide-slate-100 bg-white">{children}</tbody>
                    ),
                    tr: ({ children }: any) => (
                        <tr className="hover:bg-slate-50/80 transition-colors">{children}</tr>
                    ),
                    th: ({ children }: any) => (
                        <th className="px-5 py-3 text-left font-semibold text-xs uppercase tracking-wider whitespace-nowrap">{children}</th>
                    ),
                    td: ({ children }: any) => (
                        <td className="px-5 py-3 text-slate-700 align-top leading-relaxed">{children}</td>
                    ),
                };

                return (
                    <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 p-4">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200 overflow-hidden">

                            {/* Colored Header */}
                            <div className={`flex items-center justify-between px-6 py-4 shrink-0 bg-gradient-to-r ${headerGradient}`}>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white/20 rounded-lg">
                                        <KindIcon className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-white/70 text-[10px] uppercase tracking-widest font-bold mb-0.5">{kindLabel}</p>
                                        <h3 className="text-white font-bold text-base leading-tight">{nodeTitle}</h3>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIntelligenceResult(null)}
                                    className="p-2 hover:bg-white/20 rounded-full transition-colors"
                                >
                                    <X className="h-5 w-5 text-white" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-auto p-8 bg-white">
                                {intelligenceResult.type === 'text' ? (
                                    <div className="max-w-3xl mx-auto">
                                        <ReactMarkdown
                                            remarkPlugins={[remarkGfm]}
                                            components={mdComponents}
                                        >
                                            {(intelligenceResult.content as string).replace(/<br\s*\/?>/gi, '\n\n')}
                                        </ReactMarkdown>
                                    </div>
                                ) : (
                                    <SmartDiagram
                                        data={intelligenceResult.content as DiagramData}
                                        className="h-full border-0 shadow-none"
                                        onConvertToMaster={onConvertToMaster}
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* Loading Overlay */}
            {isLoading && (
                <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-white/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="h-12 w-12 text-primary-500 animate-spin" />
                        <p className="text-lg font-medium text-slate-600">Generating Intelligence...</p>
                    </div>
                </div>
            )}

            {/* Error Toast — auto-dismisses after 8s, dismissible by click */}
            {errorToast && (
                <div className="fixed bottom-6 right-6 z-[100002] max-w-md animate-in slide-in-from-bottom-4 fade-in duration-300">
                    <div className="bg-white rounded-xl shadow-2xl border border-rose-200 overflow-hidden">
                        <div className="bg-gradient-to-r from-rose-500 to-red-500 h-1" />
                        <div className="p-4 flex gap-3">
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center">
                                <AlertCircle className="w-5 h-5 text-rose-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-slate-800 text-sm mb-1">{errorToast.title}</h4>
                                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{errorToast.message}</p>
                            </div>
                            <button
                                onClick={() => setErrorToast(null)}
                                className="flex-shrink-0 p-1 hover:bg-slate-100 rounded transition-colors h-fit"
                                aria-label="Cerrar notificación"
                            >
                                <X className="w-4 h-4 text-slate-400" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Limit Reached Modal */}
            {limitReachedNode && (
                <div className="fixed inset-0 z-[100001] flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-300 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-8 text-white text-center relative">
                            <div className="absolute top-4 right-4">
                                <button onClick={() => setLimitReachedNode(null)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                            <div className="bg-white/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm border border-white/30">
                                <AlertCircle className="h-10 w-10 text-white" />
                            </div>
                            <h3 className="text-2xl font-bold mb-2">Límite de Profundidad</h3>
                            <p className="text-orange-50 text-sm leading-relaxed">
                                Has alcanzado el nivel 3 de profundidad. Por arquitectura y claridad, es momento de modularizar este proceso.
                            </p>
                        </div>

                        <div className="p-8">
                            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mb-6">
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <Info className="h-3 w-3" /> Recomendación del Arquitecto
                                </h4>
                                <p className="text-sm text-slate-600 leading-relaxed italic">
                                    "La complejidad excesiva en un solo diagrama oculta riesgos. Modularizar este paso lo convertirá en un nuevo proceso maestro independiente, manteniendo la trazabilidad y facilitando el mantenimiento."
                                </p>
                            </div>

                            <div className="space-y-3">
                                <button
                                    onClick={() => {
                                        console.log(`DEBUG: Convert button clicked. Node: ${limitReachedNode?.data?.label}, has callback: ${!!onConvertToMaster}`);
                                        if (onConvertToMaster) {
                                            onConvertToMaster(limitReachedNode);
                                        } else {
                                            console.error("DEBUG: onConvertToMaster is MISSING in this SmartDiagram instance!");
                                            alert("Error: Callback configuration is missing. Please refresh.");
                                        }
                                        setLimitReachedNode(null);
                                    }}
                                    className="w-full py-4 bg-primary-600 text-white rounded-xl font-bold shadow-lg shadow-primary-200 hover:bg-primary-700 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3 group"
                                >
                                    <RefreshCw className="h-5 w-5 group-hover:rotate-180 transition-transform duration-500" />
                                    Convertir en Proceso Maestro
                                </button>
                                <button
                                    onClick={() => setLimitReachedNode(null)}
                                    className="w-full py-3 bg-white text-slate-500 border border-slate-200 rounded-xl font-medium hover:bg-slate-50 transition-colors"
                                >
                                    Entendido, continuar editando
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

// Wrapper to provide ReactFlow context and Error Boundary
export const SmartDiagram: React.FC<SmartDiagramProps> = (props) => {
    const [hasError, setHasError] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const handleDiagramError = useCallback((err: Error) => {
        setHasError(true);
        setErrorMessage(err.message);
        loggingService.logError('SmartDiagram', 'Render Error', { error: err.message }, 'system');
    }, []);

    if (hasError) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center my-6">
                <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                <h3 className="text-red-800 font-semibold">Something went wrong</h3>
                <p className="text-red-600 text-sm">{errorMessage}</p>
                <button
                    onClick={() => setHasError(false)}
                    className="mt-4 text-sm text-red-700 underline hover:text-red-900"
                >
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <DiagramErrorBoundary onError={handleDiagramError}>
            <ReactFlowProvider>
                <SmartDiagramContent {...props} />
            </ReactFlowProvider>
        </DiagramErrorBoundary>
    );
};
