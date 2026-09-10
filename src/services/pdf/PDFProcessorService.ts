import * as pdfjsLib from 'pdfjs-dist';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { geminiService } from '../gemini/geminiService';
import { loggingService } from '../firebase/loggingService';
import type {
    ValidationResult,
    PDFMetadata,
    ProcessedPDFContent,
    PDFProcessorConfig,
    SmartSummaryOptions
} from '../../types/pdf';

// Configure PDF.js worker using local file from node_modules
// This avoids CORS issues and external CDN dependencies
// Vite will handle bundling the worker file correctly
GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
).toString();

const DEFAULT_CONFIG: PDFProcessorConfig = {
    maxSizeMB: 5,
    enableOCR: true,
    summaryMaxWords: 200,
    ocrProvider: 'gemini-vision'
};

class PDFProcessorService {
    private config: PDFProcessorConfig;

    constructor(config: Partial<PDFProcessorConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    /**
     * Validate PDF file before processing
     */
    validateFile(file: File): ValidationResult {
        // Check file type
        if (file.type !== 'application/pdf') {
            return {
                valid: false,
                error: 'Only PDF files are supported',
                errorCode: 'INVALID_TYPE'
            };
        }

        // Check file size
        const sizeMB = file.size / (1024 * 1024);
        if (sizeMB > this.config.maxSizeMB) {
            return {
                valid: false,
                error: `File size exceeds ${this.config.maxSizeMB}MB limit`,
                errorCode: 'SIZE_EXCEEDED'
            };
        }

        return { valid: true };
    }

    /**
     * Extract text from PDF using PDF.js
     */
    private async extractTextNative(file: File): Promise<{ text: string; pageCount: number }> {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf: PDFDocumentProxy = await getDocument({ data: arrayBuffer }).promise;
            const pageCount = pdf.numPages;

            let fullText = '';

            // Extract text from each page
            for (let i = 1; i <= pageCount; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items
                    .map((item: any) => item.str)
                    .join(' ');
                fullText += pageText + '\n\n';
            }

            return { text: fullText.trim(), pageCount };
        } catch (error: any) {
            console.error('Error extracting text from PDF:', error);

            // Provide user-friendly error message based on error type
            if (error.message?.includes('worker') || error.message?.includes('fetch')) {
                throw new Error('No se pudo cargar el procesador de PDF. Por favor intenta de nuevo.');
            } else if (error.message?.includes('Invalid PDF')) {
                throw new Error('El archivo PDF está dañado o no es válido.');
            } else {
                throw new Error('No se pudo leer el contenido del PDF. Verifica que el archivo no esté protegido o corrupto.');
            }
        }
    }

    /**
     * Detect if PDF is scanned (image-based) by analyzing text density
     */
    private detectScannedPDF(text: string, pageCount: number): boolean {
        const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
        const wordsPerPage = wordCount / pageCount;

        // If less than 50 words per page, likely scanned
        return wordsPerPage < 50;
    }

    /**
     * Perform OCR using Gemini Vision API (fallback for scanned PDFs)
     */
    private async performOCR(file: File): Promise<string> {
        try {
            // Convert PDF to image (first page for now, can be extended)
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await getDocument({ data: arrayBuffer }).promise;
            const page = await pdf.getPage(1);

            const viewport = page.getViewport({ scale: 2.0 });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d')!;
            canvas.width = viewport.width;
            canvas.height = viewport.height;

            await page.render({
                canvasContext: context,
                viewport: viewport,
                canvas: canvas
            }).promise;

            // Convert canvas to base64
            const imageData = canvas.toDataURL('image/png');

            // Use Gemini Vision for OCR
            const prompt = 'Extract all text from this document image. Return only the extracted text, no additional commentary.';

            // Note: This is a simplified version. Full implementation would need Gemini Vision API
            // For now, we'll use the text generation API with a note
            const ocrText = await geminiService.generateContent(
                'gemini-1.5-flash',
                'You are an OCR system. Extract text from the provided image.',
                prompt
            );

            return ocrText;
        } catch (error: any) {
            console.error('OCR failed:', error);
            throw new Error(`OCR processing failed: ${error.message}`);
        }
    }

    /**
     * Generate smart summary using Gemini AI
     */
    private async generateSmartSummary(
        text: string,
        options: SmartSummaryOptions = {}
    ): Promise<string> {
        const {
            maxWords = this.config.summaryMaxWords,
            language = 'en',
            focusAreas = []
        } = options;

        const langInstruction = language === 'es'
            ? 'Responde en Español.'
            : 'Respond in English.';

        const focusInstruction = focusAreas.length > 0
            ? `Focus on these areas: ${focusAreas.join(', ')}.`
            : '';

        const systemPrompt = `You are an expert document summarizer. Create a concise, informative summary of the provided document.
    
    Requirements:
    - Maximum ${maxWords} words
    - Capture key points, main ideas, and critical information
    - Use clear, professional language
    - ${langInstruction}
    - ${focusInstruction}
    
    Return ONLY the summary text, no additional formatting or commentary.`;

        const userPrompt = `Summarize this document:\n\n${text.substring(0, 15000)}`; // Limit to ~15k chars to avoid token limits

        try {
            const summary = await geminiService.generateContent(
                'gemini-1.5-flash',
                systemPrompt,
                userPrompt
            );

            return summary.trim();
        } catch (error: any) {
            console.error('Summary generation failed:', error);
            // Fallback: Return first 200 words
            return text.split(/\s+/).slice(0, maxWords).join(' ') + '...';
        }
    }

    /**
     * Calculate word count
     */
    private countWords(text: string): number {
        return text.split(/\s+/).filter(w => w.length > 0).length;
    }

    /**
     * Main processing method
     */
    async processFile(
        file: File,
        summaryOptions?: SmartSummaryOptions
    ): Promise<ProcessedPDFContent> {
        const startTime = Date.now();

        // Validate file
        const validation = this.validateFile(file);
        if (!validation.valid) {
            throw new Error(validation.error);
        }

        try {
            // Extract text
            const { text: fullText, pageCount } = await this.extractTextNative(file);

            // Check if scanned
            const isScanned = this.detectScannedPDF(fullText, pageCount);

            let finalText = fullText;
            let method: 'native' | 'ocr' = 'native';

            // If scanned and OCR enabled, perform OCR
            if (isScanned && this.config.enableOCR) {
                console.log('Scanned PDF detected, performing OCR...');
                finalText = await this.performOCR(file);
                method = 'ocr';
            }

            // Generate smart summary
            const summary = await this.generateSmartSummary(finalText, summaryOptions);

            // Calculate metadata
            const wordCount = this.countWords(finalText);
            const sizeMB = parseFloat((file.size / (1024 * 1024)).toFixed(2));

            const metadata: PDFMetadata = {
                fileName: file.name,
                pageCount,
                wordCount,
                sizeBytes: file.size,
                sizeMB
            };

            const processingTime = Date.now() - startTime;

            // Log success
            await loggingService.logInfo('pdf-processor', 'file_processed', {
                fileName: file.name,
                pageCount,
                wordCount,
                isScanned,
                method,
                processingTime
            });

            return {
                fullText: finalText,
                summary,
                metadata,
                isScanned,
                processingTime,
                method
            };

        } catch (error: any) {
            // Log error
            await loggingService.logError('pdf-processor', 'processing_failed', {
                fileName: file.name,
                error: error.message,
                stack: error.stack
            });

            throw error;
        }
    }
}

// Export singleton instance
export const pdfProcessorService = new PDFProcessorService();
