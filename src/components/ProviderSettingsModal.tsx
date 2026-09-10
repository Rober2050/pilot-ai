import { useState, useEffect } from 'react';
import { X, Save, Eye, EyeOff, Key } from 'lucide-react';
import { configService, ProviderConfig } from '../services/firebase/configService';

interface ProviderSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ProviderSettingsModal({ isOpen, onClose }: ProviderSettingsModalProps) {
    const [configs, setConfigs] = useState<Record<string, ProviderConfig>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

    const providers = [
        { id: 'openai', name: 'OpenAI', icon: '🤖' },
        { id: 'anthropic', name: 'Anthropic', icon: '🧠' },
        { id: 'google', name: 'Google Gemini', icon: '✨' }
    ];

    useEffect(() => {
        if (isOpen) {
            loadConfigs();
        }
    }, [isOpen]);

    const loadConfigs = async () => {
        setLoading(true);
        const newConfigs: Record<string, ProviderConfig> = {};

        for (const provider of providers) {
            const config = await configService.getProviderConfig(provider.id);
            newConfigs[provider.id] = config || { apiKey: '', isEnabled: true };
        }

        setConfigs(newConfigs);
        setLoading(false);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            for (const [providerId, config] of Object.entries(configs)) {
                // Only save if key is provided or we're just toggling enabled state
                if (config.apiKey || config.isEnabled !== undefined) {
                    await configService.setProviderConfig(providerId, config);
                }
            }
            alert('Provider settings saved successfully!');
            onClose();
        } catch (error) {
            console.error('Error saving configs:', error);
            alert('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const toggleShowKey = (providerId: string) => {
        setShowKeys(prev => ({ ...prev, [providerId]: !prev[providerId] }));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900">Provider Settings</h3>
                        <p className="text-sm text-slate-500">Configure API keys and access</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <div className="p-6 max-h-[60vh] overflow-y-auto space-y-6">
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                        </div>
                    ) : (
                        providers.map(provider => (
                            <div key={provider.id} className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl">{provider.icon}</span>
                                        <h4 className="font-bold text-slate-900">{provider.name}</h4>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={configs[provider.id]?.isEnabled ?? true}
                                            onChange={(e) => setConfigs(prev => ({
                                                ...prev,
                                                [provider.id]: { ...prev[provider.id], isEnabled: e.target.checked }
                                            }))}
                                        />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                                    </label>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">API Key</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Key className="h-4 w-4 text-slate-400" />
                                        </div>
                                        <input
                                            type={showKeys[provider.id] ? "text" : "password"}
                                            value={configs[provider.id]?.apiKey || ''}
                                            onChange={(e) => setConfigs(prev => ({
                                                ...prev,
                                                [provider.id]: { ...prev[provider.id], apiKey: e.target.value }
                                            }))}
                                            className="block w-full pl-10 pr-10 py-2 border border-slate-300 rounded-lg text-sm focus:ring-primary-500 focus:border-primary-500 font-mono"
                                            placeholder={`sk-...`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => toggleShowKey(provider.id)}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                                        >
                                            {showKeys[provider.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                    <p className="text-xs text-slate-400">
                                        {configs[provider.id]?.apiKey ? 'Key stored securely in Firestore' : 'Using environment variable (if set)'}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                    <button onClick={onClose} className="btn-secondary">
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving || loading}
                        className="btn-primary flex items-center gap-2"
                    >
                        {saving ? (
                            <>Saving...</>
                        ) : (
                            <>
                                <Save className="h-4 w-4" />
                                Save Settings
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
