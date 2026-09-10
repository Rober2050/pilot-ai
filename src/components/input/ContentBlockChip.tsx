import React, { useState } from 'react';
import { X, Edit2, ChevronDown, ChevronUp, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ContentBlock, getBlockIcon, getBlockColorClass } from '../../types/content';
import { cn } from '../../lib/utils';

interface ContentBlockChipProps {
    block: ContentBlock;
    onEdit?: (blockId: string, newContent: string) => void;
    onDelete?: (blockId: string) => void;
    onToggleCollapse?: (blockId: string) => void;
}

export function ContentBlockChip({
    block,
    onEdit,
    onDelete,
    onToggleCollapse
}: ContentBlockChipProps) {
    const { t } = useTranslation('translation');
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(block.content);

    const handleSaveEdit = () => {
        if (onEdit && editedContent.trim()) {
            onEdit(block.id, editedContent);
            setIsEditing(false);
        }
    };

    const handleCancelEdit = () => {
        setEditedContent(block.content);
        setIsEditing(false);
    };

    const formatDuration = (seconds?: number): string => {
        if (!seconds) return '';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const formatFileSize = (bytes?: number): string => {
        if (!bytes) return '';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    };

    const getBlockTitle = (): string => {
        switch (block.type) {
            case 'text':
                return t('contentBlock.manualText', 'Manual Text');
            case 'audio':
                return block.metadata?.fileName || t('contentBlock.audioTranscription', 'Audio Transcription');
            case 'pdf':
                return block.metadata?.fileName || t('contentBlock.pdfSummary', 'PDF Summary');
            case 'image':
                return block.metadata?.fileName || t('contentBlock.imageDescription', 'Image Description');
            default:
                return t('contentBlock.content', 'Content');
        }
    };

    const shouldShowContent = !block.isCollapsed || block.content.length < 200;
    const displayContent = shouldShowContent ? block.content : block.content.substring(0, 200) + '...';

    return (
        <div className="group relative bg-white rounded-xl border-2 border-slate-200 hover:border-slate-300 transition-all duration-200 overflow-hidden animate-in fade-in slide-in-from-top-2">
            {/* Header */}
            <div className={cn(
                "px-4 py-3 bg-gradient-to-r text-white flex items-center justify-between",
                getBlockColorClass(block.type)
            )}>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-xl">{getBlockIcon(block.type)}</span>
                    <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold truncate">
                            {getBlockTitle()}
                        </h4>
                        {block.metadata && (
                            <div className="flex items-center gap-3 text-xs text-white/80 mt-0.5">
                                {block.metadata.duration && (
                                    <span className="flex items-center gap-1">
                                        <Clock size={12} />
                                        {formatDuration(block.metadata.duration)}
                                    </span>
                                )}
                                {block.metadata.pages && (
                                    <span>{block.metadata.pages} {t('contentBlock.pages', 'pages')}</span>
                                )}
                                {block.metadata.size && (
                                    <span>{formatFileSize(block.metadata.size)}</span>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                    {block.isEditable && onEdit && !isEditing && (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                            title={t('common.edit', 'Edit')}
                        >
                            <Edit2 size={14} />
                        </button>
                    )}

                    {block.content.length > 200 && onToggleCollapse && (
                        <button
                            onClick={() => onToggleCollapse(block.id)}
                            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                            title={block.isCollapsed ? t('contentBlock.expand', 'Expand') : t('contentBlock.collapse', 'Collapse')}
                        >
                            {block.isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                        </button>
                    )}

                    {onDelete && (
                        <button
                            onClick={() => onDelete(block.id)}
                            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                            title={t('common.delete', 'Delete')}
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="p-4">
                {isEditing ? (
                    <div className="space-y-3">
                        <textarea
                            value={editedContent}
                            onChange={(e) => setEditedContent(e.target.value)}
                            className="w-full h-32 px-3 py-2 text-sm text-slate-700 bg-slate-50 border border-slate-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            autoFocus
                        />
                        <div className="flex items-center justify-end gap-2">
                            <button
                                onClick={handleCancelEdit}
                                className="px-4 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                {t('common.cancel', 'Cancel')}
                            </button>
                            <button
                                onClick={handleSaveEdit}
                                className="px-4 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                            >
                                {t('common.save', 'Save')}
                            </button>
                        </div>
                    </div>
                ) : (
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                        {displayContent}
                    </p>
                )}
            </div>

            {/* Timestamp Footer */}
            {block.metadata?.timestamp && (
                <div className="px-4 py-2 bg-slate-50 border-t border-slate-200">
                    <p className="text-xs text-slate-500">
                        {t('contentBlock.addedAt', 'Added at')} {new Date(block.metadata.timestamp).toLocaleTimeString()}
                    </p>
                </div>
            )}
        </div>
    );
}
