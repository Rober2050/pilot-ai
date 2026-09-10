// Academy Content Types
export interface AcademyContent {
    contentId: string;
    type: 'tour' | 'role-explainer' | 'custom';

    // Metadata
    title: {
        en: string;
        es: string;
    };
    subtitle: {
        en: string;
        es: string;
    };
    icon: string; // Lucide icon name
    category: 'core' | 'roles' | 'advanced';
    orderIndex: number;
    isEnabled: boolean;

    // Role-specific
    roleId?: string; // Links to ai_roles
    tourConfig?: any; // TourConfig from academy-schema (using any to avoid circular deps if needed, otherwise import)

    // Content
    content: {
        en: AcademyContentData;
        es: AcademyContentData;
    };

    // Metadata
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
}

export interface AcademyContentData {
    methodology: string; // Main description
    keyPoints: string[]; // Bullet points
    visualDemo?: VisualDemo; // Optional visualization
}

export interface VisualDemo {
    type: 'chart' | 'matrix' | 'diagram' | 'animation';
    title: string;
    data: any; // Flexible structure based on type
}

// For the selection modal
export interface AcademyCard {
    id: string;
    type: 'tour' | 'role-explainer' | 'custom';
    title: string;
    subtitle: string;
    icon: string;
    category: string;
    orderIndex: number;
    onClick: () => void;
}
