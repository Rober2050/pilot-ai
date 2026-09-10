/**
 * Sanitizes data for Firestore to prevent "Nested arrays are not supported" errors.
 * Recursively traverses the object and converts nested arrays to objects.
 */
export const sanitizeForFirestore = (data: any): any => {
    if (data === null || data === undefined) return data;

    if (Array.isArray(data)) {
        // Check if any element is an array (which would make this a nested array)
        // We only care if the item ITSELF is an array. Objects inside are fine.
        const hasNestedArray = data.some(item => Array.isArray(item));

        if (hasNestedArray) {
            console.warn("Detected nested array in Firestore data. Converting to objects to prevent crash.");
            // Convert array of arrays to array of objects
            // Example: [[1, 2], [3, 4]] -> [{ "0": 1, "1": 2 }, { "0": 3, "1": 4 }]
            return data.map((item) => {
                if (Array.isArray(item)) {
                    // Convert array to object with index keys
                    return { ...item };
                }
                return sanitizeForFirestore(item);
            });
        }

        // Recursively sanitize elements
        return data.map(item => sanitizeForFirestore(item));
    }

    if (typeof data === 'object') {
        const sanitized: any = {};
        for (const [key, value] of Object.entries(data)) {
            sanitized[key] = sanitizeForFirestore(value);
        }
        return sanitized;
    }

    return data;
};
