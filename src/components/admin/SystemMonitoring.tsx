import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { loggingService, LogEntry } from '../../services/firebase/loggingService';
import { authService } from '../../services/firebase/authService';
import { auth, supabase, SUPABASE_URL } from '../../services/firebase/firebaseClient';
import { AlertCircle, RefreshCw, Trash2, Download, ChevronDown, CheckCircle, AlertTriangle, XCircle, Wifi, Key, Shield } from 'lucide-react';

interface DiagnosticResult {
    id: string;
    name: string;
    status: 'success' | 'error' | 'warning' | 'pending';
    message: string;
    details?: string;
}

export function SystemMonitoring() {
    const { t } = useTranslation('translation');

    // Model Logs State
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [isLoadingLogs, setIsLoadingLogs] = useState(false);
    const [selectedModel, setSelectedModel] = useState<string>('all');

    // System Health State
    const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([]);
    const [isRunningDiagnostics, setIsRunningDiagnostics] = useState(false);
    const [isHealthExpanded, setIsHealthExpanded] = useState(false);

    // Load logs
    const loadLogs = async () => {
        setIsLoadingLogs(true);
        try {
            const allLogs = await loggingService.getLogs(200);
            setLogs(allLogs);
        } catch (error) {
            console.error('Error loading logs:', error);
        } finally {
            setIsLoadingLogs(false);
        }
    };

    // Run system diagnostics
    const runDiagnostics = async () => {
        setIsRunningDiagnostics(true);
        setDiagnostics([]);
        const newResults: DiagnosticResult[] = [];

        // 1. AI connectivity — every model call goes through the anthropic-proxy Edge Function.
        // The proxy answers `healthcheck` itself (auth + config), so this never spends tokens.
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('No active session');
            const res = await fetch(`${SUPABASE_URL}/functions/v1/anthropic-proxy`, {
                method: 'POST',
                headers: { 'content-type': 'application/json', Authorization: `Bearer ${session.access_token}` },
                body: JSON.stringify({ healthcheck: true }),
            });
            const body = await res.json().catch(() => ({}));
            if (!res.ok || !body?.ok) throw new Error(body?.error || `HTTP ${res.status}`);
            newResults.push({
                id: 'connectivity',
                name: 'Claude API (anthropic-proxy)',
                status: body.anthropicKeyConfigured ? 'success' : 'warning',
                message: body.anthropicKeyConfigured ? 'Proxy reachable and configured' : 'Proxy reachable, ANTHROPIC_API_KEY missing',
                details: `Models: ${(body.models || []).join(', ')}`
            });
        } catch (e: any) {
            newResults.push({
                id: 'connectivity',
                name: 'Claude API (anthropic-proxy)',
                status: 'error',
                message: 'Connection Failed',
                details: e.message
            });
        }

        // 2. Auth Status
        try {
            const user = auth.currentUser;
            if (user) {
                const userProfile = await authService.getUserProfile(user.uid);

                newResults.push({
                    id: 'auth',
                    name: 'Authentication Status',
                    status: 'success',
                    message: `Logged in as ${user.email}`,
                    details: `UID: ${user.uid}`
                });

                if (userProfile?.rol === 'admin') {
                    newResults.push({
                        id: 'permissions',
                        name: 'Admin Permissions',
                        status: 'success',
                        message: 'Admin Role Verified',
                        details: `Role: ${userProfile.rol}`
                    });
                } else {
                    newResults.push({
                        id: 'permissions',
                        name: 'Admin Permissions',
                        status: 'error',
                        message: 'User is NOT Admin',
                        details: `Current Role: ${userProfile?.rol}`
                    });
                }
            } else {
                newResults.push({
                    id: 'auth',
                    name: 'Authentication Status',
                    status: 'error',
                    message: 'No active user found',
                    details: 'Please log in again'
                });
            }
        } catch (e: any) {
            newResults.push({
                id: 'auth',
                name: 'Auth Verification',
                status: 'error',
                message: 'Failed to verify auth state',
                details: e.message
            });
        }

        setDiagnostics(newResults);
        setIsRunningDiagnostics(false);
    };

    // Initial load
    useEffect(() => {
        loadLogs();
        runDiagnostics();
    }, []);

    const filteredLogs = logs.filter(log => {
        if (log.source !== 'AnthropicProvider') return false;
        if (selectedModel !== 'all' && log.details?.model !== selectedModel) return false;
        return true;
    });

    const models = Array.from(new Set(
        logs
            .filter(l => l.source === 'AnthropicProvider')
            .map(l => l.details?.model || l.details?.primaryModel || 'unknown')
            .filter(Boolean)
    )).sort();

    const errorCounts = logs
        .filter(l => l.source === 'AnthropicProvider' && l.level === 'error')
        .reduce((acc: Record<string, number>, log) => {
            const model = log.details?.model || log.details?.primaryModel || 'unknown';
            acc[model] = (acc[model] || 0) + 1;
            return acc;
        }, {});

    const allHealthy = diagnostics.every(d => d.status !== 'error');

    const handleClearLogs = async () => {
        if (!window.confirm('⚠️ Delete ALL system logs?')) return;
        try {
            await loggingService.clearLogs();
            setLogs([]);
            alert('Logs cleared!');
        } catch (error) {
            console.error('Error clearing logs:', error);
            alert('Failed to clear logs.');
        }
    };

    const handleExportLogs = () => {
        const csv = [
            ['Timestamp', 'Model', 'Message', 'Details'].join(','),
            ...filteredLogs.map(log => [
                new Date(log.timestamp.toDate()).toISOString(),
                log.details?.model || log.details?.primaryModel || '',
                `"${log.message}"`,
                `"${JSON.stringify(log.details || {}).slice(0, 100)}"`
            ].join(','))
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `monitoring-logs-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6">
            {/* System Health - Collapsible */}
            <div className="bg-slate-900/50 border border-white/10 rounded-lg overflow-hidden">
                <button
                    onClick={() => setIsHealthExpanded(!isHealthExpanded)}
                    className="w-full flex items-center justify-between p-6 hover:bg-slate-800/50 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <div className={`h-3 w-3 rounded-full ${allHealthy ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        <div className="text-left">
                            <h3 className="text-lg font-semibold text-white">System Health</h3>
                            <p className="text-sm text-slate-400">{diagnostics.length} checks</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                runDiagnostics();
                            }}
                            disabled={isRunningDiagnostics}
                            className="flex items-center gap-2 px-3 py-1 rounded text-sm bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50"
                        >
                            <RefreshCw size={14} className={isRunningDiagnostics ? 'animate-spin' : ''} />
                        </button>
                        <ChevronDown
                            size={20}
                            className={`transition-transform text-slate-400 ${isHealthExpanded ? 'rotate-180' : ''}`}
                        />
                    </div>
                </button>

                {isHealthExpanded && (
                    <div className="border-t border-white/10 p-6 space-y-3">
                        {diagnostics.length === 0 ? (
                            <p className="text-slate-400 text-sm">Run diagnostics to check system health</p>
                        ) : (
                            diagnostics.map(diag => {
                                const Icon = diag.status === 'success' ? CheckCircle : diag.status === 'warning' ? AlertTriangle : XCircle;
                                const color = diag.status === 'success' ? 'text-emerald-400' : diag.status === 'warning' ? 'text-amber-400' : 'text-red-400';
                                return (
                                    <div key={diag.id} className="flex items-start gap-3 p-3 bg-slate-950/50 rounded">
                                        <Icon size={18} className={color} />
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-white text-sm">{diag.name}</div>
                                            <div className="text-sm text-slate-400">{diag.message}</div>
                                            {diag.details && (
                                                <div className="text-xs text-slate-500 mt-1 font-mono">{diag.details}</div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}
            </div>

            {/* Model Error Logs - Main Focus */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Model Performance</h2>
                        <p className="text-slate-400 text-sm mt-1">Monitor AI model errors and fallback events</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={loadLogs}
                            disabled={isLoadingLogs}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-colors disabled:opacity-50"
                        >
                            <RefreshCw size={16} className={isLoadingLogs ? 'animate-spin' : ''} />
                            Refresh
                        </button>
                        <button
                            onClick={handleExportLogs}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700 text-white hover:bg-slate-600 transition-colors"
                        >
                            <Download size={16} />
                            Export
                        </button>
                    </div>
                </div>

                {/* Model Health Summary */}
                {models.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        {models.map(model => (
                            <div key={model} className="bg-slate-900/50 border border-white/10 rounded-lg p-4 cursor-pointer hover:border-indigo-500/50 transition-colors" onClick={() => setSelectedModel(model)}>
                                <div className="text-sm text-slate-400 truncate">{model}</div>
                                <div className="text-2xl font-bold text-white mt-2">
                                    {errorCounts[model] || 0}
                                </div>
                                <div className="text-xs text-slate-500 mt-1">errors</div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
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
                            Clear Logs
                        </button>
                    </div>
                </div>

                {/* Logs Table */}
                <div className="bg-slate-900/50 border border-white/10 rounded-lg overflow-hidden">
                    {filteredLogs.length === 0 ? (
                        <div className="p-8 text-center">
                            <AlertCircle className="mx-auto h-12 w-12 text-slate-500 mb-2" />
                            <p className="text-slate-400">No model errors logged. Excellent! 🎉</p>
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
                                                {new Date(log.timestamp.toDate()).toLocaleString()}
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
                <div className="grid grid-cols-3 gap-4 text-sm text-slate-400 mt-6">
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
        </div>
    );
}
