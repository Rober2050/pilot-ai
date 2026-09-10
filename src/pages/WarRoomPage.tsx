import { useState, useEffect } from 'react';
import WarRoomLab from '../components/admin/WarRoomLab';
import { rolesService } from '../services/firebase/rolesService';
import { RoleConfig } from '../types/roles';

export default function WarRoomPage() {
    const [roles, setRoles] = useState<RoleConfig[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchRoles = async () => {
            try {
                const data = await rolesService.getAllRoles();
                if (data && data.length > 0) {
                    setRoles(data);
                }
            } catch (err) {
                console.error("Failed to load roles", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchRoles();
    }, []);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="h-full w-full bg-slate-900">
            <WarRoomLab
                roles={roles}
                theme="realistic"
                fullScreen={true}
            />
        </div>
    );
}
