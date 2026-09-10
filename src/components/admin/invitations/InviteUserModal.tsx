import React, { useState } from 'react';
import { X, Copy, Check } from 'lucide-react';
import { SubscriptionPlan } from '../../../services/firebase/subscriptionService';

interface InviteUserModalProps {
    plans: SubscriptionPlan[];
    onClose: () => void;
    onInvite: (email: string, role: string, displayName: string, planId: string) => Promise<void>;
}

export const InviteUserModal: React.FC<InviteUserModalProps> = ({ plans, onClose, onInvite }) => {
    const [newUser, setNewUser] = useState({ email: '', displayName: '', role: 'user', planId: 'free' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [inviteLink, setInviteLink] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            await onInvite(newUser.email, newUser.role, newUser.displayName, newUser.planId);
            // Generate link
            const link = `${window.location.origin}/login?email=${encodeURIComponent(newUser.email)}`;
            setInviteLink(link);
        } catch (error) {
            console.error(error);
            // Error handling should be done by parent or we can show error state here
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCopy = () => {
        if (inviteLink) {
            navigator.clipboard.writeText(inviteLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-slate-900">Add New User</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {!inviteLink ? (
                    <>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Display Name</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    value={newUser.displayName}
                                    onChange={e => setNewUser({ ...newUser, displayName: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    className="input-field"
                                    value={newUser.email}
                                    onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                                <select
                                    className="input-field"
                                    value={newUser.role}
                                    onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                                >
                                    <option value="user">User</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Subscription Plan</label>
                                <select
                                    className="input-field"
                                    value={newUser.planId}
                                    onChange={e => setNewUser({ ...newUser, planId: e.target.value })}
                                >
                                    {plans.map(plan => (
                                        <option key={plan.id} value={plan.id}>
                                            {plan.name} ({plan.billingCycle})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
                            <button onClick={onClose} className="btn-secondary">Cancel</button>
                            <button onClick={handleSubmit} disabled={isSubmitting} className="btn-primary">
                                {isSubmitting ? 'Creating...' : 'Create Invitation'}
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="p-6 text-center space-y-6">
                        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                            <Check className="h-8 w-8" />
                        </div>
                        <div>
                            <h4 className="text-lg font-bold text-slate-900">User Pre-approved!</h4>
                            <p className="text-slate-500 mt-1">
                                Share this link with the user to help them get started.
                            </p>
                        </div>

                        <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                            <code className="flex-1 text-sm text-slate-700 break-all text-left">
                                {inviteLink}
                            </code>
                            <button
                                onClick={handleCopy}
                                className="p-2 text-slate-500 hover:text-primary-600 transition-colors"
                            >
                                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            </button>
                        </div>

                        <button onClick={onClose} className="btn-primary w-full">
                            Done
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
