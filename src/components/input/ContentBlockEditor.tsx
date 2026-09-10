import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Zap, Check, Plus } from 'lucide-react';
import { ContentBlock, createContentBlock } from '../../types/content';
import { ContentBlockChip } from './ContentBlockChip';
import { cn } from '../../lib/utils';

interface ContentBlockEditorProps {
    blocks: ContentBlock[];
    onBlocksChange: (blocks: ContentBlock[]) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    validationError?: string | null;
    onValidationErrorChange?: (error: string | null) => void;
    suggestedIdea?: string | null;
    onSuggestedIdeaChange?: (idea: string | null) => void;
    suggestedModules?: string[] | null;
    onSuggestedModulesChange?: (modules: string[] | null) => void;
    onIdeaAccepted?: () => void;
}

export function ContentBlockEditor({
    blocks,
    onBlocksChange,
    placeholder,
    disabled = false,
    className,
    validationError,
    onValidationErrorChange,
    suggestedIdea,
    onSuggestedIdeaChange,
    suggestedModules,
    onSuggestedModulesChange,
    onIdeaAccepted
}: ContentBlockEditorProps) {
    const { t } = useTranslation('translation');
    const [textInput, setTextInput] = useState('');
    const [selectedModules, setSelectedModules] = useState<Set<string>>(new Set());
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Reset selected modules when suggestion changes or is dismissed
    useEffect(() => {
        if (!suggestedIdea) {
            setSelectedModules(new Set());
        }
    }, [suggestedIdea]);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [textInput]);

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setTextInput(e.target.value);
        if (validationError && onValidationErrorChange) {
            onValidationErrorChange(null);
        }

        if (e.target.value.trim() && !blocks.some(b => b.type === 'text')) {
            const textBlock = createContentBlock('text', e.target.value);
            onBlocksChange([...blocks, textBlock]);
        } else if (e.target.value.trim()) {
            const updatedBlocks = blocks.map(block =>
                block.type === 'text'
                    ? { ...block, content: e.target.value }
                    : block
            );
            onBlocksChange(updatedBlocks);
        } else if (!e.target.value.trim()) {
            const updatedBlocks = blocks.filter(b => b.type !== 'text');
            onBlocksChange(updatedBlocks);
        }
    };

    const handleEditBlock = (blockId: string, newContent: string) => {
        const updatedBlocks = blocks.map(block =>
            block.id === blockId ? { ...block, content: newContent } : block
        );
        onBlocksChange(updatedBlocks);
    };

    const handleDeleteBlock = (blockId: string) => {
        const blockToDelete = blocks.find(b => b.id === blockId);
        if (blockToDelete?.type === 'text') setTextInput('');
        onBlocksChange(blocks.filter(block => block.id !== blockId));
    };

    const handleToggleCollapse = (blockId: string) => {
        const updatedBlocks = blocks.map(block =>
            block.id === blockId ? { ...block, isCollapsed: !block.isCollapsed } : block
        );
        onBlocksChange(updatedBlocks);
    };

    const toggleModule = (module: string) => {
        setSelectedModules(prev => {
            const next = new Set(prev);
            if (next.has(module)) {
                next.delete(module);
            } else {
                next.add(module);
            }
            return next;
        });
    };

    const handleUseSuggestion = () => {
        if (!suggestedIdea) return;
        let finalIdea = suggestedIdea;
        if (selectedModules.size > 0) {
            const list = Array.from(selectedModules).join(', ');
            finalIdea = `${suggestedIdea}\n\nMódulos clave: ${list}.`;
        }
        setTextInput(finalIdea);
        const newTextBlock = createContentBlock('text', finalIdea);
        const newBlocks = blocks.some(b => b.type === 'text')
            ? blocks.map(b => b.type === 'text' ? newTextBlock : b)
            : [...blocks, newTextBlock];
        onBlocksChange(newBlocks);
        if (onValidationErrorChange) onValidationErrorChange(null);
        if (onSuggestedIdeaChange) onSuggestedIdeaChange(null);
        if (onSuggestedModulesChange) onSuggestedModulesChange(null);
        if (onIdeaAccepted) onIdeaAccepted();
        setSelectedModules(new Set());
        textareaRef.current?.focus();
    };

    const handleDismissSuggestion = () => {
        if (onSuggestedIdeaChange) onSuggestedIdeaChange(null);
        if (onSuggestedModulesChange) onSuggestedModulesChange(null);
        setSelectedModules(new Set());
        textareaRef.current?.focus();
    };

    // Separate blocks by type
    const textBlock = blocks.find(b => b.type === 'text');
    const otherBlocks = blocks.filter(b => b.type !== 'text');
    const hasMultipleSources = blocks.length > 1 || (blocks.length === 1 && blocks[0].type !== 'text');

    // Module lists
    const selectedModulesList = Array.from(selectedModules);
    const availableModules = (suggestedModules || []).filter(m => !selectedModules.has(m));

    // Sync textarea with text block
    useEffect(() => {
        if (textBlock && textBlock.content !== textInput) {
            setTextInput(textBlock.content);
        }
    }, [textBlock]);

    return (
        <div className={cn("space-y-4", className)}>
            {/* Text Input Area */}
            <div className="relative">
                <textarea
                    ref={textareaRef}
                    value={textInput}
                    onChange={handleTextChange}
                    disabled={disabled}
                    placeholder={placeholder || t('contentBlock.placeholder', 'Describe your project idea...')}
                    className={cn(
                        "w-full min-h-[52px] max-h-[400px] px-4 py-3 text-base lg:text-xl bg-transparent border-none outline-none resize-y transition-all duration-200",
                        "placeholder:text-slate-400",
                        "focus:ring-0 leading-relaxed font-light tracking-wide",
                        "disabled:opacity-50 disabled:cursor-not-allowed",
                        "scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent"
                    )}
                    rows={2}
                />
                {textInput.length > 0 && (
                    <div className="absolute bottom-2 left-4 text-xs text-slate-400 pointer-events-none select-none">
                        {textInput.length} {t('contentBlock.characters', 'characters')}
                    </div>
                )}
            </div>

            {/* Content Blocks (Audio, PDF, Images) */}
            {otherBlocks.length > 0 && (
                <div className="space-y-3">
                    {hasMultipleSources && (
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <div className="h-px flex-1 bg-slate-200" />
                            <span className="font-medium">
                                {t('contentBlock.additionalSources', 'Additional Sources')}
                            </span>
                            <div className="h-px flex-1 bg-slate-200" />
                        </div>
                    )}
                    {otherBlocks.map((block) => (
                        <ContentBlockChip
                            key={block.id}
                            block={block}
                            onEdit={handleEditBlock}
                            onDelete={handleDeleteBlock}
                            onToggleCollapse={handleToggleCollapse}
                        />
                    ))}
                </div>
            )}

            {/* Info message when multiple sources */}
            {hasMultipleSources && (
                <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="text-blue-600 mt-0.5">ℹ️</div>
                    <p className="text-xs text-blue-700 leading-relaxed">
                        {t('contentBlock.multiSourceInfo', 'All content sources will be combined and analyzed together. You can edit or remove individual blocks using the buttons above.')}
                    </p>
                </div>
            )}

            {/* Validation panel — guided, not punishing */}
            {validationError && (
                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
                    <p className="text-sm text-amber-800 font-medium flex items-center gap-1.5">
                        <span aria-hidden="true">💡</span>
                        {validationError}
                    </p>

                    {/* Smart Suggestion */}
                    {suggestedIdea && (
                        <div className="bg-white rounded-lg border border-amber-100 overflow-hidden">

                            {/* Suggested idea text */}
                            <div className="flex items-start gap-2 p-2.5">
                                <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider pt-1 shrink-0">
                                    ✨ Sugerencia:
                                </span>
                                <p className="text-xs text-amber-900 leading-relaxed flex-1">
                                    {suggestedIdea}
                                </p>
                            </div>

                            {/* Selected modules tray — appears when ≥1 module selected */}
                            {selectedModulesList.length > 0 && (
                                <div className="mx-2.5 mb-2 p-2 bg-amber-500 rounded-lg">
                                    <p className="text-[10px] font-bold text-white uppercase tracking-wider mb-1.5">
                                        ✅ {selectedModulesList.length} módulo{selectedModulesList.length !== 1 ? 's' : ''} seleccionado{selectedModulesList.length !== 1 ? 's' : ''}:
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {selectedModulesList.map((module, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => toggleModule(module)}
                                                title="Clic para quitar"
                                                className="inline-flex items-center gap-1 px-2 py-0.5 bg-white text-amber-700 text-[10px] font-semibold rounded-full hover:bg-amber-100 transition-colors"
                                            >
                                                <Check size={9} />
                                                {module}
                                                <span className="ml-0.5 opacity-60">×</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Action buttons */}
                            <div className="flex gap-2 px-2.5 pb-2.5">
                                <button
                                    onClick={handleUseSuggestion}
                                    className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-[11px] font-bold transition-all shadow-sm"
                                >
                                    <Zap size={9} aria-hidden="true" />
                                    ✨ Usar sugerencia
                                    {selectedModulesList.length > 0 && (
                                        <span className="ml-1 bg-white/30 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                                            +{selectedModulesList.length}
                                        </span>
                                    )}
                                </button>
                                <button
                                    onClick={handleDismissSuggestion}
                                    className="px-3 py-1.5 rounded-full bg-white border border-amber-300 hover:bg-amber-50 text-amber-700 text-[11px] font-medium transition-colors"
                                >
                                    ✎ Escribir la mía
                                </button>
                            </div>

                            {/* Available modules — click + to select */}
                            {availableModules.length > 0 && (
                                <div className="px-2.5 pb-2.5 space-y-1.5">
                                    <div className="flex items-center gap-2">
                                        <div className="h-px flex-1 bg-amber-100" />
                                        <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider shrink-0">
                                            📦 Personaliza — agrega módulos a tu idea:
                                        </span>
                                        <div className="h-px flex-1 bg-amber-100" />
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {availableModules.map((module, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => toggleModule(module)}
                                                title="Clic para agregar"
                                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 text-[10px] font-medium rounded-full border border-amber-200 hover:border-amber-400 hover:bg-amber-100 transition-all"
                                            >
                                                <Plus size={9} aria-hidden="true" />
                                                {module}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* All modules selected confirmation */}
                            {suggestedModules && suggestedModules.length > 0 && availableModules.length === 0 && (
                                <p className="px-2.5 pb-2.5 text-[10px] text-amber-600 font-medium">
                                    ✅ Todos los módulos seleccionados — hacé clic en "✨ Usar sugerencia" para continuar.
                                </p>
                            )}
                        </div>
                    )}

                </div>
            )}
        </div>
    );
}
