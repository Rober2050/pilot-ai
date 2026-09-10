/**
 * War Room Styles Manager
 * 
 * Admin UI component for managing War Room behavioral styles (Audit, Creative, Crisis, etc.)
 */

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import { warRoomStylesService } from '../../../services/firebase/warRoomStylesService';
import { WarRoomStyle } from '../../../types/prompt-composer';

export const WarRoomStylesManager: React.FC = () => {
    const [styles, setStyles] = useState<WarRoomStyle[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    const [formData, setFormData] = useState<Partial<WarRoomStyle>>({
        mode: 'custom',
        name: '',
        nameEn: '',
        modifier: '',
        modifierEn: '',
        icon: '🎯',
        isEnabled: true
    });

    useEffect(() => {
        loadStyles();
    }, []);

    const loadStyles = async () => {
        setIsLoading(true);
        try {
            const data = await warRoomStylesService.getAllStyles();
            setStyles(data);
        } catch (error) {
            console.error('Error loading styles:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = () => {
        setIsCreating(true);
        setFormData({
            mode: 'custom',
            name: '',
            nameEn: '',
            modifier: '',
            modifierEn: '',
            icon: '🎯',
            isEnabled: true
        });
    };

    const handleEdit = (style: WarRoomStyle) => {
        setEditingId(style.id);
        setFormData(style);
    };

    // Helper to slugify text for IDs
    const toSlug = (text: string) => {
        return text.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    };

    const handleSave = async () => {
        try {
            // Validation
            if (!formData.name || !formData.nameEn || !formData.modifier || !formData.modifierEn) {
                alert('Por favor completa todos los campos obligatorios');
                return;
            }

            // Determine effective Mode/ID
            let effectiveMode = formData.mode;

            // If custom mode, generate unique ID from English name
            if (formData.mode === 'custom' || !formData.mode) {
                if (!formData.nameEn) {
                    alert('El nombre en inglés es requerido para generar el ID del estilo custom');
                    return;
                }
                effectiveMode = toSlug(formData.nameEn);
            }

            const styleData = {
                mode: effectiveMode, // Use slug as the unique mode ID
                name: formData.name,
                nameEn: formData.nameEn,
                modifier: formData.modifier,
                modifierEn: formData.modifierEn,
                icon: formData.icon || '🎯',
                isEnabled: formData.isEnabled !== false
            };

            if (isCreating) {
                await warRoomStylesService.createStyle(styleData as any);
            } else if (editingId) {
                // For updates, we usually keep the original ID, but update fields.
                // If mode was custom and remains custom, ID is preserved.
                await warRoomStylesService.updateStyle(editingId, styleData);
            }

            setIsCreating(false);
            setEditingId(null);
            setFormData({});
            await loadStyles();
        } catch (error) {
            console.error('Error saving style:', error);
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
            alert(`Error al guardar el estilo: ${errorMessage}`);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este estilo?')) return;

        try {
            await warRoomStylesService.deleteStyle(id);
            await loadStyles();
        } catch (error) {
            console.error('Error deleting style:', error);
            alert('Error al eliminar el estilo');
        }
    };

    const handleCancel = () => {
        setIsCreating(false);
        setEditingId(null);
        setFormData({});
    };

    if (isLoading) {
        return <div className="text-center py-8">Cargando estilos...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">War Room Styles</h2>
                    <p className="text-gray-600 mt-1">
                        Gestiona los estilos de comportamiento para War Room (Auditoría, Creativo, Crisis, etc.)
                    </p>
                </div>
                <button
                    onClick={handleCreate}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    Nuevo Estilo
                </button>
            </div>

            {/* Create/Edit Form */}
            {(isCreating || editingId) && (
                <div className="bg-white border-2 border-blue-500 rounded-lg p-6 shadow-lg">
                    <h3 className="text-lg font-semibold mb-4">
                        {isCreating ? 'Crear Nuevo Estilo' : 'Editar Estilo'}
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Icon */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Icono (Emoji)
                            </label>
                            <input
                                type="text"
                                value={formData.icon || ''}
                                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg"
                                placeholder="🎯"
                                maxLength={2}
                            />
                        </div>

                        {/* Mode */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Modo
                            </label>
                            <select
                                value={formData.mode || 'custom'}
                                onChange={(e) => setFormData({ ...formData, mode: e.target.value as any })}
                                className="w-full px-3 py-2 border rounded-lg"
                            >
                                <option value="audit">Audit</option>
                                <option value="creative">Creative</option>
                                <option value="crisis">Crisis</option>
                                <option value="custom">Custom</option>
                            </select>
                        </div>

                        {/* Name (Spanish) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nombre (Español)
                            </label>
                            <input
                                type="text"
                                value={formData.name || ''}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg"
                                placeholder="Auditoría (Crítico)"
                            />
                        </div>

                        {/* Name (English) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nombre (English)
                            </label>
                            <input
                                type="text"
                                value={formData.nameEn || ''}
                                onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg"
                                placeholder="Audit (Critical)"
                            />
                        </div>

                        {/* Modifier (Spanish) */}
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Modificador de Prompt (Español)
                            </label>
                            <textarea
                                value={formData.modifier || ''}
                                onChange={(e) => setFormData({ ...formData, modifier: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg"
                                rows={4}
                                placeholder="MODO AUDITORÍA: Sé extremadamente crítico..."
                            />
                        </div>

                        {/* Modifier (English) */}
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Modificador de Prompt (English)
                            </label>
                            <textarea
                                value={formData.modifierEn || ''}
                                onChange={(e) => setFormData({ ...formData, modifierEn: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg"
                                rows={4}
                                placeholder="AUDIT MODE: Be extremely critical..."
                            />
                        </div>

                        {/* Enabled */}
                        <div className="col-span-2">
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={formData.isEnabled || false}
                                    onChange={(e) => setFormData({ ...formData, isEnabled: e.target.checked })}
                                    className="w-4 h-4"
                                />
                                <span className="text-sm font-medium text-gray-700">Habilitado</span>
                            </label>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-4">
                        <button
                            onClick={handleSave}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                            <Save className="w-4 h-4" />
                            Guardar
                        </button>
                        <button
                            onClick={handleCancel}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                        >
                            <X className="w-4 h-4" />
                            Cancelar
                        </button>
                    </div>
                </div>
            )}

            {/* Styles List */}
            <div className="grid gap-4 max-h-[600px] overflow-y-auto pr-2">
                {styles.map((style) => (
                    <div
                        key={style.id}
                        className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3 flex-1">
                                <div className="text-3xl">{style.icon}</div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold text-lg">{style.name}</h3>
                                        <span className="text-sm text-gray-500">({style.nameEn})</span>
                                        {!style.isEnabled && (
                                            <span className="px-2 py-1 bg-gray-200 text-gray-600 text-xs rounded">
                                                Deshabilitado
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1">{style.modifier}</p>
                                    <p className="text-sm text-gray-400 mt-1 italic">{style.modifierEn}</p>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleEdit(style)}
                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Editar"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleDelete(style.id)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Eliminar"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {styles.length === 0 && !isCreating && (
                <div className="text-center py-12 text-gray-500">
                    <p>No hay estilos creados todavía.</p>
                    <p className="text-sm mt-2">Haz clic en "Nuevo Estilo" para crear uno.</p>
                </div>
            )}
        </div>
    );
};
