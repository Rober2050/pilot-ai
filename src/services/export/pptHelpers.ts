import PptxGenJS from 'pptxgenjs';
import { ROLE_EXPORT_PROFILES } from '../../constants/roleExportConfig';

/**
 * PPT Helpers — Premium White + Role Color Design System
 * C-Level execution quality for executive audiences
 * White slides with role color as dominant accent identity
 */

// ===== LIGHT DESIGN SYSTEM (slides de contenido) =====
export const SLIDE_BG   = 'FFFFFF';   // Blanco puro para slides
export const CARD_BG    = 'FFFFFF';   // Card blanca
export const CARD_PALE  = 'F9F6EE';   // Crema muy suave (alternancia)
export const CARD_SHD   = 'D1D5DB';   // Sombra simulada (gray-300)
export const BORDER     = 'E5E7EB';   // Borde sutil (gray-200)
export const TEXT_H     = '0F172A';   // Títulos (slate-900)
export const TEXT_B     = '334155';   // Cuerpo (slate-700)
export const TEXT_M     = '6B7280';   // Muted (gray-500)
export const TEXT_L     = '9CA3AF';   // Light (gray-400)

// ===== DARK DESIGN SYSTEM (Cover / High Impact Slides) =====
// THE USER EXPLICITLY REJECTED BLACK BACKGROUNDS.
// "Dark Mode" tokens now map to a highly elegant, polished "Pearl Light" theme with deep slate text.
export const SLIDE_DARK_BG = 'FFFFFF';
export const SLIDE_DARK_ACCENT = 'F8FAFC'; // Soft pearl for contrast
export const TEXT_DARK_H = '0F172A';    // Slate 900
export const TEXT_DARK_B = '475569';    // Slate 600
export const COVER_BG_DEFAULT = 'FCFDFE'; // Extremely soft arctic white

// ===== ROLE COLOR PALETTE =====
// Re-exported from roleExportConfig.ts — single source of truth.
// DO NOT redefine these values here or in docxGenerator/pdfGenerator.
export const ROLE_COLORS: Record<string, string> =
  Object.fromEntries(Object.entries(ROLE_EXPORT_PROFILES).map(([k, v]) => [k, v.color]));

export const ROLE_COVER_BG: Record<string, string> =
  Object.fromEntries(Object.entries(ROLE_EXPORT_PROFILES).map(([k, v]) => [k, v.coverBg]));

export const ROLE_COLORS_LIGHT: Record<string, string> =
  Object.fromEntries(Object.entries(ROLE_EXPORT_PROFILES).map(([k, v]) => [k, v.colorLight]));

export const ROLE_COLORS_PALE: Record<string, string> =
  Object.fromEntries(Object.entries(ROLE_EXPORT_PROFILES).map(([k, v]) => [k, v.colorPale]));

export const VERDICT_COLORS: Record<string, string> = {
  'PROCEED': '059669',   // emerald
  'PIVOT':   'F59E0B',   // amber
  'HALT':    'DC2626',   // red
};

export const SWOT_COLORS = {
  S: '059669',   // emerald — Strengths / Fortalezas
  W: 'DC2626',   // red     — Weaknesses / Debilidades
  O: '2563EB',   // blue    — Opportunities / Oportunidades
  T: 'D97706',   // amber   — Threats / Amenazas (= rol strategy analyst)
};

// IDEO: colores fijos por dimensión (no cambian por rol)
export const IDEO_COLORS: Record<string, { fill: string; light: string }> = {
  desirability: { fill: '4F46E5', light: '818CF8' },  // indigo
  feasibility:  { fill: '7C3AED', light: 'A78BFA' },  // purple
  viability:    { fill: '059669', light: '34D399' },   // emerald
};

// ===== TRANSLATIONS =====
const LABELS_ES: Record<string, string> = {
  'Strategy Analyst':  'Analista de Estrategia',
  'Business Strategy Executive Audit': 'Auditoría Ejecutiva de Estrategia Empresarial',
  'Executive Dashboard': 'Panel Ejecutivo',
  'Market Opportunity':  'Oportunidad de Mercado',
  'Market Intelligence': 'Inteligencia de Mercado',
  'Market Trends':       'Tendencias de Mercado',
  'SWOT Analysis':       'Análisis FODA',
  'IDEO Validation':     'Validación IDEO',
  'Unit Economics':      'Economía Unitaria',
  'TOWS Strategies':     'Estrategias TOWS',
  'Strategic Actions':   'Acciones Estratégicas',
  'Key Strategic Actions':'Acciones Estratégicas Clave',
  'STRENGTHS':     'FORTALEZAS',
  'WEAKNESSES':    'DEBILIDADES',
  'OPPORTUNITIES': 'OPORTUNIDADES',
  'THREATS':       'AMENAZAS',
  'Strengths (Internal)':   'Fortalezas (Internas)',
  'Weaknesses (Internal)':  'Debilidades (Internas)',
  'Opportunities (External)':'Oportunidades (Externas)',
  'Threats (External)':     'Amenazas (Externas)',
  'Desirability': 'Deseabilidad',
  'Feasibility':  'Factibilidad',
  'Viability':    'Viabilidad',
  'LTV': 'LTV',
  'CAC': 'CAC',
  'LTV:CAC Ratio':      'Ratio LTV:CAC',
  'Breakeven':          'Punto de Equilibrio',
  'PROJECTED BREAKEVEN':'PUNTO DE EQUILIBRIO PROYECTADO',
  'MONTHS': 'MESES',
  'Healthy Unit Economics': 'Economía Unitaria Saludable',
  'Monitor Required':  'Requiere Monitoreo',
  'Action Needed':     'Acción Requerida',
  'PROCEED': 'PROCEDER',
  'PIVOT':   'PIVOTAR',
  'HALT':    'DETENER',
  'Generated on': 'Generado el',
  'Confidential': 'Confidencial',
  'C-Level Board': 'Junta Directiva',
  'ESTIMATED CAC': 'CAC ESTIMADO',
  'ESTIMATED LTV': 'LTV ESTIMADO',
  'Final Verdict': 'Veredicto Final',
  'Overall Score': 'Puntuación General',
  'Annual Market Growth': 'Crecimiento Anual del Mercado',
  'Executive Summary': 'Resumen Ejecutivo',
  'Key Market Insight': 'Perspectiva Clave del Mercado',
  'Sources': 'Fuentes',
};

export function t(label: string, lang: 'es' | 'en'): string {
  return lang === 'es' ? (LABELS_ES[label] ?? label) : label;
}

/**
 * Normalizes AI verdict string to standard PROCEED/PIVOT/HALT
 * Handles: "STRONG VIABILITY", "STRONG_VIABILITY", "PROCEED WITH CAUTION", etc.
 */
export function normalizeVerdict(v: string): 'PROCEED' | 'PIVOT' | 'HALT' {
  const u = (v || '').toUpperCase();
  if (u.includes('HALT') || u.includes('STOP') || u.includes('AVOID') || u.includes('NO-GO')) return 'HALT';
  if (u.includes('PIVOT') || u.includes('RECONSIDER') || u.includes('REVISE') || u.includes('CAUTION')) return 'PIVOT';
  return 'PROCEED'; // PROCEED, STRONG VIABILITY, STRONG_VIABILITY, etc.
}

// ===== SLIDE HEADER =====

/**
 * Adds the standard slide header with number + title + amber divider line
 */
export function addSlideHeader(
  slide: any,
  num: string,
  title: string,
  roleColor: string
) {
  // Number (amber/roleColor)
  slide.addText(num, {
    x: 0.35, y: 0.22, w: 0.75, h: 0.52,
    fontSize: 24, bold: true, color: roleColor, fontFace: 'Helvetica',
  });
  // Title (dark)
  slide.addText(title, {
    x: 1.1, y: 0.22, w: 8.55, h: 0.52,
    fontSize: 24, bold: true, color: TEXT_H, fontFace: 'Helvetica',
  });
  // Divider line in role color
  slide.addShape('rect', {
    x: 0.35, y: 0.82, w: 9.3, h: 0.10,
    fill: { color: roleColor }, line: { color: roleColor, width: 0 },
  });
}

// ===== PREMIUM CARD (white + shadow simulation) =====

interface PremiumCardOpts {
  x: number; y: number; w: number; h: number;
  accentColor?: string;
  accentSide?: 'top' | 'left' | 'none';
  bgColor?: string;
}

/**
 * White card with simulated drop shadow and optional role-color accent
/**
 * Highly elegant card with real CSS-like drop shadows and smooth corners.
 */
export function addPremiumCard(slide: any, opts: PremiumCardOpts) {
  const bg = opts.bgColor ?? CARD_BG;

  // Real Drop Shadow + Smooth Corners (Apple/Stripe aesthetic)
  slide.addShape('roundRect', {
    x: opts.x, y: opts.y, w: opts.w, h: opts.h,
    fill: { color: bg },
    line: { color: 'E2E8F0', width: 0.5 }, // Thin, soft slate 200 border
    rectRadius: 0.15, // Elegant deep curves
    shadow: { type: 'outer', color: '0F172A', opacity: 0.25, blur: 35, offset: 8, angle: 90 }
  });

  // Sophisticated Accent - thin geometric markers
  if (opts.accentColor && opts.accentSide !== 'none') {
    if (opts.accentSide === 'left') {
      slide.addShape('roundRect', {
        x: opts.x + 0.1, y: opts.y + 0.2, w: 0.05, h: opts.h - 0.4,
        fill: { color: opts.accentColor }, line: { color: opts.accentColor, width: 0 }, rectRadius: 0.02,
      });
    } else {
      // top (default) - elegant thin bar
      slide.addShape('roundRect', {
        x: opts.x + 0.3, y: opts.y + 0.1, w: opts.w - 0.6, h: 0.05,
        fill: { color: opts.accentColor }, line: { color: opts.accentColor, width: 0 }, rectRadius: 0.02,
      });
    }
  }
}

// ===== IDEO BAR (clean, no overlap) =====

export function addIdeoBar(
  slide: any,
  opts: {
    x: number; y: number; w: number; h: number;
    label: string; score: number;
    fillColor: string; lightColor: string;
    reason?: string;
    lang: 'es' | 'en';
  }
) {
  const score = Math.min(100, Math.max(0, opts.score));
  const LABEL_W = 2.0;
  const PCT_W   = 0.85;
  const barX    = opts.x + LABEL_W + 0.1;
  const barW    = opts.w - LABEL_W - 0.1 - PCT_W - 0.1;
  const fillW   = Math.max(0.12, barW * (score / 100));
  const barH    = 0.42;
  const barY    = opts.y + (opts.h * 0.35);

  // Card background
  addPremiumCard(slide, {
    x: opts.x, y: opts.y, w: opts.w, h: opts.h,
    accentColor: opts.fillColor, accentSide: 'left',
  });

  // Label (left, uppercase muted)
  slide.addText(opts.label.toUpperCase(), {
    x: opts.x + 0.2, y: opts.y, w: LABEL_W - 0.1, h: opts.h,
    fontSize: 12, bold: false, color: TEXT_M,
    align: 'right', valign: 'middle', fontFace: 'Helvetica', charSpacing: 0.5,
  });

  // Track background
  slide.addShape('roundRect', {
    x: barX, y: barY, w: barW, h: barH,
    fill: { color: 'F3F4F6' }, line: { color: BORDER, width: 0.3 }, rectRadius: 0.07,
  });

  // Fill (solid, NO overlap)
  if (fillW > 0.12) {
    slide.addShape('roundRect', {
      x: barX, y: barY, w: fillW, h: barH,
      fill: { color: opts.fillColor }, line: { color: opts.fillColor, width: 0 }, rectRadius: 0.07,
    });
  }

  // Bright end-cap (AFTER the fill, small highlight at right edge of fill)
  if (fillW > 0.3) {
    slide.addShape('roundRect', {
      x: barX + fillW - 0.14, y: barY + 0.07, w: 0.2, h: barH - 0.14,
      fill: { color: opts.lightColor }, line: { color: opts.lightColor, width: 0 }, rectRadius: 0.05,
    });
  }

  // Score percentage (right, bold, color of fill)
  slide.addText(`${Math.round(score)}%`, {
    x: barX + barW + 0.1, y: opts.y, w: PCT_W, h: opts.h,
    fontSize: 28, bold: true, color: opts.fillColor,
    align: 'center', valign: 'middle', fontFace: 'Helvetica',
  });

  // Reason (small, below bar)
  if (opts.reason) {
    slide.addText(opts.reason.substring(0, 95), {
      x: barX, y: barY + barH + 0.06, w: barW, h: 0.38,
      fontSize: 9, color: TEXT_L, valign: 'top',
    });
  }
}

// ===== SWOT MATRIX (white cards 2x2) =====

export function addSwotMatrix(
  slide: any,
  swot: { strengths: string[]; weaknesses: string[]; opportunities: string[]; threats: string[] },
  lang: 'es' | 'en',
  roleColor: string,
  isDark: boolean = false
) {
  const W = 4.55, H = 2.05; // Reduced height to fit perfectly inside 5.625"
  const bgColor = isDark ? SLIDE_DARK_ACCENT : CARD_BG;
  const textColor = isDark ? TEXT_DARK_H : TEXT_H;
  const bodyColor = isDark ? TEXT_DARK_B : TEXT_B;

  const quadrants = [
    { x: 0.35, y: 0.95, title: t('Strengths (Internal)', lang),   items: swot.strengths,    color: SWOT_COLORS.S },
    { x: 5.05, y: 0.95, title: t('Weaknesses (Internal)', lang),  items: swot.weaknesses,   color: SWOT_COLORS.W },
    { x: 0.35, y: 3.15, title: t('Opportunities (External)', lang),items: swot.opportunities,color: SWOT_COLORS.O },
    { x: 5.05, y: 3.15, title: t('Threats (External)', lang),     items: swot.threats,      color: roleColor },
  ];

  for (const q of quadrants) {
    addPremiumCard(slide, { x: q.x, y: q.y, w: W, h: H, accentColor: q.color, accentSide: 'top', bgColor: bgColor });

    // Decorative quadrant diamond
    slide.addShape('diamond', { x: q.x + 0.15, y: q.y + 0.12, w: 0.18, h: 0.18, fill: { color: q.color }, line: { width: 0 } });

    // Header text
    slide.addText(q.title, {
      x: q.x + 0.4, y: q.y + 0.12, w: W - 0.6, h: 0.35,
      fontSize: 12, bold: true, color: q.color, fontFace: 'Helvetica',
    });

    // Bullets
    const rows = q.items.slice(0, 3).map((item) => ({
      text: `• ${String(item).substring(0, 75)}`,
      options: { fontSize: 9, color: bodyColor, lineSpacing: 12 },
    }));
    slide.addText(rows, {
      x: q.x + 0.2, y: q.y + 0.48, w: W - 0.35, h: H - 0.6, valign: 'top',
    });
  }
}

// ===== TOWS MATRIX (white cards 2x2) =====

export function addTowsMatrix(
  slide: any,
  tows: { so: string[]; wo: string[]; st: string[]; wt: string[] },
  lang: 'es' | 'en',
  roleColor: string,
  isDark: boolean = false
) {
  const W = 4.55, H = 2.05; // Matches SWOT height for 16:9
  const bgColor = isDark ? SLIDE_DARK_ACCENT : CARD_BG;
  const bodyColor = isDark ? TEXT_DARK_B : TEXT_B;

  const quadrants = [
    { x: 0.35, y: 0.95, key: 'SO', items: tows.so, color: SWOT_COLORS.S },
    { x: 5.05, y: 0.95, key: 'WO', items: tows.wo, color: SWOT_COLORS.O },
    { x: 0.35, y: 3.15, key: 'ST', items: tows.st, color: SWOT_COLORS.S },
    { x: 5.05, y: 3.15, key: 'WT', items: tows.wt, color: SWOT_COLORS.W },
  ];

  for (const q of quadrants) {
    addPremiumCard(slide, { x: q.x, y: q.y, w: W, h: H, accentColor: q.color, accentSide: 'top', bgColor: bgColor });

    // Badge pill
    slide.addShape('roundRect', {
      x: q.x + 0.18, y: q.y + 0.12, w: 0.5, h: 0.28,
      fill: { color: q.color }, line: { color: q.color, width: 0 }, rectRadius: 0.05,
    });
    slide.addText(q.key, {
      x: q.x + 0.18, y: q.y + 0.12, w: 0.5, h: 0.28,
      fontSize: 10, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle',
    });

    // Items
    const rows = (q.items || []).slice(0, 3).map((item) => ({
      text: `• ${String(item).substring(0, 82)}`,
      options: { fontSize: 9, color: bodyColor, lineSpacing: 12 },
    }));
    slide.addText(rows, {
      x: q.x + 0.18, y: q.y + 0.45, w: W - 0.35, h: H - 0.6, valign: 'top',
    });
  }
}

// ===== MARKET BAR CHART =====

export function addMarketChart(
  pptx: PptxGenJS,
  slide: any,
  data: { label: string; value: number }[],
  lang: 'es' | 'en',
  roleColor: string,
  roleId?: string,
  isDark: boolean = false
) {
  const roleLight = roleId ? (ROLE_COLORS_LIGHT[roleId] ?? 'FCD34D') : 'FCD34D';
  const chartTitle = t('Market Opportunity', lang);
  const bgColor = isDark ? SLIDE_DARK_ACCENT : CARD_BG;
  const textColor = isDark ? TEXT_DARK_H : TEXT_H;
  const mutedColor = isDark ? TEXT_DARK_B : TEXT_M;
  const gridColor = isDark ? '334155' : BORDER;

  // Card background (shadow + white card)
  addPremiumCard(slide, {
    x: 0.35, y: 0.95, w: 9.3, h: 3.2, // Reduced height to 3.2 to allow bottom insights
    accentColor: roleColor, accentSide: 'top',
    bgColor: bgColor
  });

  // Format values for readability (avoid 9E+10)
  const formattedData = data.map((d) => ({
    ...d,
    displayValue: d.value >= 1e9 ? d.value / 1e9 : d.value >= 1e6 ? d.value / 1e6 : d.value,
  }));
  const suffix = data[0]?.value >= 1e9 ? 'B' : data[0]?.value >= 1e6 ? 'M' : '';
  const labelsWithSuffix = formattedData.map((d) => `${d.label}\n${suffix ? `($${d.displayValue.toFixed(1)}${suffix})` : ''}`);

  slide.addChart(
    pptx.ChartType.bar,
    [
      {
        name: chartTitle,
        labels: labelsWithSuffix,
        values: formattedData.map((d) => d.displayValue),
      },
    ],
    {
      x: 0.45, y: 1.05, w: 9.1, h: 2.9, // Reduced height to fit inside 3.2 card
      showTitle: false,
      barDir: 'col',
      barGrouping: 'clustered',
      chartColors: ['0F172A', '475569', '94A3B8'], // Premium Slate Palette (No Yellow!)
      dataBorder: { pt: 0.5, color: isDark ? SLIDE_DARK_BG : 'FFFFFF' },
      showLegend: false,
      showValue: true,
      dataLabelFontSize: 9,
      dataLabelColor: textColor,
      valGridLine: { color: gridColor, style: 'dash', size: 0.5 },
      catAxisLabelColor: mutedColor,
      valAxisLabelColor: mutedColor,
      catAxisLineShow: false,
      valAxisLineShow: false,
      plotArea: { fill: { color: bgColor } },
      chartArea: { fill: { color: bgColor } },
      valAxisNumFmt: `0"${suffix}"`,
    }
  );
}

// ===== GEOMETRIC ACCENT (decorative background shape) =====

/**
 * Adds a semi-transparent geometric diamond shape as a decorative accent.
 * Used to give slides a "geometric luxury brand" feel.
 */
export function addGeometricAccent(
  slide: any,
  opts: { x: number; y: number; w: number; h: number; color: string; opacity?: string }
) {
  const alpha = opts.opacity ?? '0D'; // ~5% opacity by default
  slide.addShape('diamond', {
    x: opts.x, y: opts.y, w: opts.w, h: opts.h,
    fill: { color: opts.color },
    line: { color: opts.color, width: 0.4 },
  });
}

// ===== COVER SLIDE =====

export function addCoverSlide(
  pptx: PptxGenJS,
  opts: {
    title: string;
    subtitle: string;
    projectName: string;
    date: string;
    verdict?: { verdict: string; action: string };
    roleColor: string;
    lang: 'es' | 'en';
    roleId?: string;
  }
) {
  const slide = pptx.addSlide();
  const coverBg = 'FFFFFF'; // Pure White for absolute minimalist elegance
  slide.background = { color: coverBg };

  // Elegant very thin left vertical line
  slide.addShape('rect', {
    x: 0, y: 0, w: 0.15, h: 5.625,
    fill: { color: opts.roleColor }, line: { color: opts.roleColor, width: 0 },
  });

  // Top accent bar (elegant very thin line)
  slide.addShape('rect', {
    x: 0, y: 0, w: '100%', h: 0.06,
    fill: { color: opts.roleColor }, line: { color: opts.roleColor, width: 0 },
  });

  // Removed massive geometric watermarks for a cleaner aesthetic

  // CONFIDENTIAL label (Top Left)
  slide.addText(
    `${t('Confidential', opts.lang).toUpperCase()} — ${t('C-Level Board', opts.lang).toUpperCase()}`,
    {
      x: 0.5, y: 0.5, w: 8.5, h: 0.4,
      fontSize: 11, color: '1E3A8A', charSpacing: 3, fontFace: 'Helvetica', bold: true, align: 'left',
    }
  );

  // --- CENTERED SECTION ---
  // Role name (Large, Centered, Amber - Force single line by using full width)
  slide.addText(opts.title.toUpperCase(), {
    x: 0.0, y: 1.6, w: 10.0, h: 1.0,
    fontSize: 44, bold: true, color: opts.roleColor, charSpacing: 2, fontFace: 'Helvetica', align: 'center', valign: 'middle',
  });

  // Subtitle (Below Role, Centered, Premium Navy Blue)
  slide.addText(opts.subtitle, {
    x: 0.0, y: 2.8, w: 10.0, h: 0.5,
    fontSize: 18, color: '1E3A8A', fontFace: 'Helvetica', align: 'center', bold: true,
  });

  // --- BOTTOM CARD SECTION ---
  // Project Name ("Idea") inside an elegant card at the bottom
  const cardW = 9.0;
  const cardH = 0.9;
  const cardX = 0.5;
  const cardY = 3.6;

  addPremiumCard(slide, { 
    x: cardX, y: cardY, w: cardW, h: cardH, 
    accentColor: opts.roleColor, accentSide: 'none', bgColor: 'FEFCE8' // soft yellow tint board
  });

  slide.addText(opts.projectName, {
    x: cardX + 0.5, y: cardY, w: cardW - 1.0, h: cardH,
    fontSize: 20, bold: true, color: '1e293b', fontFace: 'Helvetica', align: 'center', valign: 'middle',
  });

  // Bottom: date + PILOT AI branding (Y target ~5.2 for 5.625 height)
  slide.addText(`${t('Generated on', opts.lang)} ${opts.date}`, {
    x: 1.0, y: 5.15, w: 4, h: 0.35, fontSize: 9, color: '94A3B8', valign: 'bottom'
  });
  slide.addText('PILOT AI', {
    x: 8.0, y: 5.15, w: 1.5, h: 0.35,
    fontSize: 10, bold: true, color: opts.roleColor, align: 'right', charSpacing: 1, valign: 'bottom'
  });
}

// ===== CLOSING SLIDE =====

export function addClosingSlide(
  slide: any,
  opts: {
    roleColor: string;
    roleId?: string;
    projectName: string;
    sources?: Array<{ source: string; tier: number }>;
    lang: 'es' | 'en';
  }
) {
  const coverBg = 'FFFFFF';
  slide.background = { color: coverBg };

  // Elegant very thin left vertical line
  slide.addShape('rect', {
    x: 0, y: 0, w: 0.15, h: 5.625,
    fill: { color: opts.roleColor }, line: { color: opts.roleColor, width: 0 },
  });

  // Top accent bar
  slide.addShape('rect', {
    x: 0, y: 0, w: '100%', h: 0.06,
    fill: { color: opts.roleColor }, line: { color: opts.roleColor, width: 0 },
  });

  // Branding Title - MOVED UP
  slide.addText('PILOT AI', {
    x: 0.8, y: 1.0, w: 8.5, h: 1.0,
    fontSize: 54, bold: true, color: '0F172A',
    fontFace: 'Helvetica',
  });

  // Decorative role pulse - MOVED UP
  slide.addShape('roundRect', {
    x: 0.8, y: 2.1, w: 1.5, h: 0.05,
    fill: { color: opts.roleColor }, line: { color: opts.roleColor, width: 0 }, rectRadius: 0.02
  });

  // Subtitle - MOVED UP
  slide.addText(opts.lang === 'es' ? 'FIN DEL REPORTE EJECUTIVO' : 'END OF EXECUTIVE SUMMARY', {
    x: 0.8, y: 2.4, w: 8.5, h: 0.5,
    fontSize: 14, color: opts.roleColor, bold: true, charSpacing: 3, fontFace: 'Helvetica',
  });

  // Sources - MOVED UP to y: 3.5 to leave space at bottom
  if (opts.sources && opts.sources.length > 0) {
    slide.addText(opts.lang === 'es' ? 'FUENTES DE INTELIGENCIA' : 'INTELLIGENCE SOURCES', {
      x: 0.8, y: 3.5, w: 9, h: 0.3,
      fontSize: 10, color: '94A3B8', bold: true, charSpacing: 2
    });
    
    const validSources = opts.sources.filter(s => s && s.source && s.source !== 'undefined').slice(0, 3);
    if (validSources.length > 0) {
      const bullets = validSources.map((s) => ({
        text: `• ${s.source}`,
        options: { fontSize: 10, color: '64748B', lineSpacing: 12 },
      }));
      slide.addText(bullets, {
        x: 0.8, y: 3.8, w: 9, h: 1.0, valign: 'top',
      });
    }
  }

  // Footer - ADJUSTED to y: 5.25 for 16:9 compliance
  slide.addText('PILOT AI Enterprise System', {
    x: 0.5, y: 5.25, w: 9, h: 0.3,
    fontSize: 10, color: '64748B', align: 'right',
  });
}

// ===== NUMERIC EXTRACTOR (C-Level Spec Regex Scrubber) =====

/**
 * Safely extracts a numeric value from any input.
 * Prevents text fields like "Verdict: High Risk" from corrupting chart data.
 * Per C-Level PPT Spec: /^[\$\s]*[\d.,]+[\s%KMB]*$/i
 */
export function extractNumeric(val: any): number {
  if (typeof val === 'number' && !isNaN(val)) return val;
  const s = String(val ?? '').trim();
  if (!s || !/\d/.test(s)) return 0;
  const numMatch = s.match(/[\d.,]+/);
  if (!numMatch) return 0;
  const num = parseFloat(numMatch[0].replace(/,/g, ''));
  if (isNaN(num)) return 0;
  const upper = s.toUpperCase();
  if (upper.includes('B') && !upper.includes('BRE')) return num * 1e9;
  if (upper.includes('M') && !upper.includes('MO'))  return num * 1e6;
  if (upper.endsWith('K')) return num * 1e3;
  return num;
}

// ===== CLEAN SLIDE HEADER (C-Level Spec — Left Accent Bar Style) =====

/**
 * Premium slide header matching the C-Level executive spec:
 * - Role-color vertical bar on the LEFT edge — primary role identity signal
 * - Large bold dark title (34pt) with dynamic sizing for overflow
 * - Short role-color underline accent below title
 */
export function addSlideHeaderClean(
  slide: any,
  title: string,
  roleColor: string,
  footerText?: string
) {
  // Left vertical bar — exactly 5.625" for 16x9 aspect ratio
  slide.addShape('rect', {
    x: 0, y: 0, w: 0.18, h: 5.625,
    fill: { color: roleColor }, line: { color: roleColor, width: 0 },
  });

  // Dynamic Title Sizing Logic
  const isTooLong = title.length > 35;
  const fSize = isTooLong ? 26 : 34; // Reduce if potentially wrapping
  const lineY = isTooLong ? 1.05 : 0.84; // Push line down if title is large

  // Large bold title (Premium Navy Blue, left-aligned)
  slide.addText(title, {
    x: 0.55, y: 0.05, w: 9.05, h: isTooLong ? 0.95 : 0.72,
    fontSize: fSize, bold: true, color: '1E3A8A', fontFace: 'Helvetica', valign: 'middle',
  });

  // Short underline accent in role color
  slide.addShape('rect', {
    x: 0.55, y: lineY, w: 1.8, h: 0.055,
    fill: { color: roleColor }, line: { color: roleColor, width: 0 },
  });

  // Optional footer
  if (footerText) {
    slide.addText(footerText, {
      x: 0.55, y: 5.3, w: 9.05, h: 0.25,
      fontSize: 9, color: TEXT_L, fontFace: 'Helvetica',
    });
  }
}
