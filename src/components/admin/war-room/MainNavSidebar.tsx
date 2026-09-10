import { useState } from 'react';
import { Home, Briefcase, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface MainNavSidebarProps {
    language: 'es' | 'en';
    cinematicMode?: boolean;
}

export const MainNavSidebar: React.FC<MainNavSidebarProps> = ({
    language,
    cinematicMode = false
}) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const isSpanish = language === 'es';

    const navItems = [
        {
            id: 'strategy-hub',
            icon: Home,
            label: isSpanish ? 'Strategy Hub' : 'Strategy Hub',
            labelEs: 'Strategy Hub',
            path: '/',
            color: 'cyan'
        },
        {
            id: 'war-room',
            icon: Briefcase,
            label: isSpanish ? 'War Room' : 'War Room',
            labelEs: 'War Room',
            path: '/war-room',
            color: 'purple'
        }
    ];

    // In cinematic mode, hide sidebar
    if (cinematicMode) {
        return (
            <div className="fixed top-1/2 left-4 -translate-y-1/2 z-[100] opacity-0 hover:opacity-100 transition-opacity duration-300">
                <div className="flex flex-col gap-2">
                    {navItems.map(item => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;

                        return (
                            <button
                                key={item.id}
                                onClick={() => navigate(item.path)}
                                className={`
                                    px-4 py-3 rounded-r-xl border border-l-0 transition-all
                                    ${isActive
                                        ? 'bg-cyan-500/20 border-cyan-500/30 text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.3)]'
                                        : 'bg-slate-900/80 border-white/10 text-slate-400 hover:text-white hover:bg-slate-800/80'}
                                `}
                                title={isSpanish ? item.labelEs : item.label}
                            >
                                <Icon className="w-5 h-5" />
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    }

    return (
        <>
            <div className={`fixed top-0 left-0 h-screen z-[100] flex transition-all duration-300 ${isCollapsed ? 'translate-x-[calc(-100%+60px)]' : 'translate-x-0'}`}>
                {/* Content Panel */}
                <div className="w-[280px] bg-slate-900/95 backdrop-blur-xl border-r border-white/10 flex flex-col shadow-2xl">
                    {/* Header */}
                    <div className="px-6 py-6 border-b border-white/10 bg-gradient-to-r from-slate-800/50 to-slate-900/50">
                        <h1 className="text-xl font-bold text-white uppercase tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500">
                            PILOTAI
                        </h1>
                        <p className="text-xs text-slate-400 mt-1">
                            {isSpanish ? 'Plataforma de Estrategia' : 'Strategy Platform'}
                        </p>
                    </div>

                    {/* Navigation Items */}
                    <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
                        {navItems.map(item => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path;

                            return (
                                <button
                                    key={item.id}
                                    onClick={() => navigate(item.path)}
                                    className={`
                                        w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                                        ${isActive
                                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                                            : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'}
                                    `}
                                >
                                    <Icon className="w-5 h-5 flex-shrink-0" />
                                    <span className="font-medium text-sm">
                                        {isSpanish ? item.labelEs : item.label}
                                    </span>
                                    {isActive && (
                                        <div className="ml-auto w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.6)]" />
                                    )}
                                </button>
                            );
                        })}
                    </nav>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-white/10 bg-slate-800/30">
                        <p className="text-xs text-slate-500 text-center">
                            © 2024 PILOTAI
                        </p>
                    </div>
                </div>

                {/* Collapse Toggle */}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="w-[60px] h-full bg-slate-900/95 backdrop-blur-xl border-r border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all shadow-2xl"
                    title={isCollapsed ? (isSpanish ? 'Expandir' : 'Expand') : (isSpanish ? 'Colapsar' : 'Collapse')}
                >
                    {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                </button>
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(0, 0, 0, 0.2);
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(6, 182, 212, 0.3);
                    border-radius: 2px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(6, 182, 212, 0.5);
                }
            `}</style>
        </>
    );
};
