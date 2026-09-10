// eslint-disable-next-line @typescript-eslint/no-explicit-any
import XLSX from 'xlsx-js-style';
import { saveAs } from 'file-saver';
import { Blueprint } from '../../types/blueprint';
import { RoleConfig } from '../../types/roles';
import { getRoleExportProfile } from '../../constants/roleExportConfig';

import { normalizeRoleOutput, NormalizedDocument, NormalizedSection } from './contentNormalizer';

// ── Style Palette ──────────────────────────────────────────────────────────────
const THIN = { style: 'thin', color: { rgb: 'CBD5E1' } };
const BD = { top: THIN, left: THIN, bottom: THIN, right: THIN };

const S = {
    coverTitle: {
        fill: { patternType: 'solid', fgColor: { rgb: '1E293B' } },
        font: { name: 'Calibri', bold: true, color: { rgb: 'FFFFFF' }, sz: 16 },
        alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
        border: BD,
    },
    primaryHeader: {
        fill: { patternType: 'solid', fgColor: { rgb: '1E293B' } },
        font: { name: 'Calibri', bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
        alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
        border: BD,
    },
    sectionHeader: {
        fill: { patternType: 'solid', fgColor: { rgb: '334155' } },
        font: { name: 'Calibri', bold: true, color: { rgb: 'FFFFFF' }, sz: 10 },
        alignment: { vertical: 'center' },
        border: BD,
    },
    metricsHeader: {
        fill: { patternType: 'solid', fgColor: { rgb: '3730A3' } },
        font: { name: 'Calibri', bold: true, color: { rgb: 'FFFFFF' }, sz: 10 },
        border: BD,
    },
    emeraldHeader: {
        fill: { patternType: 'solid', fgColor: { rgb: '065F46' } },
        font: { name: 'Calibri', bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
        alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
        border: BD,
    },
    redHeader: {
        fill: { patternType: 'solid', fgColor: { rgb: '991B1B' } },
        font: { name: 'Calibri', bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
        alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
        border: BD,
    },
    grandTotal: {
        fill: { patternType: 'solid', fgColor: { rgb: '064E3B' } },
        font: { name: 'Calibri', bold: true, color: { rgb: 'FFFFFF' }, sz: 12 },
        border: BD,
    },
    subtotal: {
        fill: { patternType: 'solid', fgColor: { rgb: 'F1F5F9' } },
        font: { name: 'Calibri', bold: true, color: { rgb: '1E293B' }, sz: 10 },
        border: BD,
    },
    reserveRow: {
        fill: { patternType: 'solid', fgColor: { rgb: 'FFFBEB' } },
        font: { name: 'Calibri', color: { rgb: '92400E' }, sz: 10, italic: true },
        border: BD,
    },
    phaseRow: {
        fill: { patternType: 'solid', fgColor: { rgb: 'EFF6FF' } },
        font: { name: 'Calibri', bold: true, color: { rgb: '1E40AF' }, sz: 10 },
        border: BD,
    },
    criticalRow: {
        fill: { patternType: 'solid', fgColor: { rgb: 'FFF1F2' } },
        font: { name: 'Calibri', color: { rgb: '991B1B' }, sz: 10 },
        border: BD,
    },
    riskCritical: {
        fill: { patternType: 'solid', fgColor: { rgb: 'FEF2F2' } },
        font: { name: 'Calibri', color: { rgb: '991B1B' }, sz: 10 },
        border: BD,
    },
    riskHigh: {
        fill: { patternType: 'solid', fgColor: { rgb: 'FFF7ED' } },
        font: { name: 'Calibri', color: { rgb: '9A3412' }, sz: 10 },
        border: BD,
    },
    riskMedium: {
        fill: { patternType: 'solid', fgColor: { rgb: 'FFFBEB' } },
        font: { name: 'Calibri', color: { rgb: '92400E' }, sz: 10 },
        border: BD,
    },
    riskLow: {
        fill: { patternType: 'solid', fgColor: { rgb: 'F0FDF4' } },
        font: { name: 'Calibri', color: { rgb: '166534' }, sz: 10 },
        border: BD,
    },
    dataLight: {
        fill: { patternType: 'solid', fgColor: { rgb: 'F8FAFC' } },
        font: { name: 'Calibri', sz: 10 },
        border: BD,
    },
    dataWhite: {
        fill: { patternType: 'solid', fgColor: { rgb: 'FFFFFF' } },
        font: { name: 'Calibri', sz: 10 },
        border: BD,
    },
    coverField: {
        fill: { patternType: 'solid', fgColor: { rgb: 'FFFFFF' } },
        font: { name: 'Calibri', sz: 10, color: { rgb: '475569' } },
        border: BD,
    },
    coverValue: {
        fill: { patternType: 'solid', fgColor: { rgb: 'FFFFFF' } },
        font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: '1E293B' } },
        border: BD,
    },
    coverBudget: {
        fill: { patternType: 'solid', fgColor: { rgb: 'ECFDF5' } },
        font: { name: 'Calibri', sz: 12, bold: true, color: { rgb: '064E3B' } },
        border: BD,
    },
};

// ── Helpers ────────────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function styleRow(ws: any, row: number, numCols: number, style: any) {
    for (let c = 0; c < numCols; c++) {
        const addr = XLSX.utils.encode_cell({ r: row, c });
        if (!ws[addr]) ws[addr] = { v: '', t: 's' };
        ws[addr].s = style;
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function styleCell(ws: any, row: number, col: number, style: any) {
    const addr = XLSX.utils.encode_cell({ r: row, c: col });
    if (!ws[addr]) ws[addr] = { v: '', t: 's' };
    ws[addr].s = style;
}


export const excelGenerator = {
    generateSpreadsheet: (blueprint: Blueprint, roles: RoleConfig[], shouldDownload = true) => {
        const wb = XLSX.utils.book_new();

        // 1. Overview Sheet (generic, kept for compatibility)
        const overviewData = [
            ['Project Name', blueprint.meta.projectName],
            ['Version', blueprint.meta.version],
            ['Created At', blueprint.meta.createdAt],
            ['Original Idea', blueprint.ideaOriginal],
        ];
        const wsOverview = XLSX.utils.aoa_to_sheet(overviewData);
        wsOverview['!cols'] = [{ wch: 20 }, { wch: 60 }];
        XLSX.utils.book_append_sheet(wb, wsOverview, 'Overview');

        const sortedRoles = [...roles].sort((a, b) => a.orderIndex - b.orderIndex);

        sortedRoles.forEach(role => {
            const roleData = blueprint.roles[role.roleId];
            if (!roleData || roleData.status !== 'completed' || !roleData.content) return;
            if (role.docConfig && !role.docConfig.excel) return;

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const content = roleData.content as any;
            if (typeof content !== 'object' || content === null) return;

            // Check if role has PM-specific data (projectPhases = has specialized handler)
            const hasPMData = content?.projectPhases || content?.phases;
            if (hasPMData) {
                // Use existing PM-specialized generator (continue below)
            } else {
                // Use generic spreadsheet for all other roles
                const normalizedDoc = normalizeRoleOutput(
                    role.roleId,
                    role.displayName,
                    content,
                    blueprint.meta.projectName,
                    'es'
                );
                const roleWb = excelGenerator.generateGenericSpreadsheet(normalizedDoc, role, false);
                // Merge sheets from roleWb into main wb
                roleWb.SheetNames.forEach(sheetName => {
                    const ws = roleWb.Sheets[sheetName];
                    if (ws) {
                        const uniqueName = sheetName.includes(role.displayName)
                            ? sheetName
                            : `${role.displayName}-${sheetName}`.substring(0, 31);
                        XLSX.utils.book_append_sheet(wb, ws, uniqueName);
                    }
                });
                return; // Skip PM-specialized processing for this role
            }

            // Generic array exports (Roadmap, Backlog, QA)
            if (content.roadmap || content.gantt || content.timeline) {
                const data = content.roadmap || content.gantt || content.timeline;
                if (Array.isArray(data) && data.length > 0) {
                    const ws = XLSX.utils.json_to_sheet(data);
                    XLSX.utils.book_append_sheet(wb, ws, `Roadmap - ${role.displayName}`.substring(0, 31));
                }
            }
            if (content.backlog || content.mvpFeatures || content.userStories || content.features) {
                const data = content.backlog || content.mvpFeatures || content.userStories || content.features;
                if (Array.isArray(data) && data.length > 0) {
                    const ws = XLSX.utils.json_to_sheet(data);
                    XLSX.utils.book_append_sheet(wb, ws, `Backlog - ${role.displayName}`.substring(0, 31));
                }
            }
            if (content.testPlan || content.qa || content.testCases) {
                const data = content.testPlan || content.qa || content.testCases;
                if (Array.isArray(data) && data.length > 0) {
                    const ws = XLSX.utils.json_to_sheet(data);
                    XLSX.utils.book_append_sheet(wb, ws, `QA Plan - ${role.displayName}`.substring(0, 31));
                }
            }

            // ── Project Manager PMO Sheets (5 professional sheets) ──────────────
            if (content.projectPhases && Array.isArray(content.projectPhases)) {
                const WEEKS_PER_MONTH = 4.33;
                const HOURS_PER_MONTH = 160;
                const CONTINGENCY = 0.10;
                const MGMT_RESERVE = 0.05;

                const totalWeeks = Math.max(...content.projectPhases.map((p: any) => (p.startWeek || 1) + (p.duration || 0)));
                const durationMonths = totalWeeks / WEEKS_PER_MONTH;
                const teamSize = (content.resources || []).reduce((acc: number, r: any) => acc + Number(r.count || 0), 0);
                const monthlyBurn = (content.resources || []).reduce((acc: number, r: any) => acc + (r.rate * HOURS_PER_MONTH * r.count), 0);
                const baseCost = monthlyBurn * durationMonths;
                const totalCost = baseCost * (1 + CONTINGENCY + MGMT_RESERVE);

                // ── A. PORTADA ─────────────────────────────────────────────────
                const coverData: any[][] = [
                    ['PLAN MAESTRO DE PROYECTO — PMO', ''],
                    ['', ''],
                    ['Campo', 'Valor'],
                    ['Proyecto', blueprint.meta.projectName],
                    ['Fecha de Generación', new Date().toLocaleDateString('es-AR')],
                    ['Versión', blueprint.meta.version],
                    ['', ''],
                    ['MÉTRICAS CLAVE', ''],
                    ['Duración Total', `${totalWeeks} semanas (${(totalWeeks / WEEKS_PER_MONTH).toFixed(1)} meses)`],
                    ['Equipo', `${teamSize} FTEs`],
                    ['Burn Rate Mensual', `$${Math.round(monthlyBurn).toLocaleString()}`],
                    ['Costo Base', `$${Math.round(baseCost).toLocaleString()}`],
                    ['Reserva de Contingencia (10%)', `$${Math.round(baseCost * CONTINGENCY).toLocaleString()}`],
                    ['Reserva de Gestión (5%)', `$${Math.round(baseCost * MGMT_RESERVE).toLocaleString()}`],
                    ['PRESUPUESTO TOTAL RECOMENDADO', `$${Math.round(totalCost).toLocaleString()}`],
                    ['', ''],
                    ['METODOLOGÍA', ''],
                    ['Estimación', 'WBS Paramétrico + PERT (PMI PMBOK 7ª Ed.)'],
                    ['Gestión de Riesgos', 'Score = Probabilidad × Impacto (1–9, PMI Risk Standard)'],
                    ['Eficiencia de Equipo', "Brooks Law — Exponente 0.8 (diminishing returns)"],
                    ['Horas laborables', '160h efectivas/mes por FTE'],
                ];
                const wsCover = XLSX.utils.aoa_to_sheet(coverData);
                wsCover['!cols'] = [{ wch: 38 }, { wch: 45 }];
                wsCover['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }];

                // Style cover
                styleRow(wsCover, 0, 2, S.coverTitle);
                styleRow(wsCover, 2, 2, S.sectionHeader);
                for (let r = 3; r <= 5; r++) styleRow(wsCover, r, 2, r % 2 === 0 ? S.dataWhite : S.dataLight);
                styleRow(wsCover, 7, 2, S.metricsHeader);
                for (let r = 8; r <= 13; r++) styleRow(wsCover, r, 2, r % 2 === 0 ? S.dataWhite : S.dataLight);
                styleRow(wsCover, 14, 2, S.coverBudget);
                styleRow(wsCover, 16, 2, S.sectionHeader);
                for (let r = 17; r <= 20; r++) styleRow(wsCover, r, 2, r % 2 === 0 ? S.dataWhite : S.dataLight);

                XLSX.utils.book_append_sheet(wb, wsCover, '📋 Portada');

                // ── B. MASTER PLAN ─────────────────────────────────────────────
                const flatPlan: any[] = [];
                let taskCounter = 0;
                const rowMeta: { isPhase: boolean; isCritical: boolean; isEmpty: boolean }[] = [];

                content.projectPhases.forEach((phase: any) => {
                    flatPlan.push({
                        '#': '', 'Fase': `━━ ${phase.name.toUpperCase()} ━━`, 'Tarea': '',
                        'Rol': '', 'Días': `${phase.duration} sem`, 'Semana Inicio': phase.startWeek || 1,
                        'Ruta Crítica': '', 'Prob (1-3)': '', 'Impacto (1-3)': '',
                        'Score Riesgo': '', 'Severidad': '', 'Descripción Riesgo': '', 'Dependencia': '',
                    });
                    rowMeta.push({ isPhase: true, isCritical: false, isEmpty: false });

                    if (phase.tasks && Array.isArray(phase.tasks)) {
                        phase.tasks.forEach((task: any) => {
                            taskCounter++;
                            const score = task.risk ? task.risk.prob * task.risk.impact : 0;
                            const severity = score >= 7 ? 'CRÍTICO' : score >= 5 ? 'ALTO' : score >= 3 ? 'MEDIO' : 'BAJO';
                            flatPlan.push({
                                '#': taskCounter, 'Fase': phase.name, 'Tarea': task.name,
                                'Rol': task.role || '', 'Días': task.days,
                                'Semana Inicio': phase.startWeek || 1,
                                'Ruta Crítica': task.critical ? '⚑ SÍ' : '',
                                'Prob (1-3)': task.risk?.prob ?? '', 'Impacto (1-3)': task.risk?.impact ?? '',
                                'Score Riesgo': score || '', 'Severidad': severity,
                                'Descripción Riesgo': task.risk?.desc ?? '', 'Dependencia': task.dependency || '',
                            });
                            rowMeta.push({ isPhase: false, isCritical: !!task.critical, isEmpty: false });
                        });
                    }
                    flatPlan.push({});
                    rowMeta.push({ isPhase: false, isCritical: false, isEmpty: true });
                });

                const wsPlan = XLSX.utils.json_to_sheet(flatPlan);
                wsPlan['!cols'] = [
                    { wch: 5 }, { wch: 28 }, { wch: 42 }, { wch: 16 }, { wch: 8 },
                    { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 11 },
                    { wch: 12 }, { wch: 45 }, { wch: 30 }
                ];

                // Style Master Plan header row (row 0 = headers from json_to_sheet)
                styleRow(wsPlan, 0, 13, S.primaryHeader);
                // Style data rows (starting from row 1)
                rowMeta.forEach((meta, idx) => {
                    const r = idx + 1;
                    if (meta.isEmpty) return;
                    if (meta.isPhase) styleRow(wsPlan, r, 13, S.phaseRow);
                    else if (meta.isCritical) styleRow(wsPlan, r, 13, S.criticalRow);
                    else styleRow(wsPlan, r, 13, idx % 2 === 0 ? S.dataWhite : S.dataLight);
                });

                XLSX.utils.book_append_sheet(wb, wsPlan, '📅 Master Plan');

                // ── C. RISK REGISTER ───────────────────────────────────────────
                const allRisks: any[] = [];
                content.projectPhases.forEach((phase: any) => {
                    (phase.tasks || []).forEach((task: any) => {
                        if (task.risk) {
                            const score = task.risk.prob * task.risk.impact;
                            allRisks.push({
                                '#': allRisks.length + 1, 'Tarea / Riesgo': task.name, 'Fase': phase.name,
                                'Probabilidad (1-3)': task.risk.prob, 'Impacto (1-3)': task.risk.impact,
                                'Score (P×I)': score,
                                'Severidad': score >= 7 ? 'CRÍTICO' : score >= 5 ? 'ALTO' : score >= 3 ? 'MEDIO' : 'BAJO',
                                'Descripción / Mitigación': task.risk.desc,
                                'Estado': 'ABIERTO', 'Responsable': 'Project Manager',
                            });
                        }
                    });
                });
                allRisks.sort((a, b) => b['Score (P×I)'] - a['Score (P×I)']);

                const wsRisks = XLSX.utils.json_to_sheet(allRisks);
                wsRisks['!cols'] = [
                    { wch: 5 }, { wch: 42 }, { wch: 28 }, { wch: 16 }, { wch: 14 },
                    { wch: 11 }, { wch: 12 }, { wch: 55 }, { wch: 12 }, { wch: 18 }
                ];

                // Style Risk Register
                styleRow(wsRisks, 0, 10, S.redHeader);
                allRisks.forEach((risk, idx) => {
                    const r = idx + 1;
                    const score = risk['Score (P×I)'];
                    const rStyle = score >= 7 ? S.riskCritical : score >= 5 ? S.riskHigh : score >= 3 ? S.riskMedium : S.riskLow;
                    styleRow(wsRisks, r, 10, rStyle);
                });

                XLSX.utils.book_append_sheet(wb, wsRisks, '⚠️ Risk Register');

                // ── D. PRESUPUESTO ─────────────────────────────────────────────
                if (content.resources && Array.isArray(content.resources)) {
                    const budgetRows: any[] = content.resources.map((r: any) => {
                        const monthly = r.rate * HOURS_PER_MONTH * r.count;
                        const total = monthly * durationMonths;
                        return {
                            'Rol': r.role, 'Seniority': r.seniority, 'FTE': r.count,
                            'Tarifa ($/h)': r.rate,
                            'Costo Mensual': `$${Math.round(monthly).toLocaleString()}`,
                            'Costo Total Proyecto': `$${Math.round(total).toLocaleString()}`,
                        };
                    });

                    const resourceCount = budgetRows.length;

                    budgetRows.push({});
                    budgetRows.push({ 'Rol': 'SUBTOTAL — Costo Base', 'Costo Total Proyecto': `$${Math.round(baseCost).toLocaleString()}` });
                    budgetRows.push({ 'Rol': 'Reserva de Contingencia (10%)', 'Costo Total Proyecto': `$${Math.round(baseCost * CONTINGENCY).toLocaleString()}` });
                    budgetRows.push({ 'Rol': 'Reserva de Gestión (5%)', 'Costo Total Proyecto': `$${Math.round(baseCost * MGMT_RESERVE).toLocaleString()}` });
                    budgetRows.push({ 'Rol': '★ PRESUPUESTO TOTAL RECOMENDADO', 'Costo Total Proyecto': `$${Math.round(totalCost).toLocaleString()}` });

                    const wsBudget = XLSX.utils.json_to_sheet(budgetRows);
                    wsBudget['!cols'] = [{ wch: 38 }, { wch: 12 }, { wch: 8 }, { wch: 12 }, { wch: 18 }, { wch: 24 }];

                    // Style budget sheet
                    styleRow(wsBudget, 0, 6, S.emeraldHeader);
                    for (let r = 1; r <= resourceCount; r++) {
                        styleRow(wsBudget, r, 6, r % 2 === 0 ? S.dataWhite : S.dataLight);
                    }
                    // separator row: skip (resourceCount + 1)
                    styleRow(wsBudget, resourceCount + 2, 6, S.subtotal);         // SUBTOTAL
                    styleRow(wsBudget, resourceCount + 3, 6, S.reserveRow);       // Contingencia
                    styleRow(wsBudget, resourceCount + 4, 6, S.reserveRow);       // Gestión
                    styleRow(wsBudget, resourceCount + 5, 6, S.grandTotal);       // TOTAL

                    XLSX.utils.book_append_sheet(wb, wsBudget, '💰 Presupuesto');
                }

                // ── E. RESUMEN EJECUTIVO ───────────────────────────────────────
                if (content.summary) {
                    const summaryData: any[][] = [
                        ['RESUMEN EJECUTIVO DEL PROYECTO'],
                        [''],
                        [content.summary],
                        [''],
                        [`Generado por PilotAI — ${new Date().toLocaleDateString('es-AR')} — PMI PMBOK 7ª Ed.`],
                    ];
                    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
                    wsSummary['!cols'] = [{ wch: 120 }];
                    styleRow(wsSummary, 0, 1, S.coverTitle);
                    styleRow(wsSummary, 4, 1, { font: { name: 'Calibri', sz: 9, italic: true, color: { rgb: '94A3B8' } } });
                    XLSX.utils.book_append_sheet(wb, wsSummary, '📝 Resumen Ejecutivo');
                }

                return; // done for PM role
            }

            // Generic fallback for other roles with array content
            if (Array.isArray(content) && content.length > 0 && typeof content[0] === 'object') {
                const ws = XLSX.utils.json_to_sheet(content);
                const sheetName = `${role.displayName}`.substring(0, 31);
                if (!wb.SheetNames.includes(sheetName)) XLSX.utils.book_append_sheet(wb, ws, sheetName);
            } else if (typeof content === 'object' && content !== null) {
                const detailsData: any[] = [];
                const arraySheets: { name: string, data: any[] }[] = [];

                for (const [key, value] of Object.entries(content)) {
                    if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
                        arraySheets.push({ name: key, data: value as any[] });
                    } else if (typeof value !== 'object' || value === null) {
                        detailsData.push({ Property: key, Value: value });
                    } else if (typeof value === 'object' && !Array.isArray(value)) {
                        detailsData.push({ Property: key, Value: JSON.stringify(value).substring(0, 32000) });
                    }
                }

                if (detailsData.length > 0) {
                    const wsDetails = XLSX.utils.json_to_sheet(detailsData);
                    const sheetName = `${role.displayName} Details`.substring(0, 31);
                    if (!wb.SheetNames.includes(sheetName)) XLSX.utils.book_append_sheet(wb, wsDetails, sheetName);
                }

                arraySheets.forEach(sheet => {
                    const ws = XLSX.utils.json_to_sheet(sheet.data);
                    let cleanName = sheet.name.replace(/([A-Z])/g, ' $1').trim();
                    cleanName = (cleanName.charAt(0).toUpperCase() + cleanName.slice(1)).substring(0, 31);
                    if (!wb.SheetNames.includes(cleanName)) {
                        XLSX.utils.book_append_sheet(wb, ws, cleanName);
                    } else {
                        XLSX.utils.book_append_sheet(wb, ws, (cleanName.substring(0, 28) + ' ' + Math.floor(Math.random() * 99)).substring(0, 31));
                    }
                });
            }
        });

        if (shouldDownload) {
            const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
            const blob = new Blob([wbout], { type: 'application/octet-stream' });
            saveAs(blob, `${blueprint.meta.projectName.replace(/\s+/g, '_')}_PMO_Plan.xlsx`);
        }
    },

    /**
     * Generic spreadsheet for roles WITHOUT PM specialization.
     * Uses NormalizedDocument for consistent structure across all roles.
     */
    generateGenericSpreadsheet: (
        normalizedDoc: NormalizedDocument,
        roleConfig: RoleConfig,
        shouldDownload = true
    ) => {
        const wb = XLSX.utils.book_new();
        const projectName = normalizedDoc.projectName;
        const roleName = normalizedDoc.roleName;

        // Role-branded header style — sourced from roleExportConfig (single source of truth).
        // The semantic palette S.* (risk, phases, financials) stays fixed — only role identity headers change.
        const roleHeaderColor = getRoleExportProfile(roleConfig.roleId).excelHeaderColor;
        const roleSectionColor = roleHeaderColor; // same shade for section sub-headers
        const roleHeader = {
            fill: { patternType: 'solid', fgColor: { rgb: roleHeaderColor } },
            font: { name: 'Calibri', bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
            alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
            border: BD,
        };
        const roleSectionHeader = {
            fill: { patternType: 'solid', fgColor: { rgb: roleSectionColor } },
            font: { name: 'Calibri', bold: true, color: { rgb: 'FFFFFF' }, sz: 10 },
            alignment: { vertical: 'center' },
            border: BD,
        };

        // ── 1. DASHBOARD SHEET (Consolidated KPIs & Text) ────────────────────────
        const dashboardData: any[][] = [
            ['DASHBOARD EJECUTIVO'],
            [''],
            ['Rol:', roleName],
            ['Proyecto:', projectName],
            ['Generado:', new Date().toLocaleDateString()],
            [''],
            ['MÉTRICAS Y RESÚMENES CLAVE', 'Valor / Detalle']
        ];

        const listAndTableSections: NormalizedSection[] = [];

        normalizedDoc.sections.forEach(sec => {
            if (sec.type === 'kpi_grid' && typeof sec.data === 'object' && !Array.isArray(sec.data)) {
                dashboardData.push(['']);
                dashboardData.push([sec.title || 'Métricas', '']);
                Object.entries(sec.data).forEach(([k, v]) => {
                    dashboardData.push([k, v]);
                });
            } else if (sec.type === 'text' && typeof sec.data === 'string') {
                dashboardData.push(['']);
                dashboardData.push([sec.title || 'Resumen', '']);
                dashboardData.push([sec.data, '']);
            } else {
                // Save lists and tables for their own sheets
                listAndTableSections.push(sec);
            }
        });

        const dashboardSheet = XLSX.utils.aoa_to_sheet(dashboardData);
        dashboardSheet['!cols'] = [{ wch: 35 }, { wch: 65 }];

        // Style the Dashboard
        styleRow(dashboardSheet, 0, 2, S.coverTitle);
        styleRow(dashboardSheet, 2, 2, S.coverField); styleRow(dashboardSheet, 2, 1, S.coverValue);
        styleRow(dashboardSheet, 3, 2, S.coverField); styleRow(dashboardSheet, 3, 1, S.coverValue);
        styleRow(dashboardSheet, 4, 2, S.coverField); styleRow(dashboardSheet, 4, 1, S.coverValue);
        styleRow(dashboardSheet, 6, 2, roleHeader);

        // Apply styles to dynamically added rows based on content
        for (let r = 7; r < dashboardData.length; r++) {
            const row = dashboardData[r];
            if (row[0] === '') continue; // Empty row
            
            if (row[1] === '') {
                // Section Title (Métricas or Resumen)
                styleRow(dashboardSheet, r, 2, roleSectionHeader);
                if (dashboardData[r+1] && dashboardData[r+1][1] === '') {
                     // The next row is text, merge cells and wrap
                     dashboardSheet['!merges'] = dashboardSheet['!merges'] || [];
                     dashboardSheet['!merges'].push({ s: { r: r+1, c: 0 }, e: { r: r+1, c: 1 } });
                     dashboardSheet[`A${r+2}`].s = { ...S.dataWhite, alignment: { wrapText: true, vertical: 'top' } };
                     // Approximate height for text
                     dashboardSheet['!rows'] = dashboardSheet['!rows'] || [];
                     dashboardSheet['!rows'][r+1] = { hpx: 60 };
                }
            } else {
                // KPI Row
                styleRow(dashboardSheet, r, 2, r % 2 === 0 ? S.dataWhite : S.dataLight);
            }
        }

        XLSX.utils.book_append_sheet(wb, dashboardSheet, '📊 Dashboard');

        // ── 2. DETAILS SHEETS (Lists and Tables) ────────────────────
        listAndTableSections.forEach((section, idx) => {
            let sheetName = (section.title || `Detalle ${idx + 1}`)
                .replace(/[:/\\?*[\]]/g, '-')
                .substring(0, 31);

            while (wb.SheetNames.includes(sheetName)) {
                sheetName = (sheetName.substring(0, 28) + ` ${idx+1}`).substring(0, 31);
            }

            if (section.type === 'table' && Array.isArray(section.data)) {
                // TABLE: Use json_to_sheet with styling
                const tableData = section.data.filter((item): item is Record<string, any> => typeof item === 'object' && item !== null);
                if (tableData.length > 0) {
                    // Prevent [object Object] by flattening arrays/objects
                    const safeTableData = tableData.map(row => {
                        const safeRow: Record<string, any> = {};
                        for (const [k, v] of Object.entries(row)) {
                            if (v !== null && typeof v === 'object') {
                                safeRow[k] = Array.isArray(v) ? v.map(i => typeof i === 'object' ? JSON.stringify(i) : i).join(', ') : JSON.stringify(v);
                            } else {
                                safeRow[k] = v;
                            }
                        }
                        return safeRow;
                    });

                    const tableSheet = XLSX.utils.json_to_sheet(safeTableData);

                    // Copy headers with style
                    const headers = Object.keys(safeTableData[0] || {});
                    styleRow(tableSheet, 0, headers.length, roleHeader);

                    // Alternate row colors
                    for (let r = 1; r <= safeTableData.length; r++) {
                        const style = r % 2 === 0 ? S.dataWhite : S.dataLight;
                        styleRow(tableSheet, r, headers.length, style);
                    }
                    
                    // Auto-adjust column widths
                    const cols = headers.map(() => ({ wch: 25 }));
                    tableSheet['!cols'] = cols;

                    XLSX.utils.book_append_sheet(wb, tableSheet, sheetName);
                }
            } else if (section.type === 'list' && Array.isArray(section.data)) {
                // LIST: Each item in a row with bullet styling
                const listItems = section.data.filter((item): item is string => typeof item === 'string');
                if (listItems.length > 0) {
                    const ws = XLSX.utils.aoa_to_sheet([
                        [{ v: section.title || 'Elementos', t: 's', s: roleHeader }],
                        ...listItems.map(item => [{ v: `• ${item}`, t: 's', s: S.dataLight }])
                    ]);
                    ws['!cols'] = [{ wch: 80 }];
                    XLSX.utils.book_append_sheet(wb, ws, sheetName);
                }
            }
        });

        // ── DOWNLOAD ────────────────────────────────────────────
        if (shouldDownload) {
            const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
            const blob = new Blob([wbout], { type: 'application/octet-stream' });
            saveAs(blob, `${projectName.replace(/\s+/g, '_')}_${roleConfig.roleId}.xlsx`);
        }

        return wb;
    }
};
