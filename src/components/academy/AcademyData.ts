// Modular Feature System for PILOT ACADEMY
// Each feature can be registered independently for easy expansion

export type FeatureCategory = 'core' | 'advanced' | 'collaboration' | 'export';

export interface FeatureModule {
    id: string;
    title: string;
    subtitle: string;
    category: FeatureCategory;
    icon: string; // lucide icon name
    demoComponent: string; // Component name to render
    duration: number; // seconds
    order: number;
}

// Core Platform Journey
export const ACADEMY_MODULES: FeatureModule[] = [
    {
        id: 'inception',
        title: 'Inception',
        subtitle: 'De idea a proyecto en segundos',
        category: 'core',
        icon: 'Sparkles',
        demoComponent: 'InceptionStage',
        duration: 5,
        order: 1
    },
    {
        id: 'strategy-analysis',
        title: 'Análisis Estratégico',
        subtitle: 'IA analiza viabilidad de mercado',
        category: 'core',
        icon: 'Target',
        demoComponent: 'StrategyStage',
        duration: 6,
        order: 2
    },
    {
        id: 'role-factory',
        title: 'La Fábrica de Roles',
        subtitle: '11 especialistas trabajando en paralelo',
        category: 'core',
        icon: 'Users',
        demoComponent: 'RoleFactoryStage',
        duration: 7,
        order: 3
    },
    {
        id: 'ai-consultation',
        title: 'Consulta IA Especializada',
        subtitle: 'Refina con chat inteligente por rol',
        category: 'collaboration',
        icon: 'MessageSquare',
        demoComponent: 'ChatStage',
        duration: 6,
        order: 4
    },
    {
        id: 'prototype-generation',
        title: 'Generación de Prototipo',
        subtitle: 'De wireframes a UI interactiva',
        category: 'advanced',
        icon: 'Palette',
        demoComponent: 'PrototypeStage',
        duration: 5,
        order: 5
    },
    {
        id: 'document-export',
        title: 'Exportación de Documentos',
        subtitle: 'Word, Excel, PPT, PDF al instante',
        category: 'export',
        icon: 'FileDown',
        demoComponent: 'ExportStage',
        duration: 4,
        order: 6
    },
    {
        id: 'war-room',
        title: 'War Room - Gobernanza',
        subtitle: 'Auditoría con el Triángulo de IDEO',
        category: 'advanced',
        icon: 'Shield',
        demoComponent: 'WarRoomStage',
        duration: 8,
        order: 7
    }
];

// Helper to get modules by category
export const getModulesByCategory = (category: FeatureCategory) =>
    ACADEMY_MODULES.filter(m => m.category === category).sort((a, b) => a.order - b.order);

// Helper to get all modules sorted
export const getAllModulesSorted = () =>
    [...ACADEMY_MODULES].sort((a, b) => a.order - b.order);

// Add new feature easily (example):
// ACADEMY_MODULES.push({
//   id: 'new-feature',
//   title: 'New Feature',
//   subtitle: 'Description',
//   category: 'advanced',
//   icon: 'Zap',
//   demoComponent: 'NewFeatureStage',
//   duration: 5,
//   order: 8
// });
