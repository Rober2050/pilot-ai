import React, { useEffect, useState } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sparkles, ArrowLeft, Loader2 } from 'lucide-react';
import { projectsService } from '../services/firebase/projectsService';
import { rolesService } from '../services/firebase/rolesService';
import { RoleConfig } from '../types/roles';
import { Project } from '../types/blueprint';
import ResultsWorkspace from '../components/ResultsWorkspace';

export default function PublicPitch() {
    const { id } = useParams<{ id: string }>();
    const { t } = useTranslation('project');
    const [loading, setLoading] = useState(true);
    const [snapshot, setSnapshot] = useState<any>(null);
    const [roles, setRoles] = useState<RoleConfig[]>([]);

    useEffect(() => {
        async function fetchSnapshot() {
            if (!id) return;
            try {
                const data = await projectsService.getPublicSnapshot(id);
                if (data) {
                    setSnapshot(data);
                    // Fetch roles to render icons/names properly
                    const allRoles = await rolesService.getAllRoles();
                    setRoles(allRoles);
                }
            } catch (err) {
                console.error("Failed to load snapshot", err);
            } finally {
                setLoading(false);
            }
        }
        fetchSnapshot();
    }, [id]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-slate-50">
                <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-slate-500 font-medium">Loading Pitch...</p>
            </div>
        );
    }

    if (!snapshot) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-slate-50 px-4 text-center">
                <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mb-4 text-slate-400">
                    <Sparkles size={24} />
                </div>
                <h1 className="text-2xl font-bold text-slate-800 mb-2">Pitch Not Found</h1>
                <p className="text-slate-500 mb-6 max-w-sm">This link might be invalid or the project is no longer public.</p>
                <Link to="/" className="btn-primary">
                    <ArrowLeft size={16} className="mr-2" /> Go to PILOT AI
                </Link>
            </div>
        );
    }

    const projectMock: Project = {
        id: snapshot.originalProjectId,
        userId: 'public',
        createdAt: snapshot.createdAt,
        updatedAt: snapshot.createdAt,
        ideaOriginal: snapshot.blueprint.ideaOriginal,
        status: 'completed',
        language: snapshot.blueprint.meta?.language || 'en',
        blueprint: snapshot.blueprint
    };

    // Filter roles to only those that have completed outputs in the snapshot
    const activeRoles = roles.filter(r => snapshot.blueprint.roles && snapshot.blueprint.roles[r.roleId]);

    const initialRole = activeRoles.find(r => r.roleId === 'ux-designer') || activeRoles[0];

    return (
        <div className="flex flex-col h-screen bg-white font-sans text-slate-900 overflow-hidden">
            {/* Minimal Header */}
            <header className="h-14 bg-slate-950 border-b border-indigo-900/50 flex items-center px-4 gap-4 shrink-0 z-50">
                <Link to="/" className="flex items-center gap-2 shrink-0 group">
                    <div className="w-7 h-7 rounded-md bg-indigo-600 flex items-center justify-center group-hover:bg-indigo-500 transition-colors">
                        <span className="text-white font-black text-[12px] tracking-tighter">P</span>
                    </div>
                    <span className="text-lg font-bold text-white tracking-tight">PILOT AI</span>
                </Link>
                <div className="w-px h-6 bg-slate-800" />
                <div className="flex-1 min-w-0">
                    <h1 className="text-sm font-semibold text-slate-200 truncate">
                        {snapshot.blueprint.meta?.projectName || 'Project Pitch'}
                    </h1>
                </div>
                <Link to="/" className="hidden sm:inline-flex items-center justify-center px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 rounded-full hover:bg-indigo-500 transition-colors">
                    Try PILOT AI
                </Link>
            </header>

            {/* Read-Only Workspace */}
            <div className="flex flex-1 overflow-hidden bg-slate-50 relative">
                {activeRoles.length > 0 ? (
                    <ResultsWorkspace
                        roles={activeRoles}
                        outputs={snapshot.blueprint.roles}
                        initialRoleId={initialRole?.roleId}
                        onRunRole={() => {}}
                        onUpdateRole={() => {}}
                        project={projectMock}
                        readOnly={true}
                    />
                ) : (
                    <div className="flex-1 flex items-center justify-center">
                        <p className="text-slate-400">No content available for this pitch.</p>
                    </div>
                )}
            </div>
            
            {/* Small floating branding for mobile */}
            <a href="/" target="_blank" rel="noopener noreferrer" className="sm:hidden absolute bottom-4 right-4 bg-slate-900/90 backdrop-blur-md text-white px-3 py-1.5 rounded-full shadow-lg text-[10px] font-bold z-50 flex items-center gap-1.5">
                <Sparkles size={10} className="text-indigo-400" />
                Generated by PILOT AI
            </a>
        </div>
    );
}
