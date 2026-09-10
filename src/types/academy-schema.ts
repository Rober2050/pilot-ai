export type VisualizationType = 'matrix-2x2' | 'bar-chart' | 'process-flow' | 'text-concept' | 'image';

export interface BaseStageConfig {
    id: string;
    title: string;
    subtitle?: string;
    description?: string;
    duration: number; // in seconds
    type: VisualizationType;
}

export interface MatrixDataPoint {
    id: number;
    label: string;
    x: number; // 0-100
    y: number; // 0-100
    color?: 'cyan' | 'purple' | 'emerald' | 'amber' | 'red';
    tooltip?: string;
    category?: string;
}

export interface MatrixStageConfig extends BaseStageConfig {
    type: 'matrix-2x2';
    axes: {
        x: string;
        y: string;
    };
    quadrants: [
        { label: string; color: string },
        { label: string; color: string },
        { label: string; color: string },
        { label: string; color: string }
    ];
    data: MatrixDataPoint[];
}

export interface ChartDataPoint {
    label: string;
    value: number;
    secondaryValue?: string; // e.g. "+50%"
    color?: string;
    heightPercentage?: number;
}

export interface ChartStageConfig extends BaseStageConfig {
    type: 'bar-chart';
    data: ChartDataPoint[];
    yAxisLabels?: string[];
    legend?: { label: string; icon?: string }[];
}

export interface ProcessNode {
    id: string;
    label: string;
    type: 'circle' | 'rect' | 'diamond' | 'database' | 'document';
    icon?: string;
    x: number;
    y: number;
    sublabel?: string;
    color?: string;
}

export interface ProcessConnection {
    from: string;
    to: string;
    label?: string;
    style?: 'solid' | 'dashed';
    color?: string;
}

export interface ProcessStageConfig extends BaseStageConfig {
    type: 'process-flow';
    nodes: ProcessNode[];
    connections: ProcessConnection[];
}

export interface TextStageConfig extends BaseStageConfig {
    type: 'text-concept';
    content: string;
    bullets?: string[];
    highlight?: string;
}

export interface ImageStageConfig extends BaseStageConfig {
    type: 'image';
    url: string; // Base64 data URI
    caption?: string;
    style?: 'cover' | 'contain';
}

export type StageConfig = MatrixStageConfig | ChartStageConfig | ProcessStageConfig | TextStageConfig | ImageStageConfig;

export interface TourConfig {
    id: string;
    role: string;
    title: string | { en: string; es: string }; // Support both formats for backward compatibility
    description?: string | { en: string; es: string };
    icon: string; // Lucide icon name
    theme: {
        primary: string;
        secondary: string;
        gradient: string;
    };
    layout?: 'sidebar' | 'fullscreen'; // Default: sidebar
    stages: StageConfig[];
}
