import React, { useState, useEffect } from 'react';
import { Brain, Save, ChevronDown } from 'lucide-react';
import { configService, SynthesisAgentConfig } from '../../../services/firebase/configService';
import { aiModelsService, AIModel } from '../../../services/firebase/aiModelsService';
import { cn } from '../../../lib/utils';

export const SynthesisAgentPanel: React.FC = () => {
    const [config, setConfig] = useState<SynthesisAgentConfig>({
        model: 'gemini-2.5-pro',
        temperature: 0.4,
        systemPrompt: ''
    });
    const [models, setModels] = useState<AIModel[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        const load = async () => {
            const [cfg, mdls] = await Promise.all([
                configService.getSynthesisConfig(),
                aiModelsService.getActiveModels()
            ]);
            setConfig(cfg);
            setModels(mdls);
        };
        load();
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await configService.setSynthesisConfig(config);
            alert('✅ Synthesis Agent config saved!');
        } catch {
            alert('❌ Error saving. Check console.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="mt-6 rounded-xl border border-white/5 bg-slate-900/50 overflow-hidden">
            {/* Header — clickable to expand */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/5 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-indigo-500/20 rounded-lg">
                        <Brain className="h-4 w-4 text-indigo-400" />
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-white">Synthesis Agent</span>
                        <span className="text-xs text-slate-500">— agente de sistema, configurable sin tocar código</span>
                    </div>
                    <span className="text-xs font-mono text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full">
                        {config.model}
                    </span>
                </div>
                <ChevronDown className={cn(
                    'h-4 w-4 text-slate-500 transition-transform shrink-0',
                    isExpanded && 'rotate-180'
                )} />
            </button>

            {/* Expanded content */}
            {isExpanded && (
                <div className="px-5 pb-5 pt-4 space-y-4 border-t border-white/5">
                    <p className="text-xs text-slate-500">
                        Unifica los outputs de todos los roles en el Informe Ejecutivo.
                        No aparece en el equipo de usuario — es un agente interno del sistema.
                    </p>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Model select */}
                        <div>
                            <label className="block text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1.5">
                                Modelo
                            </label>
                            <select
                                value={config.model}
                                onChange={(e) => setConfig({ ...config, model: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                {models.length === 0 && (
                                    <option value={config.model}>{config.model}</option>
                                )}
                                {models.map(m => (
                                    <option key={m.id} value={m.modelName}>
                                        {m.displayName} ({m.provider})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Temperature */}
                        <div>
                            <label className="block text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1.5">
                                Temperature
                            </label>
                            <input
                                type="number"
                                value={config.temperature}
                                onChange={(e) => setConfig({ ...config, temperature: parseFloat(e.target.value) || 0 })}
                                step="0.1" min="0" max="1"
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                            <p className="text-xs text-slate-600 mt-1">Recomendado: 0.3–0.5</p>
                        </div>
                    </div>

                    {/* System Prompt override */}
                    <div>
                        <label className="block text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1.5">
                            System Prompt Override{' '}
                            <span className="font-normal text-slate-600 normal-case">(vacío = usar protocolo interno)</span>
                        </label>
                        <textarea
                            value={config.systemPrompt}
                            onChange={(e) => setConfig({ ...config, systemPrompt: e.target.value })}
                            rows={3}
                            placeholder="Dejar vacío para usar el SYNTHESIS_PROTOCOL definido en código..."
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 font-mono placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-y"
                        />
                    </div>

                    <div className="flex justify-end pt-1">
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Save className="h-3.5 w-3.5" />
                            {isSaving ? 'Guardando...' : 'Guardar configuración'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
