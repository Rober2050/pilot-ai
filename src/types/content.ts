/**
 * Content Block System Types
 * 
 * Defines the structure for multi-source content management,
 * allowing users to combine text, audio, PDF, and image inputs
 * in a structured, organized way.
 */

export type ContentBlockType = 'text' | 'audio' | 'pdf' | 'image';

export interface ContentBlock {
    /** Unique identifier for the block */
    id: string;

    /** Type of content block */
    type: ContentBlockType;

    /** Main content text */
    content: string;

    /** Optional metadata specific to the block type */
    metadata?: {
        /** Original file name (for audio, PDF, image) */
        fileName?: string;

        /** Duration in seconds (for audio) */
        duration?: number;

        /** Number of pages (for PDF) */
        pages?: number;

        /** File size in bytes */
        size?: number;

        /** Timestamp when block was created */
        timestamp: number;

        /** Format/extension (mp3, pdf, png, etc.) */
        format?: string;

        /** Processing time in milliseconds */
        processingTime?: number;
    };

    /** Whether the block is collapsed (for long content) */
    isCollapsed?: boolean;

    /** Whether the block can be edited by the user */
    isEditable?: boolean;
}

/**
 * Utility function to create a new content block
 */
export function createContentBlock(
    type: ContentBlockType,
    content: string,
    metadata?: Omit<ContentBlock['metadata'], 'timestamp'>
): ContentBlock {
    return {
        id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type,
        content,
        metadata: {
            timestamp: Date.now(),
            ...metadata
        },
        isCollapsed: false,
        isEditable: type === 'text' || type === 'audio' || type === 'pdf'
    };
}

/**
 * Utility function to combine all blocks into a structured prompt for AI
 */
export function combineBlocksForAI(blocks: ContentBlock[]): string {
    if (blocks.length === 0) return '';

    // If only one text block, return it directly
    if (blocks.length === 1 && blocks[0].type === 'text') {
        return blocks[0].content;
    }

    // Multiple blocks: create structured prompt
    let prompt = '=== PROJECT CONTEXT ===\n\n';

    blocks.forEach((block, index) => {
        const separator = index > 0 ? '\n\n' : '';

        switch (block.type) {
            case 'text':
                prompt += `${separator}[USER INPUT]\n${block.content}`;
                break;

            case 'audio':
                const audioLabel = block.metadata?.fileName || 'Audio Transcription';
                prompt += `${separator}[AUDIO TRANSCRIPTION - ${audioLabel}]\n${block.content}`;
                break;

            case 'pdf':
                const pdfLabel = block.metadata?.fileName || 'PDF Document';
                prompt += `${separator}[PDF SUMMARY - ${pdfLabel}]\n${block.content}`;
                break;

            case 'image':
                const imageLabel = block.metadata?.fileName || 'Image';
                prompt += `${separator}[IMAGE DESCRIPTION - ${imageLabel}]\n${block.content}`;
                break;
        }
    });

    prompt += '\n\n=== END OF CONTEXT ===';

    return prompt;
}

/**
 * Utility function to get icon for block type
 */
export function getBlockIcon(type: ContentBlockType): string {
    switch (type) {
        case 'text': return '✍️';
        case 'audio': return '🎵';
        case 'pdf': return '📄';
        case 'image': return '🖼️';
        default: return '📝';
    }
}

/**
 * Utility function to get color class for block type
 */
export function getBlockColorClass(type: ContentBlockType): string {
    switch (type) {
        case 'text': return 'from-slate-500 to-slate-600';
        case 'audio': return 'from-purple-500 to-pink-600';
        case 'pdf': return 'from-blue-500 to-indigo-600';
        case 'image': return 'from-green-500 to-emerald-600';
        default: return 'from-gray-500 to-gray-600';
    }
}
