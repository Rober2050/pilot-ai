export interface ProcessedMedia {
    file: File;
    url: string; // Blob URL for preview
    base64: string; // Base64 data for API (no prefix)
    mimeType: string;
    type: 'image';
}

/** Image formats Claude accepts, and its per-image size limit. */
const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export const mediaProcessorService = {

    /**
     * Converts File to Base64 (raw string without data: prefix)
     */
    fileToBase64: async (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                const result = reader.result as string;
                // Remove data:mime/type;base64, prefix
                const base64 = result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = error => reject(error);
        });
    },

    /**
     * Process Image: Create URL and Base64. Only formats Claude can read are
     * accepted — anything else would be dropped silently on the way to the model.
     */
    processImage: async (file: File): Promise<ProcessedMedia> => {
        if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) {
            throw new Error('Unsupported image format. Use JPG, PNG, GIF or WebP.');
        }
        if (file.size > MAX_IMAGE_BYTES) {
            throw new Error('Image too large. The maximum is 5 MB.');
        }

        const base64 = await mediaProcessorService.fileToBase64(file);
        const url = URL.createObjectURL(file);

        return {
            file,
            url,
            base64,
            mimeType: file.type,
            type: 'image'
        };
    },
};
