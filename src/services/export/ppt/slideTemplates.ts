import PptxGenJS from 'pptxgenjs';
import {
  addCoverSlide,
  addClosingSlide,
  addSlideHeader,
  addPremiumCard,
  TEXT_H, TEXT_B, TEXT_M, BORDER,
  t,
} from '../pptHelpers';
import { getRoleExportProfile } from '../../../constants/roleExportConfig';

/**
 * slideTemplates.ts — Composable Slide Template Library
 *
 * These templates are for NEW role generators.
 * Existing premium generators (strategyAnalystPPT, productManagerPPT) use pptHelpers directly.
 *
 * Design contract:
 * - All layout math is derived from SLIDE constants — no magic numbers.
 * - Each template receives SlideTemplateContext for role identity.
 * - Templates internally call pptHelpers functions for consistency with existing slides.
 */

// ── Layout Constants (16x9 canonical) ─────────────────────────────────────────
export const SLIDE = {
  W:         10.0,    // total width in inches
  H:         5.625,   // total height in inches (16:9)
  MARGIN_X:  0.35,    // horizontal margin
  CONTENT_Y: 0.95,    // content starts after header
  FOOTER_Y:  5.35,    // footer zone starts here
  CONTENT_W: 9.30,    // = W - MARGIN_X * 2
  CONTENT_H: 4.40,    // = FOOTER_Y - CONTENT_Y
} as const;

// ── Typography Scale ───────────────────────────────────────────────────────────
export const FONT = {
  COVER_TITLE:    44,
  SECTION_TITLE:  24,
  CARD_HEADING:   14,
  CARD_VALUE:     22,
  BODY:           11,
  CAPTION:        10,
  MICRO:           9,
} as const;

// ── Context ────────────────────────────────────────────────────────────────────

/**
 * Typed context passed to every template function.
 * Built once in the role generator and shared across all slides.
 */
export interface SlideTemplateContext {
  pptx: PptxGenJS;
  roleId: string;
  roleName: string;
  roleColor: string;      // primary accent (PPT)
  colorLight: string;     // lighter variant for chart fills
  colorPale: string;      // pale tint for card backgrounds
  lang: 'es' | 'en';
  projectName: string;
}

/**
 * Builds a SlideTemplateContext from roleId and project metadata.
 * Call this once at the top of your role generator.
 */
export function buildContext(
  pptx: PptxGenJS,
  roleId: string,
  roleName: string,
  lang: 'es' | 'en',
  projectName: string
): SlideTemplateContext {
  const profile = getRoleExportProfile(roleId);
  return {
    pptx,
    roleId,
    roleName,
    roleColor:  profile.color,
    colorLight: profile.colorLight,
    colorPale:  profile.colorPale,
    lang,
    projectName,
  };
}

// ── Templates ──────────────────────────────────────────────────────────────────

/**
 * Template: Cover slide
 * - Role identity color dominant
 * - Project name in card
 * - Date + PILOT AI branding
 */
export function renderCoverTemplate(
  ctx: SlideTemplateContext,
  opts: { subtitle: string; date: string }
): void {
  addCoverSlide(ctx.pptx, {
    title:       ctx.roleName,
    subtitle:    opts.subtitle,
    projectName: ctx.projectName,
    date:        opts.date,
    roleColor:   ctx.roleColor,
    lang:        ctx.lang,
    roleId:      ctx.roleId,
  });
}

/**
 * Template: KPI Metric Grid (up to 6 metrics in 2×3 layout)
 * - Each metric: label + value + optional unit
 * - Role color for values, pale background for cards
 */
export interface KPIMetric {
  label: string;
  value: string | number;
  unit?: string;
}

export function renderKPIGridTemplate(
  ctx: SlideTemplateContext,
  opts: { title: string; sectionNum: string; metrics: KPIMetric[] }
): void {
  const slide = ctx.pptx.addSlide({ masterName: 'SECTION_MASTER' });
  addSlideHeader(slide, opts.sectionNum, opts.title, ctx.roleColor);

  const items = opts.metrics.slice(0, 6);
  const cols   = Math.min(items.length, 3);
  const rows   = Math.ceil(items.length / cols);
  const cardW  = (SLIDE.CONTENT_W - 0.2 * (cols - 1)) / cols;
  const cardH  = rows === 1 ? 1.8 : (SLIDE.CONTENT_H - 0.2) / rows;
  const startX = SLIDE.MARGIN_X;
  const startY = SLIDE.CONTENT_Y;

  items.forEach((metric, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x   = startX + col * (cardW + 0.2);
    const y   = startY + row * (cardH + 0.2);

    addPremiumCard(slide, {
      x, y, w: cardW, h: cardH,
      accentColor: ctx.roleColor,
      accentSide: 'top',
      bgColor: 'FFFFFF',
    });

    // Label
    slide.addText(metric.label, {
      x: x + 0.2, y: y + 0.15, w: cardW - 0.4, h: 0.4,
      fontSize: FONT.CAPTION, color: TEXT_M, fontFace: 'Helvetica', align: 'center',
    });

    // Value (large, role color)
    const displayValue = metric.unit
      ? `${metric.value} ${metric.unit}`
      : String(metric.value);
    slide.addText(displayValue, {
      x: x + 0.1, y: y + 0.5, w: cardW - 0.2, h: cardH - 0.7,
      fontSize: FONT.CARD_VALUE, bold: true, color: ctx.roleColor,
      fontFace: 'Helvetica', align: 'center', valign: 'middle',
    });
  });
}

/**
 * Template: Two-column bullet list
 * - Left column: primary items
 * - Right column: secondary items (or empty for single-column mode)
 */
export function renderTwoColumnListTemplate(
  ctx: SlideTemplateContext,
  opts: { title: string; sectionNum: string; leftItems: string[]; rightItems?: string[]; leftTitle?: string; rightTitle?: string }
): void {
  const slide = ctx.pptx.addSlide({ masterName: 'SECTION_MASTER' });
  addSlideHeader(slide, opts.sectionNum, opts.title, ctx.roleColor);

  const hasRight = opts.rightItems && opts.rightItems.length > 0;
  const colW     = hasRight ? (SLIDE.CONTENT_W - 0.3) / 2 : SLIDE.CONTENT_W;

  const renderColumn = (items: string[], x: number, w: number, colTitle?: string) => {
    let y = SLIDE.CONTENT_Y + 0.1;

    if (colTitle) {
      slide.addText(colTitle, {
        x, y, w, h: 0.35,
        fontSize: FONT.CARD_HEADING, bold: true, color: ctx.roleColor, fontFace: 'Helvetica',
      });
      y += 0.4;
    }

    items.slice(0, 8).forEach((item) => {
      // Bullet accent bar
      slide.addShape('rect', {
        x, y: y + 0.07, w: 0.06, h: 0.22,
        fill: { color: ctx.roleColor }, line: { color: ctx.roleColor, width: 0 },
      });
      slide.addText(item, {
        x: x + 0.14, y, w: w - 0.2, h: 0.38,
        fontSize: FONT.BODY, color: TEXT_B, fontFace: 'Helvetica', valign: 'middle',
      });
      y += 0.42;
    });
  };

  renderColumn(opts.leftItems, SLIDE.MARGIN_X, colW, opts.leftTitle);

  if (hasRight && opts.rightItems) {
    const rightX = SLIDE.MARGIN_X + colW + 0.3;
    // Vertical divider
    slide.addShape('rect', {
      x: SLIDE.MARGIN_X + colW + 0.12, y: SLIDE.CONTENT_Y,
      w: 0.015, h: SLIDE.CONTENT_H - 0.2,
      fill: { color: BORDER }, line: { color: BORDER, width: 0 },
    });
    renderColumn(opts.rightItems, rightX, colW, opts.rightTitle);
  }
}

/**
 * Template: Full-slide data table
 * - Styled header row in role color
 * - Alternating row backgrounds
 * - Auto-truncates to fit slide
 */
export function renderTableTemplate(
  ctx: SlideTemplateContext,
  opts: { title: string; sectionNum: string; headers: string[]; rows: Record<string, any>[]; maxRows?: number }
): void {
  const slide = ctx.pptx.addSlide({ masterName: 'SECTION_MASTER' });
  addSlideHeader(slide, opts.sectionNum, opts.title, ctx.roleColor);

  const maxRows  = opts.maxRows ?? 10;
  const rows     = opts.rows.slice(0, maxRows);
  const colCount = opts.headers.length;
  const colW     = SLIDE.CONTENT_W / colCount;
  const rowH     = Math.min(0.42, (SLIDE.CONTENT_H - 0.15) / (rows.length + 1));

  const tableData = [
    // Header row
    opts.headers.map(h => ({
      text: h,
      options: {
        bold: true, color: 'FFFFFF', fontSize: FONT.CAPTION,
        fill: { color: ctx.roleColor }, align: 'center' as const,
      },
    })),
    // Data rows
    ...rows.map((row, rIdx) =>
      opts.headers.map(h => ({
        text: String(row[h] ?? ''),
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
    border: { color: 'E2E8F0', pt: 0.5 },
  });
}

/**
 * Template: Text section with optional bullet list
 * - For narrative sections (executive summary, analysis paragraphs)
 */
export function renderTextSectionTemplate(
  ctx: SlideTemplateContext,
  opts: { title: string; sectionNum: string; text: string }
): void {
  const slide = ctx.pptx.addSlide({ masterName: 'SECTION_MASTER' });
  addSlideHeader(slide, opts.sectionNum, opts.title, ctx.roleColor);

  // Content area card
  addPremiumCard(slide, {
    x: SLIDE.MARGIN_X, y: SLIDE.CONTENT_Y,
    w: SLIDE.CONTENT_W, h: SLIDE.CONTENT_H - 0.1,
    accentColor: ctx.roleColor, accentSide: 'left', bgColor: 'FFFFFF',
  });

  slide.addText(opts.text, {
    x: SLIDE.MARGIN_X + 0.25, y: SLIDE.CONTENT_Y + 0.15,
    w: SLIDE.CONTENT_W - 0.35, h: SLIDE.CONTENT_H - 0.4,
    fontSize: FONT.BODY, color: TEXT_B, fontFace: 'Helvetica',
    valign: 'top', wrap: true,
  });
}

/**
 * Template: Closing slide with sources
 * - Delegates to pptHelpers.addClosingSlide for visual consistency
 */
export function renderClosingTemplate(
  ctx: SlideTemplateContext,
  opts: { sources?: Array<{ source: string; tier: number }> }
): void {
  const slide = ctx.pptx.addSlide();
  addClosingSlide(slide, {
    roleColor:   ctx.roleColor,
    roleId:      ctx.roleId,
    projectName: ctx.projectName,
    sources:     opts.sources,
    lang:        ctx.lang,
  });
}

// ── Master Slide Registration ──────────────────────────────────────────────────

/**
 * Registers the shared slide master for all template slides.
 * Call this once before adding any slides with masterName: 'SECTION_MASTER'.
 */
export function registerSectionMaster(pptx: PptxGenJS, roleColor: string, roleName: string): void {
  pptx.defineSlideMaster({
    title: 'SECTION_MASTER',
    background: { color: 'FFFFFF' },
    objects: [
      // Thin top accent bar
      { rect: { x: 0, y: 0, w: '100%', h: 0.08, fill: { color: roleColor } } },
      // Footer: role name
      { text: { text: `${roleName} | PILOT AI`, options: { x: 0.35, y: 5.46, w: 5, h: 0.2, fontSize: FONT.MICRO, color: '9CA3AF' } } },
    ],
  });
}

// ── Branded File Name ───────────────────────────────────────────────────────────

/**
 * Generates a consistent file name for all PPT exports.
 * Format: RoleName_ProjectName_YYYY-MM-DD.pptx
 */
export function buildPPTFileName(roleName: string, projectName: string): string {
  const date     = new Date().toISOString().split('T')[0];
  const safeName = (s: string) => s.replace(/[^a-zA-Z0-9\u00C0-\u024F\s]/g, '').replace(/\s+/g, '_').substring(0, 30);
  return `${safeName(roleName)}_${safeName(projectName)}_${date}.pptx`;
}
