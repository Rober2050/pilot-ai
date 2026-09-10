import React from 'react';

// Premium UI Components matching StrategyHub aesthetic

interface NeonButtonProps {
    children: React.ReactNode;
    variant?: 'play' | 'pause' | 'next' | 'prev';
    onClick?: () => void;
    disabled?: boolean;
    className?: string;
}

export const NeonButton = ({ children, variant = 'play', onClick, disabled, className = '' }: NeonButtonProps) => {
    const variants = {
        play: 'bg-emerald-500 hover:bg-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.6)]',
        pause: 'bg-amber-500 hover:bg-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.6)]',
        next: 'bg-cyan-500 hover:bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.6)]',
        prev: 'bg-slate-600 hover:bg-slate-500 shadow-[0_0_15px_rgba(100,116,139,0.4)]'
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`
        relative inline-flex items-center justify-center
        rounded-full p-3 lg:p-4
        text-white font-bold
        transition-all duration-300
        hover:scale-110 active:scale-95
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
        border-2 border-white/20
        ${variants[variant]}
        ${className}
      `}
        >
            {children}
        </button>
    );
};

interface MetallicOrbProps {
    icon: React.ReactNode;
    label: string;
    active?: boolean;
    completed?: boolean;
    processing?: boolean;
    size?: 'sm' | 'md' | 'lg';
    onClick?: () => void;
}

export const MetallicOrb = ({
    icon,
    label,
    active = false,
    completed = false,
    processing = false,
    size = 'md',
    onClick
}: MetallicOrbProps) => {
    const sizes = {
        sm: 'w-20 h-20',
        md: 'w-24 h-24 lg:w-28 lg:h-28',
        lg: 'w-32 h-32 lg:w-36 lg:h-36'
    };

    const getOrbStyle = () => {
        if (active || processing) {
            return {
                background: `
          radial-gradient(circle at 30% 30%, rgba(236, 72, 153, 0.9) 0%, rgba(217, 70, 239, 0.7) 50%, rgba(126, 34, 206, 0.9) 100%),
          radial-gradient(circle at 70% 70%, rgba(217, 70, 239, 0.4) 0%, transparent 70%)
        `,
                boxShadow: `
          inset 0 -20px 40px rgba(0, 0, 0, 0.6),
          inset 0 20px 40px rgba(255, 255, 255, 0.15),
          0 0 40px rgba(236, 72, 153, 0.6),
          0 0 80px rgba(217, 70, 239, 0.4)
        `
            };
        }

        if (completed) {
            return {
                background: `
          radial-gradient(circle at 30% 30%, rgba(16, 185, 129, 0.8) 0%, rgba(5, 150, 105, 0.6) 50%, rgba(4, 120, 87, 0.9) 100%),
          radial-gradient(circle at 70% 70%, rgba(52, 211, 153, 0.3) 0%, transparent 70%)
        `,
                boxShadow: `
          inset 0 -20px 40px rgba(0, 0, 0, 0.6),
          inset 0 20px 40px rgba(255, 255, 255, 0.1),
          0 0 30px rgba(16, 185, 129, 0.5)
        `
            };
        }

        // Default metallic gray
        return {
            background: `
        radial-gradient(circle at 30% 30%, rgba(148, 163, 184, 0.4) 0%, rgba(71, 85, 105, 0.6) 50%, rgba(30, 41, 59, 0.9) 100%),
        radial-gradient(circle at 70% 70%, rgba(100, 116, 139, 0.2) 0%, transparent 70%)
      `,
            boxShadow: `
        inset 0 -15px 30px rgba(0, 0, 0, 0.7),
        inset 0 15px 30px rgba(255, 255, 255, 0.05),
        0 10px 30px rgba(0, 0, 0, 0.5)
      `
        };
    };

    return (
        <div className="relative flex flex-col items-center group">
            {/* Floating Badge for Active */}
            {(active || processing) && (
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800/90 backdrop-blur-md text-cyan-400 text-[8px] font-bold px-2 py-1 rounded-full border border-cyan-500/30 shadow-[0_0_15px_rgba(34,211,238,0.3)] tracking-wider whitespace-nowrap animate-pulse z-30">
                    ACTIVE
                </div>
            )}

            {/* The Orb */}
            <div
                onClick={onClick}
                className={`
          ${sizes[size]}
          rounded-full
          flex items-center justify-center
          cursor-pointer
          transition-all duration-500
          hover:scale-110
          ${active || processing ? 'scale-110 animate-pulse' : ''}
        `}
                style={getOrbStyle()}
            >
                {/* Icon */}
                <div className="relative z-10 text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                    {icon}
                </div>

                {/* Inner Highlight */}
                <div className="absolute top-4 left-4 w-8 h-8 bg-white/10 rounded-full blur-sm"></div>
            </div>

            {/* Label */}
            <span className={`
        mt-3 text-[10px] lg:text-xs font-bold tracking-wider uppercase text-center max-w-[120px]
        transition-colors duration-300
        ${active || processing ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]' :
                    completed ? 'text-emerald-400' : 'text-slate-400'}
      `}>
                {label}
            </span>

            {/* Play Button Overlay (for demonstrations) */}
            {!active && !processing && (
                <div className="absolute top-0 right-0 w-7 h-7 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white/20 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-0 h-0 border-t-[4px] border-t-transparent border-l-[6px] border-l-white border-b-[4px] border-b-transparent ml-0.5"></div>
                </div>
            )}
        </div>
    );
};

interface GlassCardProps {
    children: React.ReactNode;
    className?: string;
    glow?: boolean;
    glowColor?: 'cyan' | 'purple' | 'emerald';
}

export const GlassCard = ({ children, className = '', glow = false, glowColor = 'cyan' }: GlassCardProps) => {
    const glowColors = {
        cyan: 'shadow-[0_0_40px_rgba(34,211,238,0.3)]',
        purple: 'shadow-[0_0_40px_rgba(168,85,247,0.3)]',
        emerald: 'shadow-[0_0_40px_rgba(16,185,129,0.3)]'
    };

    return (
        <div className={`
      bg-slate-950/50 backdrop-blur-xl 
      border border-slate-800/50 
      rounded-2xl 
      shadow-2xl
      ${glow ? glowColors[glowColor] : ''}
      ${className}
    `}>
            {children}
        </div>
    );
};

// Progress bar with cyan glow
export const CyanProgressBar = ({ progress }: { progress: number }) => (
    <div className="w-full h-2 bg-slate-800/80 rounded-full border border-slate-700/50 shadow-inner overflow-hidden">
        <div
            className="h-full bg-cyan-400 rounded-full transition-all duration-1000"
            style={{
                width: `${progress}%`,
                boxShadow: '0 0 15px 2px rgba(34, 211, 238, 0.8), 0 0 30px 5px rgba(59, 130, 246, 0.6)'
            }}
        />
    </div>
);
