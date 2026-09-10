import PptxGenJS from 'pptxgenjs';
import { RoleConfig } from '../../../../types/roles';
import {
  ROLE_COLORS,
  ROLE_COLORS_PALE,
  VERDICT_COLORS,
  SLIDE_BG,
  TEXT_H,
  TEXT_B,
  TEXT_M,
  BORDER,
  addSlideHeaderClean,
  addPremiumCard,
  addSwotMatrix,
  addTowsMatrix,
  addMarketChart,
  addCoverSlide,
  addClosingSlide,
  normalizeVerdict,
  extractNumeric,
  t
} from '../../pptHelpers';
import { notificationService } from '../../../ui/notificationService';

// Premium Light Aesthetic Overrides for former Dark Mode areas
const PREMIUM_BG = 'FFFFFF'; // Pure White for absolute lowest risk of color-parsing failure
const PREMIUM_CARD = 'F8FAFC'; // Slate 50
const TEXT_HEADING = '0F172A'; // Slate 900
const TEXT_BODY = '475569'; // Slate 600

export const strategyAnalystPPT = {
  /**
   * PREMIUM C-Level PPT — Strategy Analyst (10 slides)
   * All content within slide boundaries, strictly adhering to the Light Theme.
   */
  generate: async (
    rawContent: any,
    roleConfig: RoleConfig,
    lang: 'es' | 'en' = 'es',
    projectName: string = 'Project'
  ) => {
    try {
      const pptx = new PptxGenJS();
      pptx.layout = 'LAYOUT_16x9';
      const roleColor = ROLE_COLORS[roleConfig.roleId] || 'EAB308';
      const rolePale  = ROLE_COLORS_PALE[roleConfig.roleId] || 'FEF3C7';

      // ---- Extract & regex-scrub all data ----
      const dashboard = rawContent?.dashboard || {};
      const classif   = dashboard.classification || {};
      const ideo      = dashboard.ideo || {};
      const market    = dashboard.marketIntelligence || {};
      const unitEcon  = dashboard.unitEconomics || {};
      const swot      = dashboard.swot || { strengths: [], weaknesses: [], opportunities: [], threats: [] };
      const tows      = dashboard.tows || { so: [], wo: [], st: [], wt: [] };
      const summary   = String(dashboard.executiveSummary || '');
      const sources: any[] = rawContent?.sources || [];

      // Regex-scrubbed numeric values
      const overallScore = extractNumeric(dashboard.overallScore);
      const cagr         = extractNumeric(market.cagr);
      const ltv          = extractNumeric(unitEcon.estimatedLTV);
      const cac          = extractNumeric(unitEcon.estimatedCAC);
      const ratio        = extractNumeric(unitEcon.ltvCacRatio);
      const bep          = extractNumeric(unitEcon.breakevenMonths);
      const desScore     = extractNumeric(ideo.desirability?.score);
      const feasScore    = extractNumeric(ideo.feasibility?.score);
      const viaScore     = extractNumeric(ideo.viability?.score);

      // Normalized verdict
      const nv = normalizeVerdict(classif.verdict || 'PROCEED');
      const vc = VERDICT_COLORS[nv] || '059669';

      const dateStr = new Date().toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
      });

      const footerBase = `${t('Strategy Analyst', lang).toUpperCase()} | ${projectName}`;

      // =========================================================
      // SLIDE 1 — COVER 
      // =========================================================
      addCoverSlide(pptx, {
        title:    t('Strategy Analyst', lang),
        subtitle: t('Business Strategy Executive Audit', lang),
        projectName, date: dateStr,
        verdict: { verdict: classif.verdict || 'PROCEED', action: classif.action || '' },
        roleColor, lang, roleId: roleConfig.roleId,
      });

      // =========================================================
      // SLIDE 2 — EXECUTIVE DASHBOARD (Light Premium)
      // =========================================================
      const s2 = pptx.addSlide();
      s2.background = { color: PREMIUM_BG };
      addSlideHeaderClean(s2, t('Executive Dashboard', lang), roleColor, footerBase);
      // --- CENTERED CALCULATION ---
      const marginH = 0.425;
      const cardGap = 0.2;
      const contentDown = 0.55; // Aggressive drop for breathing room
      const cardY = 1.1;       // Lowered cards for better top air

      // LEFT card: Score donut
      const card1X = marginH;
      addPremiumCard(s2, { x: card1X, y: cardY, w: 3.2, h: 3.4, accentColor: '3B82F6', accentSide: 'top', bgColor: PREMIUM_CARD });

      // Donut visualization (Architect Blue Pearl)
      const donutX = card1X + 0.2;
      const donutY = cardY + 0.2 + contentDown;
      s2.addShape(pptx.ShapeType.donut, {
        x: donutX, y: donutY, w: 1.45, h: 1.45,
        fill: { color: 'EFF6FF' },
        line: { color: '3B82F6', width: 3.5 },
      });
      s2.addText(`${Math.round(overallScore)}`, {
        x: donutX, y: donutY, w: 1.45, h: 1.45,
        fontSize: 36, bold: true, color: TEXT_HEADING, align: 'center', valign: 'middle',
      });

      const vdtX = card1X + 1.8;
      const vdtY = cardY + 0.5 + contentDown;
      s2.addShape(pptx.ShapeType.roundRect, {
        x: vdtX, y: vdtY, w: 1.2, h: 0.4,
        fill: { color: vc }, line: { color: vc, width: 0 }, rectRadius: 0.2,
      });
      s2.addText(t(nv, lang), {
        x: vdtX, y: vdtY, w: 1.2, h: 0.4,
        fontSize: 10, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle',
      });
      s2.addText(t('Final Verdict', lang).toUpperCase(), {
        x: vdtX, y: vdtY + 0.5, w: 1.2, h: 0.3, fontSize: 9, color: TEXT_M, charSpacing: 0.5,
      });

      // Score bar - MOVED DOWN
      const sBarW = 2.8;
      const sBarX = card1X + 0.2;
      const sBarY = cardY + 1.8 + contentDown; 
      s2.addShape(pptx.ShapeType.roundRect, {
        x: sBarX, y: sBarY, w: sBarW, h: 0.15,
        fill: { color: 'E2E8F0' }, line: { color: BORDER, width: 0 }, rectRadius: 0.04,
      });
      s2.addShape(pptx.ShapeType.roundRect, {
        x: sBarX, y: sBarY, w: Math.max(0.08, sBarW * (overallScore / 100)), h: 0.15,
        fill: { color: vc }, 
        line: { width: 0 }, rectRadius: 0.04,
      });
      s2.addText(`${t('Overall Score', lang)}: ${Math.round(overallScore)}/100`, {
        x: sBarX, y: sBarY + 0.2, w: sBarW, h: 0.3, fontSize: 8, color: TEXT_BODY,
      });
      s2.addText(classif.action ? classif.action.substring(0, 100) : '', {
        x: sBarX, y: sBarY + 0.45, w: sBarW, h: 0.6,
        fontSize: 10, color: TEXT_BODY, lineSpacing: 14, valign: 'top',
      });

      // CENTER card: CAGR 
      const card2X = card1X + 3.2 + cardGap;
      addPremiumCard(s2, { x: card2X, y: cardY, w: 2.65, h: 3.4, accentColor: '10B981', accentSide: 'top', bgColor: PREMIUM_CARD });
      s2.addText('CAGR', { x: card2X + 0.2, y: cardY + 0.3 + contentDown, w: 2.2, h: 0.3, fontSize: 11, bold: true, color: TEXT_HEADING, charSpacing: 1 });
      s2.addText(`${(market.cagr || 0).toFixed(1)}%`, {
        x: card2X + 0.1, y: cardY + 0.6 + contentDown, w: 2.45, h: 1.0,
        fontSize: 54, bold: true, color: '10B981', align: 'left', valign: 'middle',
      });
      s2.addText(t('Annual Market Growth', lang), {
        x: card2X + 0.2, y: cardY + 1.85 + contentDown, w: 2.2, h: 0.4, fontSize: 9, color: TEXT_BODY,
      });
      s2.addText(lang === 'es' ? 'Expansión del mercado objetivo' : 'Target market expansion', {
        x: card2X + 0.2, y: cardY + 2.25 + contentDown, w: 2.2, h: 0.6, fontSize: 10, color: TEXT_BODY, lineSpacing: 13,
      });

      // RIGHT card: Executive Summary
      const card3X = card2X + 2.65 + cardGap;
      addPremiumCard(s2, { x: card3X, y: cardY, w: 2.9, h: 3.4, accentColor: roleColor, accentSide: 'top', bgColor: PREMIUM_CARD });
      s2.addText(t('Executive Summary', lang), {
        x: card3X + 0.2, y: cardY + 0.3 + contentDown, w: 2.5, h: 0.3, fontSize: 11, bold: true, color: TEXT_HEADING, charSpacing: 0.5,
      });
      s2.addText(summary.substring(0, 240), {
        x: card3X + 0.2, y: cardY + 0.7 + contentDown, w: 2.5, h: 2.2,
        fontSize: 10, color: TEXT_BODY, lineSpacing: 14, valign: 'top',
      });

      // Bottom insight strip 
      s2.addShape(pptx.ShapeType.roundRect, {
        x: marginH, y: 4.8, w: 9.15, h: 0.45,
        fill: { color: 'F8FAFC' }, line: { color: BORDER, width: 0.5 }, rectRadius: 0.1, shadow: { type: 'outer', color: '0F172A', opacity: 0.1, blur: 15, offset: 3, angle: 90 }
      });
      s2.addText(classif.reason ? classif.reason.substring(0, 165) : '', {
        x: marginH + 0.2, y: 4.8, w: 8.75, h: 0.45,
        fontSize: 11, color: TEXT_BODY, lineSpacing: 15, valign: 'middle',
      });
      // =========================================================
      // SLIDE 3 — IDEO VALIDATION (Light Premium)
      // =========================================================
      const s3 = pptx.addSlide();
      s3.background = { color: PREMIUM_BG };
      addSlideHeaderClean(s3, t('IDEO Validation', lang) + ' Toolkit', roleColor, footerBase);

      // LEFT: IDEO Validation Framework (High-Fidelity UI Replication)
      // 1. Dark Container (War Room Aesthetic)
      s3.addShape(pptx.ShapeType.roundRect, {
        x: 0.35, y: 0.95, w: 5.5, h: 4.1,
        fill: { color: '0F172A' }, line: { color: '1E293B', width: 1 }, rectRadius: 0.15
      });

      // 2. Framework Marker
      s3.addText('✦ IDEO Validation Framework', {
        x: 0.35, y: 1.15, w: 5.5, h: 0.3,
        fontSize: 10, bold: true, color: '94A3B8', align: 'center', charSpacing: 1
      });

      // 3. Triangle Skeleton (Using POSITIVE dimensions + flipH to avoid Repair Errors)
      const lineStyle = { color: '334155', width: 2, dashType: 'dash' as any };
      // LEFT LINE: Top (Fact) -> BottomLeft (Des)
      s3.addShape(pptx.ShapeType.line, { x: 1.9, y: 2.15, w: 1.2, h: 1.8, line: lineStyle, flipH: true });
      // RIGHT LINE: Top (Fact) -> BottomRight (Via)
      s3.addShape(pptx.ShapeType.line, { x: 3.1, y: 2.15, w: 1.2, h: 1.8, line: lineStyle });
      // BASE LINE: BottomLeft -> BottomRight
      s3.addShape(pptx.ShapeType.line, { x: 1.9, y: 3.95, w: 2.4, h: 0, line: lineStyle });

      // 4. Vertex Orbitals (Circles & Scores)
      // TOP: Factibilidad (Emerald) - Perfectly Centered at vertex
      s3.addShape(pptx.ShapeType.ellipse, { x: 2.75, y: 1.8, w: 0.7, h: 0.7, fill: { color: '10B981' }, line: { color: 'FFFFFF', width: 2 } });
      s3.addText(`${Math.round(feasScore)}%`, { x: 2.75, y: 1.8, w: 0.7, h: 0.7, fontSize: 13, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle' });
      const factLabel = lang === 'es' ? 'FACTIBILIDAD\n(TÉCNICA)' : 'FEASIBILITY\n(TECH)';
      s3.addText(factLabel, { x: 2.1, y: 2.70, w: 2, h: 0.4, fontSize: 7, bold: true, color: '10B981', align: 'center' });

      // BOTTOM LEFT: Desirability (Gold)
      s3.addShape(pptx.ShapeType.ellipse, { x: 1.55, y: 3.6, w: 0.7, h: 0.7, fill: { color: roleColor }, line: { color: 'FFFFFF', width: 2 } });
      s3.addText(`${Math.round(desScore)}%`, { x: 1.55, y: 3.6, w: 0.7, h: 0.7, fontSize: 13, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle' });
      const desText = lang === 'es' ? 'DESEABILIDAD\n(HUMANA)' : 'DESIRABILITY\n(HUMAN)';
      s3.addText(desText, { x: 0.9, y: 4.3, w: 2, h: 0.4, fontSize: 7, bold: true, color: roleColor, align: 'center' });

      // BOTTOM RIGHT: Viability (Architect Blue)
      s3.addShape(pptx.ShapeType.ellipse, { x: 3.95, y: 3.6, w: 0.7, h: 0.7, fill: { color: '3B82F6' }, line: { color: 'FFFFFF', width: 2 } });
      s3.addText(`${Math.round(viaScore)}%`, { x: 3.95, y: 3.6, w: 0.7, h: 0.7, fontSize: 13, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle' });
      const viaText = lang === 'es' ? 'VIABILIDAD\n(NEGOCIO)' : 'VIABILITY\n(BUSINESS)';
      s3.addText(viaText, { x: 3.3, y: 4.3, w: 2, h: 0.4, fontSize: 7, bold: true, color: '3B82F6', align: 'center' });

      // 5. Center Sweet Spot Indicator (Lowered for perfect centering)
      s3.addShape(pptx.ShapeType.ellipse, { x: 2.95, y: 3.3, w: 0.3, h: 0.3, fill: { color: 'FFFFFF' }, line: { color: roleColor, width: 2 } });
      s3.addText('SWEET\nSPOT', { x: 2.5, y: 3.6, w: 1.2, h: 0.25, fontSize: 6, bold: true, color: '94A3B8', align: 'center' });

      // RIGHT: Glassmorphism score card
      addPremiumCard(s3, { x: 6.05, y: 0.95, w: 3.55, h: 4.0, accentColor: roleColor, accentSide: 'left', bgColor: PREMIUM_CARD });

      const ideoItems = [
        { label: t('Desirability', lang), score: desScore, color: roleColor },
        { label: t('Feasibility', lang),  score: feasScore, color: '10B981' },
        { label: t('Viability', lang),    score: viaScore,  color: '3B82F6' },
      ];
      ideoItems.forEach((item, i) => {
        const ry = 1.25 + i * 1.35; // Reduced from 1.75 to 1.35 to stay inside slide (5.625" max)

        // Score number 
        s3.addText(`${Math.round(item.score)}`, {
          x: 6.20, y: ry, w: 1.35, h: 0.7,
          fontSize: 36, bold: true, color: item.color, align: 'center', valign: 'middle',
        });
        s3.addText('/100', {
          x: 7.25, y: ry + 0.25, w: 0.65, h: 0.3,
          fontSize: 10, color: TEXT_BODY, valign: 'top',
        });

        // Label
        s3.addText(`● ${item.label.toUpperCase()}`, {
          x: 6.20, y: ry + 0.65, w: 3.25, h: 0.3,
          fontSize: 9, bold: true, color: TEXT_HEADING, charSpacing: 0.5,
        });

        // Divider
        if (i < 2) {
          s3.addShape(pptx.ShapeType.rect, {
            x: 6.25, y: ry + 1.05, w: 3.10, h: 0.01,
            fill: { color: 'CBD5E1' }, line: { color: 'CBD5E1', width: 0 },
          });
        }
      });

      // =========================================================
      // SLIDE 4 — MARKET OPPORTUNITY 
      // =========================================================
      const s4 = pptx.addSlide();
      s4.background = { color: PREMIUM_BG };
      addSlideHeaderClean(s4, t('Market Opportunity', lang), roleColor, footerBase);

      const mData = [
        { label: 'TAM', value: extractNumeric(market.tam) },
        { label: 'SAM', value: extractNumeric(market.sam) },
        { label: 'SOM', value: extractNumeric(market.som) },
      ];
      
      // Market Chart - height 3.2 is correct
      addMarketChart(pptx, s4, mData, lang, roleColor, roleConfig.roleId, false); 

      // Insight card - Moved to bottom (y: 4.6). Added fallback text to prevent "empty" look.
      const insightText = String(market.marketInsight || '').trim() || (lang === 'es' ? 'Se detecta una oportunidad clave en el mercado objetivo con alto potencial de crecimiento' : 'Key opportunity detected in target market with high growth potential');
      addPremiumCard(s4, { x: 5.8, y: 4.6, w: 3.85, h: 0.75, accentColor: roleColor, accentSide: 'left', bgColor: PREMIUM_CARD });
      s4.addText(t('Key Market Insight', lang).toUpperCase(), { x: 6.0, y: 4.65, w: 3.5, h: 0.2, fontSize: 8, bold: true, color: roleColor, charSpacing: 1 });
      s4.addText(insightText.substring(0, 110), { x: 6.0, y: 4.85, w: 3.5, h: 0.45, fontSize: 9, color: TEXT_BODY, lineSpacing: 13, valign: 'top' });

      // CAGR & Growth Analysis Container
      s4.addShape('roundRect', {
        x: 0.35, y: 4.6, w: 5.3, h: 0.75,
        fill: { color: 'F1F5F9' }, line: { color: 'CBD5E1', width: 0.5 }, rectRadius: 0.1,
      });

      // CAGR pill
      s4.addShape('roundRect', {
        x: 0.5, y: 4.75, w: 1.8, h: 0.45,
        fill: { color: roleColor }, line: { color: roleColor, width: 0 }, rectRadius: 0.2,
      });
      s4.addText(`CAGR ${cagr.toFixed(1)}%`, {
        x: 0.5, y: 4.75, w: 1.8, h: 0.45,
        fontSize: 13, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle',
      });

      // Integrated label
      s4.addText(lang === 'es' ? 'Análisis de crecimiento de mercado' : 'Market growth analysis', {
        x: 2.4, y: 4.75, w: 3.2, h: 0.45,
        fontSize: 9, bold: true, color: TEXT_HEADING, valign: 'middle',
      });

      // =========================================================
      // SLIDE 5 — MARKET INTELLIGENCE: TRENDS 
      // =========================================================
      const s5 = pptx.addSlide();
      s5.background = { color: PREMIUM_BG };
      addSlideHeaderClean(s5, t('Market Trends', lang), roleColor, footerBase);

      // Replaced saturated colors with Slate Premium tones + Role color
      const trendColors = [roleColor, '475569', '64748B', '94A3B8'];
      const trends = ((market.trends as string[]) || []).slice(0, 4);
      trends.forEach((trend: string, idx: number) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        const tx = col === 0 ? 0.35 : 5.05;
        const ty = row === 0 ? 0.95 : 3.05; 
        const tColor = trendColors[idx] || roleColor;
        addPremiumCard(s5, { x: tx, y: ty, w: 4.55, h: 2.0, accentColor: tColor, accentSide: 'left', bgColor: PREMIUM_CARD });
        s5.addText(String(idx + 1).padStart(2, '0'), {
          x: tx + 0.22, y: ty + 0.15, w: 0.7, h: 0.6, fontSize: 26, bold: true, color: tColor,
        });
        s5.addText(String(trend).substring(0, 135), {
          x: tx + 0.22, y: ty + 0.75, w: 4.1, h: 1.1,
          fontSize: 11, color: TEXT_BODY, lineSpacing: 16, valign: 'top',
        });
      });

      // =========================================================
      // SLIDE 6 — SWOT ANALYSIS 
      // =========================================================
      const s6 = pptx.addSlide();
      s6.background = { color: PREMIUM_BG };
      addSlideHeaderClean(s6, t('SWOT Analysis', lang) + (lang === 'es' ? ' (FODA)' : ''), roleColor, footerBase);
      addSwotMatrix(s6, swot, lang, roleColor, false); // isDark = false

      // =========================================================
      // SLIDE 7 — TOWS MATRIX 
      // =========================================================
      const s7 = pptx.addSlide();
      s7.background = { color: PREMIUM_BG };
      addSlideHeaderClean(s7, t('TOWS Strategies', lang), roleColor, footerBase);
      addTowsMatrix(s7, tows, lang, roleColor, false); // isDark = false

      // =========================================================
      // SLIDE 8 — UNIT ECONOMICS 
      // =========================================================
      const s8 = pptx.addSlide();
      s8.background = { color: PREMIUM_BG };
      addSlideHeaderClean(s8, t('Unit Economics', lang), roleColor, footerBase);

      const unitLabel = lang === 'es' ? 'Economía Unitaria' : 'Unit Economics';
      const ltvLabel  = lang === 'es' ? 'LTV Estimado'      : 'Estimated LTV';
      const cacLabel  = lang === 'es' ? 'CAC Estimado'      : 'Estimated CAC';
      const ratLabel  = lang === 'es' ? 'Ratio LTV:CAC'     : 'LTV:CAC Ratio';
      const bepLabel  = lang === 'es' ? 'Breakeven (mes)'   : 'Breakeven (month)';

      // 4-series clustered bar — Elegant slate palette for secondary bars
      s8.addChart(pptx.ChartType.bar, [
        { name: ltvLabel, labels: [unitLabel], values: [ltv]   },
        { name: cacLabel, labels: [unitLabel], values: [cac]   },
        { name: ratLabel, labels: [unitLabel], values: [ratio] },
        { name: bepLabel, labels: [unitLabel], values: [bep]   },
      ], {
        x: 0.35, y: 0.95, w: 9.3, h: 4.4, // Reduced height to prevent overflow
        barDir: 'col',
        barGrouping: 'clustered',
        chartColors: ['3B82F6', '475569', '64748B', '94A3B8'], // Replaced Midnight with Vivid Architect Blue
        showTitle: true,
        title: unitLabel,
        titleFontSize: 14,
        titleColor: roleColor, // Title follows accent rule
        showLegend: true,
        legendPos: 'b',
        legendFontSize: 11,
        showValue: true,
        dataLabelFontSize: 13,
        dataLabelFontBold: true,
        dataLabelColor: TEXT_H,
        catAxisLabelColor: 'FFFFFF',   // hide dummy category label
        catAxisLineShow: false,
        valAxisLineShow: false,
        valGridLine: { color: BORDER, style: 'dash', size: 0.5 },
        valAxisLabelColor: TEXT_M,
        plotArea: { fill: { color: 'FFFFFF' } },
        chartArea: { fill: { color: 'FFFFFF' } },
      });

      // =========================================================
      // SLIDE 9 — STRATEGIC ACTIONS (roadmap)
      // =========================================================
      const s9 = pptx.addSlide();
      s9.background = { color: PREMIUM_BG };
      addSlideHeaderClean(s9, t('Key Strategic Actions', lang), roleColor, footerBase);

      const topActions = (tows.so || []).slice(0, 4);
      const actColors  = [roleColor, '475569', '64748B', '94A3B8']; // Slate premium tones
      const nAct       = topActions.length || 1;
      const aW         = nAct <= 3 ? (9.3 - (nAct - 1) * 0.15) / nAct : 2.2;
      const aGap       = nAct <= 3 ? 0.15 : 0.13;

      // Connector line
      if (nAct > 1) {
        s9.addShape('rect', {
          x: 0.35 + aW / 2, y: 2.87, w: (nAct - 1) * (aW + aGap), h: 0.02, // Ultra thin line
          fill: { color: 'CBD5E1' }, line: { color: 'CBD5E1', width: 0 },
        });
      }

      topActions.forEach((action: string, idx: number) => {
        const ax = 0.35 + idx * (aW + aGap);
        const aColor = actColors[idx] || roleColor;
        const qLabels = lang === 'es'
          ? ['Q1: Fundación', 'Q2: Integración', 'Q3: Lanzamiento', 'Q4: Escalamiento']
          : ['Q1: Foundation', 'Q2: Integration', 'Q3: Launch', 'Q4: Scale'];

        // Q label pill - Compressed Y
        s9.addShape('roundRect', {
          x: ax, y: 0.95, w: aW, h: 0.35,
          fill: { color: 'F1F5F9' }, line: { color: aColor, width: 0.8 }, rectRadius: 0.2, // Fully rounded
        });
        s9.addText(qLabels[idx] || `Q${idx + 1}`, {
          x: ax, y: 0.95, w: aW, h: 0.35,
          fontSize: 9, bold: true, color: aColor, align: 'center', valign: 'middle',
        });

        // Circle node (Elegant) - Compressed Y
        s9.addShape('roundRect', {
          x: ax + aW / 2 - 0.20, y: 1.45, w: 0.40, h: 0.40,
          fill: { color: aColor }, line: { color: aColor, width: 0 }, rectRadius: 0.2,
        });
        s9.addText(String(idx + 1), {
          x: ax + aW / 2 - 0.20, y: 1.45, w: 0.40, h: 0.40,
          fontSize: 10, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle',
        });

        // Action card - Compressed Y/H
        addPremiumCard(s9, { x: ax, y: 2.05, w: aW, h: 2.1, accentColor: aColor, accentSide: 'top', bgColor: PREMIUM_CARD });
        s9.addText(String(action).substring(0, 145), {
          x: ax + 0.15, y: 2.15, w: aW - 0.3, h: 1.9,
          fontSize: 10, color: TEXT_B, lineSpacing: 14, valign: 'top',
        });
      });

      // CTA box - Compressed Y/H to fit 5.625 slide height
      s9.addShape('roundRect', {
        x: 0.35, y: 4.3, w: 9.3, h: 0.75,
        fill: { color: 'F8FAFC' }, line: { color: 'E2E8F0', width: 0.8 }, rectRadius: 0.15,
      });
      s9.addText(
        lang === 'es' ? 'Decisión Estratégica Requerida' : 'Strategic Decision Required',
        { x: 0.55, y: 4.35, w: 3.2, h: 0.3, fontSize: 10, bold: true, color: roleColor }
      );
      s9.addText(
        lang === 'es'
          ? classif.reason?.substring(0, 140) || 'Acción recomendada en base al análisis IDEO y mercado.'
          : classif.reason?.substring(0, 140) || 'Recommended action based on IDEO analysis and market data.',
        { x: 0.55, y: 4.65, w: 9.0, h: 0.35, fontSize: 9, color: '64748B' } // Slate 500
      );

      // =========================================================
      // SLIDE 10 — CLOSING
      // =========================================================
      const s10 = pptx.addSlide();
      addClosingSlide(s10, { roleColor, roleId: roleConfig.roleId, projectName, sources, lang });

      // ---- Save ----
      const safeName = projectName.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ _-]/g, '').replace(/\s+/g, '_').substring(0, 40);
      const fileName = `Strategy_Analyst_${safeName}_${new Date().toISOString().split('T')[0]}.pptx`;
      await pptx.writeFile({ fileName });
      notificationService.showSuccess(lang === 'es' ? 'PPT Estratégico descargado' : 'Strategic PPT downloaded');
    } catch (error) {
      notificationService.showError(
        lang === 'es' ? 'Fallo en la generación del PPT Ejecutivo' : 'Failed to generate Executive PPT',
        'strategyAnalystPPT.generate',
        error
      );
    }
  }
};
