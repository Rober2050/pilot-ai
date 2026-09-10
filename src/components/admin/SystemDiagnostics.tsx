import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Activity, Database, Key, Shield, Wifi, RefreshCw, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
// Removed UI imports to use inline styles for reliability

import { configService } from '../../services/firebase/configService';
import { authService } from '../../services/firebase/authService';
import { usersService } from '../../services/firebase/usersService';
import { geminiService } from '../../services/gemini/geminiService';
import { auth, supabase } from '../../services/firebase/firebaseClient';

interface DiagnosticResult {
    id: string;
    name: string;
    status: 'success' | 'error' | 'warning' | 'pending';
    message: string;
    details?: string;
}

export const SystemDiagnostics: React.FC = () => {
    const { t } = useTranslation('translation');
    const [isRunning, setIsRunning] = useState(false);
    const [results, setResults] = useState<DiagnosticResult[]>([]);

    const runDiagnostics = async () => {
        setIsRunning(true);
        setResults([]);

        const newResults: DiagnosticResult[] = [];

        // 1. Environment / API Keys Check
        try {
            const hasGeminiKey = import.meta.env.VITE_GEMINI_API_KEY;
            // Also check Firestore config
            const firestoreKey = await configService.getAPIKey('google');

            if (hasGeminiKey || firestoreKey) {
                newResults.push({
                    id: 'api-key',
                    name: 'API Key Configuration',
                    status: 'success',
                    message: 'Gemini API Key found',
                    details: firestoreKey ? 'Loaded from Firestore' : 'Loaded from Environment Variables'
                });
            } else {
                newResults.push({
                    id: 'api-key',
                    name: 'API Key Configuration',
                    status: 'error',
                    message: 'Missing Gemini API Key',
                    details: 'No VITE_GEMINI_API_KEY in env and no key in system_config'
                });
            }
        } catch (e: any) {
            newResults.push({
                id: 'api-key',
                name: 'API Key Configuration',
                status: 'error',
                message: 'Failed to check configuration',
                details: e.message
            });
        }

        setResults([...newResults]);

        // 2. Connectivity Check (Gemini Echo)
        try {
            // Simple model list check or minimal generation
            const models = await geminiService.listModels();
            if (models && models.length > 0) {
                newResults.push({
                    id: 'connectivity',
                    name: 'Gemini API Connectivity',
                    status: 'success',
                    message: 'Successfully connected to Google Gemini',
                    details: `Available models: ${models.length}`
                });
            } else {
                newResults.push({
                    id: 'connectivity',
                    name: 'Gemini API Connectivity',
                    status: 'warning',
                    message: 'Connected but no models listed',
                    details: 'Check API Key permissions or quota'
                });
            }
        } catch (e: any) {
            newResults.push({
                id: 'connectivity',
                name: 'Gemini API Connectivity',
                status: 'error',
                message: 'Connection Failed',
                details: e.message
            });
        }

        setResults([...newResults]);

        // 3. User & Auth Status
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
                        message: 'Admin Role Verified (Supabase)',
                        details: `Role: ${userProfile.rol}, Plan: ${userProfile.subscriptionPlan}`
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

        setResults([...newResults]);
        setIsRunning(false);
    };

    // Auto-run on mount
    useEffect(() => {
        runDiagnostics();
    }, []);

    const getIcon = (status: string) => {
        switch (status) {
            case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'error': return <XCircle className="w-5 h-5 text-red-500" />;
            case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
            default: return <Activity className="w-5 h-5 text-slate-400" />;
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto p-4">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Diagnóstico del Sistema</h2>
                    <p className="text-slate-500">Verifica la salud de la plataforma y la conectividad.</p>
                </div>
                <button onClick={runDiagnostics} disabled={isRunning} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                    <RefreshCw className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
                    {isRunning ? 'Ejecutando...' : 'Re-ejecutar Diagnóstico'}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.map((result) => (
                    <div key={result.id} className="bg-white rounded-lg border shadow-sm border-l-4" style={{
                        borderLeftColor: result.status === 'success' ? '#10b981' :
                            result.status === 'error' ? '#ef4444' :
                                result.status === 'warning' ? '#f59e0b' : '#94a3b8'
                    }}>
                        <div className="p-4 flex items-start gap-3">
                            <div className="mt-1">{getIcon(result.status)}</div>
                            <div>
                                <h3 className="font-semibold text-slate-800">{result.name}</h3>
                                <p className={`text-sm font-medium ${result.status === 'success' ? 'text-green-600' :
                                        result.status === 'error' ? 'text-red-600' :
                                            'text-amber-600'
                                    }`}>
                                    {result.message}
                                </p>
                                {result.details && (
                                    <p className="text-xs text-slate-400 mt-1 font-mono break-all">
                                        {result.details}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-lg border shadow-sm">
                <div className="p-6 pb-2">
                    <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                        <Shield className="w-5 h-5 text-indigo-500" />
                        Acciones de Recuperación
                    </h3>
                </div>
                <div className="p-6 pt-2 space-y-4">
                    <p className="text-sm text-slate-600">
                        Si detectas errores en la API Key o Permisos, utiliza estas acciones para intentar corregirlos automáticamente o contacta a soporte.
                    </p>
                    <div className="flex gap-3">
                        <button onClick={() => window.location.reload()} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium text-sm">
                            Recargar Aplicación (Cache Reset)
                        </button>
                        <button onClick={() => supabase.auth.signOut()} className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium text-sm">
                            Cerrar Sesión (Auth Reset)
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
