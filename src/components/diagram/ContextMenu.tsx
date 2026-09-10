import { Node } from 'reactflow';
import { Split, CheckSquare, ShieldAlert, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ContextMenuProps {
    id?: string;
    top?: number;
    left?: number;
    right?: number;
    bottom?: number;
    node: Node;
    onClose: () => void;
    onAction: (action: string, node: Node) => void;
}

export const ContextMenu = ({ top, left, right, bottom, node, onClose, onAction }: ContextMenuProps) => {
    const { t } = useTranslation('translation');

    const handleAction = (action: string) => {
        onAction(action, node);
        onClose();
    };

    return (
        <div
            style={{ top, left, right, bottom }}
            className="absolute z-50 bg-white border border-slate-200 rounded-lg shadow-xl w-56 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
        >
            <div className="bg-slate-50 px-3 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider truncate max-w-[140px]">
                    {node.data.label}
                </span>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                    <X className="h-3 w-3" />
                </button>
            </div>
            <div className="p-1">
                <button
                    onClick={() => handleAction('expand')}
                    className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-md flex items-center gap-2 transition-colors group"
                >
                    <Split className="h-4 w-4 text-indigo-500 group-hover:scale-110 transition-transform" />
                    {t('diagram.expand', 'Expandir Sub-proceso')}
                </button>
                <button
                    onClick={() => handleAction('checklist')}
                    className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 rounded-md flex items-center gap-2 transition-colors group"
                >
                    <CheckSquare className="h-4 w-4 text-emerald-500 group-hover:scale-110 transition-transform" />
                    {t('diagram.checklist', 'Generar Checklist')}
                </button>
                <button
                    onClick={() => handleAction('risks')}
                    className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-red-50 hover:text-red-700 rounded-md flex items-center gap-2 transition-colors group"
                >
                    <ShieldAlert className="h-4 w-4 text-red-500 group-hover:scale-110 transition-transform" />
                    {t('diagram.risks', 'Analizar Riesgos')}
                </button>
            </div>
        </div>
    );
};
