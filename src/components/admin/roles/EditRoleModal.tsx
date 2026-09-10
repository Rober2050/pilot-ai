import React from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { RoleConfig } from '../../../types/roles';
import { AIModel } from '../../../services/firebase/aiModelsService';

interface EditRoleModalProps {
    role: RoleConfig;
    availableModels: AIModel[];
    onClose: () => void;
    onSave: (role: RoleConfig) => void;
    onChange: (role: RoleConfig) => void;
}

export const EditRoleModal: React.FC<EditRoleModalProps> = ({ role, availableModels, onClose, onSave, onChange }) => {
    const { t } = useTranslation('translation');

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-slate-900">{t('admin.editRole')}: {role.displayName}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X className="h-6 w-6" />
                    </button>
                </div>
                <div className="p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">{t('admin.displayName')}</label>
                        <input
                            type="text"
                            value={role.displayName}
                            onChange={(e) => onChange({ ...role, displayName: e.target.value })}
                            className="input-field"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">{t('admin.systemPrompt')}</label>
                        <textarea
                            value={role.systemPrompt}
                            onChange={(e) => onChange({ ...role, systemPrompt: e.target.value })}
                            className="input-field h-64 resize-y font-mono text-sm"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">{t('admin.model')}</label>
                            <select
                                value={role.model}
                                onChange={(e) => onChange({ ...role, model: e.target.value })}
                                className="input-field"
                            >
                                {availableModels.length > 0 ? (
                                    availableModels.map(model => (
                                        <option key={model.id} value={model.modelName}>
                                            {model.displayName}
                                        </option>
                                    ))
                                ) : (
                                    <option value="" disabled>No active models found</option>
                                )}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">{t('admin.temperature')}</label>
                        <input
                            type="number"
                            value={role.temperature}
                            onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                onChange({ ...role, temperature: isNaN(val) ? 0 : val });
                            }}
                            step="0.1"
                            min="0"
                            max="1"
                            className="input-field"
                        />
                    </div>
                </div>

                {/* Documentation Settings */}
                <div className="border-t border-slate-100 pt-4 p-6">
                    <h4 className="text-sm font-bold text-slate-900 mb-3">Documentation Settings</h4>
                    <div className="grid grid-cols-2 gap-3">
                        <label className="flex items-center gap-2 p-2 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={role.docConfig?.text ?? true}
                                onChange={(e) => onChange({
                                    ...role,
                                    docConfig: { ...role.docConfig, text: e.target.checked }
                                })}
                                className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="text-sm text-slate-700">Structured Text</span>
                        </label>
                        <label className="flex items-center gap-2 p-2 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={role.docConfig?.charts ?? false}
                                onChange={(e) => onChange({
                                    ...role,
                                    docConfig: { ...role.docConfig, charts: e.target.checked }
                                })}
                                className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="text-sm text-slate-700">Charts & Dashboards</span>
                        </label>
                        <label className="flex items-center gap-2 p-2 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={role.docConfig?.excel ?? false}
                                onChange={(e) => onChange({
                                    ...role,
                                    docConfig: { ...role.docConfig, excel: e.target.checked }
                                })}
                                className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="text-sm text-slate-700">Excel Spreadsheets</span>
                        </label>
                        <label className="flex items-center gap-2 p-2 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={role.docConfig?.flowDiagrams ?? false}
                                onChange={(e) => onChange({
                                    ...role,
                                    docConfig: { ...role.docConfig, flowDiagrams: e.target.checked }
                                })}
                                className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="text-sm text-slate-700">Flow Diagrams</span>
                        </label>
                        <label className="flex items-center gap-2 p-2 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={role.docConfig?.swimlanes ?? false}
                                onChange={(e) => onChange({
                                    ...role,
                                    docConfig: { ...role.docConfig, swimlanes: e.target.checked }
                                })}
                                className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="text-sm text-slate-700">Swimlanes</span>
                        </label>
                        <label className="flex items-center gap-2 p-2 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={role.docConfig?.c4 ?? false}
                                onChange={(e) => onChange({
                                    ...role,
                                    docConfig: { ...role.docConfig, c4: e.target.checked }
                                })}
                                className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="text-sm text-slate-700">C4 Diagrams</span>
                        </label>
                        <label className="flex items-center gap-2 p-2 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={role.docConfig?.architecture ?? false}
                                onChange={(e) => onChange({
                                    ...role,
                                    docConfig: { ...role.docConfig, architecture: e.target.checked }
                                })}
                                className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="text-sm text-slate-700">Architecture Diagrams</span>
                        </label>
                        <label className="flex items-center gap-2 p-2 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={role.docConfig?.pdf ?? false}
                                onChange={(e) => onChange({
                                    ...role,
                                    docConfig: { ...role.docConfig, pdf: e.target.checked }
                                })}
                                className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="text-sm text-slate-700">PDF Reports</span>
                        </label>
                        <label className="flex items-center gap-2 p-2 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={role.docConfig?.ppt ?? false}
                                onChange={(e) => onChange({
                                    ...role,
                                    docConfig: { ...role.docConfig, ppt: e.target.checked }
                                })}
                                className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="text-sm text-slate-700">PowerPoint Slides</span>
                        </label>
                        <label className="flex items-center gap-2 p-2 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={role.docConfig?.json ?? false}
                                onChange={(e) => onChange({
                                    ...role,
                                    docConfig: { ...role.docConfig, json: e.target.checked }
                                })}
                                className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="text-sm text-slate-700">JSON Data</span>
                        </label>
                        <label className="flex items-center gap-2 p-2 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={role.docConfig?.markdown ?? false}
                                onChange={(e) => onChange({
                                    ...role,
                                    docConfig: { ...role.docConfig, markdown: e.target.checked }
                                })}
                                className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="text-sm text-slate-700">Markdown Notes</span>
                        </label>
                    </div>
                </div>
                <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
                    <button onClick={onClose} className="btn-secondary">{t('common.cancel')}</button>
                    <button onClick={() => onSave(role)} className="btn-primary">{t('common.saveChanges')}</button>
                </div>
            </div>
        </div>
    );
};
