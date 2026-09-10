/**
 * ✅ BATCH 4.5: @Mentions Dropdown Component
 * 
 * Displays filtered role suggestions when @ is typed
 */

import React from 'react';
import { RoleConfig } from '../../../types/roles';
import { User } from 'lucide-react';

interface MentionsDropdownProps {
    roles: RoleConfig[];
    selectedIndex: number;
    onSelect: (roleName: string) => void;
    language: 'es' | 'en';
}

export const MentionsDropdown: React.FC<MentionsDropdownProps> = ({
    roles,
    selectedIndex,
    onSelect,
    language
}) => {
    if (roles.length === 0) return null;

    return (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-slate-800 border border-cyan-500/30 rounded-lg shadow-2xl max-h-48 overflow-y-auto z-50">
            <div className="p-2 border-b border-slate-700">
                <span className="text-xs text-slate-400 uppercase tracking-wider">
                    {language === 'es' ? 'Mencionar Rol' : 'Mention Role'}
                </span>
            </div>
            <div className="py-1">
                {roles.map((role, index) => (
                    <button
                        key={role.roleId}
                        onClick={() => onSelect(role.displayName)}
                        className={`w-full px-3 py-2 flex items-center gap-2 transition-colors ${index === selectedIndex
                                ? 'bg-cyan-500/20 text-cyan-300'
                                : 'text-slate-300 hover:bg-slate-700'
                            }`}
                    >
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${index === selectedIndex ? 'bg-cyan-500/30' : 'bg-slate-700'
                            }`}>
                            <User size={14} />
                        </div>
                        <span className="text-sm font-medium">{role.displayName}</span>
                    </button>
                ))}
            </div>
            <div className="p-2 border-t border-slate-700 bg-slate-900/50">
                <span className="text-[10px] text-slate-500">
                    {language === 'es' ? '↑↓ Navegar • Enter Seleccionar • Esc Cerrar' : '↑↓ Navigate • Enter Select • Esc Close'}
                </span>
            </div>
        </div>
    );
};
