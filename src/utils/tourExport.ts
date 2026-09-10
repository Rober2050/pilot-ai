import { TourConfig } from '../types/academy-schema';

/**
 * Export a tour configuration as a TypeScript file
 */
export const exportTourToTypeScript = (config: TourConfig): void => {
    // Generate TypeScript code
    const configName = config.id.toUpperCase().replace(/-/g, '_') + '_CONFIG';

    const tsContent = `import { TourConfig } from '../../types/academy-schema';

export const ${configName}: TourConfig = ${JSON.stringify(config, null, 2)};
`;

    // Create blob and download
    const blob = new Blob([tsContent], { type: 'text/typescript' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${config.id}-config.ts`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

/**
 * Parse a TypeScript tour config file and extract the configuration
 */
/**
 * Parse a TypeScript tour config file and extract the configuration
 */
export const importTourFromTypeScript = (fileContent: string): TourConfig | null => {
    try {
        // Find the start of the configuration object
        // Matches: export const NAME = {  OR  export const NAME: TourConfig = {
        const startRegex = /export\s+const\s+\w+(?:\s*:\s*TourConfig)?\s*=\s*(\{)/;
        const match = fileContent.match(startRegex);

        if (!match) {
            throw new Error('Could not find TourConfig export in file');
        }

        const startIndex = match.index! + match[0].length - 1; // Start at the opening '{'

        // Find the last closing brace '}'
        // This assumes the file ends with the object definition, optionally followed by ; and whitespace
        const lastIndex = fileContent.lastIndexOf('}');

        if (lastIndex === -1 || lastIndex <= startIndex) {
            throw new Error('Invalid file format: no closing brace found');
        }

        // Extract the JSON string
        const jsonString = fileContent.substring(startIndex, lastIndex + 1);

        // Parse the JSON
        const config = JSON.parse(jsonString) as TourConfig;

        // Validate required fields
        if (!config.id || !config.role || !config.title || !config.stages) {
            throw new Error('Invalid tour configuration: missing required fields');
        }

        return config;
    } catch (error) {
        console.error('Error parsing TypeScript file:', error);
        return null; // The caller should handle the error (e.g., show an alert)
    }
};

/**
 * Get the localized string from a multilingual field
 */
export const getLocalizedString = (
    value: string | { en: string; es: string } | undefined,
    language: 'en' | 'es',
    fallback: string = ''
): string => {
    if (!value) return fallback;
    if (typeof value === 'string') return value;
    return value[language] || value.en || fallback;
};
