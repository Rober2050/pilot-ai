export const jsonToYaml = (obj: any, indent = 0): string => {
    const spacing = '  '.repeat(indent);

    if (obj === null) return 'null';
    if (obj === undefined) return '';

    if (typeof obj !== 'object') {
        return String(obj);
    }

    if (Array.isArray(obj)) {
        if (obj.length === 0) return '[]';
        return obj.map(item => {
            if (typeof item === 'object' && item !== null) {
                const itemYaml = jsonToYaml(item, indent + 1).trimStart();
                return `${spacing}- ${itemYaml}`;
            } else {
                return `${spacing}- ${item}`;
            }
        }).join('\n');
    }

    const keys = Object.keys(obj);
    if (keys.length === 0) return '{}';

    return keys.map(key => {
        const value = obj[key];
        if (typeof value === 'object' && value !== null) {
            if (Array.isArray(value) && value.length === 0) {
                return `${spacing}${key}: []`;
            }
            if (Object.keys(value).length === 0) {
                return `${spacing}${key}: {}`;
            }
            return `${spacing}${key}:\n${jsonToYaml(value, indent + 1)}`;
        } else {
            // Handle multiline strings
            if (typeof value === 'string' && value.includes('\n')) {
                const indentedValue = value.split('\n').map(line => `${spacing}  ${line}`).join('\n');
                return `${spacing}${key}: |\n${indentedValue}`;
            }
            return `${spacing}${key}: ${value}`;
        }
    }).join('\n');
};
