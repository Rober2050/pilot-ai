import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
    Plus,
    Search,
    Clock,
    CheckCircle2,
    AlertCircle,
    FileText,
    Trash2,
    Play,
    Loader2,
    Edit2,
    Eye,
    Copy,
    RefreshCw,
    Filter,
    X,
    Check,
    MoreHorizontal,
    LayoutGrid,
    List as ListIcon,
    ArrowRight,
    BarChart3,
    Zap,
    Layers,
    Briefcase,
    Sparkles,
    Terminal,
    ShieldCheck,
    Palette,
    Workflow,
    Server,
} from 'lucide-react';
import { projectsService } from '../services/firebase/projectsService';
import { Project } from '../types/blueprint';
import { useAuth } from '../contexts/AuthContext';
import { useWorkflow } from '../contexts/WorkflowContext';
import { cn } from '../lib/utils';

// Maps roleId → icon/color for the execution strip in each card
const ROLE_ICONS: Record<string, { icon: React.ElementType; bg: string; color: string; border: string; label: string }> = {
    'strategy-analyst':   { icon: Briefcase,   bg: 'bg-yellow-50',  color: 'text-yellow-600', border: 'border-yellow-200',  label: 'Strategy Analyst'  },
    'product-manager':    { icon: Layers,      bg: 'bg-purple-50',  color: 'text-purple-600', border: 'border-purple-200',  label: 'Product Manager'   },
    'business-analyst':   { icon: BarChart3,   bg: 'bg-cyan-50',    color: 'text-cyan-600',   border: 'border-cyan-200',    label: 'Business Analyst'  },
    'marketing-manager':  { icon: Sparkles,    bg: 'bg-pink-50',    color: 'text-pink-600',   border: 'border-pink-200',    label: 'Marketing Manager' },
    'architect':          { icon: Terminal,    bg: 'bg-blue-50',    color: 'text-blue-600',   border: 'border-blue-200',    label: 'Architect'         },
    'software-architect': { icon: Terminal,    bg: 'bg-blue-50',    color: 'text-blue-600',   border: 'border-blue-200',    label: 'SW Architect'      },
    'qa-engineer':        { icon: ShieldCheck, bg: 'bg-green-50',   color: 'text-green-600',  border: 'border-green-200',   label: 'QA Engineer'       },
    'ux-designer':        { icon: Palette,     bg: 'bg-violet-50',  color: 'text-violet-600', border: 'border-violet-200',  label: 'UX/UI Designer'    },
    'project-manager':    { icon: Workflow,    bg: 'bg-orange-50',  color: 'text-orange-600', border: 'border-orange-200',  label: 'Project Manager'   },
    'backend-dev':        { icon: Server,      bg: 'bg-slate-100',  color: 'text-slate-600',  border: 'border-slate-200',   label: 'Backend Dev'       },
    'frontend-dev':       { icon: Zap,         bg: 'bg-teal-50',    color: 'text-teal-600',   border: 'border-teal-200',    label: 'Frontend Dev'      },
    'devops':             { icon: Server,      bg: 'bg-amber-50',   color: 'text-amber-600',  border: 'border-amber-200',   label: 'DevOps'            },
};

/**
 * Derives the real project status from role execution data.
 * - draft      : 0 roles have been completed (nothing started)
 * - in_progress: at least 1 role completed
 * - completed  : explicitly stored as 'completed' in Firestore (set by StrategyHub
 *                only when ALL enabled roles are done)
 *
 * We intentionally do NOT derive 'completed' here because blueprint.roles only
 * contains roles that were actually run — comparing completed/total executed would
 * falsely flag a project as done after just 2 out of 8 roles finish.
 */
const computeProjectStatus = (project: Project): 'draft' | 'in_progress' | 'completed' => {
    const entries = Object.values(project.blueprint?.roles ?? {});
    const completedRoles = entries.filter(r => r?.status === 'completed').length;
    if (completedRoles === 0) return 'draft';
    if (project.status === 'completed') return 'completed';
    return 'in_progress';
};

const METHODOLOGY_BADGE = {
    pmo:    { icon: BarChart3, bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200', labelKey: 'methodology.mode.badge.pmo' },
    agile:  { icon: Zap,       bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', labelKey: 'methodology.mode.badge.agile' },
    hybrid: { icon: Layers,    bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', labelKey: 'methodology.mode.badge.hybrid' },
} as const;

export default function ProjectList() {
    const { t } = useTranslation('translation');
    const { t: tp } = useTranslation('planning');
    const { user } = useAuth();
    const { refreshTrigger } = useWorkflow();
    const navigate = useNavigate();

    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0, inProgress: 0, completed: 0, draft: 0 });
    const [statusFilter, setStatusFilter] = useState<'all' | 'in_progress' | 'completed' | 'draft'>('all');
    const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const isSelecting = selectedIds.size > 0;

    const [showIterateModal, setShowIterateModal] = useState(false);
    const [iterateProject, setIterateProject] = useState<Project | null>(null);
    const [iterateIdea, setIterateIdea] = useState('');

    useEffect(() => {
        if (user) {
            loadProjects();
        }
    }, [user, refreshTrigger]);

    const loadProjects = async () => {
        setLoading(true);
        try {
            if (!user) return;
            const userProjects = await projectsService.getUserProjects(user.uid);
            setProjects(userProjects);

            // Stats derived from real execution data (not stored status)
            const newStats = {
                total: userProjects.length,
                inProgress: userProjects.filter(p => computeProjectStatus(p) === 'in_progress').length,
                completed: userProjects.filter(p => computeProjectStatus(p) === 'completed').length,
                draft: userProjects.filter(p => computeProjectStatus(p) === 'draft').length,
            };
            setStats(newStats);

            // Auto-sync Firestore status for any project that is out of sync
            const toSync = userProjects.filter(p => computeProjectStatus(p) !== p.status);
            if (toSync.length > 0) {
                await Promise.all(
                    toSync.map(p => projectsService.updateProjectStatus(p.id, computeProjectStatus(p)))
                );
            }
        } catch (error) {
            console.error("Error loading projects:", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleSelect = (e: React.MouseEvent, projectId: string) => {
        e.stopPropagation();
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(projectId)) next.delete(projectId);
            else next.add(projectId);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === filteredProjects.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredProjects.map(p => p.id)));
        }
    };

    const handleBulkDelete = async () => {
        const count = selectedIds.size;
        if (window.confirm(`¿Eliminar ${count} proyecto${count > 1 ? 's' : ''}? Esta acción no se puede deshacer.`)) {
            try {
                await Promise.all([...selectedIds].map(id => projectsService.deleteProject(id)));
                setSelectedIds(new Set());
                loadProjects();
            } catch (error) {
                console.error("Error deleting projects:", error);
            }
        }
    };

    const handleDelete = async (e: React.MouseEvent, projectId: string) => {
        e.stopPropagation();
        if (window.confirm(t('dashboard.confirmDelete') || "Are you sure you want to delete this project?")) {
            try {
                await projectsService.deleteProject(projectId);
                loadProjects();
            } catch (error) {
                console.error("Error deleting project:", error);
            }
        }
    };

    const handleEditTitle = (e: React.MouseEvent, project: Project) => {
        e.stopPropagation();
        setEditingProjectId(project.id);
        setEditTitle(project.blueprint.meta.projectName);
    };

    const saveTitle = async (projectId: string) => {
        if (!editTitle.trim()) return;
        try {
            await projectsService.updateProjectName(projectId, editTitle);
            setEditingProjectId(null);
            loadProjects();
        } catch (error) {
            console.error("Error updating project name:", error);
        }
    };

    const handleClone = async (e: React.MouseEvent, project: Project) => {
        e.stopPropagation();
        if (!user) return;
        if (window.confirm(`Clone "${project.blueprint.meta.projectName}"?`)) {
            try {
                const idea = typeof project.ideaOriginal === 'string' ? project.ideaOriginal : JSON.stringify(project.ideaOriginal);
                await projectsService.createProject(user.uid, idea, project.language);
                loadProjects();
            } catch (error) {
                console.error("Error cloning project:", error);
            }
        }
    };

    const openIterateModal = (e: React.MouseEvent, project: Project) => {
        e.stopPropagation();
        setIterateProject(project);
        setIterateIdea(typeof project.ideaOriginal === 'string' ? project.ideaOriginal : JSON.stringify(project.ideaOriginal));
        setShowIterateModal(true);
    };

    const handleIterate = async () => {
        if (!user || !iterateProject) return;
        try {
            const newId = await projectsService.createProject(user.uid, iterateIdea, iterateProject.language);
            setShowIterateModal(false);
            setIterateProject(null);
            loadProjects();
            navigate(`/app/strategy-hub?projectId=${newId}`);
        } catch (error) {
            console.error("Error iterating project:", error);
        }
    };

    const filteredProjects = projects.filter(p => {
        if (statusFilter === 'all') return true;
        return computeProjectStatus(p) === statusFilter;
    });

    const handleResume = (projectId: string) => {
        navigate(`/app/strategy-hub?projectId=${projectId}`);
    };

    const handleNewProject = () => {
        navigate('/app/strategy-hub?new=true');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
            </div>
        );
    }

    const StatCard = ({ label, value, icon: Icon, color, bgGradient }: any) => (
        <div className="relative overflow-hidden bg-white p-6 rounded-2xl shadow-sm border border-slate-100 group hover:shadow-lg transition-all duration-300">
            <div className={cn("absolute top-0 right-0 w-32 h-32 opacity-10 rounded-full blur-3xl -mr-16 -mt-16 transition-transform group-hover:scale-110", bgGradient)}></div>
            <div className="relative z-10 flex items-center justify-between">
                <div>
                    <h3 className="text-3xl font-extrabold text-slate-800 tracking-tight">{value}</h3>
                    <p className="text-sm font-semibold text-slate-500 mt-1 uppercase tracking-wide">{label}</p>
                </div>
                <div className={cn("p-4 rounded-xl shadow-sm transform group-hover:rotate-6 transition-transform", color)}>
                    <Icon size={24} className="text-white" />
                </div>
            </div>
        </div>
    );

    return (
        <div className="w-full max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8 space-y-8">

            {/* 1. Premium Header Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    label="Total Projects"
                    value={stats.total}
                    icon={LayoutGrid}
                    color="bg-indigo-600"
                    bgGradient="bg-indigo-500"
                />
                <StatCard
                    label="In Progress"
                    value={stats.inProgress}
                    icon={Clock}
                    color="bg-blue-500"
                    bgGradient="bg-blue-500"
                />
                <StatCard
                    label="Completed"
                    value={stats.completed}
                    icon={CheckCircle2}
                    color="bg-emerald-500"
                    bgGradient="bg-emerald-500"
                />
                <StatCard
                    label="Drafts"
                    value={stats.draft}
                    icon={AlertCircle}
                    color="bg-amber-500"
                    bgGradient="bg-amber-500"
                />
            </div>

            {/* 2. Enhanced Filter & Search Bar */}
            <div className="flex flex-col md:flex-row items-center gap-4 bg-white/80 backdrop-blur-xl p-4 rounded-2xl border border-white/20 shadow-sm sticky top-4 z-20">
                <div className="relative w-full md:w-auto min-w-[200px]">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        className="w-full appearance-none bg-white border border-slate-200 rounded-xl py-3 pl-12 pr-10 text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                    >
                        <option value="all">All Projects</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="draft">Drafts</option>
                    </select>
                    <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                </div>

                <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search projects by name or idea..."
                        className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                    />
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="bg-slate-100 p-1 rounded-xl flex items-center hidden sm:flex">
                        <button
                            onClick={() => setViewMode('list')}
                            className={cn("p-2 rounded-lg transition-all", viewMode === 'list' ? "bg-white shadow text-indigo-600" : "text-slate-500 hover:text-slate-700")}
                        >
                            <ListIcon size={18} />
                        </button>
                        <button
                            onClick={() => setViewMode('grid')}
                            className={cn("p-2 rounded-lg transition-all", viewMode === 'grid' ? "bg-white shadow text-indigo-600" : "text-slate-500 hover:text-slate-700")}
                        >
                            <LayoutGrid size={18} />
                        </button>
                    </div>

                    <button
                        onClick={handleNewProject}
                        className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-0.5"
                    >
                        <Plus size={20} />
                        New Project
                    </button>
                </div>
            </div>

            {/* 3. Floating Strip List / Card Grid */}
            <div className={cn("grid gap-4 transition-all", viewMode === 'grid' ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3" : "grid-cols-1")}>
                {filteredProjects.length === 0 ? (
                    <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-slate-200">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Plus className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">No projects found</h3>
                        <p className="text-slate-500 max-w-md mx-auto mb-6">Start your first AI-driven strategy project to see the magic happen.</p>
                        <button onClick={handleNewProject} className="text-indigo-600 font-bold hover:underline">Create Project</button>
                    </div>
                ) : (
                    filteredProjects.map((project) => (
                        <div
                            key={project.id}
                            onClick={() => handleResume(project.id)}
                            className={cn(
                                "group bg-white border p-5 cursor-pointer relative overflow-hidden transition-all duration-300 hover:shadow-md",
                                viewMode === 'list' ? "rounded-2xl flex flex-col md:flex-row items-start md:items-center gap-6" : "rounded-3xl flex flex-col gap-4 h-full",
                                selectedIds.has(project.id)
                                    ? "border-indigo-400 bg-indigo-50/30 shadow-sm shadow-indigo-100"
                                    : "border-slate-200/60 hover:border-indigo-300"
                            )}
                        >
                            {/* Hover / selection indicator stripe */}
                            <div className={cn(
                                "absolute left-0 top-0 bottom-0 w-1 transition-opacity",
                                selectedIds.has(project.id) ? "bg-indigo-500 opacity-100" : "bg-indigo-500 opacity-0 group-hover:opacity-100"
                            )} />

                            {/* Icon & Title */}
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                {/* Checkbox */}
                                <div
                                    onClick={(e) => toggleSelect(e, project.id)}
                                    className={cn(
                                        "w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 cursor-pointer transition-all",
                                        isSelecting ? "opacity-100" : "opacity-0 group-hover:opacity-100",
                                        selectedIds.has(project.id)
                                            ? "bg-indigo-600 border-indigo-600"
                                            : "bg-white border-slate-300 hover:border-indigo-400"
                                    )}
                                >
                                    {selectedIds.has(project.id) && <Check size={11} className="text-white" strokeWidth={3} />}
                                </div>

                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-50 to-slate-50 border border-slate-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-sm">
                                    <span className="text-lg font-bold text-indigo-600">
                                        {project.blueprint.meta.projectName?.[0] || 'P'}
                                    </span>
                                </div>
                                <div className="min-w-0 flex-1">
                                    {editingProjectId === project.id ? (
                                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                            <input
                                                type="text"
                                                value={editTitle}
                                                onChange={(e) => setEditTitle(e.target.value)}
                                                className="w-full text-base font-bold text-slate-800 bg-white border border-indigo-300 rounded-lg px-2 py-1 focus:ring-2 focus:ring-indigo-500"
                                                autoFocus
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') saveTitle(project.id);
                                                    if (e.key === 'Escape') setEditingProjectId(null);
                                                }}
                                            />
                                            <button onClick={() => saveTitle(project.id)} className="text-emerald-600 hover:bg-emerald-50 p-1.5 rounded-lg"><CheckCircle2 size={16} /></button>
                                        </div>
                                    ) : (
                                        <div className="group/title">
                                            <h4 className="text-base font-bold text-slate-800 group-hover:text-indigo-700 truncate flex items-center gap-2">
                                                {project.blueprint.meta.projectName || 'Untitled Project'}
                                                <button
                                                    onClick={(e) => handleEditTitle(e, project)}
                                                    className="opacity-0 group-hover/title:opacity-100 text-slate-400 hover:text-indigo-600 transition-opacity"
                                                >
                                                    <Edit2 size={12} />
                                                </button>
                                            </h4>
                                            <p className="text-sm text-slate-500 truncate mt-0.5">
                                                {typeof project.ideaOriginal === 'object'
                                                    ? (project.ideaOriginal as any).description || JSON.stringify(project.ideaOriginal)
                                                    : project.ideaOriginal}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Meta Grid (Methodology, Status, Date) */}
                            <div className={cn("flex items-center gap-3 flex-wrap", viewMode === 'grid' ? "justify-between w-full border-t border-slate-50 pt-4" : "md:w-auto")}>
                                {/* Methodology badge */}
                                {(() => {
                                    const mKey = (project.blueprint?.meta?.methodology ?? 'pmo') as 'agile' | 'pmo' | 'hybrid';
                                    const cfg = METHODOLOGY_BADGE[mKey] ?? METHODOLOGY_BADGE.pmo;
                                    const Icon = cfg.icon;
                                    return (
                                        <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold", cfg.bg, cfg.text, cfg.border)}>
                                            <Icon size={10} />
                                            {tp(cfg.labelKey)}
                                        </span>
                                    );
                                })()}
                                {(() => {
                                    const cs = computeProjectStatus(project);
                                    return (
                                        <span className={cn(
                                            "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border",
                                            cs === 'completed'   ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                            cs === 'in_progress' ? "bg-blue-50 text-blue-600 border-blue-100" :
                                                                   "bg-amber-50 text-amber-600 border-amber-100"
                                        )}>
                                            {cs.replace('_', ' ')}
                                        </span>
                                    );
                                })()}
                                <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                                    <Clock size={12} />
                                    {new Date(project.updatedAt).toLocaleDateString()}
                                </span>
                            </div>

                            {/* Executed role icons */}
                            {(() => {
                                const executed = Object.entries(project.blueprint?.roles ?? {})
                                    .filter(([, output]) => output?.status === 'completed')
                                    .map(([roleId]) => roleId);
                                if (executed.length === 0) return null;
                                return (
                                    <div className={cn("flex items-center gap-1", viewMode === 'grid' && "w-full")}>
                                        {executed.slice(0, 7).map(roleId => {
                                            const cfg = ROLE_ICONS[roleId];
                                            const Icon = cfg?.icon ?? FileText;
                                            const bg = cfg?.bg ?? 'bg-slate-100';
                                            const color = cfg?.color ?? 'text-slate-500';
                                            const border = cfg?.border ?? 'border-slate-200';
                                            const label = cfg?.label ?? roleId;
                                            return (
                                                <div
                                                    key={roleId}
                                                    title={label}
                                                    className={cn("w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border", bg, border)}
                                                >
                                                    <Icon size={11} className={color} />
                                                </div>
                                            );
                                        })}
                                        {executed.length > 7 && (
                                            <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-slate-100 border border-slate-200 shrink-0">
                                                <span className="text-[9px] font-bold text-slate-500">+{executed.length - 7}</span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}

                            {/* Actions */}
                            <div className={cn("flex items-center gap-2", viewMode === 'grid' && "justify-end")}>
                                <div className="flex -space-x-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-all duration-300 md:translate-x-4 group-hover:translate-x-0">
                                    <button
                                        onClick={(e) => openIterateModal(e, project)}
                                        className="w-8 h-8 flex items-center justify-center rounded-full bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-colors border border-indigo-100 hover:border-indigo-600"
                                        title="Iterate"
                                    >
                                        <RefreshCw size={14} />
                                    </button>
                                    <button
                                        onClick={(e) => handleClone(e, project)}
                                        className="w-8 h-8 flex items-center justify-center rounded-full bg-white text-slate-500 hover:text-blue-600 hover:border-blue-200 transition-colors border border-slate-200 shadow-sm"
                                        title="Clone"
                                    >
                                        <Copy size={14} />
                                    </button>
                                    <button
                                        onClick={(e) => handleDelete(e, project.id)}
                                        className="w-8 h-8 flex items-center justify-center rounded-full bg-white text-slate-500 hover:text-red-600 hover:border-red-200 transition-colors border border-slate-200 shadow-sm"
                                        title="Delete"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                                <button className="md:hidden text-slate-400">
                                    <MoreHorizontal size={20} />
                                </button>
                                <div className="hidden md:flex ml-2 text-slate-300 group-hover:text-indigo-400 transform group-hover:translate-x-1 transition-all">
                                    <ArrowRight size={20} />
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* ── Bulk Selection Floating Bar ─────────────────────────────── */}
            {isSelecting && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3
                    bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl shadow-slate-900/30
                    animate-in fade-in slide-in-from-bottom-4 duration-200 border border-slate-700">
                    <span className="text-sm font-semibold whitespace-nowrap">
                        {selectedIds.size} proyecto{selectedIds.size > 1 ? 's' : ''} seleccionado{selectedIds.size > 1 ? 's' : ''}
                    </span>
                    <div className="w-px h-4 bg-slate-600 shrink-0" />
                    <button
                        onClick={toggleSelectAll}
                        className="text-sm text-slate-300 hover:text-white font-medium transition-colors whitespace-nowrap"
                    >
                        {selectedIds.size === filteredProjects.length ? 'Deseleccionar todo' : 'Seleccionar todo'}
                    </button>
                    <button
                        onClick={() => setSelectedIds(new Set())}
                        className="text-sm text-slate-400 hover:text-white transition-colors"
                        title="Cancelar selección"
                    >
                        <X size={15} />
                    </button>
                    <button
                        onClick={handleBulkDelete}
                        className="flex items-center gap-2 px-4 py-1.5 bg-red-500 hover:bg-red-600 rounded-xl text-sm font-bold transition-colors whitespace-nowrap shadow-lg shadow-red-900/30"
                    >
                        <Trash2 size={14} />
                        Eliminar ({selectedIds.size})
                    </button>
                </div>
            )}

            {/* Iterate Modal - Preserved Logic */}
            {showIterateModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200 border border-slate-100">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">Iterate Project Idea</h3>
                                <p className="text-sm text-slate-500 mt-1">
                                    Create a new version based on "{iterateProject?.blueprint.meta.projectName}".
                                </p>
                            </div>
                            <button onClick={() => setShowIterateModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                        </div>

                        <div className="mb-6">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Refined Idea Description</label>
                            <textarea
                                value={iterateIdea}
                                onChange={(e) => setIterateIdea(e.target.value)}
                                className="w-full h-40 p-4 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 resize-none text-slate-700 text-sm leading-relaxed"
                                placeholder="Describe how you want to modify or improve the project..."
                            />
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowIterateModal(false)}
                                className="px-5 py-2.5 text-slate-600 hover:bg-slate-50 rounded-xl font-bold transition-colors text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleIterate}
                                className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center gap-2 text-sm"
                            >
                                <RefreshCw size={16} />
                                Iterate & Analyze
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
