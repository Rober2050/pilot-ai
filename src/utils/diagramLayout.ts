import dagre from 'dagre';
import { Node, Edge, Position, MarkerType } from 'reactflow';

export interface DiagramData {
    nodes: Array<{
        id: string;
        label: string;
        type?: string;
        group?: string; // Actor column (swimlane)
        data?: any;
    }>;
    edges: Array<{
        from: string;
        to: string;
        label?: string;
        type?: string;
    }>;
    direction?: 'TB' | 'LR';
}

// ── Layout constants ─────────────────────────────────────────────────────────
const NODE_WIDTH = 170;
const NODE_HEIGHT = 60;
const HEADER_HEIGHT = 48;   // Column header strip height
const COL_WIDTH = 380;  // Wide enough for 2 nodes side-by-side next to a condition diamond
const COL_GAP = 2;    // 2px gap between columns (shared-border look)
const COL_PAD_TOP = 28;   // Space from header bottom to first node
const MIN_V_GAP = NODE_HEIGHT + 52; // Minimum vertical gap between nodes in same column
const MIN_COL_H = 420;  // Minimum column height

/** Accent-color palette for columns — cycles if > 6 actors */
const LANE_COLORS = [
    { accentColor: '#6366f1', headerBg: '#eef2ff', laneBg: 'rgba(248,250,255,0.65)' }, // indigo
    { accentColor: '#10b981', headerBg: '#ecfdf5', laneBg: 'rgba(245,254,252,0.65)' }, // emerald
    { accentColor: '#f59e0b', headerBg: '#fffbeb', laneBg: 'rgba(255,253,245,0.65)' }, // amber
    { accentColor: '#8b5cf6', headerBg: '#f5f3ff', laneBg: 'rgba(250,248,255,0.65)' }, // violet
    { accentColor: '#0ea5e9', headerBg: '#f0f9ff', laneBg: 'rgba(248,252,255,0.65)' }, // sky
    { accentColor: '#f43f5e', headerBg: '#fff1f2', laneBg: 'rgba(255,248,249,0.65)' }, // rose
];

/**
 * BPMN-style swimlane layout — intelligent two-step algorithm:
 *
 * STEP 1 — GLOBAL DAGRE (all nodes + edges together, TB direction)
 *   → Produces a topologically-correct Y position for every node.
 *   → This determines the vertical flow order across ALL actor columns.
 *
 * STEP 2 — COLUMN ASSIGNMENT
 *   → Each node's X is forced to its actor's column center.
 *   → Each column sorts its nodes by their global dagre Y position.
 *   → Minimum vertical spacing prevents intra-column overlaps.
 *   → Nodes use ABSOLUTE canvas positions (no parentNode/extent)
 *     so they can be freely dragged in Edit mode.
 *
 * Cross-lane edges are drawn by ReactFlow using smoothstep routing —
 * they correctly cross column borders to show actor handoffs.
 */
export const getLayoutedElements = (data: DiagramData) => {

    // ── 1. Bucket nodes by actor (group) ─────────────────────────────────────
    const nodesByGroup: Record<string, DiagramData['nodes']> = {};
    const groups: string[] = [];

    data.nodes.forEach(node => {
        const g = node.group || 'default_no_group';
        if (!nodesByGroup[g]) { nodesByGroup[g] = []; groups.push(g); }
        nodesByGroup[g].push(node);
    });

    const colGroups = groups.filter(g => g !== 'default_no_group');

    // ── 2. Global dagre — determines vertical flow order ─────────────────────
    const gDagre = new dagre.graphlib.Graph();
    gDagre.setDefaultEdgeLabel(() => ({}));
    // Swimlane BPMN diagrams always flow top-to-bottom.
    // Free-layout diagrams (C4, ungrouped) respect data.direction.
    const hasSwimlanes = colGroups.length > 0;
    const rankdir = hasSwimlanes ? 'TB' : (data.direction || 'TB');
    const nodesep = hasSwimlanes ? 60 : 100;
    const ranksep = hasSwimlanes ? 100 : 180;
    gDagre.setGraph({ rankdir, nodesep, ranksep });

    data.nodes.forEach(n => gDagre.setNode(n.id, { width: NODE_WIDTH, height: NODE_HEIGHT }));
    (data.edges || []).forEach(e => {
        const srcExists = data.nodes.some(n => n.id === e.from);
        const tgtExists = data.nodes.some(n => n.id === e.to);
        if (srcExists && tgtExists) gDagre.setEdge(e.from, e.to);
    });

    dagre.layout(gDagre);

    // Capture global X and Y for each node
    const globalX: Record<string, number> = {};
    const globalY: Record<string, number> = {};
    data.nodes.forEach(n => {
        const pos = gDagre.node(n.id);
        globalX[n.id] = pos ? pos.x - NODE_WIDTH / 2 : 0;
        globalY[n.id] = pos ? pos.y - NODE_HEIGHT / 2 : 0;
    });

    // ── 3. Column X positions ─────────────────────────────────────────────────
    const colStartX: Record<string, number> = {};
    let runX = 0;
    colGroups.forEach(groupId => {
        colStartX[groupId] = runX;
        runX += COL_WIDTH + COL_GAP;
    });

    // Center X of a node within its column
    const centeredNodeX = (groupId: string) =>
        colStartX[groupId] + Math.floor((COL_WIDTH - NODE_WIDTH) / 2);

    // ── 4. Per-column: sort by global Y, enforce minimum spacing ─────────────
    const finalY: Record<string, number> = {};

    colGroups.forEach(groupId => {
        const nodes = nodesByGroup[groupId] ?? [];
        if (nodes.length === 0) return;

        // Sort by the node's position in the global flow
        const sorted = [...nodes].sort((a, b) => (globalY[a.id] ?? 0) - (globalY[b.id] ?? 0));

        let minNextY = HEADER_HEIGHT + COL_PAD_TOP;
        sorted.forEach(node => {
            // Respect global Y order while enforcing minimum gap
            const desired = Math.max(HEADER_HEIGHT + COL_PAD_TOP, globalY[node.id] ?? 0);
            const y = Math.max(desired, minNextY);
            finalY[node.id] = y;
            minNextY = y + MIN_V_GAP;
        });
    });

    // Ungrouped nodes keep their raw dagre positions
    const ungrouped = nodesByGroup['default_no_group'] ?? [];
    ungrouped.forEach(n => {
        finalY[n.id] = globalY[n.id] ?? 0;
    });

    // ── 5. Diagram total height ───────────────────────────────────────────────
    const maxBottom = Math.max(
        MIN_COL_H,
        ...Object.values(finalY).map(y => y + NODE_HEIGHT + 56),
    );

    // ── 6. Build ReactFlow nodes ──────────────────────────────────────────────
    const finalNodes: Node[] = [];

    // Column background nodes — visual only, non-interactive
    colGroups.forEach((groupId, idx) => {
        const colors = LANE_COLORS[idx % LANE_COLORS.length];
        const isFirst = idx === 0;
        const isLast = idx === colGroups.length - 1;

        finalNodes.push({
            id: groupId,
            type: 'group',
            data: {
                label: groupId,
                accentColor: colors.accentColor,
                headerBg: colors.headerBg,
            },
            position: { x: colStartX[groupId], y: 0 },
            style: {
                width: COL_WIDTH,
                height: maxBottom,
                backgroundColor: colors.laneBg,
                border: '1.5px solid rgba(203,213,225,0.7)',
                borderRadius: [
                    isFirst ? '10px' : '0',
                    isLast ? '10px' : '0',
                    isLast ? '10px' : '0',
                    isFirst ? '10px' : '0',
                ].join(' '),
                zIndex: -1,
                pointerEvents: 'none',
            },
        });
    });

    // Process nodes — absolute canvas positions (no parentNode → freely draggable)
    colGroups.forEach(groupId => {
        (nodesByGroup[groupId] ?? []).forEach(node => {
            finalNodes.push({
                id: node.id,
                type: node.type || 'default',
                data: { ...node.data, label: node.label, description: (node as any).description },
                position: { x: centeredNodeX(groupId), y: finalY[node.id] },
                targetPosition: Position.Top,
                sourcePosition: Position.Bottom,
                style: { width: NODE_WIDTH, height: 'auto' },
            });
        });
    });

    // Ungrouped nodes — use dagre X positions for proper free layout (e.g. C4 diagrams)
    ungrouped.forEach(node => {
        finalNodes.push({
            id: node.id,
            type: node.type || 'default',
            data: { ...node.data, label: node.label, description: (node as any).description },
            position: { x: globalX[node.id] ?? 0, y: finalY[node.id] },
            targetPosition: Position.Top,
            sourcePosition: Position.Bottom,
            style: { width: NODE_WIDTH, height: 'auto' },
        });
    });

    // ── 7. Build ReactFlow edges ──────────────────────────────────────────────
    // Detect if this is a C4-style diagram (ungrouped, no swimlanes)
    const isC4Layout = !hasSwimlanes && ungrouped.length > 0;

    const finalEdges: Edge[] = (data.edges || []).map((edge, edgeIdx) => {
        const srcNode = data.nodes.find(n => n.id === edge.from);
        const tgtNode = data.nodes.find(n => n.id === edge.to);
        const isCondition = srcNode?.type === 'condition';

        const srcGroup = srcNode?.group ?? '';
        const tgtGroup = tgtNode?.group ?? '';
        const isCrossLane = srcGroup !== tgtGroup && srcGroup !== '' && tgtGroup !== '';
        const edgeType = isCrossLane ? 'step' : 'smoothstep';

        // Intelligent handle selection for decision (condition) nodes.
        let sourceHandle = 'bottom';
        if (isCondition) {
            const lbl = (edge.label || '').toString().trim();
            const isSiLabel = /^(s[ií]|yes)(?!\w)/i.test(lbl);
            const isNoLabel = /^no(?!\w)/i.test(lbl);

            if (isSiLabel) {
                sourceHandle = 'si';
            } else if (isNoLabel) {
                sourceHandle = 'no';
            } else if (isCrossLane) {
                const srcIdx = colGroups.indexOf(srcGroup);
                const tgtIdx = colGroups.indexOf(tgtGroup);
                sourceHandle = tgtIdx > srcIdx ? 'si' : 'no';
            }
        }

        // C4 diagrams: smaller labels with background to avoid overlapping nodes
        const labelFontSize = isC4Layout ? 9 : 11;
        const labelColor = isCrossLane ? '#6366f1' : (isC4Layout ? '#475569' : '#64748b');

        return {
            // Append index to guarantee uniqueness when the model emits parallel edges
            // (e.g. two edges from n34 to n35 with different labels). React Flow uses
            // edge.id as the React key; collisions trigger "two children with same key".
            id: `${edge.from}-${edge.to}-${edgeIdx}`,
            source: edge.from,
            target: edge.to,
            sourceHandle,
            targetHandle: 'top',
            label: edge.label,
            type: edgeType,
            animated: edge.type === 'dotted',
            style: {
                ...(edge.type === 'thick' ? { strokeWidth: 2 } : {}),
                ...(isCrossLane ? { stroke: '#6366f1', strokeWidth: 1.5 } : { stroke: '#94a3b8' }),
            },
            labelStyle: {
                fill: labelColor,
                fontWeight: isCrossLane ? 600 : 500,
                fontSize: labelFontSize,
            },
            labelBgStyle: isC4Layout ? { fill: '#ffffff', fillOpacity: 0.9 } : undefined,
            labelBgPadding: isC4Layout ? [6, 3] as [number, number] : undefined,
            labelBgBorderRadius: isC4Layout ? 4 : undefined,
            markerEnd: {
                type: MarkerType.ArrowClosed,
                color: isCrossLane ? '#6366f1' : '#94a3b8',
            },
        };
    });

    return { nodes: finalNodes, edges: finalEdges };
};
