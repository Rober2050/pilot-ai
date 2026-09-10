/**
 * Tipos para Streaming y Hacker Console
 */

export interface LogEvent {
    timestamp: number;
    agentId: string;
    message: string;
    type: 'thinking' | 'action' | 'result';
}

export interface StreamChunk {
    text: string;
    isComplete: boolean;
    metadata?: {
        tokenCount?: number;
        modelUsed?: string;
    };
}

/**
 * Estado del streaming para la UI
 */
export interface StreamingState {
    isStreaming: boolean;
    logs: LogEvent[];
    currentAgent?: string;
    progress?: number; // 0-100
}
