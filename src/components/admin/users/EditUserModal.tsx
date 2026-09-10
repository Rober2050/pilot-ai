import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { UserProfile } from '../../../services/firebase/usersService';
import { SubscriptionPlan } from '../../../services/firebase/subscriptionService';

interface EditUserModalProps {
    user: UserProfile;
    plans: SubscriptionPlan[];
    onClose: () => void;
    onSave: (uid: string, updates: Partial<UserProfile>) => Promise<void>;
}

export const EditUserModal: React.FC<EditUserModalProps> = ({ user, plans, onClose, onSave }) => {
    const [displayName, setDisplayName] = useState(user.displayName);
    const [rol, setRol] = useState(user.rol);
    const [planId, setPlanId] = useState(user.planId || user.subscriptionPlan);
    const [status, setStatus] = useState(user.status);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setDisplayName(user.displayName);
        setRol(user.rol);
        setPlanId(user.planId || user.subscriptionPlan);
        setStatus(user.status);
    }, [user]);

    const handleSave = async () => {
        setLoading(true);
        try {
            const selectedPlan = plans.find(p => p.id === planId);
            let expirationDate = user.subscriptionEndDate;

            // Calculate new expiration if plan changed
            if (selectedPlan && selectedPlan.billingCycle !== 'lifetime' && planId !== user.planId) {
                const now = new Date();
                const duration = selectedPlan.durationValue || 1;

                if (selectedPlan.billingCycle === 'daily') now.setDate(now.getDate() + duration);
                if (selectedPlan.billingCycle === 'monthly') now.setMonth(now.getMonth() + duration);
                if (selectedPlan.billingCycle === 'yearly') now.setFullYear(now.getFullYear() + duration);
                expirationDate = now.toISOString();
            }

            await onSave(user.uid, {
                displayName,
                rol,
                planId,
                subscriptionPlan: planId as 'free' | 'pro' | 'enterprise',
                subscriptionEndDate: expirationDate,
                status
            });

            onClose();
        } catch (error) {
            console.error('Error updating user:', error);
            alert('Error al actualizar usuario');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-slate-900">Editar Usuario</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
                        <input
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            className="input-field"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                        <input
                            type="email"
                            value={user.email}
                            className="input-field bg-slate-50 cursor-not-allowed"
                            disabled
                        />
                        <p className="text-xs text-slate-500 mt-1">El email no se puede modificar</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Rol</label>
                        <select
                            value={rol}
                            onChange={(e) => setRol(e.target.value as 'admin' | 'user')}
                            className="input-field"
                        >
                            <option value="user">Usuario</option>
                            <option value="admin">Administrador</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Plan de Suscripción</label>
                        <select
                            value={planId}
                            onChange={(e) => setPlanId(e.target.value)}
                            className="input-field"
                        >
                            {plans.map(plan => (
                                <option key={plan.id} value={plan.id}>
                                    {plan.name} ({plan.billingCycle})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Estado</label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value as 'active' | 'disabled')}
                            className="input-field"
                        >
                            <option value="active">Activo</option>
                            <option value="disabled">Deshabilitado</option>
                        </select>
                    </div>

                    {user.subscriptionEndDate && (
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                            <p className="text-xs text-slate-600">
                                <strong>Vencimiento actual:</strong>{' '}
                                {new Date(user.subscriptionEndDate).toLocaleDateString()}
                            </p>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
                    <button onClick={onClose} className="btn-secondary">Cancelar</button>
                    <button onClick={handleSave} disabled={loading} className="btn-primary">
                        {loading ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                </div>
            </div>
        </div>
    );
};
