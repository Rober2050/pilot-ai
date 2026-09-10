import { useState } from 'react';
import {
    Maximize2,
    Globe,
    Users,
    PlayCircle,
    Settings,
    MapPin,
    Volume2,
    MessageSquare,
    BarChart3,
    ChevronLeft,
    ChevronRight,
    X
} from 'lucide-react';

export type PanelType =
    | 'cinematic'
    | 'language'
    | 'agents'
    | 'controls'
    | 'config'
    | 'positioning'
    | 'voice'
    | 'feed'
    | 'stats'
    | null;

interface UnifiedControlSidebarProps {
    children?: React.ReactNode;
    language: 'es' | 'en';
    activePanel: PanelType;
    onPanelChange: (panel: PanelType) => void;
    onCinematicToggle?: () => void;
    cinematicMode?: boolean;
    collapsed?: boolean;
    onToggleCollapse?: () => void;
}

export const UnifiedControlSidebar: React.FC<UnifiedControlSidebarProps> = ({
    children,
    language,
    activePanel,
    onPanelChange,
    onCinematicToggle,
    cinematicMode = false,
    collapsed = false,
    onToggleCollapse
}) => {
    const isSpanish = language === 'es';

    const panels = [
        {
            id: 'cinematic' as PanelType,
            icon: Maximize2,
            label: isSpanish ? 'Cinematic' : 'Cinematic',
            labelEs: 'Cinematic',
            color: 'purple',
            action: 'toggle' // Special action for cinematic
        },
        {
            id: 'language' as PanelType,
            icon: Globe,
            label: isSpanish ? 'Idioma' : 'Language',
            labelEs: 'Idioma',
            color: 'cyan'
        },
        {
            id: 'agents' as PanelType,
            icon: Users,
            label: isSpanish ? 'Agentes' : 'Agents',
            labelEs: 'Agentes',
            color: 'blue'
        },
        {
            id: 'controls' as PanelType,
            icon: PlayCircle,
            label: isSpanish ? 'Controles' : 'Controls',
            labelEs: 'Controles',
            color: 'emerald'
        },
        {
            id: 'config' as PanelType,
            icon: Settings,
            label: isSpanish ? 'Configuración' : 'Configuration',
            labelEs: 'Configuración',
            color: 'orange'
        },
        {
            id: 'positioning' as PanelType,
            icon: MapPin,
            label: isSpanish ? 'Posiciones' : 'Positioning',
            labelEs: 'Posiciones',
            color: 'pink'
        },
        {
            id: 'voice' as PanelType,
            icon: Volume2,
            label: isSpanish ? 'Voz' : 'Voice',
            labelEs: 'Voz',
            color: 'indigo'
        },
        {
            id: 'feed' as PanelType,
            icon: MessageSquare,
            label: isSpanish ? 'Chat' : 'Feed',
            labelEs: 'Chat',
            color: 'teal'
        },
        {
            id: 'stats' as PanelType,
            icon: BarChart3,
            label: isSpanish ? 'Estadísticas' : 'Stats',
            labelEs: 'Estadísticas',
            color: 'yellow'
        }
    ];

    const handlePanelClick = (panel: typeof panels[0]) => {
        if (panel.action === 'toggle' && onCinematicToggle) {
            onCinematicToggle();
        } else {
            onPanelChange(activePanel === panel.id ? null : panel.id);
            if (collapsed && onToggleCollapse) onToggleCollapse();
        }
    };

    // In cinematic mode, hide sidebar
    if (cinematicMode) {
        return (
            <div className="fixed top-1/2 right-4 -translate-y-1/2 z-[100] opacity-0 hover:opacity-100 transition-opacity duration-300">
                <button
                    onClick={onCinematicToggle}
                    className="px-4 py-3 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-l-xl border border-purple-500/30 transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)]"
                    title={isSpanish ? 'Salir de Cinematic' : 'Exit Cinematic'}
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
            </div>
        );
    }

    return (
        <>
            <div className={`fixed top-0 right-0 h-screen z-[100] flex transition-all duration-300 ${collapsed ? 'translate-x-[calc(100%-60px)]' : 'translate-x-0'}`}>
                {/* Icon Bar */}
                <div className="w-[60px] bg-slate-900/95 backdrop-blur-xl border-l border-white/10 flex flex-col items-center py-4 shadow-2xl overflow-y-auto custom-scrollbar">
                    {/* Panel Icons */}
                    <div className="flex flex-col gap-2 flex-shrink-0">
                        {panels.map(panel => {
                            const Icon = panel.icon;
                            const isActive = activePanel === panel.id;
                            const isCinematic = panel.id === 'cinematic';

                            return (
                                <button
                                    key={panel.id}
                                    onClick={() => handlePanelClick(panel)}
                                    className={`
                                        relative w-12 h-12 rounded-lg flex items-center justify-center transition-all
                                        ${isCinematic && cinematicMode
                                            ? 'bg-purple-500/30 text-purple-300 shadow-[0_0_16px_rgba(168,85,247,0.6)]'
                                            : isActive
                                                ? 'bg-cyan-500/20 text-cyan-400 shadow-[0_0_16px_rgba(6,182,212,0.4)]'
                                                : 'text-slate-400 hover:text-white hover:bg-white/5'}
                                    `}
                                    title={isSpanish ? panel.labelEs : panel.label}
                                >
                                    <Icon className="w-5 h-5" />
                                    {isActive && !isCinematic && (
                                        <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-6 bg-cyan-400 rounded-r" />
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    <div className="flex-1 min-h-[10px]" />

                    {/* Collapse Toggle */}
                    <button
                        onClick={onToggleCollapse}
                        className="w-12 h-12 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 transition-all flex-shrink-0 mt-2"
                        title={collapsed ? (isSpanish ? 'Expandir' : 'Expand') : (isSpanish ? 'Colapsar' : 'Collapse')}
                    >
                        {collapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                </div>

                {/* Content Panel */}
                <div className={`w-[380px] bg-slate-900/90 backdrop-blur-xl border-l border-white/5 flex flex-col overflow-hidden shadow-2xl transition-all duration-300 ${activePanel && activePanel !== 'cinematic' && !collapsed ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-full pointer-events-none'}`}>
                    {activePanel && activePanel !== 'cinematic' && !collapsed && (
                        <>
                            {/* Panel Header */}
                            <div className="px-6 py-4 border-b border-white/10 bg-slate-800/50">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                        {panels.find(p => p.id === activePanel)?.icon && (
                                            <span className="text-cyan-400">
                                                {(() => {
                                                    const Icon = panels.find(p => p.id === activePanel)!.icon;
                                                    return <Icon className="w-4 h-4" />;
                                                })()}
                                            </span>
                                        )}
                                        {isSpanish
                                            ? panels.find(p => p.id === activePanel)?.labelEs
                                            : panels.find(p => p.id === activePanel)?.label}
                                    </h2>
                                    <button
                                        onClick={() => onPanelChange(null)}
                                        className="text-slate-400 hover:text-white transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Panel Content */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                {children}
                            </div>
                        </>
                    )}
                </div>
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
