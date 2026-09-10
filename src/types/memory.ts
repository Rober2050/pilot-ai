/**
 * Memory Management Types for War Room 2.0
 * 
 * Implements Long-Term Memory and Topic Closure
 */

export interface Topic {
    id: string;
    title: string;
    summary: string;
    conclusion: string;
    timestamp: number;
    tokenCount: number;
    participants: string[]; // Role IDs that participated
    turnCount: number; // Number of turns in this topic
}

export interface LongTermMemory {
    topics: Topic[];
    totalTokens: number;
    currentTopicId?: string; // ID of the active topic
}

export interface TopicClosureDecision {
    shouldClose: boolean;
    reason: string;
    confidence: number; // 0-100
}

export interface MemorySnapshot {
    shortTermHistory: any[]; // Current debate messages
    longTermMemory: LongTermMemory;
    timestamp: number;
}
