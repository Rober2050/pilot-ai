import React from 'react';
import {
    Check,
    Target,
    Package,
    Briefcase,
    Palette,
    Layers,
    Code,
    Database,
    ShieldCheck,
    Sparkles,
    TrendingUp,
    Monitor,
    Server,
    Bot
} from 'lucide-react';
import { RoleConfig } from '../types/roles';
import { RoleOutput } from '../types/blueprint';
import { cn } from '../lib/utils';
import { useTranslation } from 'react-i18next';

interface RoleCardProps {
    role: RoleConfig;
    output?: RoleOutput;
    isActive: boolean;
    isEnabled: boolean;
    onToggle: (roleId: string) => void;
    onRun?: () => void;
}

// Map role IDs to specific icons
const getRoleIcon = (roleId: string) => {
    switch (roleId.toLowerCase()) {
        case 'strategy-analyst': return <Target className="w-6 h-6" />;
        case 'product-manager': return <Package className="w-6 h-6" />;
        case 'project-manager': return <Briefcase className="w-6 h-6" />;
        case 'business-analyst': return <TrendingUp className="w-6 h-6" />;
        case 'ux-designer': return <Palette className="w-6 h-6" />;
        case 'architect': return <Layers className="w-6 h-6" />;
        case 'frontend-dev': return <Monitor className="w-6 h-6" />;
        case 'backend-dev': return <Server className="w-6 h-6" />;
        case 'qa-engineer': return <ShieldCheck className="w-6 h-6" />;
        case 'devops': return <Sparkles className="w-6 h-6" />;
        default: return <Bot className="w-6 h-6" />;
    }
};

export default function RoleCard({ role, output, isActive, isEnabled, onToggle, onRun }: RoleCardProps) {
    const { t } = useTranslation('translation');
    const status = output?.status || 'idle';

    // Status color mapping
    const getStatusColor = () => {
        if (!isEnabled) return 'text-slate-300 border-slate-200 bg-slate-50';
        switch (status) {
            case 'processing': return 'text-secondary-600 border-secondary-500 bg-secondary-50';
            case 'completed': return 'text-accent-600 border-accent-500 bg-white';
            case 'error': return 'text-red-600 border-red-500 bg-red-50';
            default: return isActive ? 'text-primary-600 border-primary-500 bg-white shadow-lg ring-2 ring-primary-100' : 'text-slate-600 border-slate-200 bg-white hover:border-primary-300';
        }
    };

    return (
        <div className="flex flex-col items-center gap-2 min-w-[100px] relative group">
            {/* Card Container */}
            <div
                className={cn(
                    "relative w-16 h-16 rounded-full flex items-center justify-center border-2 transition-all duration-300 cursor-pointer",
                    getStatusColor(),
                    !isEnabled && "opacity-60 grayscale"
                )}
                onClick={() => onToggle(role.roleId)}
            >
                {/* Status Ring Animation */}
                {status === 'processing' && (
                    <div className="absolute inset-0 rounded-full border-4 border-secondary-100 border-t-secondary-600 animate-spin" />
                )}

                {/* Role Icon */}
                <div className="z-10 flex flex-col items-center justify-center transition-transform duration-300 group-hover:scale-110">
                    {getRoleIcon(role.roleId)}
                </div>

                {/* Checkbox Toggle - Improved Visibility */}
                <div
                    className={cn(
                        "absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors z-20 shadow-sm",
                        isEnabled
                            ? "bg-accent-500 border-white text-white"
                            : "bg-white border-slate-300 text-transparent"
                    )}
                    title={isEnabled ? t('common.disable') : t('common.enable')}
                >
                    <Check className="w-3.5 h-3.5" strokeWidth={3} />
                </div>
            </div>

            {/* Label */}
            <div className="text-center max-w-[110px]">
                <h3 className={cn(
                    "font-bold text-[11px] transition-colors leading-tight",
                    isEnabled ? "text-slate-700" : "text-slate-400"
                )}>
                    {role.displayName}
                </h3>
                {status === 'processing' && (
                    <span className="text-[10px] text-secondary-600 animate-pulse font-medium block mt-0.5">Processing...</span>
                )}
            </div>
        </div>
    );
}
