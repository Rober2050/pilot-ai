export interface ValidationResult {
    valid: boolean;
    error?: string;
    errorCode?: 'SIZE_EXCEEDED' | 'INVALID_TYPE' | 'CORRUPTED_FILE' | 'PROCESSING_ERROR';
}

export interface PDFMetadata {
    fileName: string;
    pageCount: number;
    wordCount: number;
    sizeBytes: number;
    sizeMB: number;
}

export interface ProcessedPDFContent {
    fullText: string;
    summary: string;
    metadata: PDFMetadata;
    isScanned: boolean;
    processingTime: number;
    method: 'native' | 'ocr';
}

export interface PDFProcessorConfig {
    maxSizeMB: number;
    enableOCR: boolean;
    summaryMaxWords: number;
    ocrProvider: 'gemini-vision';
}

export interface SmartSummaryOptions {
    maxWords?: number;
    language?: 'en' | 'es';
    focusAreas?: string[];
}
