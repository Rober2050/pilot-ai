import { useState, useEffect, useRef } from 'react';
import { Save, Play, Trash2, Layout, BarChart, GitBranch, Grid, Type, Copy, Sparkles, Loader2, ArrowUp, ArrowDown, Clock, Image as ImageIcon, Download, FilePlus, FolderInput } from 'lucide-react';
import DynamicTour from '../../academy/engine/DynamicTour';
import { TourConfig, StageConfig } from '../../../types/academy-schema';

import { rolesService } from '../../../services/firebase/rolesService';
import { RoleConfig } from '../../../types/roles';
import { geminiService } from '../../../services/gemini/geminiService';
import ImageUploadCropModal from './ImageUploadCropModal';
import { exportTourToTypeScript, importTourFromTypeScript } from '../../../utils/tourExport';
import { tourDevService } from '../../../services/dev/tourDevService';

// Helper functions for multilingual fields
const getStringValue = (value: string | { en: string; es: string } | undefined): string => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    return value.en || value.es || '';
};

const setStringValue = (value: string): string => value;

// --- MOCK INITIAL STATE (Ideally from DB) ---
const INITIAL_CONFIG: TourConfig = {
    id: 'new-tour',
    role: 'NEW ROLE',
    title: 'New Academy Tour',
    description: 'Description of the tour...',
    icon: 'Zap',
    layout: 'sidebar', // Defaulting to sidebar as per user preference
    theme: {
        primary: '#6366f1',
        secondary: '#a855f7',
        gradient: 'from-indigo-900/20 via-slate-950 to-purple-900/20'
    },
    stages: []
};

export default function AcademyCreator() {
    const [config, setConfig] = useState<TourConfig>(INITIAL_CONFIG);
    const [activeTab, setActiveTab] = useState<'settings' | 'stages' | 'preview'>('settings');
    const [showPreview, setShowPreview] = useState(false);
    const [availableRoles, setAvailableRoles] = useState<RoleConfig[]>([]);

    // Smart Gen State
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationLanguage, setGenerationLanguage] = useState<'es' | 'en'>('es');

    // Image Upload Modal State
    const [showImageModal, setShowImageModal] = useState(false);

    // File import ref
    const fileInputRef = useRef<HTMLInputElement>(null);


    useEffect(() => {
        const fetchRoles = async () => {
            try {
                const roles = await rolesService.getAllRoles();
                setAvailableRoles(roles);
            } catch (error) {
                console.error("Error loading roles", error);
            }
        };
        fetchRoles();
    }, []);

    // --- ACTIONS ---



    // Handle new tour (Reset)
    const handleNewTour = () => {
        if (confirm("Are you sure you want to start a new tour? Unsaved changes will be lost.")) {
            setConfig({
                ...INITIAL_CONFIG,
                id: `custom-${Date.now()}`
            });
            // Reset file input if valid
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };



    // Handle dev auto-save
    const handleDevSave = async () => {
        if (!config.title) {
            alert("Please provide a Tour Title");
            return;
        }

        try {
            const success = await tourDevService.saveTourToDisk(config);
            if (success) {
                alert("Tour saved successfully! It should appear in Pilot Academy instantly.");
            }
        } catch (error) {
            console.error("Dev save error", error);
        }
    };

    const handleSmartAdd = async (type: Exclude<StageConfig['type'], 'image'>) => {
        setIsGenerating(true);
        try {
            // 1. Generate Content via AI
            const generatedStage = await geminiService.generateAcademyStage(config.role, type, generationLanguage);

            // 2. Add IDs and defaults if missing
            const newStage = {
                ...generatedStage,
                id: `stage-${Date.now()}`,
                type // enforce type
            };

            setConfig(prev => ({
                ...prev,
                stages: [...prev.stages, newStage]
            }));
        } catch (error) {
            console.error("Smart Gen Failed", error);
            alert("AI Generation failed. Adding default template instead.");
            // Fallback to default template
            const base: any = { id: `stage-${Date.now()}`, title: 'New Stage', type, duration: 5 };
            if (type === 'text-concept') base.content = "Content...";
            setConfig(prev => ({ ...prev, stages: [...prev.stages, base] }));
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSmartImage = () => {
        setShowImageModal(true);
    };

    const handleImageCropped = (base64Image: string) => {
        const newStage = {
            id: `stage-${Date.now()}`,
            type: 'image' as const,
            title: `${config.role} Visualization`,
            subtitle: 'Visual Concept',
            duration: 8,
            url: base64Image,
            caption: `Image for ${config.role}`,
            style: 'cover' as const
        };

        setConfig(prev => ({
            ...prev,
            stages: [...prev.stages, newStage]
        }));
    };

    const updateStage = (index: number, field: string, value: any) => {
        const newStages = [...config.stages];
        newStages[index] = { ...newStages[index], [field]: value };
        setConfig({ ...config, stages: newStages });
    };

    const removeStage = (index: number) => {
        setConfig(prev => ({
            ...prev,
            stages: prev.stages.filter((_, i) => i !== index)
        }));
    };

    const duplicateStage = (index: number) => {
        const stageToClone = config.stages[index];
        const newStage = { ...stageToClone, id: `stage-${Date.now()}`, title: `${stageToClone.title} (Part 2)` };
        const newStages = [...config.stages];
        newStages.splice(index + 1, 0, newStage);
        setConfig({ ...config, stages: newStages });
    };

    const moveStage = (index: number, direction: -1 | 1) => {
        const newStages = [...config.stages];
        if (index + direction < 0 || index + direction >= newStages.length) return;

        const temp = newStages[index];
        newStages[index] = newStages[index + direction];
        newStages[index + direction] = temp;

        setConfig({ ...config, stages: newStages });
    };

    const exportTour = () => {
        if (!config.title || config.stages.length === 0) {
            alert('Please add a title and at least one stage before exporting.');
            return;
        }

        try {
            exportTourToTypeScript(config);

            // Show instructions modal
            alert(`✅ Tour exported successfully!

📁 Next steps:
1. Copy the downloaded file to: src/data/tours/${config.id}-config.ts
2. Add export to src/data/tours/index.ts:
   export { ${config.id.toUpperCase().replace(/-/g, '_')}_CONFIG } from './${config.id}-config';
3. Restart dev server: npm run dev

Your tour will then appear in Pilot Academy!`);
        } catch (error: any) {
            console.error("Error exporting tour:", error);
            alert(`Failed to export tour: ${error.message}`);
        }
    };

    const handleImportTour = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            const importedConfig = importTourFromTypeScript(content);

            if (importedConfig) {
                setConfig(importedConfig);
                alert('✅ Tour imported successfully! You can now edit and re-export it.');
            } else {
                alert('❌ Failed to import tour. Please check the file format.');
            }
        };
        reader.readAsText(file);

        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };



    return (
        <div className="flex h-screen bg-slate-950 text-white overflow-hidden font-sans relative">

            {/* LEFT PANEL: EDITOR */}
            <div className="w-[450px] flex flex-col border-r border-slate-800 bg-slate-900/50">
                <div className="flex flex-col border-b border-slate-800">
                    <div className="p-4 flex items-center justify-between">
                        <h1 className="font-bold text-lg flex items-center gap-2 text-white">
                            <Layout className="text-indigo-500" /> AcademyCreator <span className="text-[10px] bg-indigo-900 px-1 rounded text-indigo-200">v2.1</span>
                        </h1>
                    </div>

                    {/* Toolbar */}
                    <div className="px-4 pb-4 flex gap-2 overflow-x-auto">
                        {/* New Tour Button */}
                        <button
                            onClick={handleNewTour}
                            className="h-9 px-3 flex items-center gap-2 rounded-lg text-xs font-medium transition-colors border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                            title="Start New Tour"
                        >
                            <FilePlus size={16} />
                            <span>New</span>
                        </button>

                        {/* Import Tour */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".ts"
                            onChange={handleImportTour}
                            className="hidden"
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="h-9 px-3 flex items-center gap-2 rounded-lg text-xs font-medium transition-colors border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                            title="Import .ts Tour"
                        >
                            <FolderInput size={16} />
                            <span>Import</span>
                        </button>

                        <div className="w-px h-9 bg-slate-800 mx-1" /> {/* Divider */}

                        {/* Dev Auto-Save Button (Only in Dev Mode) */}
                        {import.meta.env.DEV && (
                            <button
                                onClick={handleDevSave}
                                className="h-9 px-3 flex items-center gap-2 rounded-lg text-xs font-medium transition-colors border border-green-900/50 bg-green-950/30 hover:bg-green-900/50 text-green-400"
                                title="Auto-Save to Disk (Dev Only)"
                            >
                                <Save size={16} />
                                <span>Save</span>
                            </button>
                        )}

                        {/* Export Tour as TypeScript */}
                        <button
                            onClick={exportTour}
                            className="h-9 px-3 flex items-center gap-2 rounded-lg text-xs font-medium transition-colors bg-indigo-600 hover:bg-indigo-500 text-white ml-auto"
                            title="Export as TypeScript file"
                        >
                            <Download size={16} />
                            <span>Export</span>
                        </button>
                    </div>
                </div>

                <div className="flex border-b border-slate-800">
                    <button onClick={() => setActiveTab('settings')} className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'settings' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>Settings</button>
                    <button onClick={() => setActiveTab('stages')} className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'stages' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>Stages ({config.stages.length})</button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {activeTab === 'settings' && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Target Role</label>
                                <select
                                    value={availableRoles.find(r => r.displayName === config.role)?.roleId || 'custom'}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (val === 'custom') {
                                            setConfig({ ...config, role: 'CUSTOM ROLE', id: `custom-${Date.now()}` });
                                        } else {
                                            const role = availableRoles.find(r => r.roleId === val);
                                            if (role) {
                                                setConfig({ ...config, role: role.displayName, id: role.roleId });
                                            }
                                        }
                                    }}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 focus:border-indigo-500 focus:outline-none mb-2"
                                >
                                    <option value="custom">Custom (Create New)</option>
                                    <option disabled>--- System Roles ---</option>
                                    {availableRoles.map(role => (
                                        <option key={role.roleId} value={role.roleId}>{role.displayName}</option>
                                    ))}
                                </select>

                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Role Name (Display)</label>
                                <input type="text" value={config.role} onChange={(e) => setConfig({ ...config, role: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 focus:border-indigo-500 focus:outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tour Title</label>
                                <input type="text" value={getStringValue(config.title)} onChange={(e) => setConfig({ ...config, title: setStringValue(e.target.value) })} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 focus:border-indigo-500 focus:outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tour Description</label>
                                <textarea
                                    value={getStringValue(config.description)}
                                    onChange={(e) => setConfig({ ...config, description: setStringValue(e.target.value) })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 focus:border-indigo-500 focus:outline-none text-sm h-20 resize-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Layout Style</label>
                                <select value={config.layout || 'immersive'} onChange={(e) => setConfig({ ...config, layout: e.target.value as any })} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 focus:border-indigo-500 focus:outline-none">
                                    <option value="immersive">Immersive (Full Screen)</option>
                                    <option value="sidebar">Sidebar (Story Telling)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Theme Color (Hex)</label>
                                <div className="flex gap-2">
                                    <input type="color" value={config.theme.primary} onChange={(e) => setConfig({ ...config, theme: { ...config.theme, primary: e.target.value } })} className="w-10 h-10 rounded border-none cursor-pointer" />
                                    <input type="text" value={config.theme.primary} onChange={(e) => setConfig({ ...config, theme: { ...config.theme, primary: e.target.value } })} className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-2.5 uppercase" />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'stages' && (
                        <div className="space-y-4">
                            {config.stages.map((stage, idx) => (
                                <div key={stage.id} className="bg-slate-800/30 border border-slate-800 rounded-xl p-4 group relative hover:border-slate-700 transition-all">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <span className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold">{idx + 1}</span>
                                            <span className="text-sm font-bold text-slate-300">{stage.type}</span>
                                        </div>
                                        <div className="flex items-center gap-1 opacity-100 transition-opacity">
                                            <button
                                                onClick={() => idx > 0 && moveStage(idx, -1)}
                                                disabled={idx === 0}
                                                className="p-1.5 text-slate-500 hover:text-indigo-400 disabled:opacity-30 disabled:hover:text-slate-500 bg-slate-900/50 rounded hover:bg-slate-800 transition-colors"
                                                title="Move Up"
                                            >
                                                <ArrowUp size={14} />
                                            </button>
                                            <button
                                                onClick={() => idx < config.stages.length - 1 && moveStage(idx, 1)}
                                                disabled={idx === config.stages.length - 1}
                                                className="p-1.5 text-slate-500 hover:text-indigo-400 disabled:opacity-30 disabled:hover:text-slate-500 bg-slate-900/50 rounded hover:bg-slate-800 transition-colors"
                                                title="Move Down"
                                            >
                                                <ArrowDown size={14} />
                                            </button>
                                            <div className="w-px h-4 bg-slate-800 mx-1" />
                                            <button onClick={() => duplicateStage(idx)} className="p-1.5 text-slate-500 hover:text-emerald-400 bg-slate-900/50 rounded hover:bg-slate-800 transition-colors" title="Duplicate Stage">
                                                <Copy size={14} />
                                            </button>
                                            <button onClick={() => removeStage(idx)} className="p-1.5 text-slate-500 hover:text-red-400 bg-slate-900/50 rounded hover:bg-slate-800 transition-colors ml-1" title="Delete Stage">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                    <input type="text" value={stage.title} onChange={(e) => updateStage(idx, 'title', e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 mb-2 text-sm focus:border-indigo-500 focus:outline-none transition-colors" placeholder="Stage Title" />

                                    {/* Simple JSON Edit for now - Ideally replace with visual builders */}
                                    <textarea
                                        value={stage.type === 'text-concept' ? (stage as any).content : JSON.stringify((stage as any).data || (stage as any).nodes || [], null, 2)}
                                        onChange={(e) => {
                                            if (stage.type === 'text-concept') updateStage(idx, 'content', e.target.value);
                                            // Handling JSON parse risks for prototype
                                        }}
                                        className="w-full h-24 bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs font-mono text-slate-400 focus:border-indigo-500 focus:outline-none transition-colors"
                                        placeholder="Content data..."
                                    />

                                    <div className="flex items-center justify-between mt-2">
                                        <div className="text-[10px] text-slate-500 italic">
                                            *For advanced edits, edit JSON directly.
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock size={12} className="text-slate-500" />
                                            <label className="text-[10px] font-bold text-slate-500 uppercase">TIME (SEC)</label>
                                            <input
                                                type="number"
                                                value={stage.duration || 5}
                                                onChange={(e) => updateStage(idx, 'duration', parseInt(e.target.value))}
                                                className="w-12 bg-slate-950 border border-slate-800 rounded p-1 text-xs text-center focus:border-indigo-500 focus:outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}

                            <div className="grid grid-cols-2 gap-2 pt-4">
                                <button onClick={() => handleSmartAdd('matrix-2x2')} disabled={isGenerating} className="relative flex flex-col items-center justify-center gap-2 p-4 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors border border-slate-700 hover:border-indigo-500 group disabled:opacity-50">
                                    <Grid size={24} className="text-indigo-400 group-hover:scale-110 transition-transform" />
                                    <span className="text-xs font-bold">Smart Matrix</span>
                                    <Sparkles size={12} className="absolute top-2 right-2 text-indigo-400 opacity-50" />
                                </button>
                                <button onClick={() => handleSmartAdd('bar-chart')} disabled={isGenerating} className="relative flex flex-col items-center justify-center gap-2 p-4 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors border border-slate-700 hover:border-cyan-500 group disabled:opacity-50">
                                    <BarChart size={24} className="text-cyan-400 group-hover:scale-110 transition-transform" />
                                    <span className="text-xs font-bold">Smart Chart</span>
                                    <Sparkles size={12} className="absolute top-2 right-2 text-cyan-400 opacity-50" />
                                </button>
                                <button onClick={() => handleSmartAdd('process-flow')} disabled={isGenerating} className="relative flex flex-col items-center justify-center gap-2 p-4 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors border border-slate-700 hover:border-purple-500 group disabled:opacity-50">
                                    <GitBranch size={24} className="text-purple-400 group-hover:scale-110 transition-transform" />
                                    <span className="text-xs font-bold">Smart Flow</span>
                                    <Sparkles size={12} className="absolute top-2 right-2 text-purple-400 opacity-50" />
                                </button>
                                <button onClick={() => handleSmartAdd('text-concept')} disabled={isGenerating} className="relative flex flex-col items-center justify-center gap-2 p-4 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors border border-slate-700 hover:border-emerald-500 group disabled:opacity-50">
                                    <Type size={24} className="text-emerald-400 group-hover:scale-110 transition-transform" />
                                    <span className="text-xs font-bold">Smart Text</span>
                                    <Sparkles size={12} className="absolute top-2 right-2 text-emerald-400 opacity-50" />
                                </button>
                                <button onClick={handleSmartImage} disabled={isGenerating} className="relative flex flex-col items-center justify-center gap-2 p-4 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors border border-slate-700 hover:border-pink-500 group disabled:opacity-50 col-span-2">
                                    <ImageIcon size={24} className="text-pink-400 group-hover:scale-110 transition-transform" />
                                    <span className="text-xs font-bold">Smart Image (Google Imagen)</span>
                                    <Sparkles size={12} className="absolute top-2 right-2 text-pink-400 opacity-50" />
                                </button>
                            </div>

                            {isGenerating && (
                                <div className="flex items-center justify-center gap-2 py-4 text-indigo-400 animate-pulse">
                                    <Loader2 size={16} className="animate-spin" />
                                    <span className="text-xs font-medium">Generating content with AI...</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div >

            {/* RIGHT PANEL: LIVE PREVIEW */}
            < div className="flex-1 bg-slate-950 relative flex flex-col" >
                <div className="absolute top-4 right-4 z-50 flex gap-2">
                    <div className="bg-slate-900/80 backdrop-blur rounded-full p-1 flex items-center border border-slate-700">
                        <button
                            onClick={() => setGenerationLanguage('es')}
                            className={`px-3 py-1 text-xs font-bold rounded-full transition-colors ${generationLanguage === 'es' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                        >
                            ES
                        </button>
                        <button
                            onClick={() => setGenerationLanguage('en')}
                            className={`px-3 py-1 text-xs font-bold rounded-full transition-colors ${generationLanguage === 'en' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                        >
                            EN
                        </button>
                    </div>
                    <button onClick={() => setShowPreview(!showPreview)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-full shadow-lg font-bold transition-all">
                        <Play size={16} fill="currentColor" /> {showPreview ? 'Stop Preview' : 'Run Tour'}
                    </button>
                </div>

                {
                    showPreview ? (
                        <div className="w-full h-full">
                            <DynamicTour config={config} onClose={() => setShowPreview(false)} onBack={() => setShowPreview(false)} isPreview={true} />
                        </div>
                    ) : (
                        <div className="text-center p-20 opacity-50">
                            <h2 className="text-2xl font-bold text-slate-700 mb-2">Live Canvas</h2>
                            <p className="text-slate-500">Click "Run Tour" to test your configuration interactively.</p>
                        </div>
                    )
                }
            </div >

            {/* Image Upload Modal */}
            < ImageUploadCropModal
                isOpen={showImageModal}
                onClose={() => setShowImageModal(false)
                }
                onImageCropped={handleImageCropped}
                roleName={config.role}
            />
        </div >
    );
}
