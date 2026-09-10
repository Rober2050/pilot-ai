import React, { useRef, useState } from 'react';
import { FileText, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { pdfProcessorService } from '../../services/pdf/PDFProcessorService';
import type { ProcessedPDFContent } from '../../types/pdf';

interface FileUploadButtonProps {
    onFileProcessed: (content: ProcessedPDFContent) => void;
    onError: (error: Error) => void;
    disabled?: boolean;
    variant?: 'dark' | 'light';
}

export function FileUploadButton({
    onFileProcessed,
    onError,
    disabled = false,
    variant = 'dark'
}: FileUploadButtonProps) {
    const { t, i18n } = useTranslation('translation');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsProcessing(true);

        try {
            // Validate file
            const validation = pdfProcessorService.validateFile(file);
            if (!validation.valid) {
                throw new Error(validation.error);
            }

            // Process file with language-aware summary
            const currentLang = i18n.language === 'es' ? 'es' : 'en';
            const processedContent = await pdfProcessorService.processFile(file, {
                language: currentLang
            });

            onFileProcessed(processedContent);
        } catch (error: any) {
            console.error('PDF processing error:', error);
            onError(error);
        } finally {
            setIsProcessing(false);
            // Reset input to allow re-uploading the same file
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleClick = () => {
        if (!disabled && !isProcessing) {
            fileInputRef.current?.click();
        }
    };

    return (
        <>
            <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={handleFileSelect}
                className="hidden"
                disabled={disabled || isProcessing}
            />

            <button
                onClick={handleClick}
                disabled={disabled || isProcessing}
                className={`group relative p-3 rounded-full border transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 ${variant === 'light' ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-500 hover:text-slate-700' : 'bg-white/10 hover:bg-white/20 border-white/20'}`}
                title={t('input.uploadPDF', 'Upload PDF')}
            >
                {isProcessing ? (
                    <Loader2 size={20} className={variant === 'light' ? 'text-slate-500 animate-spin' : 'text-white animate-spin'} />
                ) : (
                    <FileText size={20} className={`group-hover:scale-110 transition-transform ${variant === 'light' ? '' : 'text-white'}`} />
                )}

                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                    {isProcessing
                        ? t('input.processingPDF', 'Processing PDF...')
                        : t('input.uploadPDF', 'Upload PDF')
                    }
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900"></div>
                </div>
            </button>
        </>
    );
}
