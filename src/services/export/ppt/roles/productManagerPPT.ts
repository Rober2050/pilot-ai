import PptxGenJS from 'pptxgenjs';
import { NormalizedDocument } from '../../contentNormalizer';
import { RoleConfig } from '../../../../types/roles';
import { 
  addSlideHeaderClean, 
  addPremiumCard, 
  ROLE_COLORS, 
  SLIDE_BG, 
  CARD_BG,
  TEXT_H,
  TEXT_B,
  TEXT_M,
  BORDER,
  t
} from '../../pptHelpers';

/**
 * Product Manager PPT Specialist Module
 * High-impact, C-level executive design for Product Managers.
 */
export const productManagerPPT = {
  generate: async (
    normalizedDoc: NormalizedDocument,
    roleConfig: RoleConfig,
    lang: 'es' | 'en' = 'es',
    projectName: string = 'Project'
  ) => {
    const pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_16x9';

    const roleColor = ROLE_COLORS['product-manager'] || 'A855F7';
    const footerBase = `${normalizedDoc.roleName} | ${projectName}`;

    // --- DATA EXTRACTION (Senior Robust Engine) ---
    const sections = normalizedDoc.sections;
    
    // 1. Resolve Summary/Vision (Look for multiple variants)
    const summarySection = sections.find((s: any) => {
      const t = s.title?.toLowerCase() || '';
      return t.includes('resumen') || t.includes('summary') || t.includes('visión') || t.includes('vision') || t.includes('propuesta');
    });
    const summary = (summarySection?.data as string) || '';

    const metricsSection = sections.find((s: any) => s.type === 'kpi_grid');
    const metrics = (metricsSection?.data as Record<string, any>) || {};

    // 2. Resolve Milestones/Phases (Look for multiple variants)
    const phasesSection = sections.find((s: any) => {
      const t = s.title?.toLowerCase() || '';
      return t.includes('fases') || t.includes('phases') || t.includes('hitos') || t.includes('milestones') || t.includes('cronograma') || t.includes('timeline');
    });
    const phases = (phasesSection?.data as any[]) || [];

    const roadmapSection = sections.find((s: any) => {
      const t = s.title?.toLowerCase() || '';
      return t.includes('roadmap') || t.includes('hoja de ruta');
    });
    const roadmap = (roadmapSection?.data as any[]) || [];
    
    // Fallback overall score
    const overallScore = metrics[lang === 'es' ? 'Puntuación General' : 'Overall Score'] || 85;

    // =========================================================
    // SLIDE 1 — COVER
    // =========================================================
    const s1 = pptx.addSlide();
    s1.background = { color: 'FAF5FF' }; 
    s1.addShape('rect' as any, { x: 0, y: 0, w: 0.15, h: '100%', fill: { color: roleColor } });
    s1.addText(normalizedDoc.roleName.toUpperCase(), {
      x: 0.8, y: 2.2, w: 8.0, h: 1.0, fontSize: 48, bold: true, color: '0F172A', charSpacing: 2
    });
    s1.addText(projectName, {
      x: 0.8, y: 3.4, w: 8.0, h: 0.6, fontSize: 24, color: '4B5563'
    });
    s1.addText(`PILOT AI | BOARD REPORT | ${new Date().toLocaleDateString()}`, {
      x: 0.8, y: 5.0, w: 8.0, h: 0.4, fontSize: 10, color: '9CA3AF'
    });

    // =========================================================
    // SLIDE 2 — PRODUCT DASHBOARD (Premium C-Level)
    // =========================================================
    const s2 = pptx.addSlide();
    s2.background = { color: SLIDE_BG };
    addSlideHeaderClean(s2, lang === 'es' ? 'Panel de Control de Producto' : 'Product Control Board', roleColor, footerBase);

    const marginH = 0.425;
    const cardGap = 0.2;
    const contentDown = 0.55; 
    const cardY = 1.1;

    // LEFT: Product Readiness (Donut)
    const card1X = marginH;
    addPremiumCard(s2, { x: card1X, y: cardY, w: 3.2, h: 3.4, accentColor: roleColor, accentSide: 'top', bgColor: CARD_BG });
    
    const donutX = card1X + 0.2;
    const donutY = cardY + 0.2 + contentDown;
    s2.addShape(pptx.ShapeType.donut, {
      x: donutX, y: donutY, w: 1.45, h: 1.45,
      fill: { color: 'FAF5FF' }, line: { color: roleColor, width: 3.5 }
    });
    s2.addText(`${overallScore}`, {
      x: donutX, y: donutY, w: 1.45, h: 1.45,
      fontSize: 36, bold: true, color: TEXT_H, align: 'center', valign: 'middle'
    });
    s2.addText(lang === 'es' ? 'NIVEL DE MADUREZ' : 'PRODUCT READINESS', {
      x: card1X + 1.8, y: donutY + 0.4, w: 1.2, h: 0.4, fontSize: 9, bold: true, color: roleColor, align: 'center'
    });

    const sBarY = cardY + 1.8 + contentDown;
    s2.addShape(pptx.ShapeType.roundRect, {
      x: card1X + 0.2, y: sBarY, w: 2.8, h: 0.12, fill: { color: 'F3E8FF' }, rectRadius: 0.04
    });
    s2.addShape(pptx.ShapeType.roundRect, {
      x: card1X + 0.2, y: sBarY, w: 2.8 * (Number(overallScore)/100), h: 0.12, fill: { color: roleColor }, rectRadius: 0.04
    });
    s2.addText(lang === 'es' ? 'MVP Confidence Status' : 'MVP Confidence Status', {
      x: card1X + 0.2, y: sBarY + 0.2, w: 2.8, h: 0.3, fontSize: 8, color: TEXT_B
    });

    // CENTER: Project Phases
    const card2X = card1X + 3.2 + cardGap;
    addPremiumCard(s2, { x: card2X, y: cardY, w: 3.2, h: 3.4, accentColor: '10B981', accentSide: 'top', bgColor: CARD_BG });
    s2.addText(lang === 'es' ? 'HITOS CLAVE' : 'KEY MILESTONES', { x: card2X + 0.2, y: cardY + 0.3 + contentDown, w: 2.8, h: 0.3, fontSize: 11, bold: true, color: TEXT_H });
    
    if (phases.length > 0) {
      phases.slice(0, 4).forEach((p, i) => {
        const py = cardY + 0.8 + contentDown + (i * 0.55);
        s2.addShape(pptx.ShapeType.ellipse, { x: card2X + 0.2, y: py + 0.05, w: 0.1, h: 0.1, fill: { color: i === 0 ? '10B981' : 'CBD5E1' } });
        s2.addText(p.phase || p.title || p.name || `Phase ${i+1}`, { x: card2X + 0.4, y: py, w: 2.4, h: 0.3, fontSize: 10, color: TEXT_B, bold: i === 0 });
      });
    } else {
      s2.addText(lang === 'es' ? 'Cronograma detallado no disponible.' : 'Detailed timeline not available.', {
        x: card2X + 0.2, y: cardY + 0.8 + contentDown, w: 2.6, h: 2.0, fontSize: 10, color: TEXT_M, italic: true, valign: 'top'
      });
    }

    // RIGHT: Executive Vision
    const card3X = card2X + 3.0 + cardGap;
    addPremiumCard(s2, { x: card3X, y: cardY, w: 2.9, h: 3.4, accentColor: '3B82F6', accentSide: 'top', bgColor: CARD_BG });
    s2.addText(lang === 'es' ? 'VISIÓN DE PRODUCTO' : 'PRODUCT VISION', { x: card3X + 0.2, y: cardY + 0.3 + contentDown, w: 2.5, h: 0.3, fontSize: 11, bold: true, color: TEXT_H });
    
    if (summary) {
      s2.addText(summary.substring(0, 300), {
        x: card3X + 0.2, y: cardY + 0.7 + contentDown, w: 2.5, h: 2.4, fontSize: 10, color: TEXT_B, lineSpacing: 14, valign: 'top'
      });
    } else {
      s2.addText(lang === 'es' ? 'Visión estratégica no definida explícitamente.' : 'Strategic vision not explicitly defined.', {
        x: card3X + 0.2, y: cardY + 0.7 + contentDown, w: 2.5, h: 2.4, fontSize: 10, color: TEXT_M, italic: true, valign: 'top'
      });
    }

    // =========================================================
    // SLIDE 3 — AGILE ROADMAP (Premium Chevrons)
    // =========================================================
    if (roadmap.length > 0) {
      const s3 = pptx.addSlide();
      s3.background = { color: SLIDE_BG };
      addSlideHeaderClean(s3, lang === 'es' ? 'Hoja de Ruta Agile' : 'Agile Roadmap', roleColor, footerBase);

      const items = roadmap.slice(0, 4);
      const stepW = 2.2;
      const stepGap = 0.15;
      const startX = (10 - (items.length * (stepW + stepGap))) / 2;

      items.forEach((item, i) => {
        const curX = startX + (i * (stepW + stepGap));
        const curY = 2.0;

        s3.addShape(pptx.ShapeType.chevron, {
          x: curX, y: curY, w: stepW, h: 1.2,
          fill: { color: i === 0 ? roleColor : 'F3E8FF' },
          line: { color: roleColor, width: 1 },
          shadow: { type: 'outer', color: '0F172A', opacity: 0.1, blur: 10, offset: 4, angle: 90 }
        });

        s3.addText(`${i + 1}`, {
          x: curX, y: curY, w: 0.4, h: 1.2, fontSize: 24, bold: true, color: i === 0 ? 'FFFFFF' : roleColor, align: 'center', valign: 'middle'
        });

        s3.addText(item.name || item.phase || `Sprint ${i+1}`, {
          x: curX + 0.4, y: curY, w: stepW - 0.6, h: 1.2, fontSize: 11, bold: true, color: i === 0 ? 'FFFFFF' : TEXT_H, align: 'center', valign: 'middle'
        });

        addPremiumCard(s3, { x: curX, y: curY + 1.4, w: stepW, h: 1.5, accentColor: 'E2E8F0', accentSide: 'top', bgColor: 'FFFFFF' });
        s3.addText(item.goal || item.description || '', {
          x: curX + 0.15, y: curY + 1.5, w: stepW - 0.3, h: 1.3, fontSize: 9, color: TEXT_B, valign: 'top', align: 'center'
        });
      });
    }

    // =========================================================
    // SLIDE 4 — STRATEGIC PRIORITIZATION (RICE Matrix)
    // =========================================================
    const riceSection = sections.find(s => s.title?.toLowerCase().includes('priorización') || s.title?.toLowerCase().includes('rice'));
    if (riceSection && Array.isArray(riceSection.data)) {
      const s4 = pptx.addSlide();
      s4.background = { color: SLIDE_BG };
      addSlideHeaderClean(s4, lang === 'es' ? 'Priorización Estratégica: Matriz RICE' : 'Strategic Prioritization: RICE Matrix', roleColor, footerBase);
      renderRICEMatrix(s4, riceSection.data, roleColor);
    }

    // =========================================================
    // SLIDE 5 — COMPETITIVE LANDSCAPE OR DISCOVERY QUERIES (Senior Pivot)
    // =========================================================
    const compSection = sections.find(s => 
      s.title?.toLowerCase().includes('competidores') || 
      s.title?.toLowerCase().includes('competitive')
    );

    // CRITICAL CHECK: Do we have ACTUAL analysis for competitors or just names?
    const compData = Array.isArray(compSection?.data) ? (compSection?.data as any[]) : [];
    const hasUsefulCompetitorData = compData.length > 0 && compData.some(c => {
      if (typeof c !== 'object' || c === null) return false;
      const keys = Object.keys(c).map(k => k.toLowerCase());
      return keys.some(k => 
        k.includes('weak') || k.includes('oppo') || k.includes('cons') || k.includes('pros') || 
        k.includes('debil') || k.includes('fuer') || k.includes('analis') ||
        (typeof (c as any)[k] === 'number' && !['id', 'score'].includes(k))
      );
    });

    const s5 = pptx.addSlide();
    s5.background = { color: SLIDE_BG };
    
    if (hasUsefulCompetitorData && compSection) {
      addSlideHeaderClean(s5, lang === 'es' ? 'Panorama Competitivo & Posicionamiento' : 'Competitive Landscape & Positioning', roleColor, footerBase);
      renderCompetitiveLandscape(s5, compData, roleColor);
    } else {
      // PIVOT TO DISCOVERY: Information density check failed, providing strategic questions instead.
      addSlideHeaderClean(s5, lang === 'es' ? 'Validación de Mercado & Discovery' : 'Market Discovery & Validation', roleColor, footerBase);
      
      const discoveryQueriesSection = sections.find(s => 
        s.title?.toLowerCase().includes('discovery') || 
        s.title?.toLowerCase().includes('preguntas') ||
        s.title?.toLowerCase().includes('queries')
      );
      
      const jtbdData = sections.find(s => s.title?.toLowerCase().includes('jtbd'))?.data;
      
      renderFallbackDiscovery(s5, discoveryQueriesSection?.data || jtbdData, roleColor);
    }

    // =========================================================
    // SLIDE 6 — DISCOVERY & HYPOTHESIS
    // =========================================================
    const hypoSection = sections.find(s => s.title?.toLowerCase().includes('hipótesis') || s.title?.toLowerCase().includes('hypothesis'));
    const risksSection = sections.find(s => s.title?.toLowerCase().includes('riesgos') || s.title?.toLowerCase().includes('risks'));
    if (hypoSection || risksSection) {
      const s6 = pptx.addSlide();
      s6.background = { color: SLIDE_BG };
      addSlideHeaderClean(s6, lang === 'es' ? 'Descubrimiento y Validación de Hipótesis' : 'Product Discovery & Hypothesis Validation', roleColor, footerBase);
      renderDiscoveryPanel(s6, hypoSection?.data as any[], risksSection?.data as any[], roleColor);
    }

    // =========================================================
    // SLIDE 7 — AUDIENCE & JTBD
    // =========================================================
    const jtbdSection = sections.find(s => s.title?.toLowerCase().includes('jtbd') || s.title?.toLowerCase().includes('jobs to be done'));
    const personaSection = sections.find(s => s.title?.toLowerCase().includes('público') || s.title?.toLowerCase().includes('audience'));
    if (jtbdSection || personaSection) {
      const s7 = pptx.addSlide();
      s7.background = { color: SLIDE_BG };
      addSlideHeaderClean(s7, lang === 'es' ? 'Perfil del Usuario & Jobs-to-be-Done' : 'User Persona & Jobs-to-be-Done', roleColor, footerBase);
      renderAudiencePanel(s7, personaSection?.data, jtbdSection?.data, roleColor);
    }

    // =========================================================
    // REMAINING SECTIONS (Dynamic Executive Slides)
    // =========================================================
    const handledTitles = [
      lang === 'es' ? 'Resumen' : 'Summary',
      lang === 'es' ? 'Fases' : 'Phases',
      lang === 'es' ? 'Roadmap' : 'Roadmap',
      lang === 'es' ? 'Indicadores Clave' : 'Key Indicators',
      'priorización', 'rice', 'competidores', 'competitive', 'hipótesis', 'hypothesis', 'riesgos', 'risks', 'público', 'audience', 'jtbd'
    ];

    const remainingSections = sections.filter(s => 
      !handledTitles.some(ht => s.title?.toLowerCase().includes(ht.toLowerCase())) &&
      s.title !== (lang === 'es' ? 'Panel de Control de Producto' : 'Product Control Board')
    );

    for (const section of remainingSections.slice(0, 5)) {
      const sN = pptx.addSlide();
      sN.background = { color: SLIDE_BG };
      addSlideHeaderClean(sN, section.title || '', roleColor, footerBase);

      const contentY = 1.4;
      const contentH = 3.6; 

      if (section.type === 'text' && typeof section.data === 'string') {
        addPremiumCard(sN, { x: 0.5, y: contentY, w: 9, h: contentH, accentColor: 'E2E8F0', accentSide: 'left', bgColor: 'FFFFFF' });
        sN.addText(section.data, {
          x: 0.8, y: contentY + 0.2, w: 8.4, h: contentH - 0.4, fontSize: 11, color: TEXT_B, lineSpacing: 16, valign: 'top'
        });
      } else if (section.type === 'list' && Array.isArray(section.data)) {
        addPremiumCard(sN, { x: 0.5, y: contentY, w: 9, h: contentH, accentColor: 'E2E8F0', accentSide: 'left', bgColor: 'FFFFFF' });
        const bullets = section.data.map(item => ({
          text: String(item),
          options: { fontSize: 11, bullet: true, color: TEXT_B, lineSpacing: 22 }
        }));
        sN.addText(bullets, { x: 0.8, y: contentY + 0.2, w: 8.4, h: contentH - 0.4, valign: 'top' });
      } else if (section.type === 'table' && Array.isArray(section.data)) {
        renderPMTable(sN, section.data, roleColor, contentY);
      } else if (section.type === 'kpi_grid' && typeof section.data === 'object' && !Array.isArray(section.data)) {
        renderPMKPIs(sN, section.data, roleColor, contentY);
      }
    }

    // =========================================================
    // FINAL SLIDE — BOARD VERDICT & NEXT STEPS
    // =========================================================
    const sEnd = pptx.addSlide();
    sEnd.background = { color: 'FAF5FF' };
    sEnd.addShape('rect' as any, { x: 0, y: 0.15, w: '100%', h: 0.05, fill: { color: roleColor } });
    
    sEnd.addText(lang === 'es' ? 'PRÓXIMOS PASOS ESTRATÉGICOS' : 'STRATEGIC NEXT STEPS', {
      x: 1.25, y: 1.2, w: 7.5, h: 0.8, fontSize: 32, bold: true, color: '0F172A', align: 'center'
    });
    
    const conclusionBullets = [
      { text: lang === 'es' ? 'Validación de MVPs seleccionados con el equipo de ingeniería.' : 'Validation of selected MVPs with the engineering team.', options: { bullet: true, fontSize: 14, color: TEXT_B } },
      { text: lang === 'es' ? 'Ajuste de presupuesto basado en el roadmap táctico.' : 'Budget adjustment based on the tactical roadmap.', options: { bullet: true, fontSize: 14, color: TEXT_B } },
      { text: lang === 'es' ? 'Lanzamiento de la fase de Product Discovery (Sprint 0).' : 'Kick-off of the Product Discovery phase (Sprint 0).', options: { bullet: true, fontSize: 14, color: TEXT_B } },
      { text: lang === 'es' ? 'PILOT AI: Inteligencia para la Excelencia en Producto.' : 'PILOT AI: Intelligence for Product Excellence.', options: { bullet: true, fontSize: 16, color: roleColor, bold: true } }
    ];
    sEnd.addText(conclusionBullets, { x: 2.0, y: 2.2, w: 6.0, h: 3.0, lineSpacing: 30 });

    const fileName = `${normalizedDoc.roleName.replace(/\s+/g, '_')}_${projectName.replace(/\s+/g, '_')}.pptx`;
    await pptx.writeFile({ fileName });
  }
};

/**
 * RENDERER: RICE Priority Matrix (Modern Table with status indicators)
 */
function renderRICEMatrix(slide: PptxGenJS.Slide, data: any[], accentColor: string) {
  const contentY = 1.4;
  addPremiumCard(slide, { x: 0.5, y: contentY, w: 9, h: 3.8, accentColor, accentSide: 'left', bgColor: 'FFFFFF' });

  // Filter only feature rows (skip if data looks like something else)
  const rows = data.slice(0, 6);
  if (rows.length === 0) return;

  const headers = ['FEATURE', 'R', 'I', 'C', 'E', 'SCORE', 'MVP'];
  const tableData: any[][] = [
    headers.map(h => ({ 
      text: h, 
      options: { 
        bold: true, color: 'FFFFFF', fill: { color: accentColor }, 
        fontSize: 9, align: 'center', valign: 'middle' 
      } 
    }))
  ];

  rows.forEach(row => {
    tableData.push([
      { text: String(row.name || row.feature || row.title || '').substring(0, 40), options: { fontSize: 8, color: TEXT_H, bold: true } },
      { text: String(row.r || row.reach || '-'), options: { fontSize: 8, align: 'center' } },
      { text: String(row.i || row.impact || '-'), options: { fontSize: 8, align: 'center' } },
      { text: String(row.c || row.confidence || '-'), options: { fontSize: 8, align: 'center' } },
      { text: String(row.e || row.effort || '-'), options: { fontSize: 8, align: 'center' } },
      { text: String(row.score || row.value || '-'), options: { fontSize: 9, bold: true, color: accentColor, align: 'center' } },
      { text: (row.mvp === true || String(row.mvp).toLowerCase() === 'yes' || String(row.mvp).toLowerCase().includes('inclu')) ? 'INCLUDED' : 'FUTURE', options: { fontSize: 7, bold: true, align: 'center', color: '10B981' } }
    ]);
  });

  slide.addTable(tableData, {
    x: 0.7, y: contentY + 0.2, w: 8.6, 
    border: { pt: 0.5, color: 'E2E8F0' },
    valign: 'middle',
    colW: [3.4, 0.8, 0.8, 0.8, 0.8, 1.0, 1.0]
  });
}

/**
 * RENDERER: Fallback Discovery Queries
 * Strategic pivot when specific competitive analysis is missing.
 */
function renderFallbackDiscovery(slide: PptxGenJS.Slide, data: any, accentColor: string) {
  const contentY = 1.4;
  const genericQuestions = [
    { q: '¿Qué ventaja competitiva defendible estamos construyendo hoy?', color: '3B82F6' },
    { q: '¿Cuál es el riesgo de ejecución más crítico en el Sprint 1?', color: 'EF4444' },
    { q: '¿Qué canal de adquisición garantiza el CAC más eficiente?', color: '10B981' }
  ];

  let displayList = genericQuestions;
  
  if (Array.isArray(data) && data.length > 0) {
    displayList = data.slice(0, 3).map((item, idx) => {
      const qText = typeof item === 'string' ? item : (item.question || item.task || item.goal || item.description || '');
      return {
        q: qText || genericQuestions[idx % 3].q,
        color: genericQuestions[idx % 3].color
      };
    });
  }

  displayList.forEach((item, i) => {
    const x = 0.5 + (i * 3.1);
    addPremiumCard(slide, { x, y: contentY, w: 2.9, h: 3.8, accentColor: item.color, accentSide: 'left', bgColor: CARD_BG });
    
    slide.addText('STRATEGIC QUERY', { 
      x: x + 0.2, y: contentY + 0.3, w: 2.5, h: 0.4, fontSize: 10, bold: true, color: '64748B' 
    });
    
    slide.addText(item.q, { 
      x: x + 0.2, y: contentY + 1.0, w: 2.5, h: 2.0, fontSize: 11, bold: true, color: TEXT_H, align: 'center', valign: 'middle', lineSpacing: 18
    });
    
    slide.addText('Validación de mercado requerida', { 
      x: x + 0.2, y: contentY + 3.2, w: 2.5, h: 0.4, fontSize: 8, color: '94A3B8', align: 'center', italic: true 
    });
  });
}

/**
 * RENDERER: Competitive Landscape (Grid of competitors vs our value)
 * "Deep Discovery" version to ensure no data is lost regardless of AI key naming.
 */
function renderCompetitiveLandscape(slide: PptxGenJS.Slide, data: any[], accentColor: string) {
  const contentY = 1.4;
  const items = data.slice(0, 3);
  
  items.forEach((comp, i) => {
    const x = 0.5 + (i * 3.1);
    addPremiumCard(slide, { x, y: contentY, w: 2.9, h: 3.8, accentColor, accentSide: 'top', bgColor: CARD_BG });
    
    // 1. Resolve Name
    const name = String(comp.name || comp.competitor || comp.title || i+1).toUpperCase();
    slide.addText(name, { 
      x: x + 0.2, y: contentY + 0.3, w: 2.5, h: 0.4, fontSize: 11, bold: true, color: '1E3A8A', align: 'center' 
    });
    
    // 2. Resolve Descriptions (Spanish/English Variants)
    const weaknesses = comp.weaknesses || comp.cons || comp.debilidades || comp.puntosDebiles || comp.detallesNegativos;
    const opportunities = comp.opportunities || comp.pros || comp.oportunidades || comp.fortalezas || comp.strengths || comp.puntosFuertes;

    if (weaknesses || opportunities) {
      const details = [
        { text: 'Analysis & Points: \n', options: { bold: true, fontSize: 8, color: accentColor } },
        { text: String(weaknesses || opportunities || '-'), options: { fontSize: 8, color: TEXT_B } }
      ];

      if (weaknesses && opportunities) {
        details.length = 0;
        details.push(
          { text: 'Weaknesses / Cons: \n', options: { bold: true, fontSize: 8, color: 'EF4444' } },
          { text: String(weaknesses).substring(0, 150) + '\n\n', options: { fontSize: 8, color: TEXT_B } },
          { text: 'Opportunities / Pros: \n', options: { bold: true, fontSize: 8, color: '10B981' } },
          { text: String(opportunities).substring(0, 150), options: { fontSize: 8, color: TEXT_B } }
        );
      }
      slide.addText(details, { x: x + 0.2, y: contentY + 0.8, w: 2.5, h: 2.8, valign: 'top', lineSpacing: 12 });
    } 
    else {
      // 3. Deep Discovery: Look for numbers or OTHER strings
      const otherInfo = Object.entries(comp)
        .filter(([k, v]) => 
          !['id', 'name', 'competitor', 'title', 'score', '_meta'].includes(k.toLowerCase()) && 
          v && (typeof v === 'string' || typeof v === 'number')
        );

      if (otherInfo.length > 0) {
        let drawY = contentY + 0.8;
        otherInfo.slice(0, 5).forEach(([key, val]) => {
          if (typeof val === 'number') {
            // Visualize numbers as progress bars
            slide.addText(key.toUpperCase().replace(/([A-Z])/g, ' $1').trim(), { x: x + 0.2, y: drawY, w: 2.5, h: 0.2, fontSize: 7, bold: true, color: '94A3B8' });
            slide.addShape('rect' as any, { x: x + 0.2, y: drawY + 0.22, w: 2.5, h: 0.08, fill: { color: 'F1F5F9' } });
            slide.addShape('rect' as any, { x: x + 0.2, y: drawY + 0.22, w: 2.5 * (Math.min(val, 10)/10), h: 0.08, fill: { color: accentColor } });
            drawY += 0.55;
          } else {
            // Small text item
            slide.addText(`${key.toUpperCase()}:`, { x: x + 0.2, y: drawY, w: 2.5, h: 0.2, fontSize: 7, bold: true, color: accentColor });
            slide.addText(String(val).substring(0, 60), { x: x + 0.2, y: drawY + 0.18, w: 2.5, h: 0.3, fontSize: 8, color: TEXT_B });
            drawY += 0.5;
          }
        });
      } else {
        // Honest fallback - should almost never happen with Deep Discovery
        slide.addText('Información de análisis profundo no disponible en el blueprint actual.', { 
          x: x + 0.2, y: contentY + 1.2, w: 2.5, h: 1.0, fontSize: 9, color: '94A3B8', italic: true, align: 'center' 
        });
      }
    }
  });
}

/**
 * RENDERER: Discovery & Hypothesis (Risk vs Reward Cards)
 */
function renderDiscoveryPanel(slide: PptxGenJS.Slide, hypos: any[], risks: any[], accentColor: string) {
  const contentY = 1.4;
  
  // Hypotheses
  slide.addText('STRATEGIC HYPOTHESES', { x: 0.5, y: contentY, w: 4.5, h: 0.3, fontSize: 10, bold: true, color: '64748B' });
  const hList = (hypos || []).slice(0, 3);
  hList.forEach((h, i) => {
    const y = contentY + 0.4 + (i * 1.1);
    addPremiumCard(slide, { x: 0.5, y, w: 4.3, h: 1.0, accentColor: '3B82F6', accentSide: 'left', bgColor: 'FFFFFF' });
    slide.addText(typeof h === 'string' ? h : (h.title || h.description || ''), {
      x: 0.7, y, w: 3.9, h: 1.0, fontSize: 9, color: TEXT_B, valign: 'middle'
    });
  });

  // Risks
  slide.addText('KEY PRODUCT RISKS', { x: 5.2, y: contentY, w: 4.5, h: 0.3, fontSize: 10, bold: true, color: '64748B' });
  const rList = (risks || []).slice(0, 3);
  rList.forEach((r, i) => {
    const y = contentY + 0.4 + (i * 1.1);
    const riskColor = (r.impact === 'High' || r.level === 'High') ? 'EF4444' : 'F59E0B';
    addPremiumCard(slide, { x: 5.2, y, w: 4.3, h: 1.0, accentColor: riskColor, accentSide: 'left', bgColor: 'FFFFFF' });
    slide.addText(typeof r === 'string' ? r : (r.risk || r.description || ''), {
      x: 5.4, y, w: 3.9, h: 1.0, fontSize: 9, color: TEXT_B, valign: 'middle'
    });
  });
}

/**
 * RENDERER: Audience & JTBD Panel
 */
function renderAudiencePanel(slide: PptxGenJS.Slide, audience: any, jtbd: any, accentColor: string) {
  const contentY = 1.4;
  
  // Target Audience Card
  addPremiumCard(slide, { x: 0.3, y: contentY, w: 4.6, h: 3.8, accentColor, accentSide: 'left', bgColor: 'FFFFFF' });
  slide.addText('TARGET AUDIENCE', { x: 0.6, y: contentY + 0.2, w: 4.0, h: 0.4, fontSize: 12, bold: true, color: '1E3A8A' });
  
  const audienceText = Array.isArray(audience) ? audience.join('\n\n') : (typeof audience === 'string' ? audience : JSON.stringify(audience));
  slide.addText(audienceText.substring(0, 500), {
    x: 0.6, y: contentY + 0.7, w: 4.0, h: 2.8, fontSize: 9.5, color: TEXT_B, valign: 'top', lineSpacing: 14
  });

  // JTBD Card
  addPremiumCard(slide, { x: 5.1, y: contentY, w: 4.6, h: 3.8, accentColor: '10B981', accentSide: 'left', bgColor: 'FFFFFF' });
  slide.addText('JOBS TO BE DONE', { x: 5.4, y: contentY + 0.2, w: 4.0, h: 0.4, fontSize: 12, bold: true, color: '1E3A8A' });
  
  const jtbdItems = Array.isArray(jtbd) ? jtbd.slice(0, 3) : [];
  if (jtbdItems.length > 0) {
    const bullets = jtbdItems.map(item => ({
      text: (typeof item === 'string' ? item : (item.task || item.goal || item.description || '')),
      options: { fontSize: 9, bullet: true, color: TEXT_B, lineSpacing: 16 }
    }));
    slide.addText(bullets, { x: 5.4, y: contentY + 0.7, w: 4.0, h: 2.8, valign: 'top' });
  }
}

/**
 * Helper: Render a premium table for PM role
 */
function renderPMTable(slide: PptxGenJS.Slide, data: any[], accentColor: string, yOffset: number) {
  if (data.length === 0) return;
  const items = data.slice(0, 10);
  const headers = Object.keys(items[0]);
  const tableData: any[][] = [
    headers.map(h => ({ text: h.toUpperCase(), options: { bold: true, color: 'FFFFFF', fill: { color: accentColor }, fontSize: 10, align: 'center' } }))
  ];

  items.forEach(row => {
    tableData.push(
      headers.map(h => ({
        text: String(row[h] || '').substring(0, 80),
        options: { fontSize: 9, color: TEXT_B, border: { pt: 0.5, color: 'E2E8F0' } }
      }))
    );
  });

  slide.addTable(tableData, {
    x: 0.5, y: yOffset, w: 9, 
    border: { pt: 0.5, color: 'E2E8F0' },
    valign: 'middle'
  });
}

/**
 * Helper: Render KPI grid for PM role
 */
function renderPMKPIs(slide: PptxGenJS.Slide, data: Record<string, any>, accentColor: string, yOffset: number) {
  const entries = Object.entries(data);
  let x = 0.6;
  let y = yOffset;
  
  entries.slice(0, 6).forEach(([label, val], i) => {
    if (i > 0 && i % 3 === 0) {
      x = 0.6;
      y += 2.2;
    }
    
    addPremiumCard(slide, { x, y, w: 2.8, h: 2.0, accentColor, accentSide: 'left', bgColor: 'FFFFFF' });
    slide.addText(label, { x: x + 0.2, y: y + 0.2, w: 2.4, h: 0.4, fontSize: 10, bold: true, color: TEXT_M });
    slide.addText(String(val), { x: x + 0.2, y: y + 0.6, w: 2.4, h: 1.0, fontSize: 18, bold: true, color: accentColor, align: 'center', valign: 'middle' });
    
    x += 3.1;
  });
}

