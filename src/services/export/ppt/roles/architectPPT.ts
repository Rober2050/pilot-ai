/**
 * architectPPT.ts — Specialist PPT Generator for Software Architect Role
 *
 * C-Level quality presentation. Reads rawContent.dashboard DIRECTLY.
 * Bypasses genericRolePPT (which causes duplicate summaries + raw markdown overflow).
 *
 * Slides:
 *   01 — Executive Summary   (dashboard.summary)
 *   02 — KPI Dashboard       (dashboard.kpis: SLA, Complexity, Cloud Cost, Dev Effort)
 *   03 — Arch. Decisions     (tabs[adrs]: ADR table — ID, Decision, Status, Context)
 *   04 — Quality Attributes  (tabs[quality-attributes]: Attribute, Measure, Priority)
 *   05 — Tech Radar          (tabs[tech-radar]: Technology, Ring, Quadrant, Rationale)
 *   06 — Architecture Detail (tabs[detailed-architecture]: stripped markdown, no overflow)
 *   07 — Closing
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

/** Strip markdown formatting for clean C-Level slide text */
function stripMarkdown(md: string): string {
  return md
    .replace(/^#{1,6}\s+/gm, '')                  // # Headers
    .replace(/\*\*(.+?)\*\*/gs, '$1')             // **Bold**
    .replace(/\*(.+?)\*/gs, '$1')                 // *Italic*
    .replace(/`(.+?)`/g, '$1')                    // `Code`
    .replace(/^\|.+\|$/gm, '')                    // | Tables |
    .replace(/^[-*]\s+/gm, '• ')                  // List markers
    .replace(/^\s*[-]{3,}\s*$/gm, '')             // --- separators
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Find tab data by id from dashboard.tabs[] */
function findTab(tabs: any[], id: string): any[] | null {
  const tab = tabs.find((t: any) => t.id === id);
  if (!tab) return null;
  return Array.isArray(tab.data) ? tab.data : null;
}

function findTabData(tabs: any[], id: string): any {
  return tabs.find((t: any) => t.id === id)?.data ?? null;
}

/** Extract all architect-specific data from rawContent */
function extractArchData(rawContent: any) {
  const d = (rawContent?.dashboard ?? rawContent) ?? {};
  const tabs: any[] = Array.isArray(d.tabs) ? d.tabs : [];

  const summary  = String(d.summary ?? '');
  const kpis     = Array.isArray(d.kpis) ? d.kpis : [];
  const adrs     = findTab(tabs, 'adrs') ?? [];
  const qualAttr = findTab(tabs, 'quality-attributes') ?? [];
  const techRadar = findTab(tabs, 'tech-radar') ?? [];
  const detailMd = findTabData(tabs, 'detailed-architecture');
  const detailText = typeof detailMd === 'string' ? stripMarkdown(detailMd) : '';

  return { summary, kpis, adrs, qualAttr, techRadar, detailText };
}

// KPI trend colors (match role dashboard colors)
const KPI_COLORS: Record<string, string> = {
  emerald: '059669', green:  '059669',
  blue:    '2563EB', indigo: '4F46E5',
  amber:   'D97706', yellow: 'D97706',
  red:     'DC2626', rose:   'DC2626',
  purple:  '7C3AED', teal:   '0D9488',
};

const TREND_ICON: Record<string, string> = { up: '↑', down: '↓', neutral: '→' };

// Ring colors for Tech Radar
const RING_COLORS: Record<string, string> = {
  Adopt:  '059669',
  Trial:  '2563EB',
  Assess: 'D97706',
  Hold:   'DC2626',
};

// ── Main generator ────────────────────────────────────────────────────────────

export const architectPPT = {
  generate: async (rawContent: any, roleConfig: RoleConfig, lang: 'es' | 'en', projectName: string): Promise<void> => {
    try {
      const pptx      = new PptxGenJS();
      pptx.layout     = 'LAYOUT_16x9';
      const roleColor = ROLE_COLORS[roleConfig.roleId] || '3B82F6';
      const roleName  = roleConfig.displayName;
      const data      = extractArchData(rawContent);

      registerSectionMaster(pptx, roleColor, roleName);

      // ── 1. Cover ──────────────────────────────────────────────────────────
      const dateStr = new Date().toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
      });
      addCoverSlide(pptx, {
        title:       roleName,
        subtitle:    lang === 'es' ? 'Análisis de Arquitectura' : 'Architecture Analysis',
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
      if (data.kpis.length > 0) {
        const kpiSlide = pptx.addSlide({ masterName: 'SECTION_MASTER' });
        addSlideHeader(kpiSlide, '02',
          lang === 'es' ? 'Panel de Métricas' : 'KPI Dashboard', roleColor);

        const kpis  = data.kpis.slice(0, 4);
        const gapX  = 0.18;
        const cardW = (SLIDE.CONTENT_W - gapX * 3) / 4;
        const cardH = SLIDE.CONTENT_H - 0.3;

        kpis.forEach((kpi: any, i: number) => {
          const accentCol = KPI_COLORS[kpi.color] ?? roleColor;
          const x = SLIDE.MARGIN_X + i * (cardW + gapX);
          const y = SLIDE.CONTENT_Y;

          addPremiumCard(kpiSlide, {
            x, y, w: cardW, h: cardH,
            accentColor: accentCol, accentSide: 'top', bgColor: 'FFFFFF',
          });

          kpiSlide.addText(String(kpi.label ?? ''), {
            x: x + 0.1, y: y + 0.25, w: cardW - 0.2, h: 0.4,
            fontSize: FONT.CAPTION, color: TEXT_M,
            fontFace: 'Helvetica', align: 'center',
          });

          kpiSlide.addText(String(kpi.value ?? ''), {
            x: x + 0.1, y: y + 0.7, w: cardW - 0.2, h: 1.2,
            fontSize: 22, bold: true, color: accentCol,
            fontFace: 'Helvetica', align: 'center', valign: 'middle',
          });

          const trendIcon = TREND_ICON[kpi.trend] ?? '';
          const trendText = kpi.trendValue ? `${trendIcon} ${kpi.trendValue}` : trendIcon;
          if (trendText.trim()) {
            kpiSlide.addText(trendText, {
              x: x + 0.1, y: y + cardH - 0.65, w: cardW - 0.2, h: 0.45,
              fontSize: FONT.MICRO, color: accentCol,
              fontFace: 'Helvetica', align: 'center', valign: 'bottom',
            });
          }
        });
      }

      // ── 4. Architectural Decision Records (ADRs) ──────────────────────────
      if (data.adrs.length > 0) {
        const adrSlide = pptx.addSlide({ masterName: 'SECTION_MASTER' });
        addSlideHeader(adrSlide, '03',
          lang === 'es' ? 'Decisiones Arquitectónicas' : 'Architectural Decisions', roleColor);

        const headers = lang === 'es'
          ? ['ID', 'Decisión', 'Estado', 'Contexto']
          : ['ID', 'Decision', 'Status', 'Context'];
        const COL_WIDTHS = [0.8, 2.4, 1.0, 5.1];
        const H_FILL = { color: roleColor };
        const H_OPT  = { fontSize: FONT.MICRO, bold: true, color: 'FFFFFF', align: 'center' as const };

        const adrs = data.adrs.slice(0, 8);
        const rowH = Math.min(0.42, (SLIDE.CONTENT_H - 0.1) / (adrs.length + 1));

        const tableData = [
          headers.map((h, ci) => ({
            text: h,
            options: { ...H_OPT, align: ci === 0 ? 'center' as const : 'left' as const, fill: H_FILL },
          })),
          ...adrs.map((adr: any, idx: number) => {
            const fill = { color: idx % 2 === 0 ? 'FFFFFF' : 'EFF6FF' };
            const status = String(adr.status ?? 'Accepted');
            const statusColor = status === 'Accepted' ? '059669' :
                               status === 'Deprecated' ? 'DC2626' : 'D97706';
            return [
              { text: String(adr.id ?? ''), options: { fontSize: FONT.MICRO, bold: true, color: roleColor, align: 'center' as const, fill } },
              { text: String(adr.title ?? adr.decision ?? '').substring(0, 45), options: { fontSize: FONT.MICRO, bold: true, color: TEXT_H, fill } },
              { text: status, options: { fontSize: FONT.MICRO, color: statusColor, bold: true, align: 'center' as const, fill } },
              { text: String(adr.context ?? '').substring(0, 95), options: { fontSize: FONT.MICRO, color: TEXT_B, fill } },
            ];
          }),
        ];

        adrSlide.addTable(tableData, {
          x: SLIDE.MARGIN_X, y: SLIDE.CONTENT_Y,
          w: SLIDE.CONTENT_W, rowH,
          colW: COL_WIDTHS,
          border: { color: BORDER, pt: 0.5 },
        });
      }

      // ── 5. Quality Attributes ─────────────────────────────────────────────
      if (data.qualAttr.length > 0) {
        const qaSlide = pptx.addSlide({ masterName: 'SECTION_MASTER' });
        addSlideHeader(qaSlide, '04',
          lang === 'es' ? 'Atributos de Calidad' : 'Quality Attributes', roleColor);

        const headers = lang === 'es'
          ? ['Atributo', 'Métrica / Escenario', 'Prioridad', 'Categoría']
          : ['Attribute', 'Metric / Scenario', 'Priority', 'Category'];
        const COL_WIDTHS = [1.5, 4.5, 1.2, 1.9];
        const H_FILL = { color: roleColor };
        const H_OPT  = { fontSize: FONT.MICRO, bold: true, color: 'FFFFFF', align: 'center' as const };

        const attrs = data.qualAttr.slice(0, 10);
        const rowH  = Math.min(0.42, (SLIDE.CONTENT_H - 0.1) / (attrs.length + 1));

        const PRIORITY_COLORS: Record<string, string> = {
          Critical: 'DC2626', High: 'D97706', Medium: '2563EB', Low: '6B7280',
        };

        const tableData = [
          headers.map((h, ci) => ({
            text: h,
            options: { ...H_OPT, align: ci === 0 ? 'left' as const : 'center' as const, fill: H_FILL },
          })),
          ...attrs.map((a: any, idx: number) => {
            const fill = { color: idx % 2 === 0 ? 'FFFFFF' : 'EFF6FF' };
            const prio  = String(a.priority ?? 'Medium');
            const prioColor = PRIORITY_COLORS[prio] ?? TEXT_M;
            const scenario = String(a.measure ?? a.scenario ?? '').substring(0, 80);
            return [
              { text: String(a.attribute ?? ''), options: { fontSize: FONT.MICRO, bold: true, color: roleColor, fill } },
              { text: scenario, options: { fontSize: FONT.MICRO, color: TEXT_B, fill } },
              { text: prio, options: { fontSize: FONT.MICRO, bold: true, color: prioColor, align: 'center' as const, fill } },
              { text: String(a.category ?? ''), options: { fontSize: FONT.MICRO, color: TEXT_M, align: 'center' as const, fill } },
            ];
          }),
        ];

        qaSlide.addTable(tableData, {
          x: SLIDE.MARGIN_X, y: SLIDE.CONTENT_Y,
          w: SLIDE.CONTENT_W, rowH,
          colW: COL_WIDTHS,
          border: { color: BORDER, pt: 0.5 },
        });
      }

      // ── 6. Tech Radar ────────────────────────────────────────────────────
      if (data.techRadar.length > 0) {
        const radarSlide = pptx.addSlide({ masterName: 'SECTION_MASTER' });
        addSlideHeader(radarSlide, '05', 'Tech Radar', roleColor);

        const headers = lang === 'es'
          ? ['Tecnología', 'Ring', 'Cuadrante', 'Justificación']
          : ['Technology', 'Ring', 'Quadrant', 'Rationale'];
        const COL_WIDTHS = [1.6, 0.9, 1.8, 4.9];
        const H_FILL = { color: roleColor };
        const H_OPT  = { fontSize: FONT.MICRO, bold: true, color: 'FFFFFF', align: 'center' as const };

        const techs = data.techRadar.slice(0, 10);
        const rowH  = Math.min(0.42, (SLIDE.CONTENT_H - 0.1) / (techs.length + 1));

        const tableData = [
          headers.map((h, ci) => ({
            text: h,
            options: { ...H_OPT, align: ci === 0 ? 'left' as const : 'center' as const, fill: H_FILL },
          })),
          ...techs.map((t: any, idx: number) => {
            const fill = { color: idx % 2 === 0 ? 'FFFFFF' : 'EFF6FF' };
            const ring  = String(t.ring ?? '');
            const ringColor = RING_COLORS[ring] ?? TEXT_M;
            return [
              { text: String(t.name ?? ''), options: { fontSize: FONT.MICRO, bold: true, color: TEXT_H, fill } },
              { text: ring, options: { fontSize: FONT.MICRO, bold: true, color: ringColor, align: 'center' as const, fill } },
              { text: String(t.quadrant ?? '').substring(0, 25), options: { fontSize: FONT.MICRO, color: TEXT_M, align: 'center' as const, fill } },
              { text: String(t.rationale ?? t.description ?? '').substring(0, 90), options: { fontSize: FONT.MICRO, color: TEXT_B, fill } },
            ];
          }),
        ];

        radarSlide.addTable(tableData, {
          x: SLIDE.MARGIN_X, y: SLIDE.CONTENT_Y,
          w: SLIDE.CONTENT_W, rowH,
          colW: COL_WIDTHS,
          border: { color: BORDER, pt: 0.5 },
        });
      }

      // ── 7. Architecture Overview (stripped markdown, no overflow) ─────────
      if (data.detailText) {
        const detSlide = pptx.addSlide({ masterName: 'SECTION_MASTER' });
        addSlideHeader(detSlide, '06',
          lang === 'es' ? 'Visión de Arquitectura' : 'Architecture Overview', roleColor);

        // Truncate to max 1400 chars to avoid overflow
        const truncated = data.detailText.length > 1400
          ? data.detailText.substring(0, 1400) + '…'
          : data.detailText;

        addPremiumCard(detSlide, {
          x: SLIDE.MARGIN_X, y: SLIDE.CONTENT_Y,
          w: SLIDE.CONTENT_W, h: SLIDE.CONTENT_H - 0.1,
          accentColor: roleColor, accentSide: 'left', bgColor: 'FFFFFF',
        });
        detSlide.addText(truncated, {
          x: SLIDE.MARGIN_X + 0.25, y: SLIDE.CONTENT_Y + 0.1,
          w: SLIDE.CONTENT_W - 0.35, h: SLIDE.CONTENT_H - 0.35,
          fontSize: FONT.MICRO + 1, color: TEXT_B, fontFace: 'Helvetica',
          valign: 'top', wrap: true,
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
        fileName: `${safe(roleName)}_${new Date().toISOString().split('T')[0]}.pptx`,
      });

      notificationService.showSuccess(
        lang === 'es' ? 'Presentación generada con éxito' : 'Presentation generated successfully'
      );
    } catch (error) {
      notificationService.showError(
        lang === 'es' ? 'Error al generar presentación Software Architect' : 'Error generating Software Architect presentation',
        'architectPPT.generate',
        error
      );
    }
  },
};
