import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { rolesService } from '../services/firebase/rolesService';
import { RoleConfig } from '../types/roles';
import { usersService, UserProfile } from '../services/firebase/usersService';
import { subscriptionService, SubscriptionPlan } from '../services/firebase/subscriptionService';
import { aiModelsService, AIModel } from '../services/firebase/aiModelsService';
import { Settings, Users, CreditCard, FlaskConical, Play, RotateCcw, Cpu, CheckCircle, Network, Layout, ChevronRight, Trash2, Mail, Wand2, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { aiService } from '../services/ai/aiService';
import AIModelsManager from '../components/AIModelsManager';
import { ArchitectureExplorer } from '../components/admin/architecture/ArchitectureExplorer';
import { validateOutput } from '../services/ai/outputValidator';
import { SynthesisAgentPanel } from '../components/admin/roles/SynthesisAgentPanel';


import { RichContentRenderer } from '../components/RichContentRenderer';
import VoiceTestPage from './VoiceTestPage';
import { UserList } from '../components/admin/users/UserList';
import { RoleList } from '../components/admin/roles/RoleList';
import { SubscriptionPlans } from '../components/admin/subscriptions/SubscriptionPlans';
import { InviteUserModal } from '../components/admin/invitations/InviteUserModal';
import { EditRoleModal } from '../components/admin/roles/EditRoleModal';
import { EditPlanModal } from '../components/admin/subscriptions/EditPlanModal';
import { EditUserModal } from '../components/admin/users/EditUserModal';
import { cn } from '../lib/utils';
import { WarRoomStylesManager } from '../components/admin/war-room/WarRoomStylesManager';
import { MarketIntelligence } from '../components/admin/MarketIntelligence';
import { WaitlistPanel } from '../components/admin/waitlist/WaitlistPanel';
import { SystemMonitoring } from '../components/admin/SystemMonitoring';
import { TrendingUp } from 'lucide-react';

type AdminTab = 'roles' | 'users' | 'subscriptions' | 'docs' | 'workbench' | 'aimodels' | 'voice-test' | 'monitoring' | 'architecture' | 'war-room-styles' | 'market-intelligence' | 'waitlist' | 'academy-creator';


export default function AdminConsole() {
    const { t } = useTranslation('translation');
    const [activeTab, setActiveTab] = useState<AdminTab>('roles');
    const navigate = useNavigate();

    // Data States
    const [roles, setRoles] = useState<RoleConfig[]>([]);
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [availableModels, setAvailableModels] = useState<AIModel[]>([]);

    // UI States
    const [isLoading, setIsLoading] = useState(false);
    const [editingRole, setEditingRole] = useState<RoleConfig | null>(null);
    const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
    const [isCreatingUser, setIsCreatingUser] = useState(false);
    const [editingUser, setEditingUser] = useState<UserProfile | null>(null);

    // Workbench States
    const [workbenchRoleId, setWorkbenchRoleId] = useState<string>('');
    const [testInput, setTestInput] = useState('');
    const [testOutput, setTestOutput] = useState('');
    const [isTesting, setIsTesting] = useState(false);

    // Drag and Drop States
    const [draggedRole, setDraggedRole] = useState<RoleConfig | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    // Cleanup duplicates state
    const [isCleaningUp, setIsCleaningUp] = useState(false);
    const [cleanupResult, setCleanupResult] = useState<{ cleaned: number; total: number; details: string[] } | null>(null);

    const loadData = async () => {
        setIsLoading(true);
        try {
            if (activeTab === 'roles' && roles.length === 0) {
                const data = await rolesService.getAllRoles();
                setRoles(data);
            } else if (activeTab === 'users' && users.length === 0) {
                const data = await usersService.getAllUsers();
                setUsers(data);
            } else if (activeTab === 'subscriptions' && plans.length === 0) {
                const data = await subscriptionService.getAllPlans();
                setPlans(data);
            }

            // Always fetch plans for dropdowns (needed for EditUserModal)
            if (plans.length === 0) {
                const plansData = await subscriptionService.getAllPlans();
                setPlans(plansData);
            }

            // Always fetch active models for dropdowns
            if (availableModels.length === 0) {
                const models = await aiModelsService.getActiveModels();
                setAvailableModels(models);
            }
        } catch (error) {
            console.error("Error loading data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab]);

    // Refresh available models when opening role edit modal
    useEffect(() => {
        if (editingRole) {
            const refreshModels = async () => {
                const models = await aiModelsService.getActiveModels();
                setAvailableModels(models);
            };
            refreshModels();
        }
    }, [editingRole]);

    const handleSaveRole = async (role: RoleConfig) => {
        try {
            // Sanitize data before saving
            const roleToSave = { ...role };
            if (typeof roleToSave.temperature !== 'number' || isNaN(roleToSave.temperature)) {
                roleToSave.temperature = 0.7; // Default fallback
            }

            // Duplicate Check
            const isDuplicate = roles.some(r =>
                r.displayName.trim().toLowerCase() === roleToSave.displayName.trim().toLowerCase() &&
                r.roleId !== roleToSave.roleId
            );

            if (isDuplicate) {
                alert(`A role with the name "${roleToSave.displayName}" already exists. Please choose a different name.`);
                return;
            }

            console.log('[AdminConsole] Saving role:', roleToSave);
            await rolesService.updateRoleConfig(roleToSave.roleId, roleToSave);
            console.log('[AdminConsole] Role saved successfully');

            setRoles(roles.map(r => r.roleId === roleToSave.roleId ? roleToSave : r));

            // If it's a new role (not in current list), add it
            if (!roles.find(r => r.roleId === roleToSave.roleId)) {
                setRoles([...roles, roleToSave]);
            }

            setEditingRole(null);
            alert("Role updated successfully!");
        } catch (error: any) {
            console.error("[AdminConsole] Error saving role:", error);
            const errorMsg = error?.message || String(error);
            alert(`Failed to save role: ${errorMsg}`);
        }
    };

    // Drag and Drop Handlers
    const handleDragStart = (role: RoleConfig) => {
        setDraggedRole(role);
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        setDragOverIndex(index);
    };

    const handleDragLeave = () => {
        setDragOverIndex(null);
    };

    const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
        e.preventDefault();
        setDragOverIndex(null);

        if (!draggedRole) return;

        const dragIndex = roles.findIndex(r => r.roleId === draggedRole.roleId);
        if (dragIndex === dropIndex) return;

        // Reorder roles array
        const newRoles = [...roles];
        const [removed] = newRoles.splice(dragIndex, 1);
        newRoles.splice(dropIndex, 0, removed);

        // Update orderIndex for all roles
        const updatedRoles = newRoles.map((role, index) => ({
            ...role,
            orderIndex: index
        }));

        setRoles(updatedRoles);

        // Save new order to Firestore
        try {
            for (const role of updatedRoles) {
                await rolesService.updateRoleConfig(role.roleId, { orderIndex: role.orderIndex });
            }
        } catch (error) {
            console.error("Error updating role order:", error);
        }

        setDraggedRole(null);
    };



    const handleExportRoles = async () => {
        try {
            const jsonString = await rolesService.exportRolesToJSON();

            // Create download link
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `pilotai-roles-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            alert('✅ Roles exported successfully!');
        } catch (error) {
            console.error("Error exporting roles:", error);
            alert("Error exporting roles. Check console.");
        }
    };

    const handleImportRoles = async () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';

        input.onchange = async (e: any) => {
            const file = e.target?.files?.[0];
            if (!file) return;

            try {
                const text = await file.text();

                if (!window.confirm(`This will import roles from "${file.name}". Existing roles with the same ID will be overwritten. Continue?`)) {
                    return;
                }

                setIsLoading(true);
                const result = await rolesService.importRolesFromJSON(text);

                if (result.errors.length > 0) {
                    console.error("Import errors:", result.errors);
                    alert(`Import completed with errors:\n${result.errors.join('\n')}\n\nImported: ${result.imported} roles`);
                } else {
                    alert(`✅ Import successful!\n\nImported: ${result.imported} roles`);
                }

                await loadData();
            } catch (error) {
                console.error("Error importing roles:", error);
                alert("Error importing roles. Check console.");
            } finally {
                setIsLoading(false);
            }
        };

        input.click();
    };


    const handleUpdateUserStatus = async (uid: string, status: 'active' | 'disabled') => {
        try {
            await usersService.updateUser(uid, { status });
            setUsers(users.map(u => u.uid === uid ? { ...u, status } : u));
        } catch (error) {
            console.error("Error updating user:", error);
        }
    };

    const handleDeleteRole = async (roleId: string) => {
        if (!window.confirm('Are you sure you want to delete this role? This action cannot be undone.')) return;

        try {
            // @ts-ignore
            await rolesService.deleteRole(roleId);
            setRoles(roles.filter(r => r.roleId !== roleId));
        } catch (error) {
            console.error("Error deleting role:", error);
            alert("Failed to delete role. Check console for details.");
        }
    };

    const handleDeleteUser = async (uid: string) => {
        if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

        try {
            await usersService.deleteUser(uid);
            setUsers(users.filter(u => u.uid !== uid));
        } catch (error) {
            console.error("Error deleting user:", error);
            alert("Failed to delete user. Check console for details.");
        }
    };

    const handleCleanupDuplicates = async () => {
        if (!window.confirm('Esto buscará y eliminará documentos Firestore duplicados (mismo email, diferente UID). ¿Continuar?')) return;
        setIsCleaningUp(true);
        setCleanupResult(null);
        try {
            const result = await usersService.cleanupAllDuplicates();
            setCleanupResult(result);
            // Reload users list after cleanup
            const fresh = await usersService.getAllUsers();
            setUsers(fresh);
        } catch (error) {
            console.error('Cleanup error:', error);
            alert('Error durante el cleanup. Ver consola.');
        } finally {
            setIsCleaningUp(false);
        }
    };

    const handleInviteUser = async (email: string, role: string, displayName: string, planId: string) => {
        const selectedPlan = plans.find(p => p.id === planId);
        let expirationDate = null;

        if (selectedPlan && selectedPlan.billingCycle !== 'lifetime') {
            const now = new Date();
            const duration = selectedPlan.durationValue || 1;

            if (selectedPlan.billingCycle === 'daily') now.setDate(now.getDate() + duration);
            if (selectedPlan.billingCycle === 'monthly') now.setMonth(now.getMonth() + duration);
            if (selectedPlan.billingCycle === 'yearly') now.setFullYear(now.getFullYear() + duration);
            expirationDate = now.toISOString();
        }

        await usersService.createInvitation(email, role, displayName, planId, expirationDate);
    };

    const handleEditUser = async (uid: string, updates: Partial<UserProfile>) => {
        try {
            await usersService.updateUser(uid, updates);
            setUsers(users.map(u => u.uid === uid ? { ...u, ...updates } : u));
        } catch (error) {
            console.error("Error editing user:", error);
            throw error;
        }
    };

    const handleRunTest = async () => {
        if (!workbenchRoleId || !testInput) return;

        const role = roles.find(r => r.roleId === workbenchRoleId);
        if (!role) return;

        setIsTesting(true);
        setTestOutput('Running analysis...');

        try {
            let systemPromptToUse = role.systemPrompt;

            // Inject Diagram Instructions if needed
            if (role.docConfig?.flowDiagrams || role.docConfig?.swimlanes || role.docConfig?.c4 || role.docConfig?.architecture) {
                systemPromptToUse += `
            
            - DIAGRAMS: Include a 'diagrams' key in your JSON response. This should be an array of diagram objects.
              
              CRITICAL: You must generate diagrams as structured JSON data, NOT as text-based diagram code.
              
              JSON STRUCTURE FOR DIAGRAMS:
              {
                "title": "Diagram Title",
                "description": "Brief description of what this diagram shows",
                "code": {
                  "direction": "TB", // or "LR"
                  "nodes": [
                    { "id": "node1", "label": "Start", "type": "start", "group": "Swimlane A" },
                    { "id": "node2", "label": "Process", "type": "default", "group": "Swimlane B" }
                  ],
                  "edges": [
                    { "from": "node1", "to": "node2", "label": "Action" }
                  ]
                }
              }

              Node Types: "start", "end", "condition", "database", "cloud", "default".
              Use the 'group' property to define swimlanes or clusters.`;
            }

            // Use generateJSON to ensure valid JSON output which is what the renderer expects
            const result = await aiService.generateJSON(role.model, systemPromptToUse, testInput);

            // Validate output quality
            const validation = validateOutput(result, role.roleId);

            // Build output with validation results
            const outputWithValidation = {
              validation: {
                isValid: validation.isValid,
                errors: validation.errors,
                warnings: validation.warnings,
                status: validation.isValid ? '✅ VALID' : '❌ INVALID'
              },
              output: result
            };

            setTestOutput(JSON.stringify(outputWithValidation, null, 2));
        } catch (error: any) {
            setTestOutput(`Error: ${error.message}`);
        } finally {
            setIsTesting(false);
        }
    };

    const handleSavePlan = async (plan: SubscriptionPlan) => {
        try {
            if (plan.id.startsWith('new-plan-')) {
                const { id, ...planData } = plan;
                await subscriptionService.createPlan(planData);
            } else {
                await subscriptionService.updatePlan(plan.id, plan);
            }
            const data = await subscriptionService.getAllPlans();
            setPlans(data);
            setEditingPlan(null);
        } catch (error) {
            console.error("Error saving plan:", error);
        }
    };

    const renderWorkbenchContent = () => {
        const selectedRole = roles.find(r => r.roleId === workbenchRoleId);

        return (
            <div className="h-[calc(100vh-200px)] flex flex-col">
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-white">AI Workbench</h2>
                    <p className="text-slate-400">Test and debug AI prompts directly.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
                    <div className="lg:col-span-1 flex flex-col gap-4 overflow-y-auto pr-2">
                        <div className="bg-slate-900/50 border border-white/5 p-6 rounded-xl space-y-4">
                            <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Configuration</h3>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Role Agent</label>
                                <select
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={workbenchRoleId}
                                    onChange={(e) => setWorkbenchRoleId(e.target.value)}
                                >
                                    <option value="">Select a role...</option>
                                    {roles.map(role => (
                                        <option key={role.roleId} value={role.roleId}>{role.displayName}</option>
                                    ))}
                                </select>
                            </div>

                            {selectedRole && (
                                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-sm space-y-2">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-slate-500">Model:</span>
                                        <span className="font-mono font-medium text-slate-300 text-xs">{selectedRole.model}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Temperature:</span>
                                        <span className="font-mono font-medium text-slate-300">{selectedRole.temperature}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-500 block mb-1">System Prompt Preview:</span>
                                        <p className="text-slate-400 italic line-clamp-3 text-xs">
                                            {selectedRole.systemPrompt}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="bg-slate-900/50 border border-white/5 p-6 rounded-xl flex-1 flex flex-col">
                            <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">Test Input (Idea/Context)</h3>
                            <textarea
                                className="w-full flex-1 bg-slate-950 border border-slate-700 rounded-lg p-3 text-slate-200 resize-none font-sans focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="Enter a simulated user idea..."
                                value={testInput}
                                onChange={(e) => setTestInput(e.target.value)}
                            />
                            <button
                                className="w-full mt-4 flex items-center justify-center gap-2 py-2 rounded-lg font-bold bg-indigo-600 text-white hover:bg-indigo-500 transition-colors"
                                onClick={handleRunTest}
                                disabled={!selectedRole || !testInput || isTesting}
                            >
                                {isTesting ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        Running...
                                    </>
                                ) : (
                                    <>
                                        <Play className="h-4 w-4 fill-current" />
                                        Run Test
                                    </>
                                )}
                            </button>
                            <button
                                className="w-full mt-2 py-2 rounded-lg font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex items-center justify-center"
                                onClick={() => {
                                    setTestInput('');
                                    setTestOutput('');
                                }}
                                disabled={isTesting}
                            >
                                <RotateCcw className="h-4 w-4 mr-2" />
                                Clear
                            </button>
                        </div>
                    </div>

                    <div className="lg:col-span-2 flex flex-col min-h-0">
                        <div className="bg-slate-900/50 border border-white/5 p-6 rounded-xl flex-1 flex flex-col overflow-hidden">
                            <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">AI Response</h3>
                            <div className="flex-1 overflow-y-auto bg-slate-950 rounded-lg p-4 border border-slate-800 text-slate-300">
                                {testOutput ? (
                                    <div className="prose prose-invert prose-sm max-w-none">
                                        <RichContentRenderer
                                            content={testOutput}
                                            docConfig={selectedRole?.docConfig}
                                        />
                                    </div>
                                ) : (
                                    <p className="text-slate-500 italic">No output yet. Run a test to see results.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const tabs: { id: AdminTab, label: string, icon: any }[] = [
        { id: 'roles', label: t('admin.roleManagement'), icon: Settings },
        { id: 'users', label: t('admin.userManagement'), icon: Users },
        { id: 'subscriptions', label: t('admin.subscriptionPlans'), icon: CreditCard },
        { id: 'aimodels', label: 'AI Models', icon: Cpu },
        { id: 'monitoring', label: 'System & Models', icon: BarChart3 },
        { id: 'war-room-styles', label: 'War Room Styles', icon: Settings },
        { id: 'workbench', label: 'Workbench', icon: FlaskConical },
        { id: 'voice-test', label: 'Voice Test', icon: Settings },
        { id: 'architecture', label: 'Architecture', icon: Network },
        { id: 'market-intelligence', label: 'Market Intelligence', icon: TrendingUp },
        { id: 'waitlist', label: 'Waitlist', icon: Mail },
        { id: 'academy-creator', label: 'Academy Creator', icon: Wand2 },
    ];

    return (
        <div className="bg-slate-950 min-h-full">
        <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">{t('admin.title')}</h1>
                <p className="text-slate-400">{t('admin.subtitle')}</p>
            </div>

            {/* Horizontal Tabs - Advanced Scrollable Control */}
            <div className="relative group mb-8 border-b border-white/10">
                {/* Left Fade & Button */}
                <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-slate-950 to-transparent z-10 pointer-events-none" />
                <button
                    onClick={() => {
                        document.getElementById('admin-tabs-container')?.scrollBy({ left: -200, behavior: 'smooth' });
                    }}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-slate-800/80 p-2 rounded-full text-white shadow-lg hover:bg-indigo-600 transition-all opacity-0 group-hover:opacity-100 backdrop-blur-sm -ml-4"
                >
                    <ChevronRight size={20} className="rotate-180" />
                </button>

                {/* Right Fade & Button */}
                <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-slate-950 to-transparent z-10 pointer-events-none" />
                <button
                    onClick={() => {
                        document.getElementById('admin-tabs-container')?.scrollBy({ left: 200, behavior: 'smooth' });
                    }}
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-slate-800/80 p-2 rounded-full text-white shadow-lg hover:bg-indigo-600 transition-all opacity-0 group-hover:opacity-100 backdrop-blur-sm -mr-4"
                >
                    <ChevronRight size={20} />
                </button>

                {/* Scrollable Container */}
                <div
                    id="admin-tabs-container"
                    className="flex overflow-x-auto pb-4 gap-2 scrollbar-hide px-4 relative z-0"
                    onWheel={(e) => {
                        // Enable horizontal scrolling with mouse wheel
                        if (e.deltaY !== 0) {
                            e.preventDefault();
                            e.currentTarget.scrollLeft += e.deltaY;
                        }
                    }}
                >
                    {tabs.map((tab) => {
                        const isActive = activeTab === tab.id;
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-full whitespace-nowrap transition-all duration-200 border",
                                    isActive
                                        ? "bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-500/20 scale-105"
                                        : "bg-slate-900/50 text-slate-400 border-white/5 hover:bg-slate-800 hover:text-white hover:border-white/10"
                                )}
                            >
                                <Icon size={16} className={cn(isActive ? "text-indigo-200" : "text-slate-500")} />
                                <span className={cn("text-sm font-medium", isActive ? "text-white" : "text-slate-400 group-hover:text-slate-200")}>{tab.label}</span>
                            </button>
                        )
                    })}
                </div>
            </div>

            <div className="w-full">
                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                    </div>
                ) : (
                    <div className="animate-in fade-in duration-300">
                        {activeTab === 'roles' && (
                            <>
                                <RoleList
                                    roles={roles}
                                    dragOverIndex={dragOverIndex}
                                    onSave={handleSaveRole}
                                    onEdit={setEditingRole}
                                    onDelete={handleDeleteRole}
                                    onDragStart={handleDragStart}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    onExport={handleExportRoles}
                                    onImport={handleImportRoles}
                                />
                                <SynthesisAgentPanel />
                            </>
                        )}
                        {activeTab === 'users' && (
                            <div className="space-y-4">
                                {/* Cleanup duplicates toolbar */}
                                <div className="flex items-center gap-3 flex-wrap">
                                    <button
                                        onClick={handleCleanupDuplicates}
                                        disabled={isCleaningUp}
                                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                                    >
                                        <Trash2 size={14} />
                                        {isCleaningUp ? 'Limpiando...' : 'Cleanup Duplicates'}
                                    </button>
                                    {cleanupResult && (
                                        <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-800/60 border border-white/10 rounded-lg px-3 py-2">
                                            <CheckCircle size={13} className="text-emerald-400 shrink-0" />
                                            <span>
                                                {cleanupResult.cleaned === 0
                                                    ? `Sin duplicados — ${cleanupResult.total} docs OK`
                                                    : `${cleanupResult.cleaned} duplicado(s) eliminado(s) de ${cleanupResult.total} docs`}
                                            </span>
                                            {cleanupResult.details.length > 0 && (
                                                <details className="ml-1">
                                                    <summary className="cursor-pointer text-indigo-400">ver detalle</summary>
                                                    <ul className="mt-1 space-y-0.5 list-disc list-inside text-slate-500">
                                                        {cleanupResult.details.map((d, i) => <li key={i}>{d}</li>)}
                                                    </ul>
                                                </details>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <UserList
                                    users={users}
                                    onUpdateStatus={handleUpdateUserStatus}
                                    onDelete={handleDeleteUser}
                                    onCreate={() => setIsCreatingUser(true)}
                                    onEdit={setEditingUser}
                                />
                            </div>
                        )}
                        {activeTab === 'subscriptions' && (
                            <SubscriptionPlans
                                plans={plans}
                                onReset={async () => {
                                    if (!window.confirm(t('admin.confirmResetPlans', 'Are you sure? This will reset all plans to default settings in Firestore.'))) return;
                                    try {
                                        setIsLoading(true);
                                        await subscriptionService.initializeDefaultPlans();
                                        await loadData();
                                        alert(t('admin.plansResetSuccess', 'Subscription Plans initialized/reset successfully! includedRoles and limits are now in Firestore.'));
                                    } catch (error) {
                                        console.error(error);
                                        alert('Error resetting plans.');
                                    } finally {
                                        setIsLoading(false);
                                    }
                                }}
                                onEdit={setEditingPlan}
                                onCreate={() => setEditingPlan({
                                    id: `new-plan-${Date.now()}`,
                                    name: 'New Plan',
                                    price: 0,
                                    currency: 'USD',
                                    features: [],
                                    isActive: true,
                                    billingCycle: 'monthly',
                                    durationValue: 1,
                                    includedRoles: [],
                                    maxRoles: 2,
                                    limits: {
                                        analysesPerMonth: 10,
                                        maxProjects: 1,
                                        allowedModels: ['claude-haiku-4-5-20251001']
                                    }
                                })}
                            />
                        )}
                        {activeTab === 'aimodels' && <AIModelsManager />}
                        {activeTab === 'monitoring' && <SystemMonitoring />}
                        {activeTab === 'workbench' && renderWorkbenchContent()}
                        {activeTab === 'voice-test' && <VoiceTestPage />}
                        {activeTab === 'architecture' && <ArchitectureExplorer />}
                        {activeTab === 'war-room-styles' && <WarRoomStylesManager />}
                        {activeTab === 'market-intelligence' && <MarketIntelligence />}
                        {activeTab === 'waitlist' && <WaitlistPanel />}
                        {activeTab === 'academy-creator' && (() => {
                            // AcademyCreator is a full-screen tool — navigate to its own route
                            navigate('/app/academy-creator');
                            return null;
                        })()}
                    </div>
                )}
            </div>

            {/* Modals */}
            {isCreatingUser && (
                <InviteUserModal
                    plans={plans}
                    onClose={() => setIsCreatingUser(false)}
                    onInvite={handleInviteUser}
                />
            )}

            {editingRole && (
                <EditRoleModal
                    role={editingRole}
                    availableModels={availableModels}
                    onClose={() => setEditingRole(null)}
                    onSave={handleSaveRole}
                    onChange={setEditingRole}
                />
            )}

            {editingPlan && (
                <EditPlanModal
                    plan={editingPlan}
                    onClose={() => setEditingPlan(null)}
                    onSave={handleSavePlan}
                    onChange={setEditingPlan}
                />
            )}

            {editingUser && (
                <EditUserModal
                    user={editingUser}
                    plans={plans}
                    onClose={() => setEditingUser(null)}
                    onSave={handleEditUser}
                />
            )}
        </div>
        </div>
    );
}
