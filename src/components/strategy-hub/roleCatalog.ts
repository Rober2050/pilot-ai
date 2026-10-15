/** Role color palette for the team catalog — one color per slot. */
export const ROLE_COLORS = [
    { border: 'border-amber-400',   bg: 'bg-amber-50',   icon: 'text-amber-500',   dot: 'bg-amber-400',   avatar: 'bg-amber-400'   },
    { border: 'border-purple-400',  bg: 'bg-purple-50',  icon: 'text-purple-500',  dot: 'bg-purple-400',  avatar: 'bg-purple-400'  },
    { border: 'border-cyan-500',    bg: 'bg-cyan-50',    icon: 'text-cyan-600',    dot: 'bg-cyan-500',    avatar: 'bg-cyan-500'    },
    { border: 'border-teal-400',    bg: 'bg-teal-50',    icon: 'text-teal-600',    dot: 'bg-teal-400',    avatar: 'bg-teal-400'    },
    { border: 'border-rose-400',    bg: 'bg-rose-50',    icon: 'text-rose-500',    dot: 'bg-rose-400',    avatar: 'bg-rose-400'    },
    { border: 'border-blue-500',    bg: 'bg-blue-50',    icon: 'text-blue-600',    dot: 'bg-blue-500',    avatar: 'bg-blue-500'    },
    { border: 'border-indigo-400',  bg: 'bg-indigo-50',  icon: 'text-indigo-500',  dot: 'bg-indigo-400',  avatar: 'bg-indigo-400'  },
    { border: 'border-emerald-500', bg: 'bg-emerald-50', icon: 'text-emerald-600', dot: 'bg-emerald-500', avatar: 'bg-emerald-500' },
    { border: 'border-orange-400',  bg: 'bg-orange-50',  icon: 'text-orange-500',  dot: 'bg-orange-400',  avatar: 'bg-orange-400'  },
    { border: 'border-pink-400',    bg: 'bg-pink-50',    icon: 'text-pink-500',    dot: 'bg-pink-400',    avatar: 'bg-pink-400'    },
];

export type RoleColor = typeof ROLE_COLORS[number];

export const getRoleColor = (index: number): RoleColor => ROLE_COLORS[index % ROLE_COLORS.length];

/** Deliverable label derived from the role's docConfig flags. */
export const getDeliverable = (role: { docConfig?: Record<string, any> }): string => {
    const cfg = role.docConfig || {};
    const parts: string[] = [];
    if (cfg.pdf || cfg.text) parts.push('DOC');
    if (cfg.ppt) parts.push('PPT');
    if (cfg.excel) parts.push('Excel');
    if (cfg.c4 || cfg.architecture || cfg.flowDiagrams) parts.push('Diagram');
    if (cfg.userStories) parts.push('Stories');
    if (cfg.marketing) parts.push('Plan Mkt');
    return parts.slice(0, 2).join(' / ') || 'Report';
};

/** Short subtitle per role (job titles, kept in English on purpose). */
export const getRoleSubtitle = (roleId: string): string => {
    const map: Record<string, string> = {
        'strategy-analyst': 'Strategy Lead',
        'product-manager':  'Product Manager',
        'business-analyst': 'Business Analyst',
        'project-manager':  'Project Lead',
        'marketing-manager':'CMO',
        'ux-designer':      'UX Designer',
        'qa-engineer':      'QA Lead',
        'devops-engineer':  'DevOps',
        'architect':        'CTO',
    };
    return map[roleId] || roleId;
};
