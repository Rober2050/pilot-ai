import React from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, Edit2, GripVertical } from 'lucide-react';
import { RoleConfig } from '../../../types/roles';

interface RoleListProps {
    roles: RoleConfig[];
    dragOverIndex: number | null;
    onSave: (role: RoleConfig) => void;
    onEdit: (role: RoleConfig | null) => void; // Pass null for creating new
    onDelete: (roleId: string) => void;
    onDragStart: (role: RoleConfig) => void;
    onDragOver: (e: React.DragEvent, index: number) => void;
    onDragLeave: () => void;
    onDrop: (e: React.DragEvent, dropIndex: number) => void;
    onExport?: () => void;
    onImport?: () => void;
}

export const RoleList: React.FC<RoleListProps> = ({
    roles,
    dragOverIndex,
    onSave,
    onEdit,
    onDelete,
    onDragStart,
    onDragOver,
    onDragLeave,
    onDrop,
    onExport,
    onImport
}) => {
    const { t } = useTranslation('translation');

    const handleCreateRole = () => {
        onEdit({
            roleId: `role-${Date.now()}`,
            displayName: '',
            description: '',
            systemPrompt: '',
            model: 'claude-haiku-4-5-20251001',
            temperature: 0.7,
            isEnabled: true,
            orderIndex: roles.length + 1,
            docConfig: { text: true, charts: false, excel: false, flowDiagrams: false, swimlanes: false, c4: false, architecture: false, pdf: false, ppt: false, json: false, markdown: false, otherFormats: [] }
        } as RoleConfig);
    };

    return (
        <div className="card">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-slate-900">{t('admin.workflowRoles')}</h2>
                <div className="flex gap-2 flex-wrap">
                    {onExport && (
                        <button
                            className="btn-secondary text-sm py-1.5 bg-green-50 text-green-700 hover:bg-green-100 border-green-200"
                            onClick={onExport}
                            title="Export all roles to JSON file"
                        >
                            📥 Export
                        </button>
                    )}
                    {onImport && (
                        <button
                            className="btn-secondary text-sm py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200"
                            onClick={onImport}
                            title="Import roles from JSON file"
                        >
                            📤 Import
                        </button>
                    )}
                    <button
                        className="btn-secondary text-sm py-1.5"
                        onClick={handleCreateRole}
                    >
                        <Plus className="h-4 w-4 mr-1" />
                        {t('admin.createRole')}
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                {roles.map((role, index) => (
                    <div
                        key={role.roleId}
                        draggable
                        onDragStart={() => onDragStart(role)}
                        onDragOver={(e) => onDragOver(e, index)}
                        onDragLeave={onDragLeave}
                        onDrop={(e) => onDrop(e, index)}
                        className={`flex items-center gap-4 p-4 border rounded-xl bg-white transition-all ${dragOverIndex === index
                            ? 'border-primary-500 shadow-lg scale-105'
                            : 'border-slate-200 hover:shadow-sm'
                            }`}
                    >
                        <div className="text-slate-400 cursor-move hover:text-primary-600 transition-colors">
                            <GripVertical className="h-5 w-5" />
                        </div>
                        <div className="h-10 w-10 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center font-bold">
                            {role.displayName[0]}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-slate-900">{role.displayName}</h3>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onSave({ ...role, isEnabled: !role.isEnabled });
                                    }}
                                    className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${role.isEnabled ? 'bg-green-500' : 'bg-slate-200'}`}
                                >
                                    <span className="sr-only">Use setting</span>
                                    <span
                                        aria-hidden="true"
                                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${role.isEnabled ? 'translate-x-4' : 'translate-x-0'}`}
                                    />
                                </button>
                            </div>
                            <p className="text-sm text-slate-500 truncate pr-4">{role.description}</p>
                        </div>
                        <button onClick={() => onEdit(role)} className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                            <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => onDelete(role.roleId)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Role"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};
