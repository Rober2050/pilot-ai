import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { Globe, Check, X } from 'lucide-react';
import { authService } from '../services/firebase/authService';
import { notificationService } from '../services/ui/notificationService';

export default function Settings() {
    const { user, userProfile } = useAuth();
    const { t, i18n } = useTranslation('translation');
    const [isEditingName, setIsEditingName] = useState(false);
    const [newName, setNewName] = useState(userProfile?.displayName || '');
    const [isSavingName, setIsSavingName] = useState(false);
    const [isSendingReset, setIsSendingReset] = useState(false);

    // Detect if user is authenticated via Google (Supabase OAuth users always have photoURL)
    const isGoogleUser = !!(user?.photoURL);

    const changeLanguage = (lang: string) => {
        i18n.changeLanguage(lang);
    };

    const handleSaveName = async () => {
        if (!newName.trim()) {
            notificationService.showError('El nombre no puede estar vacío', 'Settings');
            return;
        }

        setIsSavingName(true);
        try {
            await authService.updateDisplayName(newName.trim());
            notificationService.showSuccess('Nombre actualizado correctamente');
            setIsEditingName(false);
        } catch (error) {
            notificationService.showError('Error al actualizar el nombre', 'Settings', error);
        } finally {
            setIsSavingName(false);
        }
    };

    const handleResetPassword = async () => {
        if (!userProfile?.email) return;

        setIsSendingReset(true);
        try {
            await authService.sendPasswordReset(userProfile.email);
            notificationService.showSuccess('Te enviamos un email para restablecer tu contraseña');
        } catch (error) {
            notificationService.showError('Error al enviar el email de recuperación', 'Settings', error);
        } finally {
            setIsSendingReset(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-slate-900 mb-8">{t('settings.title')}</h1>

            <div className="space-y-6">
                {/* Profile Section */}
                <div className="card">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">{t('settings.profile.title')}</h2>

                    {/* Avatar & Name/Email */}
                    <div className="flex items-start gap-6 mb-6">
                        {/* Avatar — show Google photo if available, else initial */}
                        {isGoogleUser && userProfile?.photoURL ? (
                            <img
                                src={userProfile.photoURL}
                                alt={userProfile.displayName || 'User'}
                                className="h-20 w-20 rounded-full object-cover shrink-0"
                            />
                        ) : (
                            <div className="h-20 w-20 rounded-full bg-primary-100 flex items-center justify-center text-3xl font-bold text-primary-600 shrink-0">
                                {userProfile?.displayName?.[0] || 'U'}
                            </div>
                        )}

                        <div className="flex-1">
                            {/* Name Section */}
                            {isEditingName ? (
                                <div className="mb-4">
                                    <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">
                                        {t('settings.profile.nameLabel') || 'Nombre'}
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newName}
                                            onChange={(e) => setNewName(e.target.value)}
                                            placeholder="Tu nombre"
                                            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                            autoFocus
                                        />
                                        <button
                                            onClick={handleSaveName}
                                            disabled={isSavingName}
                                            className="px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center gap-1"
                                            title="Guardar"
                                        >
                                            <Check size={16} />
                                        </button>
                                        <button
                                            onClick={() => {
                                                setIsEditingName(false);
                                                setNewName(userProfile?.displayName || '');
                                            }}
                                            disabled={isSavingName}
                                            className="px-3 py-2 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors flex items-center gap-1"
                                            title="Cancelar"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="mb-4">
                                    <h3 className="font-semibold text-slate-900 text-lg mb-1">
                                        {userProfile?.displayName || 'Usuario'}
                                    </h3>
                                    <p className="text-slate-500 text-sm mb-3">{userProfile?.email}</p>
                                    {isGoogleUser && (
                                        <p className="text-xs text-slate-400 mb-3">Linked with Google</p>
                                    )}
                                    <button
                                        onClick={() => setIsEditingName(true)}
                                        className="btn-secondary text-sm"
                                    >
                                        {t('settings.profile.editName') || 'Editar nombre'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Password Reset Button — hidden for Google users */}
                    {!isGoogleUser && (
                        <div className="border-t border-slate-200 pt-6">
                            <p className="text-sm text-slate-600 mb-3">
                                {t('settings.profile.changePasswordDesc') || 'Recibe un email para cambiar tu contraseña'}
                            </p>
                            <button
                                onClick={handleResetPassword}
                                disabled={isSendingReset}
                                className="btn-secondary text-sm disabled:opacity-50"
                            >
                                {isSendingReset ? (t('common.sending') || 'Enviando...') : (t('settings.profile.changePassword') || 'Cambiar contraseña')}
                            </button>
                        </div>
                    )}
                </div>

                {/* Language */}
                <div className="card">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">{t('settings.language.title')}</h2>
                    <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl">
                        <div className="flex items-center gap-3">
                            <Globe className="h-5 w-5 text-slate-400" />
                            <div>
                                <p className="font-medium text-slate-900">{t('settings.language.interfaceLanguage')}</p>
                                <p className="text-sm text-slate-500">{t('settings.language.selectLanguage')}</p>
                            </div>
                        </div>
                        <select
                            className="btn-secondary text-sm"
                            value={i18n.language}
                            onChange={(e) => changeLanguage(e.target.value)}
                        >
                            <option value="en">English</option>
                            <option value="es">Español</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
}
