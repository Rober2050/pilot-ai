
import React, { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/firebase/authService';
import { WorkflowProvider, useWorkflow } from '../contexts/WorkflowContext';
import { projectsService } from '../services/firebase/projectsService';
import { Project } from '../types/blueprint';
import {
    Settings,
    Menu,
    Share2,
    Sparkles,
    History,
    LogOut,
    ChevronDown,
    ChevronRight,
    ShieldCheck,
    GraduationCap,
    X,
    Clock,
    Zap,
    Layers,
    BarChart3,
    Swords,
    Briefcase,
    Terminal,
    Palette,
    Workflow,
    Server,
} from 'lucide-react';
import { cn } from '../lib/utils';
import NewProjectModal from './NewProjectModal';
import ShareModal from './ShareModal';
import LanguageSwitcher from './LanguageSwitcher';
// AcademySelectionModal uses `import * as LucideIcons` (all 1000+ icons) + all tour data.
// Lazy-loading it removes ~2.5 MB from the critical Layout chunk.
const AcademySelectionModal = React.lazy(() => import('./academy/AcademySelectionModal'));

// ─── Time ago helper ─────────────────────────────────────────────────────────
function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return mins <= 1 ? 'Hace 1 min' : `Hace ${mins} min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return hrs === 1 ? 'Hace 1h' : `Hace ${hrs}h`;
    const days = Math.floor(hrs / 24);
    return days === 1 ? 'Ayer' : `Hace ${days} días`;
}

// ─── Methodology badge ────────────────────────────────────────────────────────
const METH_BADGE: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
    pmo:    { label: 'PMO',   icon: <BarChart3 size={9} />, color: 'bg-slate-100 text-slate-600' },
    agile:  { label: 'Agile', icon: <Zap size={9} />,       color: 'bg-indigo-50 text-indigo-600' },
    hybrid: { label: 'Hybrid',icon: <Layers size={9} />,    color: 'bg-emerald-50 text-emerald-600' },
};

// ─── Header (top nav) ─────────────────────────────────────────────────────────
const TopNav = ({
    onToggleSidebar,
    sidebarOpen,
    onOpenAcademy,
}: {
    onToggleSidebar: () => void;
    sidebarOpen: boolean;
    onOpenAcademy: () => void;
}) => {
    const { user, userProfile } = useAuth();
    const { autoFlow, setAutoFlow, currentProjectName } = useWorkflow();
    const navigate = useNavigate();
    const location = useLocation();
    const projectId = new URLSearchParams(location.search).get('projectId');
    
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [shareModalOpen, setShareModalOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const handleLogout = async () => {
        setDropdownOpen(false);
        await authService.logout();
        navigate('/login');
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const initial = userProfile?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U';

    return (
        <header className="h-14 bg-white border-b border-slate-200 flex items-center px-4 gap-3 shrink-0 z-50 relative">
            {/* Logo */}
            <NavLink to="/app/strategy-hub" className="flex items-center gap-1.5 shrink-0">
                <div className="w-6 h-6 rounded-md bg-indigo-600 flex items-center justify-center">
                    <span className="text-white font-black text-[10px] tracking-tighter">P</span>
                </div>
                <span className="text-base font-bold text-slate-900 tracking-tight hidden sm:block">PILOT AI</span>
            </NavLink>

            {/* Mis Proyectos toggle */}
            <button
                onClick={onToggleSidebar}
                className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                    sidebarOpen
                        ? 'bg-slate-100 text-slate-900'
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                )}
            >
                <History size={15} />
                <span className="hidden sm:block">Mis Proyectos</span>
            </button>

            {/* Project breadcrumb */}
            {currentProjectName && (
                <div className="hidden sm:flex items-center gap-1.5 min-w-0 relative group">
                    <ChevronRight size={12} className="text-slate-300 shrink-0" />
                    <span className="text-sm font-semibold text-indigo-600 truncate max-w-[240px] lg:max-w-[360px] cursor-default">
                        {currentProjectName}
                    </span>
                    {/* Hover tooltip — up to 2 lines */}
                    <div className="pointer-events-none absolute top-full left-0 mt-2 z-[200]
                        opacity-0 group-hover:opacity-100 transition-opacity duration-150
                        bg-white border border-slate-200 shadow-lg rounded-xl px-3 py-2.5
                        min-w-[200px] max-w-[340px]">
                        <p className="text-sm font-semibold text-indigo-700 leading-snug break-words line-clamp-2">
                            {currentProjectName}
                        </p>
                    </div>
                </div>
            )}

            {/* Spacer */}
            <div className="flex-1" />

            {/* Auto Flow toggle (compact) */}
            <div
                className="hidden md:flex items-center bg-slate-100 border border-slate-200 rounded-full p-0.5 cursor-pointer gap-0.5"
                onClick={() => setAutoFlow(!autoFlow)}
            >
                <span className={cn("text-[11px] font-semibold px-2.5 py-1 rounded-full transition-all", !autoFlow ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400')}>
                    Manual
                </span>
                <span className={cn("text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 transition-all", autoFlow ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400')}>
                    <Sparkles size={9} />
                    Auto
                </span>
            </div>

            {/* Share */}
            {projectId && (
                <button 
                    onClick={() => setShareModalOpen(true)}
                    className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 font-medium transition-colors"
                >
                    <Share2 size={15} />
                    Share
                </button>
            )}

            {/* Language */}
            <LanguageSwitcher />

            {/* Academy */}
            <button
                onClick={onOpenAcademy}
                className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-medium transition-colors"
            >
                <GraduationCap size={15} />
                Academy
            </button>

            {/* User Avatar + Dropdown */}
            <div className="relative" ref={dropdownRef}>
                <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-full hover:bg-slate-50 transition-colors"
                >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-600 to-purple-700 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                        {initial}
                    </div>
                    <ChevronDown size={14} className={cn("text-slate-400 transition-transform duration-200", dropdownOpen && "rotate-180")} />
                </button>

                {dropdownOpen && (
                    <div className="absolute right-0 top-12 w-52 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-[100]">
                        {/* User info */}
                        <div className="px-4 py-3 border-b border-slate-100">
                            <p className="text-sm font-bold text-slate-900 truncate">{userProfile?.displayName || 'Usuario'}</p>
                            <p className="text-xs text-slate-400 truncate capitalize">{userProfile?.subscriptionPlan || 'Free'}</p>
                        </div>
                        {/* Admin Console + War Room — admins only */}
                        {userProfile?.rol === 'admin' && (
                            <>
                                <NavLink
                                    to="/app/admin"
                                    onClick={() => setDropdownOpen(false)}
                                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                                >
                                    <ShieldCheck size={15} className="text-slate-400" />
                                    Admin Console
                                </NavLink>
                                <NavLink
                                    to="/app/war-room"
                                    onClick={() => setDropdownOpen(false)}
                                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                                >
                                    <Swords size={15} className="text-slate-400" />
                                    War Room
                                </NavLink>
                            </>
                        )}
                        {/* Settings */}
                        <NavLink
                            to="/app/settings"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                            <Settings size={15} className="text-slate-400" />
                            Settings
                        </NavLink>
                        {/* Mobile: Academy */}
                        <button
                            onClick={() => { setDropdownOpen(false); onOpenAcademy(); }}
                            className="lg:hidden flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                            <GraduationCap size={15} className="text-slate-400" />
                            Academy
                        </button>
                        {/* Sign out */}
                        <div className="border-t border-slate-100 mt-1 pt-1">
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                            >
                                <LogOut size={15} />
                                Cerrar Sesión
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Mobile menu button */}
            <button className="lg:hidden p-2 text-slate-400 hover:text-slate-700">
                <Menu size={20} />
            </button>

            {/* Share Modal */}
            <ShareModal isOpen={shareModalOpen} onClose={() => setShareModalOpen(false)} projectId={projectId} />
        </header>
    );
};

// ─── Role icon strip (same as ProjectList) ───────────────────────────────────
const DRAWER_ROLE_ICONS: Record<string, { icon: React.ElementType; bg: string; color: string }> = {
    'strategy-analyst':   { icon: Briefcase,   bg: 'bg-yellow-50',  color: 'text-yellow-600' },
    'product-manager':    { icon: Layers,      bg: 'bg-purple-50',  color: 'text-purple-600' },
    'business-analyst':   { icon: BarChart3,   bg: 'bg-cyan-50',    color: 'text-cyan-600'   },
    'marketing-manager':  { icon: Sparkles,    bg: 'bg-pink-50',    color: 'text-pink-600'   },
    'architect':          { icon: Terminal,    bg: 'bg-blue-50',    color: 'text-blue-600'   },
    'software-architect': { icon: Terminal,    bg: 'bg-blue-50',    color: 'text-blue-600'   },
    'qa-engineer':        { icon: ShieldCheck, bg: 'bg-green-50',   color: 'text-green-600'  },
    'ux-designer':        { icon: Palette,     bg: 'bg-violet-50',  color: 'text-violet-600' },
    'project-manager':    { icon: Workflow,    bg: 'bg-orange-50',  color: 'text-orange-600' },
    'backend-dev':        { icon: Server,      bg: 'bg-slate-100',  color: 'text-slate-600'  },
    'frontend-dev':       { icon: Zap,         bg: 'bg-teal-50',    color: 'text-teal-600'   },
    'devops':             { icon: Server,      bg: 'bg-amber-50',   color: 'text-amber-600'  },
};

// ─── Recent projects drawer ───────────────────────────────────────────────────
const RecentProjectsSidebar = ({ onClose }: { onClose: () => void }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const { refreshTrigger } = useWorkflow();

    useEffect(() => {
        if (!user) return;
        setLoading(true);
        projectsService.getUserProjects(user.uid)
            .then(p => setProjects(p.slice(0, 8)))
            .catch(() => setProjects([]))
            .finally(() => setLoading(false));
    }, [user, refreshTrigger]);

    const openProject = (projectId: string) => {
        navigate(`/app/strategy-hub?projectId=${projectId}`);
        onClose();
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[60]"
                onClick={onClose}
            />

            {/* Drawer panel */}
            <div className="fixed top-0 left-0 h-screen w-80 max-w-full bg-white shadow-2xl z-[70] animate-in slide-in-from-left duration-300 flex flex-col border-r border-gray-200">
                {/* Header */}
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-slate-50">
                    <div className="flex items-center gap-2 text-slate-900 font-bold">
                        <History size={18} className="text-indigo-600" />
                        Mis Proyectos
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Project list */}
                <div className="flex-1 overflow-y-auto py-2">
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : projects.length === 0 ? (
                        <div className="px-4 py-8 text-center">
                            <Clock size={24} className="text-slate-200 mx-auto mb-2" />
                            <p className="text-xs text-slate-400">No hay proyectos aún</p>
                        </div>
                    ) : (
                        projects.map(project => {
                            const methKey = (project.blueprint?.meta?.methodology ?? 'pmo') as string;
                            const badge = METH_BADGE[methKey] ?? METH_BADGE.pmo;
                            const name = project.blueprint?.meta?.projectName || project.ideaOriginal || 'Sin título';
                            const executedRoles = Object.entries(project.blueprint?.roles ?? {})
                                .filter(([, output]) => output?.status === 'completed')
                                .map(([roleId]) => roleId);
                            return (
                                <button
                                    key={project.id}
                                    onClick={() => openProject(project.id)}
                                    className="w-full text-left px-4 py-2.5 hover:bg-slate-50 transition-colors group border-b border-slate-50 last:border-0"
                                >
                                    <p className="text-sm font-medium text-slate-700 group-hover:text-slate-900 truncate leading-snug">{name}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[10px] text-slate-400">{timeAgo(project.updatedAt || project.createdAt)}</span>
                                        <span className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold", badge.color)}>
                                            {badge.icon}
                                            {badge.label}
                                        </span>
                                    </div>
                                    {executedRoles.length > 0 && (
                                        <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                                            {executedRoles.slice(0, 6).map(roleId => {
                                                const cfg = DRAWER_ROLE_ICONS[roleId];
                                                if (!cfg) return null;
                                                const Icon = cfg.icon;
                                                return (
                                                    <div
                                                        key={roleId}
                                                        title={roleId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                                                        className={cn("w-5 h-5 rounded-md flex items-center justify-center shrink-0", cfg.bg)}
                                                    >
                                                        <Icon size={9} className={cfg.color} />
                                                    </div>
                                                );
                                            })}
                                            {executedRoles.length > 6 && (
                                                <div className="w-5 h-5 rounded-md bg-slate-100 flex items-center justify-center shrink-0">
                                                    <span className="text-[8px] font-bold text-slate-400">+{executedRoles.length - 6}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </button>
                            );
                        })
                    )}
                </div>

                {/* Footer */}
                <div className="border-t border-gray-100 p-3">
                    <NavLink
                        to="/app/dashboard"
                        onClick={onClose}
                        className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg text-xs font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors"
                    >
                        Ver todos los proyectos →
                    </NavLink>
                </div>
            </div>
        </>
    );
};

// ─── Main Layout ──────────────────────────────────────────────────────────────
export default function Layout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [academyOpen, setAcademyOpen] = useState(false);
    const [newProjectModalOpen, setNewProjectModalOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    // Auto-close sidebar on mobile when route changes
    useEffect(() => {
        if (window.innerWidth < 1024) setSidebarOpen(false);
    }, [location.pathname]);

    return (
        <WorkflowProvider>
            <div className="flex flex-col h-screen bg-white font-sans text-slate-900 overflow-hidden">
                <NewProjectModal isOpen={newProjectModalOpen} onClose={() => setNewProjectModalOpen(false)} />

                {/* Top navigation */}
                <TopNav
                    onToggleSidebar={() => setSidebarOpen(o => !o)}
                    sidebarOpen={sidebarOpen}
                    onOpenAcademy={() => setAcademyOpen(true)}
                />

                {/* Projects drawer */}
                {sidebarOpen && <RecentProjectsSidebar onClose={() => setSidebarOpen(false)} />}

                {/* Body: main content */}
                <div className="flex flex-1 overflow-hidden relative">
                    <main className="flex-1 overflow-y-auto bg-white">
                        <Outlet context={{ openNewProjectModal: () => setNewProjectModalOpen(true) }} />
                    </main>
                </div>

                {/* Academy Modal — lazy to keep Lucide barrel + tour data out of main bundle */}
                {academyOpen && (
                    <React.Suspense fallback={null}>
                        <AcademySelectionModal isOpen={academyOpen} onClose={() => setAcademyOpen(false)} />
                    </React.Suspense>
                )}
            </div>
        </WorkflowProvider>
    );
}
