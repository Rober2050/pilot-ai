import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/firebase/firebaseClient';

export default function ResetPassword() {
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [done, setDone] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (password.length < 8) {
            setError('La contraseña debe tener al menos 8 caracteres.');
            return;
        }
        if (password !== confirm) {
            setError('Las contraseñas no coinciden.');
            return;
        }

        setIsLoading(true);
        try {
            const { error: updateError } = await supabase.auth.updateUser({ password });
            if (updateError) throw updateError;
            setDone(true);
            setTimeout(() => navigate('/login'), 2500);
        } catch (err: any) {
            setError(err.message || 'Error al actualizar la contraseña.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-600 rounded-xl mb-4">
                        <span className="text-white font-bold text-lg">P</span>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">PILOT AI</h1>
                    <p className="text-slate-500 text-sm mt-1">Nueva contraseña</p>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                    {done ? (
                        <div className="text-center py-4">
                            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h2 className="text-lg font-semibold text-slate-900 mb-2">¡Contraseña actualizada!</h2>
                            <p className="text-slate-500 text-sm">Redirigiendo al login...</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900 mb-1">Establecer nueva contraseña</h2>
                                <p className="text-slate-500 text-sm">Elige una contraseña segura de al menos 8 caracteres.</p>
                            </div>

                            {error && (
                                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">
                                    Nueva contraseña
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="Mínimo 8 caracteres"
                                    required
                                    autoFocus
                                    className="w-full px-4 py-3 border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">
                                    Confirmar contraseña
                                </label>
                                <input
                                    type="password"
                                    value={confirm}
                                    onChange={e => setConfirm(e.target.value)}
                                    placeholder="Repite tu nueva contraseña"
                                    required
                                    className="w-full px-4 py-3 border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                            >
                                {isLoading ? 'Actualizando...' : 'Guardar nueva contraseña'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
