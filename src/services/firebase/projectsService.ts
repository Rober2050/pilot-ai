/**
 * Projects Service — migrado de Firestore a Supabase.
 *
 * Mapea Firestore docs a filas de la tabla `public.projects`. El blueprint
 * completo se guarda en la columna JSONB `blueprint` (schema flexible).
 *
 * Notas:
 *  - Firestore subcollection `projects/{id}/context/source_data` no tiene
 *    equivalente directo. Se almacena dentro del JSONB blueprint.contextData.
 */

import { supabase } from './firebaseClient';
import { Project, Blueprint, RoleOutput, SynthesisOutput } from '../../types/blueprint';

const TABLE = 'projects';

const rowToProject = (row: any): Project => {
    const blueprint = row.blueprint || {};
    return {
        id: row.project_id || row.id,
        userId: row.user_id,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        ideaOriginal: blueprint.ideaOriginal || row.idea_original || '',
        language: row.language || 'es',
        methodology: row.methodology || 'pmo',
        status: row.status,
        blueprint,
    } as Project;
};

export const projectsService = {
    createProject: async (
        userId: string,
        idea: string,
        language: 'en' | 'es',
        methodology: 'agile' | 'pmo' | 'hybrid' = 'pmo',
    ): Promise<string> => {
        const initialBlueprint: Blueprint = {
            meta: {
                projectId: '',
                projectName: idea.length > 60 ? idea.substring(0, 60) + '...' : idea,
                language,
                methodology,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                version: '1.0.0',
            },
            ideaOriginal: idea,
            roles: {},
            documentationConfig: {},
        };

        const { data, error } = await supabase
            .from(TABLE)
            .insert({
                user_id: userId,
                project_name: initialBlueprint.meta.projectName,
                language,
                methodology,
                status: 'draft',
                blueprint: initialBlueprint,
            })
            .select('id, project_id')
            .single();

        if (error) {
            console.error('Error creating project:', error);
            throw error;
        }

        const projectId = data.project_id || data.id;

        // Update blueprint.meta.projectId now that we have the ID
        const updatedBlueprint = {
            ...initialBlueprint,
            meta: { ...initialBlueprint.meta, projectId },
        };
        await supabase
            .from(TABLE)
            .update({ blueprint: updatedBlueprint })
            .eq('id', data.id);

        return projectId;
    },

    getProjectById: async (projectId: string): Promise<Project | null> => {
        // Try by project_id first, then by UUID id
        let { data, error } = await supabase
            .from(TABLE)
            .select('*')
            .eq('project_id', projectId)
            .maybeSingle();

        if (!data && !error) {
            const result = await supabase
                .from(TABLE)
                .select('*')
                .eq('id', projectId)
                .maybeSingle();
            data = result.data;
            error = result.error;
        }

        if (error) {
            console.error('Error getting project:', error);
            return null;
        }
        return data ? rowToProject(data) : null;
    },

    getUserProjects: async (userId: string): Promise<Project[]> => {
        const { data, error } = await supabase
            .from(TABLE)
            .select('*')
            .eq('user_id', userId)
            .order('updated_at', { ascending: false });

        if (error) {
            console.error('Error getting user projects:', error);
            return [];
        }
        return (data || []).map(rowToProject);
    },

    countUserProjects: async (userId: string): Promise<number> => {
        const { count, error } = await supabase
            .from(TABLE)
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);
        if (error) return 0;
        return count || 0;
    },

    getProjectsByStatus: async (userId: string, status: Project['status']): Promise<Project[]> => {
        const { data, error } = await supabase
            .from(TABLE)
            .select('*')
            .eq('user_id', userId)
            .eq('status', status)
            .order('updated_at', { ascending: false });

        if (error) return [];
        return (data || []).map(rowToProject);
    },

    updateBlueprintRole: async (projectId: string, roleId: string, data: RoleOutput) => {
        const project = await projectsService.getProjectById(projectId);
        if (!project) throw new Error(`Project ${projectId} not found`);

        const updatedBlueprint = {
            ...project.blueprint,
            roles: { ...project.blueprint.roles, [roleId]: data },
            meta: { ...project.blueprint.meta, updatedAt: new Date().toISOString() },
        };

        // Try update by project_id first, fall back to id
        const { error } = await supabase
            .from(TABLE)
            .update({ blueprint: updatedBlueprint })
            .or(`project_id.eq.${projectId},id.eq.${projectId}`);
        if (error) throw error;
    },

    updateBlueprintSynthesis: async (
        projectId: string,
        synthesis: SynthesisOutput | null,
        status: 'pending' | 'processing' | 'completed' | 'error',
    ): Promise<void> => {
        const project = await projectsService.getProjectById(projectId);
        if (!project) throw new Error(`Project ${projectId} not found`);

        const updatedBlueprint: any = {
            ...project.blueprint,
            synthesisStatus: status,
        };
        if (synthesis !== null) {
            updatedBlueprint.synthesis = synthesis;
        }

        const { error } = await supabase
            .from(TABLE)
            .update({ blueprint: updatedBlueprint })
            .or(`project_id.eq.${projectId},id.eq.${projectId}`);
        if (error) throw error;
    },

    updateProjectStatus: async (projectId: string, status: Project['status']): Promise<void> => {
        const { error } = await supabase
            .from(TABLE)
            .update({ status })
            .or(`project_id.eq.${projectId},id.eq.${projectId}`);
        if (error) throw error;
    },

    updateProjectName: async (projectId: string, name: string): Promise<void> => {
        const project = await projectsService.getProjectById(projectId);
        if (!project) throw new Error(`Project ${projectId} not found`);

        const updatedBlueprint = {
            ...project.blueprint,
            meta: { ...project.blueprint.meta, projectName: name },
        };

        const { error } = await supabase
            .from(TABLE)
            .update({ blueprint: updatedBlueprint, project_name: name })
            .or(`project_id.eq.${projectId},id.eq.${projectId}`);
        if (error) throw error;
    },

    archiveProject: async (projectId: string): Promise<void> => {
        await projectsService.updateProjectStatus(projectId, 'archived');
    },

    deleteProject: async (projectId: string): Promise<void> => {
        const { error } = await supabase
            .from(TABLE)
            .delete()
            .or(`project_id.eq.${projectId},id.eq.${projectId}`);
        if (error) throw error;
    },

    getProjectStats: async (
        userId: string,
    ): Promise<{ total: number; inProgress: number; completed: number; draft: number }> => {
        const projects = await projectsService.getUserProjects(userId);
        return {
            total: projects.filter((p) => p.status !== 'archived').length,
            inProgress: projects.filter((p) => p.status === 'in_progress').length,
            completed: projects.filter((p) => p.status === 'completed').length,
            draft: projects.filter((p) => p.status === 'draft').length,
        };
    },

    getAverageProcessingTime: async (userId: string): Promise<number> => {
        const completedProjects = await projectsService.getProjectsByStatus(userId, 'completed');
        if (completedProjects.length === 0) return 0;
        const totalTime = completedProjects.reduce((sum, project) => {
            const created = new Date(project.createdAt).getTime();
            const updated = new Date(project.updatedAt).getTime();
            return sum + (updated - created);
        }, 0);
        return Math.round(totalTime / completedProjects.length / 1000 / 60);
    },

    getProjectProgress: (project: Project): number => {
        const roles = Object.values(project.blueprint.roles);
        if (roles.length === 0) return 0;
        const completedRoles = roles.filter((role) => role.status === 'completed').length;
        return Math.round((completedRoles / roles.length) * 100);
    },

    saveDiscoveryAnswers: async (projectId: string, roleId: string, answers: Record<string, string>) => {
        const project = await projectsService.getProjectById(projectId);
        if (!project) throw new Error(`Project ${projectId} not found`);

        const currentRole = project.blueprint.roles[roleId] || ({} as RoleOutput);
        const updatedBlueprint = {
            ...project.blueprint,
            roles: {
                ...project.blueprint.roles,
                [roleId]: { ...currentRole, discoveryAnswers: answers },
            },
        };

        const { error } = await supabase
            .from(TABLE)
            .update({ blueprint: updatedBlueprint })
            .or(`project_id.eq.${projectId},id.eq.${projectId}`);
        if (error) throw error;
    },

    isProjectComplete: (project: Project): boolean => {
        const roles = Object.values(project.blueprint.roles);
        if (roles.length === 0) return false;
        return roles.every((role) => role.status === 'completed');
    },

    /**
     * Guarda contexto largo (PDFs parseados) dentro del blueprint JSONB.
     * En Firestore esto era una subcollection; aquí va al campo contextData.
     */
    saveProjectContext: async (projectId: string, content: string): Promise<void> => {
        if (!content) return;
        const project = await projectsService.getProjectById(projectId);
        if (!project) throw new Error(`Project ${projectId} not found`);

        const updatedBlueprint = {
            ...project.blueprint,
            contextData: { content, updatedAt: new Date().toISOString() },
        };

        const { error } = await supabase
            .from(TABLE)
            .update({ blueprint: updatedBlueprint })
            .or(`project_id.eq.${projectId},id.eq.${projectId}`);
        if (error) throw error;
    },

    getProjectContext: async (projectId: string): Promise<string | null> => {
        const project = await projectsService.getProjectById(projectId);
        const ctx = (project?.blueprint as any)?.contextData?.content;
        return ctx || null;
    },

    /**
     * Crea un snapshot público en `shared_blueprints` para compartir.
     */
    createPublicSnapshot: async (projectId: string, blueprint: Blueprint): Promise<string> => {
        const { data, error } = await supabase
            .from('shared_blueprints')
            .insert({
                blueprint: { ...blueprint, originalProjectId: projectId, isPublic: true },
            })
            .select('id')
            .single();
        if (error) throw error;
        return data.id;
    },

    getPublicSnapshot: async (snapshotId: string): Promise<any | null> => {
        const { data, error } = await supabase
            .from('shared_blueprints')
            .select('*')
            .eq('id', snapshotId)
            .maybeSingle();
        if (error || !data) return null;
        if (!data.blueprint?.isPublic) return null;
        return { id: data.id, ...data.blueprint };
    },
};
