/**
 * businessAnalystPPT.ts — Specialist PPT Generator for Business Analyst Role
 *
 * C-Level quality presentation matching Strategy Analyst and Product Manager tier.
 * Reads rawContent directly from AI output — bypasses generic normalizer.
 *
 * Data extracted from UniversalDashboardSchema:
 *   dashboard.summary          → Executive Summary slide
 *   dashboard.kpis[]           → KPI Dashboard slide (with trend colors)
 *   dashboard.tabs[requirements] → Requirements table
 *   dashboard.tabs[user-stories] → User Stories 2-column layout
 *   dashboard.tabs[business-rules] → Business Rules table
 *
 * NOT a generic generator — role-specific slide logic for maximum quality.
 */

import PptxGenJS from 'pptxgenjs';
import { RoleConfig } from '../../../../types/roles';
import {
  addCoverSlide, addSlideHeader, addPremiumCard, addClosingSlide,
  ROLE_COLORS, TEXT_H, TEXT_B, TEXT_M, BORDER,
} from '../../pptHelpers';
import { registerSectionMaster, SLIDE, FONT } from '../slideTemplates';
import { notificationService } from '../../../ui/notificationService';

// KPI trend colors (match role dashboard UI colors)
const KPI_COLORS: Record<string, string> = {
  emerald: '059669',
  green:   '059669',
  blue:    '2563EB',
  indigo:  '4F46E5',
  amber:   'D97706',
  yellow:  'D97706',
  red:     'DC2626',
  rose:    'DC2626',
  purple:  '7C3AED',
  teal:    '0D9488',
  cyan:    '0891B2',
};

// Trend icons as unicode characters
const TREND_ICON: Record<string, string> = {
  up:      '↑',
  down:    '↓',
  neutral: '→',
};

interface BAData {
  summary:      string;
  kpis:         any[];
  requirements: any[];
  userStories:  any[];
  bizRules:     any[];
  analyticsCharts: any[];
}

function extractBAData(rawContent: any): BAData {
  const d = rawContent?.dashboard ?? rawContent ?? {};
  const tabs: any[] = d.tabs ?? [];

  const findTab = (id: string) => tabs.find((t: any) => t.id === id)?.data;

  const reqData       = findTab('requirements');
  const storiesData   = findTab('user-stories');
  const rulesData     = findTab('business-rules');
  const analyticsData = findTab('analytics');

  return {
    summary:         d.summary ?? '',
    kpis:            Array.isArray(d.kpis) ? d.kpis : [],
    requirements:    Array.isArray(reqData) ? reqData
                     : Array.isArray(reqData?.requirements) ? reqData.requirements : [],
    userStories:     Array.isArray(storiesData) ? storiesData
                     : Array.isArray(storiesData?.stories) ? storiesData.stories : [],
    bizRules:        Array.isArray(rulesData) ? rulesData
                     : Array.isArray(rulesData?.rules) ? rulesData.rules : [],
    analyticsCharts: Array.isArray(analyticsData) ? analyticsData : [],
  };
}

export const businessAnalystPPT = {
  generate: async (
    rawContent: any,
    roleConfig: RoleConfig,
    lang: 'es' | 'en',
    projectName: string
  ): Promise<void> => {
    try {
      const pptx      = new PptxGenJS();
      pptx.layout     = 'LAYOUT_16x9';
      const roleColor = ROLE_COLORS[roleConfig.roleId] || '0891B2';
      const roleName  = roleConfig.displayName;
      const data      = extractBAData(rawContent);

      // ── 1. Master ────────────────────────────────────────────────────────
      registerSectionMaster(pptx, roleColor, roleName);

      // ── 2. Cover ─────────────────────────────────────────────────────────
      const dateStr = new Date().toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
      });
      addCoverSlide(pptx, {
        title:       roleName,
        subtitle:    lang === 'es' ? 'Análisis de Requerimientos' : 'Requirements Analysis',
        projectName,
        date:        dateStr,
        roleColor,
        lang,
        roleId:      roleConfig.roleId,
      });

      // ── 3. Executive Summary ──────────────────────────────────────────────
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

      // ── 4. KPI Dashboard ─────────────────────────────────────────────────
      if (data.kpis.length > 0) {
        const kpiSlide = pptx.addSlide({ masterName: 'SECTION_MASTER' });
        addSlideHeader(kpiSlide, '02',
          lang === 'es' ? 'Panel de Indicadores' : 'KPI Dashboard', roleColor);

        const kpis   = data.kpis.slice(0, 4);
        const cols   = Math.min(kpis.length, 4);
        const gapX   = 0.18;
        const cardW  = (SLIDE.CONTENT_W - gapX * (cols - 1)) / cols;
        const cardH  = SLIDE.CONTENT_H - 0.3;

        kpis.forEach((kpi: any, i: number) => {
          const accentCol = KPI_COLORS[kpi.color] ?? roleColor;
          const x = SLIDE.MARGIN_X + i * (cardW + gapX);
          const y = SLIDE.CONTENT_Y;

          addPremiumCard(kpiSlide, {
            x, y, w: cardW, h: cardH,
            accentColor: accentCol, accentSide: 'top', bgColor: 'FFFFFF',
          });

          // Label
          kpiSlide.addText(String(kpi.label ?? ''), {
            x: x + 0.1, y: y + 0.25, w: cardW - 0.2, h: 0.4,
            fontSize: FONT.CAPTION, color: TEXT_M,
            fontFace: 'Helvetica', align: 'center',
          });

          // Value (large, accent color)
          kpiSlide.addText(String(kpi.value ?? ''), {
            x: x + 0.1, y: y + 0.7, w: cardW - 0.2, h: 1.2,
            fontSize: 26, bold: true, color: accentCol,
            fontFace: 'Helvetica', align: 'center', valign: 'middle',
          });

          // Trend indicator
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

      // ── 5. Requirements table ─────────────────────────────────────────────
      if (data.requirements.length > 0) {
        const reqSlide = pptx.addSlide({ masterName: 'SECTION_MASTER' });
        addSlideHeader(reqSlide, '03',
          lang === 'es' ? 'Requisitos Clave' : 'Key Requirements', roleColor);

        // Show: ID, text (as Descripción), type, priority
        const reqs = data.requirements.slice(0, 12);
        const headers = lang === 'es'
          ? ['ID', 'Descripción', 'Tipo', 'Prioridad']
          : ['ID', 'Description', 'Type', 'Priority'];
        const rowH = Math.min(0.42, (SLIDE.CONTENT_H - 0.1) / (reqs.length + 1));

        const tableData: any[][] = [
          headers.map(h => ({
            text: h,
            options: {
              bold: true, color: 'FFFFFF', fontSize: FONT.CAPTION,
              fill: { color: roleColor }, align: 'center' as const,
            },
          })),
          ...reqs.map((req: any, rIdx: number) => [
            { text: String(req.id ?? ''), options: { fontSize: FONT.MICRO, color: roleColor, bold: true, fill: { color: rIdx % 2 === 0 ? 'FFFFFF' : 'F8FAFC' } } },
            { text: String(req.text ?? req.description ?? '').substring(0, 80), options: { fontSize: FONT.MICRO, color: TEXT_B, fill: { color: rIdx % 2 === 0 ? 'FFFFFF' : 'F8FAFC' } } },
            { text: String(req.type ?? req.category ?? ''), options: { fontSize: FONT.MICRO, color: TEXT_M, align: 'center' as const, fill: { color: rIdx % 2 === 0 ? 'FFFFFF' : 'F8FAFC' } } },
            { text: String(req.priority ?? req.moscow ?? ''), options: { fontSize: FONT.MICRO, color: TEXT_M, align: 'center' as const, fill: { color: rIdx % 2 === 0 ? 'FFFFFF' : 'F8FAFC' } } },
          ]),
        ];

        reqSlide.addTable(tableData, {
          x: SLIDE.MARGIN_X, y: SLIDE.CONTENT_Y,
          w: SLIDE.CONTENT_W, rowH,
          border: { color: BORDER, pt: 0.5 },
          colW: [1.0, 4.8, 1.4, 1.6],
        });
      }

      // ── 6. User Stories (2-column layout) ─────────────────────────────────
      if (data.userStories.length > 0) {
        const storiesSlide = pptx.addSlide({ masterName: 'SECTION_MASTER' });
        addSlideHeader(storiesSlide, '04',
          lang === 'es' ? 'Historias de Usuario' : 'User Stories', roleColor);

        const stories = data.userStories.slice(0, 8);
        const half    = Math.ceil(stories.length / 2);
        const leftItems  = stories.slice(0, half);
        const rightItems = stories.slice(half);

        const gapX  = 0.3;
        const colW  = (SLIDE.CONTENT_W - gapX) / 2;
        const itemH = 0.5;

        const renderColumn = (items: any[], startX: number) => {
          let y = SLIDE.CONTENT_Y + 0.15;
          for (const story of items) {
            const title = typeof story === 'string' ? story
              : (story.title ?? story.description ?? `${story.id ?? ''}`);
            // Accent bar
            storiesSlide.addShape('rect', {
              x: startX, y: y + 0.12, w: 0.06, h: 0.24,
              fill: { color: roleColor }, line: { color: roleColor, width: 0 },
            });
            storiesSlide.addText(String(title).substring(0, 90), {
              x: startX + 0.14, y,
              w: colW - 0.2, h: itemH,
              fontSize: FONT.BODY, color: TEXT_B, fontFace: 'Helvetica',
              valign: 'middle', wrap: true,
            });
            y += itemH + 0.05;
          }
        };

        // Background cards for each column
        addPremiumCard(storiesSlide, {
          x: SLIDE.MARGIN_X, y: SLIDE.CONTENT_Y,
          w: colW, h: SLIDE.CONTENT_H - 0.1,
          accentColor: roleColor, accentSide: 'top', bgColor: 'FFFFFF',
        });
        if (rightItems.length > 0) {
          addPremiumCard(storiesSlide, {
            x: SLIDE.MARGIN_X + colW + gapX, y: SLIDE.CONTENT_Y,
            w: colW, h: SLIDE.CONTENT_H - 0.1,
            accentColor: roleColor, accentSide: 'top', bgColor: 'FFFFFF',
          });
        }

        renderColumn(leftItems, SLIDE.MARGIN_X + 0.1);
        if (rightItems.length > 0) renderColumn(rightItems, SLIDE.MARGIN_X + colW + gapX + 0.1);
      }

      // ── 7. Business Rules ────────────────────────────────────────────────
      if (data.bizRules.length > 0) {
        const rulesSlide = pptx.addSlide({ masterName: 'SECTION_MASTER' });
        addSlideHeader(rulesSlide, '05',
          lang === 'es' ? 'Reglas de Negocio' : 'Business Rules', roleColor);

        const rules = data.bizRules.slice(0, 10);
        const rowH  = Math.min(0.44, (SLIDE.CONTENT_H - 0.1) / (rules.length + 1));
        const headers = lang === 'es'
          ? ['ID', 'Regla', 'Cumplimiento', 'Prioridad']
          : ['ID', 'Rule', 'Compliance', 'Priority'];

        const tableData: any[][] = [
          headers.map(h => ({
            text: h,
            options: {
              bold: true, color: 'FFFFFF', fontSize: FONT.CAPTION,
              fill: { color: roleColor }, align: 'center' as const,
            },
          })),
          ...rules.map((r: any, rIdx: number) => [
            { text: String(r.id ?? ''), options: { fontSize: FONT.MICRO, color: roleColor, bold: true, fill: { color: rIdx % 2 === 0 ? 'FFFFFF' : 'F8FAFC' } } },
            { text: String(r.rule ?? r.description ?? '').substring(0, 80), options: { fontSize: FONT.MICRO, color: TEXT_B, fill: { color: rIdx % 2 === 0 ? 'FFFFFF' : 'F8FAFC' } } },
            { text: String(r.compliance ?? r.category ?? ''), options: { fontSize: FONT.MICRO, color: TEXT_M, align: 'center' as const, fill: { color: rIdx % 2 === 0 ? 'FFFFFF' : 'F8FAFC' } } },
            { text: String(r.priority ?? ''), options: { fontSize: FONT.MICRO, color: TEXT_M, align: 'center' as const, fill: { color: rIdx % 2 === 0 ? 'FFFFFF' : 'F8FAFC' } } },
          ]),
        ];

        rulesSlide.addTable(tableData, {
          x: SLIDE.MARGIN_X, y: SLIDE.CONTENT_Y,
          w: SLIDE.CONTENT_W, rowH,
          border: { color: BORDER, pt: 0.5 },
          colW: [0.9, 5.1, 1.7, 1.1],
        });
      }

      // ── 8. Closing ────────────────────────────────────────────────────────
      const closingSlide = pptx.addSlide();
      addClosingSlide(closingSlide, {
        roleColor,
        roleId: roleConfig.roleId,
        projectName,
        lang,
      });

      // ── Save ─────────────────────────────────────────────────────────────
      const safe = (s: string) =>
        s.replace(/[^a-zA-Z0-9\u00C0-\u024F\s]/g, '').replace(/\s+/g, '_').substring(0, 35);
      await pptx.writeFile({ fileName: `${safe(roleName)}_${new Date().toISOString().split('T')[0]}.pptx` });

      notificationService.showSuccess(
        lang === 'es' ? 'Presentación generada con éxito' : 'Presentation generated successfully'
      );
    } catch (error) {
      notificationService.showError(
        lang === 'es' ? 'Error al generar presentación Business Analyst' : 'Error generating Business Analyst presentation',
        'businessAnalystPPT.generate',
        error
      );
    }
  },
};
