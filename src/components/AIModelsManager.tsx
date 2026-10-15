import { useState, useEffect } from 'react';
import { aiModelsService, AIModel } from '../services/firebase/aiModelsService';
import { Plus, Edit2, X, Power, PowerOff, Trash2, Check, Settings } from 'lucide-react';
import ProviderSettingsModal from './ProviderSettingsModal';

export default function AIModelsManager() {
    const [models, setModels] = useState<AIModel[]>([]);
    const [editingModel, setEditingModel] = useState<AIModel | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    useEffect(() => {
        loadModels();
    }, []);

    const loadModels = async () => {
        setIsLoading(true);
        const data = await aiModelsService.getAllModels();
        setModels(data);
        setIsLoading(false);
    };

    const handleSaveModel = async (model: AIModel) => {
        try {
            if (model.id.startsWith('new-model-')) {
                const { id, createdAt, updatedAt, ...modelData } = model;
                const newId = model.modelName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
                await aiModelsService.createModel({ ...modelData, id: newId });
            } else {
                await aiModelsService.updateModel(model.id, model);
            }
            await loadModels();
            setEditingModel(null);
        } catch (error) {
            console.error("Error saving model:", error);
            alert("Failed to save model. Check console for details.");
        }
    };

    const handleToggleStatus = async (id: string, isActive: boolean) => {
        try {
            await aiModelsService.toggleModelStatus(id, isActive);
            setModels(models.map(m => m.id === id ? { ...m, isActive } : m));
        } catch (error) {
            console.error("Error toggling model status:", error);
        }
    };

    const handleDeleteModel = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this model? This action cannot be undone.')) return;

        try {
            await aiModelsService.deleteModel(id);
            setModels(models.filter(m => m.id !== id));
        } catch (error) {
            console.error("Error deleting model:", error);
            alert("Failed to delete model. Check console for details.");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">AI Models</h2>
                    <p className="text-slate-500">Manage available AI models for the platform.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        className="btn-secondary flex items-center gap-2"
                        onClick={() => setShowSettings(true)}
                    >
                        <Settings className="h-4 w-4" />
                        Configure Providers
                    </button>
                    <button
                        className="btn-secondary"
                        onClick={() => aiModelsService.initializeDefaultModels().then(loadModels)}
                    >
                        Reset Defaults
                    </button>
                    <button
                        className="btn-primary"
                        onClick={() => setEditingModel({
                            id: `new-model-${Date.now()}`,
                            modelName: '',
                            displayName: '',
                            provider: 'anthropic',
                            isActive: true,
                            description: ''
                        })}
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Model
                    </button>
                </div>
            </div>

            <ProviderSettingsModal
                isOpen={showSettings}
                onClose={() => setShowSettings(false)}
            />

            {isLoading ? (
                <div className="text-center py-12 text-slate-500">Loading models...</div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-slate-700">Model Name</th>
                                <th className="px-6 py-4 font-semibold text-slate-700">Display Name</th>
                                <th className="px-6 py-4 font-semibold text-slate-700">Provider</th>
                                <th className="px-6 py-4 font-semibold text-slate-700">Status</th>
                                <th className="px-6 py-4 font-semibold text-slate-700 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {models.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                        No models found. Click "Reset Defaults" to initialize.
                                    </td>
                                </tr>
                            ) : (
                                models.map((model) => (
                                    <tr key={model.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 font-mono text-xs text-slate-600">
                                            {model.modelName}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-900">
                                            {model.displayName}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 capitalize">
                                                {model.provider}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => handleToggleStatus(model.id, !model.isActive)}
                                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${model.isActive
                                                    ? 'bg-green-50 text-green-700 hover:bg-green-100'
                                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                    }`}
                                            >
                                                {model.isActive ? (
                                                    <>
                                                        <Power className="h-3 w-3" />
                                                        Active
                                                    </>
                                                ) : (
                                                    <>
                                                        <PowerOff className="h-3 w-3" />
                                                        Disabled
                                                    </>
                                                )}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => setEditingModel(model)}
                                                    className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteModel(model.id)}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Edit/Create Modal */}
            {editingModel && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="text-xl font-bold text-slate-900">
                                {editingModel.id.startsWith('new-model-') ? 'Add New Model' : 'Edit Model'}
                            </h3>
                            <button onClick={() => setEditingModel(null)} className="text-slate-400 hover:text-slate-600">
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Model Name (API)</label>
                                <div className="relative">
                                    <input
                                        list="model-suggestions"
                                        type="text"
                                        value={editingModel.modelName}
                                        onChange={(e) => setEditingModel({ ...editingModel, modelName: e.target.value })}
                                        className={`input-field font-mono text-sm ${editingModel.modelName.includes(' ') ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : ''}`}
                                        placeholder="e.g., gpt-4-turbo"
                                    />
                                    <datalist id="model-suggestions">
                                        <option value="gpt-4o">OpenAI GPT-4o</option>
                                        <option value="gpt-4-turbo">OpenAI GPT-4 Turbo</option>
                                        <option value="gpt-3.5-turbo">OpenAI GPT-3.5 Turbo</option>
                                        <option value="claude-haiku-4-5-20251001">Anthropic Claude Haiku 4.5</option>
                                        <option value="claude-3-opus-20240229">Anthropic Claude 3 Opus</option>
                                        <option value="claude-3-sonnet-20240229">Anthropic Claude 3 Sonnet</option>
                                        <option value="claude-3-5-haiku-20241022">Anthropic Claude 3.5 Haiku</option>
                                    </datalist>
                                </div>
                                {editingModel.modelName.includes(' ') && (
                                    <p className="text-xs text-red-500 mt-1 font-medium">
                                        ⚠️ Warning: API Model IDs usually do not contain spaces. Did you mean "{editingModel.modelName.replace(/\s+/g, '-').toLowerCase()}"?
                                    </p>
                                )}
                                <p className="text-xs text-slate-500 mt-1">Exact model name as used in API calls (no spaces)</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Display Name</label>
                                <input
                                    type="text"
                                    value={editingModel.displayName}
                                    onChange={(e) => setEditingModel({ ...editingModel, displayName: e.target.value })}
                                    className="input-field"
                                    placeholder="e.g., Claude Haiku 4.5"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Provider</label>
                                <select
                                    value={editingModel.provider}
                                    onChange={(e) => setEditingModel({ ...editingModel, provider: e.target.value as any })}
                                    className="input-field"
                                >
                                    <option value="anthropic">Anthropic</option>
                                    <option value="openai">OpenAI</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Description (Optional)</label>
                                <textarea
                                    value={editingModel.description || ''}
                                    onChange={(e) => setEditingModel({ ...editingModel, description: e.target.value })}
                                    className="input-field resize-none"
                                    rows={3}
                                    placeholder="Brief description of this model's capabilities..."
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    checked={editingModel.isActive}
                                    onChange={(e) => setEditingModel({ ...editingModel, isActive: e.target.checked })}
                                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-slate-300 rounded"
                                />
                                <label htmlFor="isActive" className="text-sm font-medium text-slate-700">
                                    Active (available for use)
                                </label>
                            </div>
                        </div>
                        <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
                            <button onClick={() => setEditingModel(null)} className="btn-secondary">
                                Cancel
                            </button>
                            <button
                                onClick={() => handleSaveModel(editingModel)}
                                className="btn-primary"
                                disabled={!editingModel.modelName || !editingModel.displayName}
                            >
                                <Check className="h-4 w-4 mr-2" />
                                Save Model
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
