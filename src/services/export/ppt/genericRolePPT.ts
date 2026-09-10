/**
 * genericRolePPT.ts — Premium Generic Role PPT Generator
 *
 * Uses the same pptHelpers premium building blocks as Strategy Analyst and Product Manager:
 * addCoverSlide · addSlideHeader · addPremiumCard · addClosingSlide
 *
 * All generic roles (Business Analyst, Marketing Manager, Financial Analyst, etc.) receive:
 * - Identical cover style with role-specific color identity
 * - Premium cards with shadow and accent markers
 * - Role-colored slide headers and dividers
 * - Professional closing slide
 *
 * NOT used by: strategy-analyst, product-manager — see exportRegistry.ts
 */

import PptxGenJS from 'pptxgenjs';
import { NormalizedDocument, NormalizedSection } from '../contentNormalizer';
import { RoleConfig } from '../../../types/roles';
import {
  addCoverSlide, addSlideHeader, addPremiumCard, addClosingSlide,
  extractNumeric, ROLE_COLORS, TEXT_B, TEXT_M, BORDER,
} from '../pptHelpers';
import { registerSectionMaster, SLIDE, FONT } from './slideTemplates';
import { notificationService } from '../../ui/notificationService';

export const genericRolePPT = {
  generate: async (
    normalizedDoc: NormalizedDocument,
    roleConfig: RoleConfig,
    lang: 'es' | 'en' = 'es'
  ) => {
    try {
      const pptx = new PptxGenJS();
      pptx.layout = 'LAYOUT_16x9';

      const roleColor = ROLE_COLORS[roleConfig.roleId] || '4F46E5';
      const { roleName, projectName, sections } = normalizedDoc;

      // ── 1. Master (must be defined before any slide) ──────────────────────
      registerSectionMaster(pptx, roleColor, roleName);

      // ── 2. Cover ──────────────────────────────────────────────────────────
      const dateStr = new Date().toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
      });
      addCoverSlide(pptx, {
        title: roleName,
        subtitle: lang === 'es' ? 'Análisis Ejecutivo' : 'Executive Analysis',
        projectName,
        date: dateStr,
        roleColor,
        lang,
        roleId: roleConfig.roleId,
      });

      // ── 3. Executive Summary ───────────────────────────────────────────────
      // Titles that represent the summary in either language — used to locate and exclude later
      const SUMMARY_TITLES = new Set(['Resumen Ejecutivo', 'Executive Summary']);
      const summaryHeading = lang === 'es' ? 'Resumen Ejecutivo' : 'Executive Summary';

      // Find the summary section directly — avoid scanning all sections which picks up
      // markdown from other tabs (e.g., deployment-strategy) and creates mixed content.
      const isHtmlContent = (s: NormalizedSection) =>
        typeof s.data === 'string' &&
        (s.data.trimStart().startsWith('<') || s.data.includes('<!DOCTYPE'));

      const summarySection = sections.find(
        s => s.type === 'text' && SUMMARY_TITLES.has(s.title) && !isHtmlContent(s)
      ) ?? sections.find(s => s.type === 'text' && !isHtmlContent(s));

      const summarySlide = pptx.addSlide({ masterName: 'SECTION_MASTER' });
      addSlideHeader(summarySlide, '01', summaryHeading, roleColor);

      // Build key bullets ONLY from the summary section (plain text, stripped of markdown)
      const keyBullets: string[] = [];
      if (summarySection && typeof summarySection.data === 'string') {
        const cleaned = stripMarkdownForSlide(summarySection.data);
        const sentences = cleaned
          .split(/(?<=[.!?])\s+|\n+/)
          .map(s => s.trim())
          .filter(s => s.length > 20 && !s.startsWith('─'));
        keyBullets.push(...sentences.slice(0, 5));
      }

      addPremiumCard(summarySlide, {
        x: SLIDE.MARGIN_X, y: SLIDE.CONTENT_Y,
        w: SLIDE.CONTENT_W, h: SLIDE.CONTENT_H - 0.1,
        accentColor: roleColor, accentSide: 'left', bgColor: 'FFFFFF',
      });

      if (keyBullets.length > 0) {
        summarySlide.addText(
          keyBullets.map(b => ({
            text: b,
            options: {
              bullet: true,
              fontSize: FONT.BODY, color: TEXT_B,
              paraSpaceAfter: 10,
            },
          })),
          {
            x: SLIDE.MARGIN_X + 0.25, y: SLIDE.CONTENT_Y + 0.2,
            w: SLIDE.CONTENT_W - 0.45, h: SLIDE.CONTENT_H - 0.5,
            fontFace: 'Helvetica', valign: 'top',
          }
        );
      }

      // ── 4. Content slides (up to 5, prioritized by type) ──────────────────
      const kpiIndicatorTitle = lang === 'es' ? 'Indicadores Clave' : 'Key Indicators';

      // Strictly: NO text sections in content slides (summary already in slide 01)
      // Only tables, lists, and metric grids — these are less likely to duplicate the summary
      const prioritized = [
        ...sections.filter(s => s.type === 'table' && s.title.trim() !== ''),
        ...sections.filter(s => s.type === 'list' && s.title.trim() !== ''),
        ...sections.filter(s => s.type === 'kpi_grid' && s.title !== kpiIndicatorTitle && s.title.trim() !== ''),
      ];

      // Total slides: 1 (cover) + 1 (summary) + up to 5 (content) + 1 (closing) = max 8
      let sectionNum = 2;
      for (const section of prioritized.slice(0, 5)) {
        const numStr = String(sectionNum).padStart(2, '0');
        sectionNum++;

        if (section.type === 'text' && typeof section.data === 'string') {
          renderTextSlide(pptx, section, numStr, roleColor);
        } else if (section.type === 'list' && Array.isArray(section.data)) {
          renderListSlide(pptx, section, numStr, roleColor);
        } else if (section.type === 'table' && Array.isArray(section.data)) {
          renderTableSlide(pptx, section, numStr, roleColor);
        } else if (section.type === 'kpi_grid' && typeof section.data === 'object' && section.data) {
          renderKPISlide(pptx, section, numStr, roleColor);
        }
      }

      // ── 5. Dedicated KPI indicators slide ─────────────────────────────────
      const kpiSection = sections.find(s =>
        s.type === 'kpi_grid' && s.title === kpiIndicatorTitle
      );
      if (kpiSection && typeof kpiSection.data === 'object' && kpiSection.data) {
        const numStr = String(sectionNum).padStart(2, '0');
        sectionNum++;
        renderKPISlide(pptx, kpiSection, numStr, roleColor);
      }

      // ── 6. Quantitative chart slide ────────────────────────────────────────
      const numericKpi = sections.find(s =>
        s.type === 'kpi_grid' &&
        typeof s.data === 'object' &&
        s.data !== null &&
        Object.values(s.data as Record<string, any>).some(v => !isNaN(extractNumeric(v)))
      );
      if (numericKpi && typeof numericKpi.data === 'object' && numericKpi.data) {
        const chartData: { label: string; val: number }[] = [];
        for (const [k, v] of Object.entries(numericKpi.data as Record<string, any>)) {
          const num = extractNumeric(v);
          if (!isNaN(num)) chartData.push({ label: k.substring(0, 15), val: num });
        }
        if (chartData.length >= 2) {
          const numStr = String(sectionNum).padStart(2, '0');
          sectionNum++;
          const chartSlide = pptx.addSlide({ masterName: 'SECTION_MASTER' });
          const chartTitle = numericKpi.title ||
            (lang === 'es' ? 'Análisis Cuantitativo' : 'Quantitative Analysis');
          addSlideHeader(chartSlide, numStr, chartTitle, roleColor);

          chartSlide.addChart(pptx.ChartType.bar, [{
            name: chartTitle,
            labels: chartData.map(d => d.label),
            values: chartData.map(d => d.val),
          }], {
            x: SLIDE.MARGIN_X, y: SLIDE.CONTENT_Y + 0.1,
            w: SLIDE.CONTENT_W, h: SLIDE.CONTENT_H - 0.25,
            barDir: 'col', barGrouping: 'clustered',
            chartColors: [roleColor, '93C5FD', 'FCD34D', '34D399', 'F87171'],
            dataBorder: { pt: 1, color: 'FFFFFF' },
            showLegend: false, showValue: true,
            valGridLine: { color: 'E5E7EB', style: 'dash', size: 1 },
            catAxisLabelColor: TEXT_M, valAxisLabelColor: TEXT_M,
            catAxisLineShow: false, valAxisLineShow: false,
          });
        }
      }

      // ── 7. Process flow slide (chevrons) ───────────────────────────────────
      const processList = sections.find(s =>
        s.type === 'list' &&
        Array.isArray(s.data) &&
        (s.data as any[]).length >= 3 &&
        (s.data as any[]).length <= 6
      );
      if (processList && Array.isArray(processList.data)) {
        const numStr = String(sectionNum).padStart(2, '0');
        sectionNum++;
        const processSlide = pptx.addSlide({ masterName: 'SECTION_MASTER' });
        const processTitle = processList.title ||
          (lang === 'es' ? 'Flujo de Proceso' : 'Process Flow');
        addSlideHeader(processSlide, numStr, processTitle, roleColor);

        const steps = (processList.data as any[]).map(d => String(d).substring(0, 50));
        const n = steps.length;
        const gap = 0.18;
        const stepW = (SLIDE.CONTENT_W - gap * (n - 1)) / n;
        let startX = SLIDE.MARGIN_X;
        const chevronY = SLIDE.CONTENT_Y + 0.9;

        for (let i = 0; i < n; i++) {
          processSlide.addShape(pptx.ShapeType.chevron, {
            x: startX, y: chevronY, w: stepW, h: 1.4,
            fill: { color: i === 0 ? roleColor : 'E5E7EB' },
            line: { color: 'FFFFFF', width: 2 },
          });
          processSlide.addText(`${i + 1}`, {
            x: startX, y: chevronY, w: stepW, h: 1.4,
            fontSize: 30, bold: true,
            color: i === 0 ? 'FFFFFF' : '9CA3AF',
            align: 'center', valign: 'middle',
          });
          processSlide.addText(steps[i], {
            x: startX, y: chevronY + 1.5, w: stepW, h: 1.1,
            fontSize: FONT.CAPTION, bold: true, color: TEXT_B,
            align: 'center', valign: 'top', wrap: true,
          });
          startX += stepW + gap;
        }
      }

      // ── 8. Closing slide ───────────────────────────────────────────────────
      const closingSlide = pptx.addSlide();
      addClosingSlide(closingSlide, {
        roleColor,
        roleId: roleConfig.roleId,
        projectName,
        lang,
      });

      // ── 9. Save ────────────────────────────────────────────────────────────
      const safe = (s: string) => s.replace(/[^a-zA-Z0-9\u00C0-\u024F\s]/g, '').replace(/\s+/g, '_').substring(0, 35);
      const fileName = `${safe(roleName)}_${new Date().toISOString().split('T')[0]}.pptx`;
      await pptx.writeFile({ fileName });

      notificationService.showSuccess(
        lang === 'es' ? 'Presentación generada con éxito' : 'Presentation generated successfully'
      );
    } catch (error) {
      notificationService.showError(
        lang === 'es' ? 'Error al generar presentación' : 'Error generating presentation',
        'genericRolePPT.generate',
        error
      );
    }
  },
};

// ── Section renderers ──────────────────────────────────────────────────────────

/**
 * Strips markdown syntax for plain-text PPT rendering.
 * Converts: headings → UPPERCASE line, bold/italic → plain, hr → separator line,
 * checkboxes → unicode chars, bullets → standardized bullet.
 */
function stripMarkdownForSlide(text: string): string {
  return text
    .replace(/^#{1,6}\s+(.+)$/gm, (_, t) => t.toUpperCase())   // headings → uppercase
    .replace(/\*\*(.*?)\*\*/g, '$1')                             // bold
    .replace(/\*(.*?)\*/g, '$1')                                 // italic
    .replace(/`([^`]+)`/g, '$1')                                 // inline code
    .replace(/^---+$/gm, '────────────────')                     // hr → visual line
    .replace(/^- \[ \]/gm, '☐')                                  // unchecked
    .replace(/^- \[x\]/gim, '☑')                                 // checked
    .replace(/^[-*]\s+/gm, '• ')                                  // bullets
    .replace(/\n{3,}/g, '\n\n')                                   // max 2 newlines
    .trim();
}

/** Text section: premium card with left accent bar */
function renderTextSlide(
  pptx: PptxGenJS, section: NormalizedSection,
  numStr: string, roleColor: string
) {
  const slide = pptx.addSlide({ masterName: 'SECTION_MASTER' });
  addSlideHeader(slide, numStr, section.title || '', roleColor);

  addPremiumCard(slide, {
    x: SLIDE.MARGIN_X, y: SLIDE.CONTENT_Y,
    w: SLIDE.CONTENT_W, h: SLIDE.CONTENT_H - 0.1,
    accentColor: roleColor, accentSide: 'left', bgColor: 'FFFFFF',
  });

  // Strip markdown and cap length — a slide holds ~900 chars at 11pt
  const cleaned = stripMarkdownForSlide(String(section.data));
  const MAX_CHARS = 900;
  const display = cleaned.length > MAX_CHARS
    ? cleaned.substring(0, MAX_CHARS).trimEnd() + '\n…'
    : cleaned;

  // Smaller font for longer content so it fits
  const fontSize = display.length > 500 ? FONT.CAPTION : FONT.BODY;

  slide.addText(display, {
    x: SLIDE.MARGIN_X + 0.25, y: SLIDE.CONTENT_Y + 0.15,
    w: SLIDE.CONTENT_W - 0.35, h: SLIDE.CONTENT_H - 0.4,
    fontSize, color: TEXT_B, fontFace: 'Helvetica',
    valign: 'top', wrap: true,
  });
}

/** List section: premium card + colored bar bullets */
function renderListSlide(
  pptx: PptxGenJS, section: NormalizedSection,
  numStr: string, roleColor: string
) {
  const slide = pptx.addSlide({ masterName: 'SECTION_MASTER' });
  addSlideHeader(slide, numStr, section.title || '', roleColor);

  addPremiumCard(slide, {
    x: SLIDE.MARGIN_X, y: SLIDE.CONTENT_Y,
    w: SLIDE.CONTENT_W, h: SLIDE.CONTENT_H - 0.1,
    accentColor: roleColor, accentSide: 'left', bgColor: 'FFFFFF',
  });

  const items = (section.data as string[]).slice(0, 8);
  const itemH = 0.44;
  let y = SLIDE.CONTENT_Y + 0.2;

  for (const item of items) {
    // Colored accent bar as bullet marker
    slide.addShape('rect', {
      x: SLIDE.MARGIN_X + 0.2, y: y + 0.1, w: 0.06, h: 0.22,
      fill: { color: roleColor }, line: { color: roleColor, width: 0 },
    });
    slide.addText(String(item), {
      x: SLIDE.MARGIN_X + 0.36, y,
      w: SLIDE.CONTENT_W - 0.5, h: itemH,
      fontSize: FONT.BODY, color: TEXT_B, fontFace: 'Helvetica', valign: 'middle',
    });
    y += itemH;
  }
}

/** Table section: role-colored header row + alternating rows */
function renderTableSlide(
  pptx: PptxGenJS, section: NormalizedSection,
  numStr: string, roleColor: string
) {
  const slide = pptx.addSlide({ masterName: 'SECTION_MASTER' });
  addSlideHeader(slide, numStr, section.title || '', roleColor);

  if (!Array.isArray(section.data) || section.data.length === 0) return;
  // Filter out rows where every value is empty/null — artifacts of AI not filling data
  const rows = (section.data as Record<string, any>[]).filter(row =>
    Object.values(row).some(v => v !== null && v !== undefined && String(v).trim() !== '')
  );
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const displayRows = rows.slice(0, 12);
  const rowH = Math.min(0.42, (SLIDE.CONTENT_H - 0.1) / (displayRows.length + 1));

  const tableData: any[][] = [
    headers.map(h => ({
      text: h,
      options: {
        bold: true, color: 'FFFFFF', fontSize: FONT.CAPTION,
        fill: { color: roleColor }, align: 'center' as const,
      },
    })),
    ...displayRows.map((row, rIdx) =>
      headers.map(h => ({
        text: String(row[h] ?? '').substring(0, 40),
        options: {
          fontSize: FONT.CAPTION, color: TEXT_B,
          fill: { color: rIdx % 2 === 0 ? 'FFFFFF' : 'F8FAFC' },
          align: 'left' as const,
        },
      }))
    ),
  ];

  slide.addTable(tableData, {
    x: SLIDE.MARGIN_X, y: SLIDE.CONTENT_Y,
    w: SLIDE.CONTENT_W, rowH,
    border: { color: BORDER, pt: 0.5 },
  });
}

/** KPI grid: premium cards in 2–3 column layout */
function renderKPISlide(
  pptx: PptxGenJS, section: NormalizedSection,
  numStr: string, roleColor: string
) {
  const slide = pptx.addSlide({ masterName: 'SECTION_MASTER' });
  addSlideHeader(slide, numStr, section.title || '', roleColor);

  if (typeof section.data !== 'object' || !section.data) return;

  const entries = Object.entries(section.data as Record<string, any>).slice(0, 6);
  const cols = Math.min(entries.length, 3);
  const rows = Math.ceil(entries.length / cols);
  const gapX = 0.2;
  const gapY = 0.2;
  const cardW = (SLIDE.CONTENT_W - gapX * (cols - 1)) / cols;
  const cardH = rows === 1 ? 1.9 : (SLIDE.CONTENT_H - gapY * (rows - 1)) / rows;

  entries.forEach(([label, value], i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = SLIDE.MARGIN_X + col * (cardW + gapX);
    const y = SLIDE.CONTENT_Y + row * (cardH + gapY);

    addPremiumCard(slide, {
      x, y, w: cardW, h: cardH,
      accentColor: roleColor, accentSide: 'top', bgColor: 'FFFFFF',
    });

    // Label
    slide.addText(String(label), {
      x: x + 0.1, y: y + 0.2, w: cardW - 0.2, h: 0.4,
      fontSize: FONT.CAPTION, color: TEXT_M, fontFace: 'Helvetica', align: 'center',
    });

    // Value (large, role color)
    slide.addText(String(value), {
      x: x + 0.1, y: y + 0.55, w: cardW - 0.2, h: cardH - 0.75,
      fontSize: FONT.CARD_VALUE, bold: true, color: roleColor,
      fontFace: 'Helvetica', align: 'center', valign: 'middle',
    });
  });
}
