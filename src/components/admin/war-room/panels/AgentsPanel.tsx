import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { RoleConfig } from '../../../../types/roles';

interface AgentsPanelProps {
    roles: RoleConfig[];
    selectedRoleIds: string[];
    onToggleRole: (roleId: string) => void;
    language: 'es' | 'en';
    roleInstructions?: Record<string, string>;
    onInstructionChange?: (roleId: string, instruction: string) => void;
}

export const AgentsPanel: React.FC<AgentsPanelProps> = ({
    roles,
    selectedRoleIds,
    onToggleRole,
    language,
    roleInstructions = {},
    onInstructionChange
}) => {
    const isSpanish = language === 'es';
    const [expandedRoleId, setExpandedRoleId] = useState<string | null>(null);

    return (
        <div className="p-6 space-y-4">
            <p className="text-sm text-slate-400">
                {isSpanish
                    ? 'Selecciona los agentes que participarán en la reunión'
                    : 'Select agents to participate in the meeting'}
            </p>

            <div className="space-y-2">
                {roles.map(role => {
                    const isSelected = selectedRoleIds.includes(role.roleId);
                    const isExpanded = expandedRoleId === role.roleId;

                    return (
                        <div key={role.roleId} className="space-y-2">
                            {/* Role Selection Button */}
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => onToggleRole(role.roleId)}
                                    className={`
                                        flex-1 px-4 py-3 rounded-xl border transition-all text-left
                                        ${isSelected
                                            ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                                            : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-300'}
                                    `}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`
                                            w-5 h-5 rounded border-2 flex items-center justify-center
                                            ${isSelected ? 'border-cyan-400 bg-cyan-500/30' : 'border-slate-600'}
                                        `}>
                                            {isSelected && (
                                                <svg className="w-3 h-3 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                        </div>
                                        <span className="font-medium text-sm">
                                            {role.displayName}
                                        </span>
                                    </div>
                                </button>

                                {/* Expand Instructions Button (only for selected roles) */}
                                {isSelected && onInstructionChange && (
                                    <button
                                        onClick={() => setExpandedRoleId(isExpanded ? null : role.roleId)}
                                        className="px-3 py-3 rounded-xl border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 transition-all"
                                        title={isSpanish ? 'Personalidad' : 'Personality'}
                                    >
                                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                    </button>
                                )}
                            </div>

                            {/* Instructions Textarea (expandable) */}
                            {isSelected && isExpanded && onInstructionChange && (
                                <div className="ml-2 p-4 bg-slate-800/50 rounded-xl border border-purple-500/20">
                                    <label className="block text-xs font-bold text-purple-400 mb-2 uppercase tracking-wider">
                                        {isSpanish ? '🎭 Personalidad / Instrucciones' : '🎭 Personality / Instructions'}
                                    </label>
                                    <textarea
                                        value={roleInstructions[role.roleId] || ''}
                                        onChange={(e) => onInstructionChange(role.roleId, e.target.value)}
                                        placeholder={isSpanish
                                            ? 'Ej: Sé más crítico con los riesgos técnicos...'
                                            : 'E.g: Be more critical about technical risks...'}
                                        className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-200 text-sm placeholder-slate-500 focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all resize-none"
                                        rows={4}
                                    />
                                    <p className="text-xs text-slate-500 mt-2">
                                        {isSpanish
                                            ? 'Estas instrucciones personalizan el comportamiento del agente'
                                            : 'These instructions customize the agent\'s behavior'}
                                    </p>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="pt-4 border-t border-white/10">
                <p className="text-xs text-slate-500">
                    {isSpanish
                        ? `${selectedRoleIds.length} de ${roles.length} agentes seleccionados`
                        : `${selectedRoleIds.length} of ${roles.length} agents selected`}
                </p>
            </div>
        </div>
    );
};
