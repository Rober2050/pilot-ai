import React, { useMemo } from 'react';
import ReactFlow, {
    Node, Edge, Background, Controls, MarkerType,
    Handle, Position, BackgroundVariant,
    useNodesState, useEdgesState, NodeProps,
} from 'reactflow';
import dagre from 'dagre';
import {
    Database, Key, Table as TableIcon,
    Hash, AlignLeft, Calendar, Type,
    Download, Lock, Zap, Info,
} from 'lucide-react';

// ── Interfaces ────────────────────────────────────────────────────────────────

interface Column {
    name: string;
    type: string;
    pk?: boolean;
    fk?: boolean;
    nullable?: boolean;
    unique?: boolean;
    encrypted?: boolean;  // PII field — should be encrypted at rest
    indexed?: boolean;    // High-traffic field with index recommended
    references?: string;  // explicit FK target table name
    description?: string;
}

interface SchemaTable {
    name: string;
    description?: string;
    columns: Column[];
}

interface SchemaAnalysis {
    storageEngine?: string;       // e.g. "PostgreSQL 15 (AWS RDS)"
    consistencyModel?: string;    // e.g. "Strong Consistency"
    normalization?: string;       // e.g. "3NF with strategic denormalization"
    estimatedCost?: string;       // e.g. "~$45/month on RDS db.t3.medium"
    rationale?: string;           // SQL vs NoSQL justification
    indexingStrategy?: string;    // indexing recommendations
    piiFields?: string[];         // e.g. ["users.email", "users.phone"]
}

interface SchemaVisualizerProps {
    data: {
        tables: SchemaTable[];
        relationships?: Array<{ from: string; to: string; label?: string }>;
        analysis?: SchemaAnalysis;
    };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const ERD_NODE_WIDTH = 240;
const getNodeHeight = (cols: Column[]) => 48 + Math.min(cols.length, 10) * 30 + 8;

const TypeIcon = ({ type }: { type: string }) => {
    const t = (type || '').toLowerCase();
    if (t.includes('int') || t.includes('number') || t.includes('float') || t.includes('decimal') || t.includes('numeric'))
        return <Hash className="w-3 h-3 text-blue-500" />;
    if (t.includes('char') || t.includes('text') || t.includes('string') || t.includes('jsonb') || t.includes('json'))
        return <AlignLeft className="w-3 h-3 text-emerald-500" />;
    if (t.includes('date') || t.includes('time'))
        return <Calendar className="w-3 h-3 text-amber-500" />;
    if (t.includes('bool'))
        return <Type className="w-3 h-3 text-purple-500" />;
    if (t.includes('uuid'))
        return <Hash className="w-3 h-3 text-indigo-400" />;
    return <Type className="w-3 h-3 text-slate-400" />;
};

/** Infer FK target table from a column name like "user_id" → "users" */
const inferFKTarget = (colName: string, tables: SchemaTable[]): string | null => {
    if (!colName.endsWith('_id')) return null;
    const base = colName.slice(0, -3);
    const candidates = [base + 's', base, base + 'es', base.replace(/y$/, 'ies')];
    for (const c of candidates) {
        const found = tables.find(t => t.name.toLowerCase() === c.toLowerCase());
        if (found) return found.name;
    }
    return null;
};

// ── ERD Custom Node — must be defined OUTSIDE any component ──────────────────

const ErdTableNodeInner = ({ data }: NodeProps) => {
    const cols: Column[] = data.columns || [];
    const shown = cols.slice(0, 10);
    const extra = cols.length - 10;

    return (
        <div
            className="bg-white rounded-xl shadow-lg overflow-hidden select-none"
            style={{ width: ERD_NODE_WIDTH, border: '1.5px solid #e2e8f0' }}
        >
            <Handle type="target" position={Position.Top} id="top" style={{ opacity: 0, top: -1 }} />
            <Handle type="target" position={Position.Left} id="left" style={{ opacity: 0, left: -1 }} />
            <Handle type="source" position={Position.Bottom} id="bottom" style={{ opacity: 0, bottom: -1 }} />
            <Handle type="source" position={Position.Right} id="right" style={{ opacity: 0, right: -1 }} />

            {/* Header */}
            <div className="bg-indigo-600 px-3 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                    <TableIcon className="w-3.5 h-3.5 text-white/70 shrink-0" />
                    <span className="font-bold text-white text-sm truncate">{data.name}</span>
                </div>
                <span className="text-[10px] text-white/50 font-mono shrink-0 ml-1">{cols.length}c</span>
            </div>

            {/* Columns */}
            <div className="divide-y divide-slate-50">
                {shown.map((col: Column, i: number) => (
                    <div
                        key={i}
                        className={`px-2.5 py-1.5 flex items-center justify-between gap-1
                            ${col.pk ? 'bg-amber-50/70' : col.fk ? 'bg-indigo-50/40' : ''}`}
                    >
                        {/* Left: PK/FK/dot icon + name */}
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                            {col.pk ? (
                                <Key className="w-3 h-3 text-amber-500 rotate-45 shrink-0" />
                            ) : col.fk ? (
                                <Key className="w-3 h-3 text-indigo-400 rotate-45 shrink-0" />
                            ) : (
                                <div className="w-3 h-3 flex items-center justify-center shrink-0">
                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                                </div>
                            )}
                            <span className={`font-mono text-xs truncate
                                ${col.pk ? 'font-bold text-amber-700' : col.fk ? 'text-indigo-600' : 'text-slate-600'}`}>
                                {col.name}
                            </span>
                        </div>

                        {/* Right: indicators + type */}
                        <div className="flex items-center gap-1 shrink-0">
                            {col.encrypted && (
                                <Lock className="w-2.5 h-2.5 text-rose-400" />
                            )}
                            {col.indexed && (
                                <Zap className="w-2.5 h-2.5 text-amber-400" />
                            )}
                            <span className="flex items-center gap-0.5 text-[10px] text-slate-400 font-mono">
                                <TypeIcon type={col.type} />
                                {col.type.split('(')[0].toLowerCase()}
                            </span>
                        </div>
                    </div>
                ))}
                {extra > 0 && (
                    <div className="px-3 py-1.5 text-[10px] text-slate-400 italic">
                        +{extra} more columns…
                    </div>
                )}
            </div>
        </div>
    );
};

const erdNodeTypes = { erdTable: ErdTableNodeInner };

// ── ERD Layout (dagre) ────────────────────────────────────────────────────────

const buildErdLayout = (
    tables: SchemaTable[],
    explicitRels: Array<{ from: string; to: string; label?: string }>,
) => {
    const g = new dagre.graphlib.Graph();
    g.setDefaultEdgeLabel(() => ({}));
    g.setGraph({ rankdir: 'LR', nodesep: 50, ranksep: 110 });

    tables.forEach(t => {
        g.setNode(t.name, { width: ERD_NODE_WIDTH, height: getNodeHeight(t.columns) });
    });

    const edges: Edge[] = [];
    const addedEdgeKeys = new Set<string>();
    let edgeCounter = 0;

    const addEdge = (from: string, to: string, label: string) => {
        const key = `${from}→${to}`;
        if (addedEdgeKeys.has(key)) return;
        const srcExists = tables.some(t => t.name === from);
        const tgtExists = tables.some(t => t.name === to);
        if (!srcExists || !tgtExists || from === to) return;
        addedEdgeKeys.add(key);
        g.setEdge(from, to);
        edges.push({
            id: `fk-${from}-${to}-${edgeCounter++}`,
            source: from,
            target: to,
            label: label || undefined,
            type: 'smoothstep',
            markerEnd: { type: MarkerType.ArrowClosed, color: '#818cf8' },
            style: { stroke: '#a5b4fc', strokeWidth: 1.5 },
            labelStyle: { fill: '#6366f1', fontSize: 10, fontWeight: 600 },
            labelBgStyle: { fill: '#fff' },
            labelBgPadding: [4, 2] as [number, number],
            labelBgBorderRadius: 4,
        });
    };

    tables.forEach(table => {
        table.columns.forEach(col => {
            if (!col.fk) return;
            const target = col.references || inferFKTarget(col.name, tables);
            if (target) addEdge(table.name, target, col.name.replace(/_id$/, ''));
        });
    });

    explicitRels.forEach(rel => addEdge(rel.from, rel.to, rel.label || ''));

    dagre.layout(g);

    const nodes: Node[] = tables.map(table => {
        const pos = g.node(table.name);
        const h = getNodeHeight(table.columns);
        return {
            id: table.name,
            type: 'erdTable',
            data: { name: table.name, columns: table.columns, description: table.description },
            position: {
                x: pos ? pos.x - ERD_NODE_WIDTH / 2 : 0,
                y: pos ? pos.y - h / 2 : 0,
            },
        };
    });

    return { nodes, edges };
};

// ── ERD View sub-component ────────────────────────────────────────────────────

const ErdView = ({
    tables,
    relationships,
}: {
    tables: SchemaTable[];
    relationships: Array<{ from: string; to: string; label?: string }>;
}) => {
    const { nodes: initNodes, edges: initEdges } = useMemo(
        () => buildErdLayout(tables, relationships),
        [tables, relationships],
    );
    const [nodes, , onNodesChange] = useNodesState(initNodes);
    const [edges, , onEdgesChange] = useEdgesState(initEdges);

    const hasEdges = initEdges.length > 0;

    return (
        <div style={{ height: 540 }} className="rounded-xl border border-slate-200 bg-slate-50/40 overflow-hidden relative">
            {!hasEdges && (
                <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 bg-white border border-amber-200 text-amber-700 text-xs px-3 py-1.5 rounded-lg shadow-sm whitespace-nowrap pointer-events-none">
                    No FK edges detected — ensure FK columns end in <code className="font-mono">_id</code> and include <code className="font-mono">"fk": true</code>
                </div>
            )}
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                nodeTypes={erdNodeTypes}
                fitView
                fitViewOptions={{ padding: 0.18 }}
                minZoom={0.2}
                maxZoom={2}
                attributionPosition="bottom-right"
            >
                <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#cbd5e1" />
                <Controls showInteractive={false} />
            </ReactFlow>
        </div>
    );
};

// ── Export Generators ─────────────────────────────────────────────────────────

const downloadDDL = (tables: SchemaTable[]) => {
    const lines: string[] = [
        '-- Generated by PilotAI Architect',
        `-- Date: ${new Date().toISOString().split('T')[0]}`,
        '',
    ];
    tables.forEach(table => {
        if (table.description) lines.push(`-- ${table.description}`);
        lines.push(`CREATE TABLE ${table.name} (`);
        table.columns.forEach((col, i) => {
            const isLast = i === table.columns.length - 1;
            const parts: string[] = [col.name, col.type.toUpperCase()];
            if (col.pk) parts.push('PRIMARY KEY');
            else if (!col.nullable) parts.push('NOT NULL');
            if (col.unique && !col.pk) parts.push('UNIQUE');
            if (col.fk && col.references) parts.push(`REFERENCES ${col.references}(id)`);
            lines.push(`  ${parts.join(' ')}${isLast ? '' : ','}`);
        });
        lines.push(');', '');
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'schema.sql';
    a.click();
    URL.revokeObjectURL(url);
};

/** Maps SQL types to Prisma field definitions */
const toPrismaFieldType = (col: Column): string => {
    const t = (col.type || '').toUpperCase();

    if (/^VARCHAR\((\d+)\)/.test(t)) {
        const m = t.match(/^VARCHAR\((\d+)\)/);
        return `String   @db.VarChar(${m![1]})`;
    }
    if (/^NUMERIC\((\d+),(\d+)\)/.test(t) || /^DECIMAL\((\d+),(\d+)\)/.test(t)) {
        const m = t.match(/\((\d+),(\d+)\)/);
        return `Decimal  @db.Decimal(${m![1]}, ${m![2]})`;
    }

    const MAP: Record<string, string> = {
        'UUID': 'String   @db.Uuid',
        'TEXT': 'String',
        'BOOLEAN': 'Boolean',
        'BOOL': 'Boolean',
        'INTEGER': 'Int',
        'INT': 'Int',
        'SERIAL': 'Int',
        'BIGINT': 'BigInt',
        'BIGSERIAL': 'BigInt',
        'FLOAT': 'Float',
        'REAL': 'Float',
        'DOUBLE PRECISION': 'Float',
        'JSONB': 'Json     @db.JsonB',
        'JSON': 'Json',
        'DATE': 'DateTime @db.Date',
        'TIMESTAMP': 'DateTime',
        'TIMESTAMPTZ': 'DateTime @db.Timestamptz(3)',
        'NUMERIC': 'Decimal',
        'DECIMAL': 'Decimal',
    };
    return MAP[t] || 'String';
};

/** snake_case → PascalCase for Prisma model names */
const toPascalCase = (s: string) =>
    s.charAt(0).toUpperCase() + s.slice(1).replace(/_([a-z])/g, (_, c) => c.toUpperCase());

const downloadPrisma = (tables: SchemaTable[]) => {
    const lines: string[] = [
        '// Generated by PilotAI Architect',
        `// ${new Date().toISOString().split('T')[0]}`,
        '',
        'generator client {',
        '  provider = "prisma-client-js"',
        '}',
        '',
        'datasource db {',
        '  provider = "postgresql"',
        '  url      = env("DATABASE_URL")',
        '}',
        '',
    ];

    tables.forEach(table => {
        const modelName = toPascalCase(table.name);
        if (table.description) lines.push(`// ${table.description}`);
        lines.push(`model ${modelName} {`);

        table.columns.forEach(col => {
            let fieldType = toPrismaFieldType(col);
            // Make nullable optional
            if (col.nullable && !col.pk) {
                const [base, ...rest] = fieldType.split(/\s+/);
                fieldType = base + '?' + (rest.length ? '  ' + rest.join(' ') : '');
            }

            const decorators: string[] = [];
            if (col.pk) {
                decorators.push('@id');
                if (col.type.toUpperCase() === 'UUID') decorators.push('@default(uuid())');
                if (col.type.toUpperCase() === 'SERIAL') decorators.push('@default(autoincrement())');
            }
            if (col.unique && !col.pk) decorators.push('@unique');
            if (col.indexed && !col.pk && !col.unique) decorators.push('// @index — add @@index([' + col.name + ']) below');

            const nameField = col.name.padEnd(22);
            const line = `  ${nameField}${fieldType}${decorators.length ? '  ' + decorators.join(' ') : ''}`;
            lines.push(line.trimEnd());
        });

        // Relation fields for FKs
        table.columns.forEach(col => {
            if (!col.fk || !col.references) return;
            const relName = col.name.replace(/_id$/, '');
            const refModel = toPascalCase(col.references);
            const relField = relName.padEnd(22);
            lines.push(`  ${relField}${refModel}  @relation(fields: [${col.name}], references: [id])`);
        });

        // Index hints for indexed non-PK columns
        const indexedCols = table.columns.filter(c => c.indexed && !c.pk && !c.unique);
        if (indexedCols.length > 0) {
            lines.push('');
            indexedCols.forEach(c => {
                lines.push(`  @@index([${c.name}])`);
            });
        }

        lines.push('}', '');
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'schema.prisma';
    a.click();
    URL.revokeObjectURL(url);
};

// ── Analysis Panel ────────────────────────────────────────────────────────────

const AnalysisPanel = ({ analysis }: { analysis: SchemaAnalysis }) => (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
        {/* KPI chips row */}
        <div className="flex flex-wrap gap-2">
            {analysis.storageEngine && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-indigo-200 text-indigo-700 text-xs font-medium rounded-lg shadow-sm">
                    <Database className="w-3 h-3" />
                    {analysis.storageEngine}
                </span>
            )}
            {analysis.consistencyModel && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-emerald-200 text-emerald-700 text-xs font-medium rounded-lg shadow-sm">
                    {analysis.consistencyModel}
                </span>
            )}
            {analysis.normalization && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-amber-200 text-amber-700 text-xs font-medium rounded-lg shadow-sm">
                    {analysis.normalization}
                </span>
            )}
            {analysis.estimatedCost && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 text-slate-600 text-xs font-medium rounded-lg shadow-sm font-mono">
                    💰 {analysis.estimatedCost}
                </span>
            )}
        </div>

        {/* Rationale */}
        {analysis.rationale && (
            <div className="flex gap-2 text-xs text-slate-600 leading-relaxed">
                <Info className="w-3.5 h-3.5 text-indigo-400 mt-0.5 shrink-0" />
                <span><strong className="text-slate-700">SQL vs NoSQL:</strong> {analysis.rationale}</span>
            </div>
        )}

        {/* Indexing */}
        {analysis.indexingStrategy && (
            <div className="flex gap-2 text-xs text-slate-600 leading-relaxed">
                <Zap className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                <span><strong className="text-slate-700">Indexing:</strong> {analysis.indexingStrategy}</span>
            </div>
        )}

        {/* PII fields */}
        {analysis.piiFields && analysis.piiFields.length > 0 && (
            <div className="flex gap-2 text-xs text-slate-600 leading-relaxed">
                <Lock className="w-3.5 h-3.5 text-rose-400 mt-0.5 shrink-0" />
                <span>
                    <strong className="text-slate-700">PII / Encrypted:</strong>{' '}
                    {analysis.piiFields.map((f, i) => (
                        <code key={i} className="font-mono bg-rose-50 text-rose-700 px-1 rounded mx-0.5">{f}</code>
                    ))}
                </span>
            </div>
        )}
    </div>
);

// ── Main Component ────────────────────────────────────────────────────────────

export const SchemaVisualizer: React.FC<SchemaVisualizerProps> = ({ data }) => {
    if (!data || !data.tables || !Array.isArray(data.tables)) {
        return (
            <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-100 flex items-center gap-2">
                <Database className="w-5 h-5" />
                <span>Invalid Schema Data: 'tables' array is missing.</span>
            </div>
        );
    }

    const { tables, relationships = [], analysis } = data;

    return (
        <div className="space-y-4">
            {/* ── Toolbar ── */}
            <div className="flex items-center justify-end gap-2">
                <button
                    onClick={() => downloadDDL(tables)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-xs font-medium rounded-lg hover:bg-slate-50 hover:border-indigo-300 hover:text-indigo-700 transition-all shadow-sm"
                >
                    <Download className="w-3.5 h-3.5" />
                    DDL
                </button>
                <button
                    onClick={() => downloadPrisma(tables)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition-all shadow-sm"
                >
                    <Download className="w-3.5 h-3.5" />
                    Prisma Schema
                </button>
            </div>

            {/* ── Analysis panel (when available) ── */}
            {analysis && <AnalysisPanel analysis={analysis} />}

            {/* ── Legend ── */}
            <div className="flex items-center gap-4 text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                    <Key className="w-3 h-3 text-amber-500 rotate-45" /> PK
                </span>
                <span className="flex items-center gap-1">
                    <Key className="w-3 h-3 text-indigo-400 rotate-45" /> FK
                </span>
                <span className="flex items-center gap-1">
                    <Lock className="w-3 h-3 text-rose-400" /> PII / Encrypted
                </span>
                <span className="flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-400" /> Indexed
                </span>
            </div>

            {/* ── ERD (always visible) ── */}
            <ErdView
                key={tables.map(t => t.name).join(',')}
                tables={tables}
                relationships={relationships}
            />
        </div>
    );
};
