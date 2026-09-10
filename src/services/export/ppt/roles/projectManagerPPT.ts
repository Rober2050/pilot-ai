/**
 * projectManagerPPT.ts — Specialist PPT Generator for Project Manager Role
 *
 * C-Level quality presentation matching Strategy Analyst / Business Analyst tier.
 * Reads rawContent DIRECTLY — bypasses generic normalizer entirely.
 *
 * Data sources (from AI output):
 *   rawContent.summary / executiveSummary   → Executive Summary slide
 *   rawContent.totalWeeks / totalCost       → KPI Dashboard cards
 *   rawContent.phases[]                     → Project Timeline table
 *   rawContent.resources[]                  → Team Composition table
 *   rawContent.slides[]                     → Deliverables Agenda (titles only)
 *   rawContent.techStack                    → Technology Stack table
 */

import PptxGenJS from 'pptxgenjs';
import { RoleConfig } from '../../../../types/roles';
import {
  addCoverSlide, addSlideHeader, addPremiumCard, addClosingSlide,
  ROLE_COLORS, TEXT_H, TEXT_B, TEXT_M, BORDER,
} from '../../pptHelpers';
import { registerSectionMaster, SLIDE, FONT } from '../slideTemplates';
import { notificationService } from '../../../ui/notificationService';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtCurrency(v: unknown, lang: string): string {
  const n = typeof v === 'number' ? v : parseFloat(String(v));
  if (isNaN(n)) return String(v ?? '');
  return new Intl.NumberFormat(lang === 'es' ? 'es-AR' : 'en-US', {
    style: 'currency', currency: 'USD', maximumFractionDigits: 0,
  }).format(n);
}

function extractPMData(rawContent: any) {
  const r = rawContent ?? {};

  const s1 = String(r.summary ?? r.Project_summary ?? '');
  const s2 = String(r.executiveSummary ?? r.Executive_Summary ?? r.projectSummary ?? '');
  const summary = s1.length >= s2.length ? s1 : s2;

  const phases: any[] = Array.isArray(r.phases)
    ? r.phases
    : Array.isArray(r.projectPhases) ? r.projectPhases
    : Array.isArray(r.Phases) ? r.Phases
    : [];

  const resources: any[] = Array.isArray(r.resources)
    ? r.resources
    : Array.isArray(r.Resources) ? r.Resources
    : [];

  const totalWeeks = Number(r.totalWeeks ?? r.total_weeks ?? 0) ||
    phases.reduce((a: number, p: any) => a + (Number(p.duration) || 0), 0);

  const totalCost = Number(r.totalCost ?? r.total_cost ?? 0) ||
    resources.reduce((a: number, res: any) =>
      a + (Number(res.rate) || 0) * (Number(res.count) || 1) * 4, 0);

  const taskCount = phases.reduce(
    (a: number, p: any) => a + (Array.isArray(p.tasks) ? p.tasks.length : 0), 0);

  const criticalTasks = phases.reduce(
    (a: number, p: any) => a + (Array.isArray(p.tasks)
      ? p.tasks.filter((t: any) => t.critical === true).length : 0), 0);

  const slides: any[] = Array.isArray(r.slides) ? r.slides : [];

  const techStack: Record<string, any> = (
    typeof r.techStack === 'object' && r.techStack && !Array.isArray(r.techStack)
  ) ? r.techStack
    : (typeof r.Tech_Stack === 'object' && r.Tech_Stack) ? r.Tech_Stack
    : {};

  return { summary, phases, resources, totalWeeks, totalCost, taskCount, criticalTasks, slides, techStack };
}

// ── Main generator ────────────────────────────────────────────────────────────

export const projectManagerPPT = {
  generate: async (rawContent: any, roleConfig: RoleConfig, lang: 'es' | 'en', projectName: string): Promise<void> => {
    try {
      const pptx      = new PptxGenJS();
      pptx.layout     = 'LAYOUT_16x9';
      const roleColor = ROLE_COLORS[roleConfig.roleId] || '22C55E';
      const roleName  = roleConfig.displayName;
      const data      = extractPMData(rawContent);

      registerSectionMaster(pptx, roleColor, roleName);

      // ── 1. Cover ──────────────────────────────────────────────────────────
      const dateStr = new Date().toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
      });
      addCoverSlide(pptx, {
        title:       roleName,
        subtitle:    lang === 'es' ? 'Plan Maestro del Proyecto' : 'Master Project Plan',
        projectName,
        date:        dateStr,
        roleColor,
        lang,
        roleId:      roleConfig.roleId,
      });

      // ── 2. Executive Summary ──────────────────────────────────────────────
      if (data.summary) {
        const sumSlide = pptx.addSlide({ masterName: 'SECTION_MASTER' });
        addSlideHeader(sumSlide, '01',
          lang === 'es' ? 'Resumen Ejecutivo' : 'Executive Summary', roleColor);

        addPremiumCard(sumSlide, {
          x: SLIDE.MARGIN_X, y: SLIDE.CONTENT_Y,
          w: SLIDE.CONTENT_W, h: SLIDE.CONTENT_H - 0.1,
          accentColor: roleColor, accentSide: 'left', bgColor: 'FFFFFF',
        });
        sumSlide.addText(data.summary, {
          x: SLIDE.MARGIN_X + 0.25, y: SLIDE.CONTENT_Y + 0.15,
          w: SLIDE.CONTENT_W - 0.35, h: SLIDE.CONTENT_H - 0.4,
          fontSize: FONT.BODY, color: TEXT_B, fontFace: 'Helvetica',
          valign: 'top', wrap: true,
        });
      }

      // ── 3. KPI Dashboard ─────────────────────────────────────────────────
      {
        const kpiSlide = pptx.addSlide({ masterName: 'SECTION_MASTER' });
        addSlideHeader(kpiSlide, '02',
          lang === 'es' ? 'Métricas Clave del Proyecto' : 'Key Project Metrics', roleColor);

        const kpis = [
          {
            label: lang === 'es' ? 'Duración Total' : 'Total Duration',
            value: data.totalWeeks > 0 ? `${data.totalWeeks}` : '—',
            unit:  lang === 'es' ? 'semanas' : 'weeks',
            color: '22C55E',
          },
          {
            label: lang === 'es' ? 'Presupuesto Estimado' : 'Estimated Budget',
            value: data.totalCost > 0 ? fmtCurrency(data.totalCost, lang) : '—',
            unit:  lang === 'es' ? 'USD total' : 'USD total',
            color: '16A34A',
          },
          {
            label: lang === 'es' ? 'Fases del Proyecto' : 'Project Phases',
            value: data.phases.length > 0 ? String(data.phases.length) : '—',
            unit:  lang === 'es' ? `${data.taskCount} tareas` : `${data.taskCount} tasks`,
            color: '059669',
          },
          {
            label: lang === 'es' ? 'Tareas Críticas' : 'Critical Tasks',
            value: String(data.criticalTasks),
            unit:  lang === 'es' ? 'en ruta crítica' : 'on critical path',
            color: data.criticalTasks > 5 ? 'DC2626' : 'D97706',
          },
        ];

        const gapX  = 0.18;
        const cardW = (SLIDE.CONTENT_W - gapX * 3) / 4;
        const cardH = SLIDE.CONTENT_H - 0.3;

        kpis.forEach((kpi, i) => {
          const x = SLIDE.MARGIN_X + i * (cardW + gapX);
          const y = SLIDE.CONTENT_Y;

          addPremiumCard(kpiSlide, {
            x, y, w: cardW, h: cardH,
            accentColor: kpi.color, accentSide: 'top', bgColor: 'FFFFFF',
          });

          kpiSlide.addText(kpi.label, {
            x: x + 0.1, y: y + 0.25, w: cardW - 0.2, h: 0.4,
            fontSize: FONT.CAPTION, color: TEXT_M,
            fontFace: 'Helvetica', align: 'center',
          });

          kpiSlide.addText(kpi.value, {
            x: x + 0.1, y: y + 0.7, w: cardW - 0.2, h: 1.2,
            fontSize: 24, bold: true, color: kpi.color,
            fontFace: 'Helvetica', align: 'center', valign: 'middle',
          });

          kpiSlide.addText(kpi.unit, {
            x: x + 0.1, y: y + cardH - 0.65, w: cardW - 0.2, h: 0.45,
            fontSize: FONT.MICRO, color: kpi.color,
            fontFace: 'Helvetica', align: 'center', valign: 'bottom',
          });
        });
      }

      // ── 4. Project Timeline / Phases ─────────────────────────────────────
      if (data.phases.length > 0) {
        const phaseSlide = pptx.addSlide({ masterName: 'SECTION_MASTER' });
        addSlideHeader(phaseSlide, '03',
          lang === 'es' ? 'Cronograma del Proyecto' : 'Project Timeline', roleColor);

        const headers = lang === 'es'
          ? ['Fase', 'Nombre de la Fase', 'Sem. Inicio', 'Duración (sem.)', 'Tareas', 'Críticas']
          : ['Phase', 'Phase Name', 'Start Wk.', 'Duration (wks.)', 'Tasks', 'Critical'];
        const COL_WIDTHS = [0.6, 3.2, 1.0, 1.4, 0.8, 0.9];
        const H_FILL = { color: roleColor };
        const H_OPT  = { fontSize: FONT.MICRO, bold: true, color: 'FFFFFF', align: 'center' as const };

        const tableData = [
          headers.map((h, ci) => ({
            text: h,
            options: { ...H_OPT, align: ci === 1 ? 'left' as const : 'center' as const, fill: H_FILL },
          })),
          ...data.phases.map((phase: any, idx: number) => {
            const tasks: any[] = Array.isArray(phase.tasks) ? phase.tasks : [];
            const crit = tasks.filter((t: any) => t.critical === true).length;
            const fill = { color: idx % 2 === 0 ? 'FFFFFF' : 'F0FDF4' };
            return [
              { text: String(phase.id ?? `P${idx + 1}`).toUpperCase(), options: { fontSize: FONT.MICRO, bold: true, color: roleColor, align: 'center' as const, fill } },
              { text: String(phase.name ?? '').substring(0, 44), options: { fontSize: FONT.MICRO, color: TEXT_B, fill } },
              { text: String(phase.startWeek ?? idx + 1), options: { fontSize: FONT.MICRO, color: TEXT_M, align: 'center' as const, fill } },
              { text: String(phase.duration ?? '?'), options: { fontSize: FONT.MICRO, color: TEXT_M, align: 'center' as const, fill } },
              { text: String(tasks.length), options: { fontSize: FONT.MICRO, color: TEXT_M, align: 'center' as const, fill } },
              { text: crit > 0 ? `${crit} ★` : '—', options: { fontSize: FONT.MICRO, color: crit > 0 ? 'DC2626' : TEXT_M, bold: crit > 0, align: 'center' as const, fill } },
            ];
          }),
        ];

        phaseSlide.addTable(tableData, {
          x: SLIDE.MARGIN_X, y: SLIDE.CONTENT_Y,
          w: SLIDE.CONTENT_W,
          colW: COL_WIDTHS,
          border: { color: BORDER, pt: 0.5 },
          rowH: 0.4,
        });
      }

      // ── 5. Team & Resources ───────────────────────────────────────────────
      if (data.resources.length > 0) {
        const resSlide = pptx.addSlide({ masterName: 'SECTION_MASTER' });
        addSlideHeader(resSlide, '04',
          lang === 'es' ? 'Equipo y Recursos' : 'Team & Resources', roleColor);

        const headers = lang === 'es'
          ? ['Rol', 'Seniority', 'Cant.', 'Rate/Mes (USD)', 'Costo Total']
          : ['Role', 'Seniority', 'Count', 'Rate/Month (USD)', 'Total Cost'];
        const COL_WIDTHS = [2.8, 1.5, 0.8, 1.7, 1.6];
        const H_FILL = { color: roleColor };
        const H_OPT  = { fontSize: FONT.MICRO, bold: true, color: 'FFFFFF', align: 'center' as const };

        const tableData = [
          headers.map((h, ci) => ({
            text: h,
            options: { ...H_OPT, align: ci === 0 ? 'left' as const : 'center' as const, fill: H_FILL },
          })),
          ...data.resources.map((res: any, idx: number) => {
            const rate  = Number(res.rate ?? res.Rate ?? 0);
            const count = Number(res.count ?? res.Count ?? 1);
            const total = rate * count;
            const fill  = { color: idx % 2 === 0 ? 'FFFFFF' : 'F0FDF4' };
            return [
              { text: String(res.role ?? res.Role ?? ''), options: { fontSize: FONT.MICRO, bold: true, color: TEXT_H, fill } },
              { text: String(res.seniority ?? res.Seniority ?? '-'), options: { fontSize: FONT.MICRO, color: TEXT_M, align: 'center' as const, fill } },
              { text: String(count), options: { fontSize: FONT.MICRO, color: TEXT_M, align: 'center' as const, fill } },
              { text: rate ? fmtCurrency(rate, lang) : '-', options: { fontSize: FONT.MICRO, color: TEXT_M, align: 'center' as const, fill } },
              { text: total ? fmtCurrency(total, lang) : '-', options: { fontSize: FONT.MICRO, bold: true, color: roleColor, align: 'center' as const, fill } },
            ];
          }),
        ];

        resSlide.addTable(tableData, {
          x: SLIDE.MARGIN_X, y: SLIDE.CONTENT_Y,
          w: SLIDE.CONTENT_W,
          colW: COL_WIDTHS,
          border: { color: BORDER, pt: 0.5 },
          rowH: 0.42,
        });
      }

      // ── 6. Deliverables / Agenda ─────────────────────────────────────────
      if (data.slides.length > 0) {
        const agSlide = pptx.addSlide({ masterName: 'SECTION_MASTER' });
        addSlideHeader(agSlide, '05',
          lang === 'es' ? 'Entregables y Agenda' : 'Deliverables & Agenda', roleColor);

        const half = Math.ceil(data.slides.length / 2);
        const col1 = data.slides.slice(0, half);
        const col2 = data.slides.slice(half);
        const colW = SLIDE.CONTENT_W / 2 - 0.1;

        const renderCol = (items: any[], startIdx: number, colX: number) => {
          items.forEach((s: any, i: number) => {
            const n     = startIdx + i + 1;
            const title = String(s.title ?? '');
            const y     = SLIDE.CONTENT_Y + i * 0.6;

            agSlide.addShape('rect', {
              x: colX, y: y + 0.05, w: 0.32, h: 0.32,
              fill: { color: roleColor }, line: { color: roleColor, width: 0 },
            });
            agSlide.addText(String(n), {
              x: colX, y: y + 0.05, w: 0.32, h: 0.32,
              fontSize: FONT.MICRO, bold: true, color: 'FFFFFF',
              align: 'center', valign: 'middle',
            });

            agSlide.addText(title.substring(0, 55), {
              x: colX + 0.38, y, w: colW - 0.45, h: 0.3,
              fontSize: FONT.BODY, bold: true, color: TEXT_H,
            });

            if (s.layout) {
              agSlide.addText(String(s.layout), {
                x: colX + 0.38, y: y + 0.3, w: colW - 0.45, h: 0.22,
                fontSize: FONT.MICRO - 1, color: TEXT_M, italic: true,
              });
            }
          });
        };

        renderCol(col1, 0, SLIDE.MARGIN_X);
        if (col2.length > 0) {
          renderCol(col2, half, SLIDE.MARGIN_X + SLIDE.CONTENT_W / 2 + 0.1);
        }
      }

      // ── 7. Tech Stack ────────────────────────────────────────────────────
      const techEntries = Object.entries(data.techStack).filter(
        ([, v]) => v && typeof v === 'object' && (v as any).name
      );
      if (techEntries.length > 0) {
        const techSlide = pptx.addSlide({ masterName: 'SECTION_MASTER' });
        addSlideHeader(techSlide, '06',
          lang === 'es' ? 'Stack Tecnológico' : 'Technology Stack', roleColor);

        const headers = lang === 'es'
          ? ['Capa', 'Tecnología', 'Justificación']
          : ['Layer', 'Technology', 'Rationale'];
        const COL_WIDTHS = [1.6, 1.8, 5.9];
        const H_FILL = { color: roleColor };
        const H_OPT  = { fontSize: FONT.MICRO, bold: true, color: 'FFFFFF', align: 'center' as const };

        const LAYER_LABELS: Record<string, { es: string; en: string }> = {
          architecture:   { es: 'Arquitectura',     en: 'Architecture' },
          frontend:       { es: 'Frontend',          en: 'Frontend' },
          backend:        { es: 'Backend',           en: 'Backend' },
          database:       { es: 'Base de Datos',     en: 'Database' },
          infrastructure: { es: 'Infraestructura',   en: 'Infrastructure' },
        };

        const tableData = [
          headers.map((h, ci) => ({
            text: h,
            options: { ...H_OPT, align: ci === 0 ? 'center' as const : 'left' as const, fill: H_FILL },
          })),
          ...techEntries.map(([key, v]: [string, any], idx) => {
            const label = LAYER_LABELS[key]
              ? LAYER_LABELS[key][lang === 'es' ? 'es' : 'en']
              : key;
            const fill = { color: idx % 2 === 0 ? 'FFFFFF' : 'F0FDF4' };
            return [
              { text: label, options: { fontSize: FONT.MICRO, bold: true, color: roleColor, align: 'center' as const, fill } },
              { text: String(v.name ?? ''), options: { fontSize: FONT.MICRO, bold: true, color: TEXT_H, fill } },
              { text: String(v.reason ?? '').substring(0, 120), options: { fontSize: FONT.MICRO, color: TEXT_B, fill } },
            ];
          }),
        ];

        techSlide.addTable(tableData, {
          x: SLIDE.MARGIN_X, y: SLIDE.CONTENT_Y,
          w: SLIDE.CONTENT_W,
          colW: COL_WIDTHS,
          border: { color: BORDER, pt: 0.5 },
          rowH: 0.46,
        });
      }

      // ── 8. Closing ───────────────────────────────────────────────────────
      const closingSlide = pptx.addSlide();
      addClosingSlide(closingSlide, {
        roleColor,
        roleId:      roleConfig.roleId,
        projectName,
        lang,
      });

      // ── Save ─────────────────────────────────────────────────────────────
      const safe = (s: string) =>
        s.replace(/[^a-zA-Z0-9\u00C0-\u024F\s]/g, '').replace(/\s+/g, '_').substring(0, 35);
      await pptx.writeFile({
        fileName: `Project_Manager_${safe(projectName)}_${new Date().toISOString().split('T')[0]}.pptx`,
      });

      notificationService.showSuccess(
        lang === 'es' ? 'Presentación generada con éxito' : 'Presentation generated successfully'
      );
    } catch (error) {
      notificationService.showError(
        lang === 'es' ? 'Error al generar presentación Project Manager' : 'Error generating Project Manager presentation',
        'projectManagerPPT.generate',
        error
      );
    }
  },
};
