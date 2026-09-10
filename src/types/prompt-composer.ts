/**
 * Prompt Composer Types
 * 
 * Types for the Sandwich Method architecture that composes prompts
 * from role base (Firestore) + context modifiers (War Room, Intelligence)
 */

import { MissionManifest } from '../services/ai/DiscoveryAgent';

export interface PromptContext {
    source: 'war-room' | 'intelligence' | 'general';
    mode?: string;
    phase?: string;
    action?: string;
    language?: 'es' | 'en';
    styleInstruction?: string;
    discoveryContext?: string | MissionManifest; // ✅ PHASE 2.5: Accept full manifest or legacy string
}

export interface StyleModifier {
    id: string;
    name: string;
    nameEn: string;
    instruction: string;
    instructionEn: string;
    priority: number;
    icon?: string;
}

export interface WarRoomStyle {
    id: string;
    name: string;
    nameEn: string;
    mode: string; // Relaxed to string to support custom style IDs
    modifier: string;
    modifierEn: string;
    icon: string;
    isEnabled: boolean;
    createdAt: string;
    updatedAt: string;
}
