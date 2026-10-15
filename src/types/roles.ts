export interface RoleConfig {
    roleId: string;
    displayName: string;
    description: string;
    systemPrompt: string;
    model: string;
    aiModel?: string; // Optional: specific AI model for this role (e.g., 'claude-haiku-4-5-20251001'). Falls back to default from AdminConsole.
    temperature: number;
    orderIndex: number;
    isEnabled: boolean;
    grounding?: boolean; // New flag for Google Search
    gender?: 'male' | 'female';
    imageUrl?: string; // ✅ FINAL UX POLISH: Avatar image URL

    // Audit fields for Database-First architecture
    updatedAt?: string;      // ISO timestamp of last update
    updatedBy?: string;      // Email of user who made the update
    version?: number;        // Incremental version number
    changelog?: string;      // Optional description of changes

    docConfig: {
        text: boolean;
        charts: boolean;
        excel: boolean;
        flowDiagrams: boolean;
        swimlanes: boolean;
        c4: boolean;
        architecture: boolean;
        pdf: boolean;
        ppt: boolean;
        json: boolean;
        markdown: boolean;
        otherFormats: string[];
        discovery?: boolean;
        userStories?: boolean;
        marketing?: boolean;
        matrix?: boolean;
    };
}
