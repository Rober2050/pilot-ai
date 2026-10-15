import { aiService } from '../ai/aiService';
import { audioCompressionService } from './audioCompressionService';

export interface ProcessedMedia {
    file: File;
    url: string; // Blob URL for preview
    base64: string; // Base64 data for API (no prefix)
    mimeType: string;
    type: 'image' | 'audio';
}

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
     * Enterprise-Grade Audio Compression
     * Delegates to AudioCompressionService with adaptive strategy selection
     */
    compressAudio: async (file: File): Promise<File> => {
        const result = await audioCompressionService.compressAudio(file);
        return result.file;
    },

    /**
     * Process Image: Create URL and Base64
     */
    processImage: async (file: File): Promise<ProcessedMedia> => {
        if (!file.type.startsWith('image/')) {
            throw new Error('Invalid file type. Expected image.');
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

    /**
     * Process Audio: Create URL and Base64
     * Uses enterprise-grade audioCompressionService for smart compression
     */
    processAudio: async (file: File): Promise<ProcessedMedia> => {
        if (!file.type.startsWith('audio/')) {
            throw new Error('Invalid file type. Expected audio.');
        }

        let fileToProcess = file;

        // SMART COMPRESSION: Only compress if > 10MB
        // audioCompressionService handles all validation and fallback strategies
        if (file.size > 10 * 1024 * 1024) {
            try {
                const compressionResult = await audioCompressionService.compressAudio(file);
                fileToProcess = compressionResult.file;

                console.log(`[ProcessAudio] Compression: ${compressionResult.strategy}, ` +
                    `${(file.size / 1024 / 1024).toFixed(2)}MB → ${(fileToProcess.size / 1024 / 1024).toFixed(2)}MB`);
            } catch (err: any) {
                // audioCompressionService already logged the error
                // Re-throw typed errors, or wrap generic errors
                throw err;
            }
        }

        // Final sanity check (should never happen with audioCompressionService)
        if (fileToProcess.size > 20 * 1024 * 1024) {
            throw new Error("Audio too large. Please upload < 20MB.");
        }

        const base64 = await mediaProcessorService.fileToBase64(fileToProcess);
        const url = URL.createObjectURL(fileToProcess);

        return {
            file: fileToProcess,
            url,
            base64,
            // Use actual mime type if available, otherwise fallback. 
            // If compressed, audioCompressionService usually returns mp3 or wav.
            // If original, use file custom type or detection.
            mimeType: fileToProcess.type || 'audio/mp3',
            type: 'audio'
        };
    },

    /**
     * Transcribe audio via the AI service
     */
    transcribeAudio: async (media: ProcessedMedia): Promise<string> => {
        try {
            // Using 'claude-haiku-4-5-20251001' explicitly for speed/cost if available, otherwise default
            // We rely on default behavior or pass model name if configurable. 
            // Assuming generic 'claude-haiku-4-5-20251001' availability or relying on auto-resolve.

            const prompt = `CRITICAL TASK: Transcribe this audio file verbatim. 
            - If there are multiple speakers, identify them as 'Speaker 1:', 'Speaker 2:'.
            - Ignore silence and background noise.
            - If the audio is not speech (e.g. music only), return '[NO SPEECH DETECTED]'.
            - Return ONLY the transcription text, no preamble.`;

            // Prepare Generic Media Option
            const options = {
                media: [{
                    mimeType: media.mimeType, // Use the processed mimetype (e.g. audio/mp3)
                    data: media.base64
                }]
            };

            const transcription = await aiService.generateText(
                'claude-haiku-4-5-20251001', // Request Flash specifically for Audio
                'You are a professional transcriber.',
                prompt,
                options
            );

            return transcription;

        } catch (error) {
            console.error("Transcription failed:", error);
            throw new Error("Failed to transcribe audio.");
        }
    },

    /**
     * Generate Smart Summary via the AI service
     */
    generateSmartSummary: async (text: string, language: 'es' | 'en' = 'es'): Promise<string> => {
        try {
            const langInstruction = language === 'es' ? 'Responde en Español.' : 'Reply in English.';

            const systemPrompt = `You are an expert content summarizer. 
            Create a concise, structured summary of the audio transcription.
            - Capture key points and actionable insights.
            - Use bullet points if appropriate.
            - Maximum 200 words.
            - ${langInstruction}`;

            const userPrompt = `Summarize this text:\n\n${text.substring(0, 15000)}`;

            const summary = await aiService.generateText(
                'claude-haiku-4-5-20251001',
                systemPrompt,
                userPrompt
            );

            return summary.trim();

        } catch (error) {
            console.warn("Summary generation failed:", error);
            // Fallback to truncation
            return text.substring(0, 500) + '...';
        }
    }
};
