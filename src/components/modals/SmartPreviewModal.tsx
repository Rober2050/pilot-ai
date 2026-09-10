import React, { useState } from 'react';
import { X, FileText, ChevronDown, ChevronUp, Edit2, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ProcessedPDFContent } from '../../types/pdf';

interface SmartPreviewModalProps {
    isOpen: boolean;
    content: ProcessedPDFContent;
    onConfirm: (summary: string) => void;
    onCancel: () => void;
}

export function SmartPreviewModal({
    isOpen,
    content,
    onConfirm,
    onCancel
}: SmartPreviewModalProps) {
    const { t } = useTranslation('translation');
    const [isFullContentExpanded, setIsFullContentExpanded] = useState(false);
    const [isEditingSummary, setIsEditingSummary] = useState(false);
    const [editedSummary, setEditedSummary] = useState(content.summary);

    if (!isOpen) return null;

    const handleConfirm = () => {
        onConfirm(isEditingSummary ? editedSummary : content.summary);
    };

    const formatFileSize = (bytes: number): string => {
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    };

    const formatNumber = (num: number): string => {
        return num.toLocaleString();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            {/* Modal Container */}
            <div className="relative w-full max-w-3xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">

                {/* Header */}
                <div className="relative bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5 text-white">
                    <button
                        onClick={onCancel}
                        className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
                        aria-label="Close"
                    >
                        <X size={20} />
                    </button>

                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                            <FileText size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">
                                {t('preview.title', 'PDF Processed Successfully')}
                            </h2>
                            <p className="text-sm text-white/80 mt-0.5">
                                {t('preview.subtitle', 'Review and confirm the extracted content')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="overflow-y-auto max-h-[calc(90vh-180px)] p-6 space-y-6">

                    {/* Metadata Stats */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                            <div className="text-2xl font-bold text-indigo-600">
                                {content.metadata.pageCount}
                            </div>
                            <div className="text-xs text-slate-600 mt-1 font-medium">
                                {t('preview.pages', 'Pages')}
                            </div>
                        </div>

                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                            <div className="text-2xl font-bold text-purple-600">
                                {formatNumber(content.metadata.wordCount)}
                            </div>
                            <div className="text-xs text-slate-600 mt-1 font-medium">
                                {t('preview.words', 'Words')}
                            </div>
                        </div>

                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                            <div className="text-2xl font-bold text-pink-600">
                                {formatFileSize(content.metadata.sizeBytes)}
                            </div>
                            <div className="text-xs text-slate-600 mt-1 font-medium">
                                {t('preview.size', 'Size')}
                            </div>
                        </div>
                    </div>

                    {/* File Name */}
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                        <div className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">
                            {t('preview.fileName', 'File Name')}
                        </div>
                        <div className="text-sm text-blue-900 font-medium truncate">
                            {content.metadata.fileName}
                        </div>
                    </div>

                    {/* Processing Info */}
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-md font-medium">
                            ✓ {content.method === 'native' ? t('preview.nativeExtraction', 'Native Extraction') : t('preview.ocrExtraction', 'OCR Extraction')}
                        </span>
                        <span>•</span>
                        <span>{content.processingTime}ms</span>
                        {content.isScanned && (
                            <>
                                <span>•</span>
                                <span className="text-amber-600 font-medium">
                                    {t('preview.scannedPDF', 'Scanned PDF')}
                                </span>
                            </>
                        )}
                    </div>

                    {/* Smart Summary Section */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
                                <Zap size={16} className="text-indigo-600" />
                                {t('preview.smartSummary', 'Smart Summary')}
                            </h3>
                            <button
                                onClick={() => setIsEditingSummary(!isEditingSummary)}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            >
                                <Edit2 size={14} />
                                {isEditingSummary ? t('preview.viewMode', 'View') : t('preview.editMode', 'Edit')}
                            </button>
                        </div>

                        {isEditingSummary ? (
                            <textarea
                                value={editedSummary}
                                onChange={(e) => setEditedSummary(e.target.value)}
                                className="w-full h-40 px-4 py-3 text-sm text-slate-700 bg-white border-2 border-indigo-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder={t('preview.editSummaryPlaceholder', 'Edit the summary...')}
                            />
                        ) : (
                            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl p-4">
                                <p className="text-sm text-slate-700 leading-relaxed">
                                    {editedSummary}
                                </p>
                            </div>
                        )}

                        <div className="text-xs text-slate-500">
                            {t('preview.summaryHint', 'This summary will be used for analysis. You can edit it to focus on specific aspects.')}
                        </div>
                    </div>

                    {/* Collapsible Full Content */}
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                        <button
                            onClick={() => setIsFullContentExpanded(!isFullContentExpanded)}
                            className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors"
                        >
                            <span className="text-sm font-semibold text-slate-700">
                                {t('preview.fullContent', 'View Full Extracted Content')}
                            </span>
                            {isFullContentExpanded ? (
                                <ChevronUp size={18} className="text-slate-500" />
                            ) : (
                                <ChevronDown size={18} className="text-slate-500" />
                            )}
                        </button>

                        {isFullContentExpanded && (
                            <div className="p-4 bg-white max-h-80 overflow-y-auto">
                                <pre className="text-xs text-slate-600 whitespace-pre-wrap font-mono leading-relaxed">
                                    {content.fullText}
                                </pre>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="border-t border-slate-200 bg-slate-50 px-6 py-4 flex items-center justify-between gap-4">
                    <button
                        onClick={onCancel}
                        className="px-6 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                        {t('common.cancel', 'Cancel')}
                    </button>

                    <button
                        onClick={handleConfirm}
                        className="group relative inline-flex items-center justify-center px-8 py-2.5 font-semibold text-white transition-all duration-200 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 active:scale-95 shadow-lg shadow-indigo-500/30"
                    >
                        <Zap size={18} className="mr-2" />
                        {t('preview.analyzeNow', 'Analyze Now')}
                    </button>
                </div>
            </div>
        </div>
    );
}
