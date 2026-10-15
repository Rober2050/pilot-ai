import { useEffect, useState, useRef } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { projectsService } from '../services/firebase/projectsService';
import { rolesService } from '../services/firebase/rolesService';
import { RoleConfig } from '../types/roles';
import { aiService } from '../services/ai/aiService';
import { docxGenerator } from '../services/export/docxGenerator';
import { excelGenerator } from '../services/export/excelGenerator';
import { jsonToYaml } from '../utils/yamlSerializer';
import { Project, RoleOutput } from '../types/blueprint';
import RolePanel from '../components/RolePanel';
import RoleCard from '../components/RoleCard';
import { Download, Share2, Settings, Loader2, FileText, Table as TableIcon } from 'lucide-react';
import { cn } from '../lib/utils';
import { buildPreviousRolesContext } from '../utils/compactRoleContext';

export default function ProjectPipeline() {
    const { t } = useTranslation(['project', 'translation']);
    const { id } = useParams<{ id: string }>();
    const location = useLocation();
    const [project, setProject] = useState<Project | null>(null);
    const [roles, setRoles] = useState<RoleConfig[]>([]);
    const [loading, setLoading] = useState(true);

    // State from navigation or defaults
    const [autoRun, setAutoRun] = useState<boolean>(() => {
        return location.state?.autoRun ?? false;
    });
    const [enabledRoles, setEnabledRoles] = useState<Set<string>>(() => {
        return new Set(location.state?.enabledRoles || []);
    });

    const [viewedRoleId, setViewedRoleId] = useState<string | null>(null);
    const [showExportMenu, setShowExportMenu] = useState(false);

    // Ref to track latest state in async functions
    const autoRunRef = useRef(autoRun);
    const enabledRolesRef = useRef(enabledRoles);
    const projectRef = useRef(project);

    useEffect(() => {
        autoRunRef.current = autoRun;
    }, [autoRun]);

    useEffect(() => {
        enabledRolesRef.current = enabledRoles;
    }, [enabledRoles]);

    useEffect(() => {
        projectRef.current = project;
    }, [project]);

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;
            try {
                const [projectData, rolesData] = await Promise.all([
                    projectsService.getProjectById(id),
                    rolesService.getAllRoles()
                ]);

                setProject(projectData);
                setRoles(rolesData);

                // If enabledRoles is empty (direct access), enable all
                if (enabledRoles.size === 0 && rolesData.length > 0) {
                    const allRoleIds = new Set(rolesData.map(r => r.roleId));
                    setEnabledRoles(allRoleIds);
                    enabledRolesRef.current = allRoleIds;
                }

                // Set first role as viewed
                if (rolesData.length > 0) {
                    setViewedRoleId(rolesData[0].roleId);
                }

                // Start auto-run if enabled
                if (location.state?.autoRun) {
                    processNextRole(projectData, rolesData, location.state.enabledRoles ? new Set(location.state.enabledRoles) : null);
                }

            } catch (error) {
                console.error("Error fetching project data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    const processNextRole = async (currentProject: Project | null, currentRoles: RoleConfig[], currentEnabledRoles: Set<string> | null) => {
        if (!currentProject || !autoRunRef.current) return;

        const rolesToUse = currentRoles;
        const enabled = currentEnabledRoles || enabledRolesRef.current;

        // Find first enabled role that hasn't completed or processing
        const nextRole = rolesToUse.find(r => {
            if (!enabled.has(r.roleId)) return false;
            const output = currentProject.blueprint.roles[r.roleId];
            return !output || (output.status !== 'completed' && output.status !== 'processing');
        });

        if (nextRole) {
            setViewedRoleId(nextRole.roleId);
            await runRoleAnalysis(nextRole, currentProject, currentRoles);
        }
    };

    const handleExport = (type: 'docx' | 'xlsx' | 'json' | 'yaml') => {
        if (!project) return;

        if (type === 'docx') {
            docxGenerator.generateReport(project.blueprint, roles);
        } else if (type === 'xlsx') {
            excelGenerator.generateSpreadsheet(project.blueprint, roles);
        } else if (type === 'json') {
            const blob = new Blob([JSON.stringify(project.blueprint, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${project.blueprint.meta.projectName}_Blueprint.json`;
            a.click();
        } else if (type === 'yaml') {
            const yamlContent = jsonToYaml(project.blueprint);
            const blob = new Blob([yamlContent], { type: 'text/yaml' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${project.blueprint.meta.projectName}_Blueprint.yaml`;
            a.click();
        }
        setShowExportMenu(false);
    };

    const runRoleAnalysis = async (role: RoleConfig, currentProject: Project = project!, currentRoles: RoleConfig[] = roles) => {
        if (!currentProject || !id) return;



        // Optimistic update
        const newRoleOutput: RoleOutput = {
            status: 'processing',
            content: null,
            lastUpdated: new Date().toISOString()
        };

        const updatedProject = {
            ...currentProject,
            blueprint: {
                ...currentProject.blueprint,
                roles: {
                    ...currentProject.blueprint.roles,
                    [role.roleId]: newRoleOutput
                }
            }
        };

        setProject(updatedProject);

        try {
            // Construct context from previous roles
            const previousRolesContext = currentRoles
                .filter(r => r.orderIndex < role.orderIndex)
                .map(r => ({
                    role: r.displayName,
                    output: updatedProject.blueprint.roles[r.roleId]?.content
                }));

            let docInstructions = "";
            if (role.docConfig?.charts) {
                docInstructions += `\n- VISUALIZATION: Include a 'charts' key in your JSON response. This should be an array of chart objects.\n  Example: { "type": "bar", "title": "Market Growth", "data": [{ "name": "2023", "value": 100 }, { "name": "2024", "value": 150 }] }\n  Supported types: 'bar', 'pie'.`;
            }
            if (role.docConfig?.flowDiagrams || role.docConfig?.swimlanes || role.docConfig?.c4 || role.docConfig?.architecture) {
                docInstructions += `\n- DIAGRAMS: Include a 'diagrams' key in your JSON response. This should be an array of diagram objects.\n  \n  CRITICAL: You must generate diagrams as structured JSON data, NOT as text-based diagram code.\n  \n  JSON STRUCTURE FOR DIAGRAMS:\n  {\n    "title": "Diagram Title",\n    "description": "Brief description of what this diagram shows",\n    "code": {\n      "direction": "TB", // or "LR"\n      "nodes": [\n        { "id": "node1", "label": "Start", "type": "start", "group": "Swimlane A" },\n        { "id": "node2", "label": "Process", "type": "default", "group": "Swimlane B" }\n      ],\n      "edges": [\n        { "from": "node1", "to": "node2", "label": "Action" }\n      ]\n    }\n  }\n\n  Node Types: "start", "end", "condition", "database", "cloud", "default".\n  Use the 'group' property to define swimlanes or clusters.`;
            }

            const promptContext = `
        Project Idea: ${currentProject.ideaOriginal}
        Output Language: ${currentProject.language === 'es' ? 'Spanish' : 'English'} (IMPORTANT: Generate all content in this language)
        
        Previous Analyses:
        ${buildPreviousRolesContext(previousRolesContext)}
        
        Your Task:
        Perform your specific role analysis based on the idea and previous context.
        Return the result as a valid JSON object matching your role's schema.
        ${docInstructions}
      `;

            const result = await aiService.generateJSON(role.model, role.systemPrompt, promptContext);

            const completedOutput: RoleOutput = {
                status: 'completed',
                content: result,
                lastUpdated: new Date().toISOString()
            };

            // Update local state
            const finalProject = {
                ...updatedProject,
                blueprint: {
                    ...updatedProject.blueprint,
                    roles: {
                        ...updatedProject.blueprint.roles,
                        [role.roleId]: completedOutput
                    }
                }
            };
            setProject(finalProject);

            // Persist to Firebase
            await projectsService.updateBlueprintRole(id, role.roleId, completedOutput);

            // Auto-advance
            if (autoRunRef.current) {
                // Small delay to allow UI to update
                setTimeout(() => processNextRole(finalProject, currentRoles, null), 500);
            }

        } catch (error) {
            console.error(`Error running role ${role.roleId}:`, error);

            const errorOutput: RoleOutput = {
                status: 'error',
                content: "Analysis failed. Please try again.",
                lastUpdated: new Date().toISOString()
            };

            setProject(prev => prev ? ({
                ...prev,
                blueprint: {
                    ...prev.blueprint,
                    roles: {
                        ...prev.blueprint.roles,
                        [role.roleId]: errorOutput
                    }
                }
            }) : null);

            await projectsService.updateBlueprintRole(id, role.roleId, errorOutput);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 text-primary-600 animate-spin" />
            </div>
        );
    }

    if (!project) {
        return <div className="p-8 text-slate-500 text-center">{t('pipeline.notFound')}</div>;
    }

    return (
        <div className="max-w-7xl mx-auto pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 pt-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-1">{project.blueprint.meta.projectName}</h1>
                    <p className="text-slate-500 text-sm">ID: {project.id}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    {/* Auto Flow Toggle */}
                    <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200">
                        <span className="text-sm font-medium text-slate-600">{t('pipeline.autoFlow')}</span>
                        <button
                            onClick={() => setAutoRun(!autoRun)}
                            className={cn(
                                "w-12 h-6 rounded-full transition-colors relative",
                                autoRun ? "bg-green-500" : "bg-slate-300"
                            )}
                        >
                            <div className={cn(
                                "absolute top-1 w-4 h-4 rounded-full bg-white transition-transform duration-200 shadow-sm",
                                autoRun ? "left-7" : "left-1"
                            )} />
                        </button>
                    </div>

                    <div className="flex gap-3">
                        <button className="btn-secondary">
                            <Share2 className="h-4 w-4" />
                            {t('translation:common.share')}
                        </button>

                        <div className="relative">
                            <button
                                className="btn-primary"
                                onClick={() => setShowExportMenu(!showExportMenu)}
                            >
                                <Download className="h-4 w-4" />
                                {t('translation:common.export')}
                            </button>
                            {showExportMenu && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 z-10 overflow-hidden animate-in fade-in zoom-in duration-200">
                                    <button onClick={() => handleExport('docx')} className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-2 text-sm text-slate-700">
                                        <FileText className="h-4 w-4 text-blue-600" /> {t('pipeline.exportReport')}
                                    </button>
                                    <button onClick={() => handleExport('xlsx')} className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-2 text-sm text-slate-700">
                                        <TableIcon className="h-4 w-4 text-emerald-600" /> {t('pipeline.exportExcel')}
                                    </button>
                                    <button onClick={() => handleExport('json')} className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-2 text-sm text-slate-700">
                                        <Settings className="h-4 w-4 text-slate-600" /> {t('pipeline.exportJson')}
                                    </button>
                                    <button onClick={() => handleExport('yaml')} className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-2 text-sm text-slate-700">
                                        <FileText className="h-4 w-4 text-purple-600" /> Export YAML
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Roles Horizontal List - Updated to 2-Row Centered Layout */}
            <div className="relative py-2 px-4 flex justify-center mb-8">
                {/* Connecting Line */}
                <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-slate-100 -z-10 -translate-y-4 hidden md:block max-w-4xl mx-auto" />

                <div className="flex items-start justify-center gap-4 md:gap-8 flex-wrap max-w-4xl">
                    {roles.map((role) => (
                        <RoleCard
                            key={role.roleId}
                            role={role}
                            output={project.blueprint.roles[role.roleId]}
                            isActive={viewedRoleId === role.roleId}
                            isEnabled={enabledRoles.has(role.roleId)}
                            onToggle={(id) => {
                                const newSet = new Set(enabledRoles);
                                if (newSet.has(id)) newSet.delete(id);
                                else newSet.add(id);
                                setEnabledRoles(newSet);
                            }}
                        />
                    ))}
                </div>
            </div>

            {/* Original Idea Card (Collapsed or Small) */}
            <div className="mb-8 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">{t('pipeline.originalConcept')}</h3>
                <p className="text-slate-700">{project.ideaOriginal}</p>
            </div>

            {/* Active Role Content */}
            <div className="min-h-[400px]">
                {viewedRoleId ? (
                    (() => {
                        const role = roles.find(r => r.roleId === viewedRoleId);
                        if (!role) return null;
                        return (
                            <RolePanel
                                key={role.roleId}
                                role={{
                                    ...role,
                                    isEnabled: enabledRoles.has(role.roleId)
                                }}
                                output={project.blueprint.roles[role.roleId]}
                                isActive={true}
                                onRun={() => runRoleAnalysis(role)}
                                onUpdate={(data) => console.log("Update from chat:", data)}
                            />
                        );
                    })()
                ) : (
                    <div className="text-center py-20 text-slate-400">
                        {t('pipeline.selectRole')}
                    </div>
                )}
            </div>
        </div>
    );
}
