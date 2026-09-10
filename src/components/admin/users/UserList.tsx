import React from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { UserProfile } from '../../../services/firebase/usersService';

interface UserListProps {
    users: UserProfile[];
    onUpdateStatus: (uid: string, status: 'active' | 'disabled') => void;
    onDelete: (uid: string) => void;
    onCreate: () => void;
    onEdit: (user: UserProfile) => void;
}

export const UserList: React.FC<UserListProps> = ({ users, onUpdateStatus, onDelete, onCreate, onEdit }) => {
    const { t } = useTranslation('translation');

    return (
        <div className="card">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-slate-900">{t('admin.userManagement')}</h2>
                <button
                    className="btn-secondary text-sm py-1.5"
                    onClick={onCreate}
                >
                    <Plus className="h-4 w-4 mr-1" />
                    Add User
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-slate-200 text-slate-500 text-sm">
                            <th className="py-3 px-4 font-medium">User</th>
                            <th className="py-3 px-4 font-medium">Role</th>
                            <th className="py-3 px-4 font-medium">Plan</th>
                            <th className="py-3 px-4 font-medium">Status</th>
                            <th className="py-3 px-4 font-medium text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        {users.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="py-8 text-center text-slate-500">
                                    No users found.
                                </td>
                            </tr>
                        ) : users.map((user) => (
                            <tr key={user.uid} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                                <td className="py-3 px-4">
                                    <div className="font-medium text-slate-900">{user.displayName || 'Unknown'}</div>
                                    <div className="text-slate-500 text-xs">{user.email}</div>
                                </td>
                                <td className="py-3 px-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.rol === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'}`}>
                                        {user.rol}
                                    </span>
                                </td>
                                <td className="py-3 px-4">
                                    <div className="capitalize text-slate-700 font-medium">{user.subscriptionPlan}</div>
                                    {user.subscriptionEndDate && (
                                        <div className="text-xs text-slate-500">
                                            Exp: {new Date(user.subscriptionEndDate).toLocaleDateString()}
                                        </div>
                                    )}
                                </td>
                                <td className="py-3 px-4">
                                    <span className={`flex items-center gap-1.5 ${user.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>
                                        <span className={`h-1.5 w-1.5 rounded-full ${user.status === 'active' ? 'bg-green-600' : 'bg-red-600'}`}></span>
                                        {user.status}
                                    </span>
                                </td>
                                <td className="py-3 px-4 text-right">
                                    <button
                                        onClick={() => onEdit(user)}
                                        className="text-xs font-medium px-3 py-1.5 rounded-lg text-primary-600 hover:bg-primary-50 transition-colors"
                                        title="Edit User"
                                    >
                                        <Edit2 className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => onUpdateStatus(user.uid, user.status === 'active' ? 'disabled' : 'active')}
                                        className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ml-2 ${user.status === 'active' ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}
                                    >
                                        {user.status === 'active' ? 'Disable' : 'Activate'}
                                    </button>
                                    <button
                                        onClick={() => onDelete(user.uid)}
                                        className="text-xs font-medium px-3 py-1.5 rounded-lg text-red-600 hover:bg-red-50 ml-2"
                                        title="Delete User"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
