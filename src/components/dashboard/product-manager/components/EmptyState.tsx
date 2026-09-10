import { AlertCircle } from 'lucide-react';

export const EmptyState = ({ message, icon: Icon }: { message: string, icon?: any }) => (
    <div className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-center">
        {Icon ? <Icon className="w-8 h-8 text-slate-400 mb-2" /> : <AlertCircle className="w-8 h-8 text-slate-400 mb-2" />}
        <p className="text-slate-500 font-medium">{message}</p>
    </div>
);
