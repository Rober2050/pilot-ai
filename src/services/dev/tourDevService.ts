import { TourConfig } from '../../types/academy-schema';

/**
 * Service to handle developer-only operations like saving tours to disk via Vite middleware
 */
export const tourDevService = {
    /**
     * Saves a tour configuration to disk and registers it in index.ts
     * This ONLY works in development mode with the custom Vite middleware
     */
    saveTourToDisk: async (config: TourConfig): Promise<boolean> => {
        // Double check we are in dev mode before trying
        if (!import.meta.env.DEV) {
            console.warn('saveTourToDisk called in production mode. Ignoring.');
            return false;
        }

        try {
            const configName = config.id.toUpperCase().replace(/-/g, '_') + '_CONFIG';
            const filename = `${config.id}-config.ts`;

            // Generate the TypeScript file content exactly as exportTourToTypeScript does
            const tsContent = `import { TourConfig } from '../../types/academy-schema';

export const ${configName}: TourConfig = ${JSON.stringify(config, null, 2)};
`;

            const response = await fetch('/__api/save-tour', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    filename,
                    content: tsContent,
                    configName
                })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Failed to save tour');
            }

            const data = await response.json();
            return data.success;
        } catch (error) {
            console.error('Failed to auto-save tour:', error);
            alert(`Auto-Save Failed: ${String(error)}. Check console for details.`);
            return false;
        }
    }
};
