// DEFINICIÓN DE TIPOS PARA LA WAR ROOM (OVERMIND)

export type WarRoomPhase = 'DIVERGENCE' | 'NEGOTIATION' | 'RESOLUTION';

/**
 * Source citation for transparency and credibility
 */
export interface SourceCitation {
    claim: string;           // What is being claimed
    source: string;          // Name of source (e.g., "Gartner Report 2024")
    url?: string;            // URL if available
    tier: 1 | 2 | 3 | 4;     // Credibility tier (1=highest, 4=lowest)
    year: number;            // Publication year
}

export type RoleId = string; // Dynamic roles from database

export interface AgentRole {
    id: RoleId;
    name: string;
    bias: string; // La directriz de personalidad "Superdotada"
}

// Estructura estricta del JSON que debe devolver la IA
export interface SimulationResponse {
    simulation_thought: string; // "CALCULANDO ROI..."
    public_message: string;     // El argumento principal

    // CRITICAL: Sincronizado con warRoomPrompts.ts METRICS_DEFINITION
    // [0: Security/Risk, 1: Market Viability, 2: Tech Feasibility, 3: Budget Efficiency]
    chart_update: [number, number, number, number];

    // NEW: Source citations for transparency
    sources?: SourceCitation[];

    // Visual artifact for diagrams/charts rendered in chat
    visual_artifact?: { type: string; data: any };
}

export interface ChatMessage {
    id: string;
    roleId: RoleId | 'system' | 'user'; // 'system' para eventos globales
    roleName: string;
    text: string;
    timestamp: number;
    thought?: string; // Pensamiento oculto simulado (visible solo en modo debug o admin)
    phase?: WarRoomPhase;
    isDownloadable?: boolean; // Para soportar archivos como el PDF que agregamos en UI
    visual_artifact?: { type: string, data: any }; // Renderizador visual
}

export interface FinalManifesto {
    decision: string;
    summary?: string; // Executive summary
    tradeOffs: string[];
    risks: string[];
    roadmap: string[];
}

// Asumo que este archivo existe en tu estructura local
import { RoleConfig } from './roles';

export interface WarRoomState {
    status: 'setup' | 'active' | 'completed' | 'debrief';
    phase: WarRoomPhase;
    turnCount: number;
    activeRoles: RoleConfig[];

    // MEJORA: Tipado estricto (Tuple) para evitar errores de renderizado en el gráfico
    chartData: [number, number, number, number];

    history: ChatMessage[];
    finalReport?: FinalManifesto;

    // Config Fields
    missionTopic?: string;
    aiMode?: string;

    // ✅ BATCH 8: Barge-In & Priority Architecture
    isPaused?: boolean;                        // Debate frozen while user speaks
    lastInputSource?: 'text' | 'voice';        // Track input source for forced TTS
}