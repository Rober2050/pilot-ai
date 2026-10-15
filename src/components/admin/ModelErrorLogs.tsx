import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { loggingService, LogEntry } from '../../services/firebase/loggingService';
import { AlertCircle, RefreshCw, Trash2, Download } from 'lucide-react';

export function ModelErrorLogs() {
    const { t } = useTranslation('translation');
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedModel, setSelectedModel] = useState<string>('all');
    const [selectedSource, setSelectedSource] = useState<string>('AnthropicProvider');

    const loadLogs = async () => {
        setIsLoading(true);
        try {
            const allLogs = await loggingService.getLogs(200);
            setLogs(allLogs);
        } catch (error) {
            console.error('Error loading logs:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadLogs();
    }, []);

    const filteredLogs = logs.filter(log => {
        if (log.source !== selectedSource) return false;
        if (selectedModel !== 'all' && log.details?.model !== selectedModel) return false;
        return true;
    });

    // Extract unique models from logs
    const models = Array.from(new Set(
        logs
            .filter(l => l.source === selectedSource)
            .map(l => l.details?.model || l.details?.primaryModel || 'unknown')
            .filter(Boolean)
    )).sort();

    // Count errors by model
    const errorCounts = logs
        .filter(l => l.source === selectedSource && l.level === 'error')
        .reduce((acc: Record<string, number>, log) => {
            const model = log.details?.model || log.details?.primaryModel || 'unknown';
            acc[model] = (acc[model] || 0) + 1;
            return acc;
        }, {});

    const handleClearLogs = async () => {
        if (!window.confirm('⚠️ This will delete ALL system logs. Continue?')) return;
        try {
            await loggingService.clearLogs();
            setLogs([]);
            alert('Logs cleared successfully!');
        } catch (error) {
            console.error('Error clearing logs:', error);
            alert('Failed to clear logs.');
        }
    };

    const handleExportLogs = () => {
        const csv = [
            ['Timestamp', 'Source', 'Message', 'Model', 'Details'].join(','),
            ...filteredLogs.map(log => [
                new Date(log.timestamp).toISOString(),
                log.source,
                `"${log.message}"`,
                log.details?.model || log.details?.primaryModel || '',
                `"${JSON.stringify(log.details || {}).slice(0, 100)}"`
            ].join(','))
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `model-logs-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">Model Error Logs</h2>
                    <p className="text-slate-400 text-sm mt-1">Monitor AI model failures and fallback events</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={loadLogs}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-colors disabled:opacity-50"
                    >
                        <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                    <button
                        onClick={handleExportLogs}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700 text-white hover:bg-slate-600 transition-colors"
                    >
                        <Download size={16} />
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Model Health Summary */}
            {models.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {models.map(model => (
                        <div key={model} className="bg-slate-900/50 border border-white/10 rounded-lg p-4">
                            <div className="text-sm text-slate-400 truncate">{model}</div>
                            <div className="text-2xl font-bold text-white mt-2">
                                {errorCounts[model] || 0}
                            </div>
                            <div className="text-xs text-slate-500 mt-1">errors (last 200 logs)</div>
                        </div>
                    ))}
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-300 mb-2">Source</label>
                    <select
                        value={selectedSource}
                        onChange={(e) => {
                            setSelectedSource(e.target.value);
                            setSelectedModel('all');
                        }}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="AnthropicProvider">AnthropicProvider (Models)</option>
                        <option value="">All Sources</option>
                    </select>
                </div>

                {models.length > 0 && (
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-slate-300 mb-2">Filter by Model</label>
                        <select
                            value={selectedModel}
                            onChange={(e) => setSelectedModel(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="all">All Models</option>
                            {models.map(model => (
                                <option key={model} value={model}>{model}</option>
                            ))}
                        </select>
                    </div>
                )}

                <div className="flex items-end">
                    <button
                        onClick={handleClearLogs}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 transition-colors"
                    >
                        <Trash2 size={16} />
                        Clear All
                    </button>
                </div>
            </div>

            {/* Logs Table */}
            <div className="bg-slate-900/50 border border-white/10 rounded-lg overflow-hidden">
                {filteredLogs.length === 0 ? (
                    <div className="p-8 text-center">
                        <AlertCircle className="mx-auto h-12 w-12 text-slate-500 mb-2" />
                        <p className="text-slate-400">No errors logged yet. Good sign! 🎉</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-800/50 border-b border-white/10">
                                <tr>
                                    <th className="px-4 py-3 text-left text-slate-300 font-semibold">Timestamp</th>
                                    <th className="px-4 py-3 text-left text-slate-300 font-semibold">Model</th>
                                    <th className="px-4 py-3 text-left text-slate-300 font-semibold">Message</th>
                                    <th className="px-4 py-3 text-left text-slate-300 font-semibold">Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredLogs.map(log => (
                                    <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                                        <td className="px-4 py-3 text-slate-400 whitespace-nowrap text-xs">
                                            {new Date(log.timestamp).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3 text-slate-300 font-mono text-xs">
                                            {log.details?.model || log.details?.primaryModel || log.details?.fallbackUsed || '—'}
                                        </td>
                                        <td className="px-4 py-3 text-slate-200 max-w-sm truncate">
                                            {log.message}
                                        </td>
                                        <td className="px-4 py-3">
                                            <details className="cursor-pointer">
                                                <summary className="text-indigo-400 text-xs hover:text-indigo-300">
                                                    {log.details?.note || (log.details ? 'view' : '—')}
                                                </summary>
                                                <pre className="mt-2 p-2 bg-slate-950 rounded text-xs text-slate-300 overflow-x-auto max-w-md">
                                                    {JSON.stringify(log.details, null, 2)}
                                                </pre>
                                            </details>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 text-sm text-slate-400">
                <div className="bg-slate-900/50 border border-white/10 rounded-lg p-3">
                    <div className="text-xs text-slate-500">Total Errors</div>
                    <div className="text-2xl font-bold text-white mt-1">
                        {logs.filter(l => l.level === 'error').length}
                    </div>
                </div>
                <div className="bg-slate-900/50 border border-white/10 rounded-lg p-3">
                    <div className="text-xs text-slate-500">Filtered Results</div>
                    <div className="text-2xl font-bold text-white mt-1">{filteredLogs.length}</div>
                </div>
                <div className="bg-slate-900/50 border border-white/10 rounded-lg p-3">
                    <div className="text-xs text-slate-500">Models Tracked</div>
                    <div className="text-2xl font-bold text-white mt-1">{models.length}</div>
                </div>
            </div>
        </div>
    );
}
