import { Document, Packer, Paragraph, TextRun, HeadingLevel, TableOfContents, PageBreak, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle, Header, Footer, PageNumber } from "docx";
import { saveAs } from "file-saver";
import { Blueprint } from "../../types/blueprint";
import { RoleConfig } from "../../types/roles";
import { NormalizedDocument, NormalizedSection } from "./contentNormalizer";
import { getRoleExportProfile } from "../../constants/roleExportConfig";

export const docxGenerator = {
    generateReport: async (blueprint: Blueprint, roles: RoleConfig[]) => {
        const sections = [];

        // --- Cover Page ---
        sections.push(
            new Paragraph({
                text: blueprint.meta.projectName || "Product Blueprint",
                heading: HeadingLevel.TITLE,
                alignment: AlignmentType.CENTER,
                spacing: { before: 5000, after: 300 },
            }),
            new Paragraph({
                text: `Version: ${blueprint.meta.version}`,
                alignment: AlignmentType.CENTER,
                spacing: { after: 100 },
                children: [new TextRun({ size: 28, bold: true, color: "5A5A5A" })]
            }),
            new Paragraph({
                text: `Generated on: ${new Date().toLocaleDateString()}`,
                alignment: AlignmentType.CENTER,
                spacing: { after: 5000 },
                children: [new TextRun({ size: 24, italics: true, color: "888888" })]
            }),
            new Paragraph({
                text: "PILOT AI Generated Report",
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ size: 20, color: "AAAAAA" })],
                pageBreakBefore: true
            })
        );

        // --- Table of Contents ---
        sections.push(
            new Paragraph({
                text: "Table of Contents",
                heading: HeadingLevel.HEADING_1,
                alignment: AlignmentType.CENTER,
                pageBreakBefore: true,
                spacing: { after: 400 }
            }),
            new TableOfContents("Summary", {
                hyperlink: true,
                headingStyleRange: "1-5",
            }),
            new Paragraph({
                children: [new PageBreak()],
            })
        );

        // --- Original Idea ---
        sections.push(
            new Paragraph({
                text: "Original Idea",
                heading: HeadingLevel.HEADING_1,
            }),
            new Paragraph({
                text: blueprint.ideaOriginal,
                spacing: { after: 300 },
                style: "Normal",
            })
        );

        // --- Role Analysis Sections ---
        // Sort roles by orderIndex to ensure logical flow
        const sortedRoles = [...roles].sort((a, b) => a.orderIndex - b.orderIndex);

        for (const role of sortedRoles) {
            const roleData = blueprint.roles[role.roleId];
            if (!roleData || roleData.status !== 'completed' || !roleData.content) continue;

            // Check docConfig - if text is disabled, skip this role's text section
            if (role.docConfig && !role.docConfig.text) continue;

            sections.push(
                new Paragraph({
                    text: role.displayName,
                    heading: HeadingLevel.HEADING_1,
                    pageBreakBefore: true,
                }),
                new Paragraph({
                    text: role.description,
                    style: "IntenseQuote",
                    spacing: { after: 400 },
                })
            );

            // Specialized Project Manager document (PMBOK-structured)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const content = roleData.content as any;
            if (role.roleId === 'project-manager' && content.projectPhases) {
                generatePMDocumentSections(content, blueprint, sections);
                continue;
            }

            // Recursively process content (generic roles)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            processContent(roleData.content as any, sections, role.docConfig);
        }

        const doc = new Document({
            styles: {
                default: {
                    heading1: {
                        run: {
                            font: "Calibri",
                            size: 52,
                            bold: true,
                            color: "2E74B5",
                        },
                        paragraph: {
                            spacing: { before: 240, after: 120 },
                        },
                    },
                    heading2: {
                        run: {
                            font: "Calibri",
                            size: 36,
                            bold: true,
                            color: "2E74B5",
                        },
                        paragraph: {
                            spacing: { before: 240, after: 120 },
                        },
                    },
                    heading3: {
                        run: {
                            font: "Calibri",
                            size: 28,
                            bold: true,
                            color: "1F4D78",
                        },
                        paragraph: {
                            spacing: { before: 200, after: 100 },
                        },
                    },
                    document: {
                        run: {
                            font: "Calibri",
                            size: 24,
                            color: "333333",
                        },
                    },
                },
                paragraphStyles: [
                    {
                        id: "Normal",
                        name: "Normal",
                        run: {
                            font: "Calibri",
                            size: 24,
                        },
                        paragraph: {
                            spacing: { line: 276, before: 0, after: 100 }, // 1.15 line spacing
                        },
                    },
                    {
                        id: "IntenseQuote",
                        name: "Intense Quote",
                        run: {
                            font: "Calibri",
                            italics: true,
                            color: "5A5A5A",
                        },
                        paragraph: {
                            indent: { left: 720 },
                            spacing: { before: 200, after: 200 },
                        },
                    },
                    {
                        id: "Strong",
                        name: "Strong",
                        run: {
                            bold: true,
                            color: "2E74B5",
                        },
                    },
                    {
                        id: "MacroText",
                        name: "Macro Text",
                        run: {
                            font: "Consolas",
                            size: 20,
                            color: "555555",
                        },
                        paragraph: {
                            spacing: { before: 100, after: 100 },
                            indent: { left: 360, right: 360 },
                        }
                    }
                ],
            },
            sections: [{
                properties: {},
                children: sections,
            }],
        });

        const blob = await Packer.toBlob(doc);
        saveAs(blob, `${blueprint.meta.projectName.replace(/\s+/g, '_')}_Blueprint.docx`);
    },

    /**
     * NEW: Generate professional DOCX from NormalizedDocument with styles
     * - Índice con hipervínculos automáticos
     * - Estilos profesionales (viñetas, tablas, colores)
     * - Compatible con todos los roles
     */
    generateGenericRoleDoc: async (
        normalizedDoc: NormalizedDocument,
        roleConfig: RoleConfig,
        lang: 'es' | 'en' = 'es'
    ) => {
        const { renderDocument, buildDocumentBaseName } = await import('./documentRenderer');
        const { DocxDriver } = await import('./drivers/docxDriver');
        const roleColor = getRoleExportProfile(roleConfig.roleId).documentColor;
        const driver = new DocxDriver();
        const baseName = buildDocumentBaseName(normalizedDoc.roleName, normalizedDoc.projectName);
        await renderDocument(driver, normalizedDoc, roleColor, lang, baseName);
    }
};

// Specialized generator for Project Manager role — PMBOK-structured document
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function generatePMDocumentSections(content: any, blueprint: Blueprint, sections: any[]) {
    const WEEKS_PER_MONTH = 4.33;
    const HOURS_PER_MONTH = 160;
    const projectPhases = content.projectPhases || [];
    const resources = content.resources || [];

    const totalWeeks = projectPhases.length > 0
        ? Math.max(...projectPhases.map((p: any) => (p.startWeek || 1) + (p.duration || 0)))
        : 14;
    const durationMonths = totalWeeks / WEEKS_PER_MONTH;
    const teamSize = resources.reduce((acc: number, r: any) => acc + Number(r.count || 0), 0);
    const monthlyBurn = resources.reduce((acc: number, r: any) => acc + (r.rate * HOURS_PER_MONTH * r.count), 0);
    const baseCost = monthlyBurn * durationMonths;
    const totalCost = baseCost * 1.15; // base + 15% reserves (PMBOK)

    // ── PROJECT CHARTER SUMMARY ──
    sections.push(
        new Paragraph({ text: "Acta de Constitución del Proyecto (Project Charter)", heading: HeadingLevel.HEADING_2, spacing: { before: 400, after: 200 } }),
        new Paragraph({ text: "PMI PMBOK 7ª Ed. — Sección 4.1 — Develop Project Charter", style: "IntenseQuote", spacing: { after: 300 } }),
    );

    // Key Metrics
    sections.push(
        new Paragraph({ text: "Métricas Clave del Proyecto", heading: HeadingLevel.HEADING_3 }),
        new Paragraph({
            children: [
                new TextRun({ text: "Proyecto: ", bold: true }),
                new TextRun({ text: blueprint.meta.projectName + "  |  " }),
                new TextRun({ text: "Duración: ", bold: true }),
                new TextRun({ text: `${totalWeeks} semanas (${durationMonths.toFixed(1)} meses)  |  ` }),
                new TextRun({ text: "Equipo: ", bold: true }),
                new TextRun({ text: `${teamSize} FTEs  |  ` }),
                new TextRun({ text: "Presupuesto Total: ", bold: true }),
                new TextRun({ text: `$${Math.round(totalCost).toLocaleString()} USD` }),
            ],
            style: "Normal",
            spacing: { after: 200 },
        }),
    );

    // Purpose / Business Justification
    if (content.summary) {
        sections.push(
            new Paragraph({ text: "Propósito / Justificación de Negocio", heading: HeadingLevel.HEADING_3 }),
            new Paragraph({ text: content.summary, style: "Normal", spacing: { after: 300 } }),
        );
    }

    // ── CRONOGRAMA WBS ──
    sections.push(
        new Paragraph({ text: "Cronograma de Alto Nivel — Work Breakdown Structure (WBS)", heading: HeadingLevel.HEADING_2, pageBreakBefore: true }),
        new Paragraph({ text: "Estimación: WBS Paramétrico + PERT Ponderado (PMI PMBOK 7ª Ed.)", style: "IntenseQuote", spacing: { after: 300 } }),
    );

    let taskCounter = 0;
    projectPhases.forEach((phase: any) => {
        sections.push(
            new Paragraph({
                children: [
                    new TextRun({ text: `${phase.name}`, bold: true, color: "2E74B5", size: 26 }),
                    new TextRun({ text: `  —  Semana ${phase.startWeek || 1}, Duración: ${phase.duration} semanas  |  ${(phase.tasks || []).length} tareas`, color: "555555" }),
                ],
                heading: HeadingLevel.HEADING_3,
                spacing: { before: 200 },
            })
        );

        (phase.tasks || []).forEach((task: any) => {
            taskCounter++;
            const score = task.risk ? task.risk.prob * task.risk.impact : 0;
            const isCritical = task.critical;
            const isHighRisk = score >= 7;

            sections.push(
                new Paragraph({
                    children: [
                        new TextRun({ text: `${taskCounter}. ${task.name}`, bold: isCritical || isHighRisk }),
                        new TextRun({
                            text: `  (${task.days} días · ${task.role || ''}${isCritical ? ' · ⚑ RUTA CRÍTICA' : ''}${isHighRisk ? ` · 🔴 RIESGO ${score}/9` : score >= 5 ? ` · 🟡 Riesgo ${score}/9` : ''})`,
                            color: isCritical || isHighRisk ? 'C0392B' : '888888',
                            size: 20,
                        }),
                    ],
                    indent: { left: 360 },
                    style: "Normal",
                    spacing: { after: 80 },
                })
            );
        });
    });

    // ── REGISTRO DE RIESGOS ──
    const allRisks: any[] = [];
    projectPhases.forEach((phase: any) => {
        (phase.tasks || []).forEach((task: any) => {
            if (task.risk) {
                const score = task.risk.prob * task.risk.impact;
                allRisks.push({
                    task: task.name, phase: phase.name, score,
                    desc: task.risk.desc,
                    severity: score >= 7 ? 'CRÍTICO' : score >= 5 ? 'ALTO' : score >= 3 ? 'MEDIO' : 'BAJO',
                    color: score >= 7 ? 'C0392B' : score >= 5 ? 'E67E22' : score >= 3 ? 'D4AC0D' : '27AE60',
                });
            }
        });
    });
    allRisks.sort((a, b) => b.score - a.score);

    if (allRisks.length > 0) {
        sections.push(
            new Paragraph({ text: "Registro de Riesgos", heading: HeadingLevel.HEADING_2, pageBreakBefore: true }),
            new Paragraph({ text: "Metodología: Score = Probabilidad × Impacto (1–9, PMI Risk Standard)", style: "IntenseQuote", spacing: { after: 300 } }),
        );

        allRisks.forEach((risk, i) => {
            sections.push(
                new Paragraph({
                    children: [
                        new TextRun({ text: `${i + 1}. [${risk.severity} · ${risk.score}/9]  `, bold: true, color: risk.color }),
                        new TextRun({ text: `${risk.task}`, bold: true }),
                        new TextRun({ text: `  (${risk.phase})`, color: '888888' }),
                        new TextRun({ text: `\n   → ${risk.desc}`, italics: true, color: '555555' }),
                    ],
                    indent: { left: 360 },
                    style: "Normal",
                    spacing: { after: 150 },
                })
            );
        });
    }

    // ── PLAN DE RECURSOS ──
    sections.push(
        new Paragraph({ text: "Plan de Recursos y Presupuesto", heading: HeadingLevel.HEADING_2, pageBreakBefore: true }),
        new Paragraph({ text: "Cálculo: Tarifa × 160h/mes × FTEs × Duración. Reservas según PMBOK (Contingencia 10% + Gestión 5%)", style: "IntenseQuote", spacing: { after: 300 } }),
    );

    resources.forEach((r: any) => {
        const monthly = r.rate * HOURS_PER_MONTH * r.count;
        const total = monthly * durationMonths;
        sections.push(
            new Paragraph({
                children: [
                    new TextRun({ text: `• ${r.role}`, bold: true }),
                    new TextRun({ text: ` (${r.seniority}) × ${r.count} FTE  |  $${r.rate}/h  |  Mensual: $${Math.round(monthly).toLocaleString()}  |  Total Proyecto: $${Math.round(total).toLocaleString()}` }),
                ],
                indent: { left: 360 },
                style: "Normal",
                spacing: { after: 100 },
            })
        );
    });

    // Budget Summary
    sections.push(
        new Paragraph({ spacing: { before: 300 } }),
        new Paragraph({
            children: [
                new TextRun({ text: "Costo Base: ", bold: true }),
                new TextRun({ text: `$${Math.round(baseCost).toLocaleString()}  |  ` }),
                new TextRun({ text: "Contingencia (10%): ", bold: true }),
                new TextRun({ text: `$${Math.round(baseCost * 0.10).toLocaleString()}  |  ` }),
                new TextRun({ text: "Reserva Gestión (5%): ", bold: true }),
                new TextRun({ text: `$${Math.round(baseCost * 0.05).toLocaleString()}` }),
            ],
            style: "Normal",
        }),
        new Paragraph({
            children: [
                new TextRun({ text: "PRESUPUESTO TOTAL RECOMENDADO: ", bold: true, size: 28, color: "1E293B" }),
                new TextRun({ text: `$${Math.round(totalCost).toLocaleString()} USD`, bold: true, size: 28, color: "064E3B" }),
            ],
            style: "Normal",
            spacing: { before: 200, after: 200 },
        }),
        new Paragraph({
            text: `Generado por PilotAI — ${new Date().toLocaleDateString('es-AR')} — PMI PMBOK 7ª Ed.`,
            style: "IntenseQuote",
        }),
    );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function processContent(content: any, sections: any[], docConfig?: RoleConfig['docConfig'], level = 0) {
    if (typeof content === 'string') {
        sections.push(
            new Paragraph({
                children: [new TextRun({ text: content })],
                style: "Normal",
            })
        );
    } else if (Array.isArray(content)) {
        content.forEach(item => {
            if (typeof item === 'string') {
                sections.push(
                    new Paragraph({
                        text: `• ${item}`,
                        style: "Normal",
                        indent: { left: 720 * (level + 1) }
                    })
                );
            } else {
                if (item.type && (item.type === 'bar' || item.type === 'pie')) {
                    if (docConfig && !docConfig.charts) return;
                    sections.push(new Paragraph({ text: `[Chart: ${item.title}]`, style: "Strong" }));
                } else if ((item.code && typeof item.code === 'object') || (item.nodes && Array.isArray(item.nodes))) {
                    if (docConfig && !docConfig.flowDiagrams) return;

                    // For JSON diagrams, we can't easily render the image in DOCX without server-side rendering.
                    // We will render a placeholder with the title and description.
                    sections.push(
                        new Paragraph({
                            text: `[Diagram: ${item.title || 'Untitled Diagram'}]`,
                            style: "Strong",
                            spacing: { before: 200 }
                        })
                    );

                    if (item.description) {
                        sections.push(
                            new Paragraph({
                                text: item.description,
                                style: "IntenseQuote"
                            })
                        );
                    }
                } else {
                    processContent(item, sections, docConfig, level + 1);
                }
            }
        });
    } else if (typeof content === 'object' && content !== null) {
        for (const [key, value] of Object.entries(content)) {
            if (key === 'charts' && docConfig && !docConfig.charts) continue;
            if ((key === 'diagrams') && docConfig && !docConfig.flowDiagrams && !docConfig.c4 && !docConfig.architecture && !docConfig.swimlanes) continue;

            const headingLevel = level === 0 ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3;

            sections.push(
                new Paragraph({
                    text: key.replace(/([A-Z])/g, ' $1').trim().toUpperCase(),
                    heading: headingLevel,
                })
            );

            processContent(value, sections, docConfig, level + 1);
        }
    }
}
