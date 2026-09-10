/**
 * TypeScript interfaces and types for Hologram system
 * Provides type safety and documentation for hologram components
 */

export interface HologramPosition {
    x: string;
    y: number;
    z: string;
    scale: number;
    facing: 'front' | 'left' | 'right';
}

export interface HologramColors {
    primary: string;
    gradient: string;
    glow: string;
}

export type HologramState = 'idle' | 'active' | 'thinking' | 'speaking';

export interface HologramErrorContext {
    component: string;
    roleId: string;
    position: HologramPosition;
    timestamp: number;
    error?: Error;
}

export interface BodyProportions {
    headHeight: number;
    neckHeight: number;
    torsoHeight: number;
    legsHeight: number;
    armLength: number;
    shoulderWidth: number;
}

export interface SVGPaths {
    head: string;
    neck: string;
    torso: string;
    leftArm: string;
    rightArm: string;
    leftLeg: string;
    rightLeg: string;
}

export interface HumanFigureProps {
    facing: 'front' | 'left' | 'right';
    isSeated: boolean;
    scale: number;
    color: string;
    isActive: boolean;
    onError?: (error: Error) => void;
}

export interface LayerConfig {
    upperBody: React.ReactNode;
    lowerBody: React.ReactNode;
    tableZIndex: number;
}
