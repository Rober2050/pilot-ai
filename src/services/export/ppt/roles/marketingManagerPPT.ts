/**
 * marketingManagerPPT.ts — Specialist PPT Generator for Marketing Manager Role
 *
 * C-Level quality presentation. Reads rawContent directly.
 * Unwraps 'dashboard' key if present (AI may wrap per UniversalDashboardSchema).
 * Bypasses genericRolePPT (which causes duplicate summaries + sparse content).
 *
 * Slides:
 *   Cover — Go-To-Market Strategy
 *   01 — Executive Summary       (summary)
 *   02 — Unit Economics          (cac, ltv, ltvCacRatio, paybackMonths)
 *   03 — Channel Strategy        (channelStrategy[] top 8)
 *   04 — ROAS Scenarios          (conservative / base / aggressive)
 *   05 — Buyer Persona           (avatar, demographics, painPoint, goals, objections)
 *   06 — Messaging Framework     (valueProposition, keyMessages[])
 *   07 — Competitive Landscape   (competitiveMap[])
 *   Closing
 */

import PptxGenJS from 'pptxgenjs';
import { RoleConfig } from '../../../../types/roles';
import {
  addCoverSlide, addSlideHeader, addPremiumCard, addClosingSlide,
  ROLE_COLORS, TEXT_H, TEXT_B, TEXT_M, BORDER,
} from '../../pptHelpers';
import { registerSectionMaster, SLIDE, FONT } from '../slideTemplates';
import { notificationService } from '../../../ui/notificationService';

// ── Data extractor ────────────────────────────────────────────────────────────

function extractMktData(raw: any) {
  // Marketing protocol says "UniversalDashboardSchema" → AI may wrap fields in a
  // 'dashboard' key. Unwrap it if present (same pattern as extractArchData).
  const d = (raw?.dashboard ?? raw) ?? {};
  return {
    summary:        String(d.summary ?? ''),
    unitEconomics:  d.unitEconomics  ?? {},
    channelStrategy: Array.isArray(d.channelStrategy)  ? d.channelStrategy  : [],
    roasScenarios:  d.roasScenarios  ?? {},
    buyerPersona:   d.buyerPersona   ?? {},
    messagingFw:    d.messagingFramework ?? {},
    competitiveMap: Array.isArray(d.competitiveMap) ? d.competitiveMap : [],
  };
}

function fmtNum(val: any, decimals = 0): string {
  const n = parseFloat(String(val));
  if (isNaN(n)) return String(val ?? '—');
  return n.toLocaleString('en-US', { maximumFractionDigits: decimals });
}

function fmtCurrency(val: any): string {
  const n = parseFloat(String(val));
  if (isNaN(n)) return '—';
  return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

// ── Main generator ────────────────────────────────────────────────────────────

export const marketingManagerPPT = {
  generate: async (
    rawContent: any,
    roleConfig: RoleConfig,
    lang: 'es' | 'en',
    projectName: string
  ): Promise<void> => {
    try {
      const pptx      = new PptxGenJS();
      pptx.layout     = 'LAYOUT_16x9';
      const roleColor = ROLE_COLORS[roleConfig.roleId] || 'EC4899';
      const roleName  = roleConfig.displayName;
      const data      = extractMktData(rawContent);

      registerSectionMaster(pptx, roleColor, roleName);

      // ── Cover ─────────────────────────────────────────────────────────────
      const dateStr = new Date().toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
      });
      addCoverSlide(pptx, {
        title:       roleName,
        subtitle:    lang === 'es' ? 'Estrategia Go-To-Market' : 'Go-To-Market Strategy',
        projectName,
        date:        dateStr,
        roleColor,
        lang,
        roleId:      roleConfig.roleId,
      });

      // ── 01. Executive Summary ─────────────────────────────────────────────
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

      // ── 02. Unit Economics ────────────────────────────────────────────────
      const ue = data.unitEconomics;
      if (ue && Object.keys(ue).length > 0) {
        const ueSlide = pptx.addSlide({ masterName: 'SECTION_MASTER' });
        addSlideHeader(ueSlide, '02',
          lang === 'es' ? 'Economía Unitaria' : 'Unit Economics', roleColor);

        const kpiCards = [
          { label: 'CAC',                                              value: fmtCurrency(ue.cac),             color: 'DC2626' },
          { label: 'LTV',                                              value: fmtCurrency(ue.ltv),             color: '059669' },
          { label: 'LTV / CAC',                                        value: `${fmtNum(ue.ltvCacRatio, 1)}x`, color: '2563EB' },
          { label: lang === 'es' ? 'Payback (meses)' : 'Payback (mo)', value: `${fmtNum(ue.paybackMonths)}m`, color: 'D97706' },
        ];

        const gapX  = 0.18;
        const cardW = (SLIDE.CONTENT_W - gapX * 3) / 4;
        const cardH = SLIDE.CONTENT_H - 0.3;

        kpiCards.forEach((kpi, i) => {
          const x = SLIDE.MARGIN_X + i * (cardW + gapX);
          const y = SLIDE.CONTENT_Y;

          addPremiumCard(ueSlide, {
            x, y, w: cardW, h: cardH,
            accentColor: kpi.color, accentSide: 'top', bgColor: 'FFFFFF',
          });

          ueSlide.addText(kpi.label, {
            x: x + 0.1, y: y + 0.25, w: cardW - 0.2, h: 0.4,
            fontSize: FONT.CAPTION, color: TEXT_M,
            fontFace: 'Helvetica', align: 'center',
          });
          ueSlide.addText(kpi.value, {
            x: x + 0.1, y: y + 0.7, w: cardW - 0.2, h: 1.2,
            fontSize: FONT.CARD_VALUE, bold: true, color: kpi.color,
            fontFace: 'Helvetica', align: 'center', valign: 'middle',
          });
        });
      }

      // ── 03. Channel Strategy ──────────────────────────────────────────────
      if (data.channelStrategy.length > 0) {
        const chSlide = pptx.addSlide({ masterName: 'SECTION_MASTER' });
        addSlideHeader(chSlide, '03',
          lang === 'es' ? 'Estrategia de Canales' : 'Channel Strategy', roleColor);

        const headers = lang === 'es'
          ? ['Canal', 'Impacto', 'Presupuesto', 'Recomendado', 'Justificación']
          : ['Channel', 'Impact', 'Budget', 'Recommended', 'Rationale'];
        const COL_WIDTHS = [1.6, 0.9, 1.0, 1.2, 4.6];

        const channels = data.channelStrategy.slice(0, 8);
        const rowH = Math.min(0.42, (SLIDE.CONTENT_H - 0.1) / (channels.length + 1));

        const tableData = [
          headers.map((h, ci) => ({
            text: h,
            options: {
              fontSize: FONT.MICRO, bold: true, color: 'FFFFFF',
              align: ci === 0 ? 'left' as const : 'center' as const,
              fill: { color: roleColor },
            },
          })),
          ...channels.map((ch: any, idx: number) => {
            const fill     = { color: idx % 2 === 0 ? 'FFFFFF' : 'FDF2F8' };
            const recColor = ch.recommended ? '059669' : '6B7280';
            const recText  = ch.recommended
              ? (lang === 'es' ? '✓ Sí' : '✓ Yes')
              : (lang === 'es' ? 'No'  : 'No');
            return [
              { text: String(ch.canal ?? ch.channel ?? ''), options: { fontSize: FONT.MICRO, bold: true, color: TEXT_H, fill } },
              { text: String(ch.impact ?? ''), options: { fontSize: FONT.MICRO, color: TEXT_B, align: 'center' as const, fill } },
              { text: ch.budgetPct ? `${ch.budgetPct}%` : '—', options: { fontSize: FONT.MICRO, color: TEXT_B, align: 'center' as const, fill } },
              { text: recText, options: { fontSize: FONT.MICRO, bold: true, color: recColor, align: 'center' as const, fill } },
              { text: String(ch.rationale ?? '').substring(0, 80), options: { fontSize: FONT.MICRO, color: TEXT_B, fill } },
            ];
          }),
        ];

        chSlide.addTable(tableData, {
          x: SLIDE.MARGIN_X, y: SLIDE.CONTENT_Y,
          w: SLIDE.CONTENT_W, rowH,
          colW: COL_WIDTHS,
          border: { color: BORDER, pt: 0.5 },
        });
      }

      // ── 04. ROAS Scenarios ────────────────────────────────────────────────
      const roas = data.roasScenarios;
      const hasRoas = roas && (roas.conservative || roas.base || roas.aggressive);
      if (hasRoas) {
        const roasSlide = pptx.addSlide({ masterName: 'SECTION_MASTER' });
        addSlideHeader(roasSlide, '04',
          lang === 'es' ? 'Escenarios ROAS' : 'ROAS Scenarios', roleColor);

        const scenarios = [
          { label: lang === 'es' ? 'Conservador' : 'Conservative', data: roas.conservative ?? {}, color: 'D97706' },
          { label: lang === 'es' ? 'Base'         : 'Base',         data: roas.base ?? {},         color: '2563EB' },
          { label: lang === 'es' ? 'Agresivo'     : 'Aggressive',   data: roas.aggressive ?? {},   color: '059669' },
        ];

        const gapX  = 0.3;
        const cardW = (SLIDE.CONTENT_W - gapX * 2) / 3;
        const cardH = SLIDE.CONTENT_H - 0.2;

        scenarios.forEach((sc, i) => {
          const x = SLIDE.MARGIN_X + i * (cardW + gapX);
          const y = SLIDE.CONTENT_Y;

          addPremiumCard(roasSlide, {
            x, y, w: cardW, h: cardH,
            accentColor: sc.color, accentSide: 'top', bgColor: 'FFFFFF',
          });

          roasSlide.addText(sc.label, {
            x: x + 0.1, y: y + 0.15, w: cardW - 0.2, h: 0.4,
            fontSize: FONT.CARD_HEADING, bold: true, color: sc.color,
            fontFace: 'Helvetica', align: 'center',
          });

          roasSlide.addText(`ROAS ${fmtNum(sc.data.roas, 1)}x`, {
            x: x + 0.1, y: y + 0.6, w: cardW - 0.2, h: 0.7,
            fontSize: 20, bold: true, color: sc.color,
            fontFace: 'Helvetica', align: 'center', valign: 'middle',
          });

          roasSlide.addText(fmtCurrency(sc.data.monthlySales), {
            x: x + 0.1, y: y + 1.4, w: cardW - 0.2, h: 0.45,
            fontSize: FONT.BODY + 2, bold: true, color: TEXT_H,
            fontFace: 'Helvetica', align: 'center',
          });
          roasSlide.addText(lang === 'es' ? 'ventas/mes' : 'sales/month', {
            x: x + 0.1, y: y + 1.85, w: cardW - 0.2, h: 0.3,
            fontSize: FONT.MICRO, color: TEXT_M,
            fontFace: 'Helvetica', align: 'center',
          });

          const convPct = sc.data.convRate
            ? `${(parseFloat(String(sc.data.convRate)) * 100).toFixed(1)}%`
            : '—';
          roasSlide.addText(`Conv: ${convPct}`, {
            x: x + 0.1, y: y + cardH - 0.65, w: cardW - 0.2, h: 0.4,
            fontSize: FONT.MICRO, color: TEXT_M,
            fontFace: 'Helvetica', align: 'center',
          });
        });
      }

      // ── 05. Buyer Persona ─────────────────────────────────────────────────
      const bp = data.buyerPersona;
      if (bp && (bp.avatar || bp.painPoint || bp.goals)) {
        const bpSlide = pptx.addSlide({ masterName: 'SECTION_MASTER' });
        addSlideHeader(bpSlide, '05',
          lang === 'es' ? 'Buyer Persona' : 'Buyer Persona', roleColor);

        const leftW  = SLIDE.CONTENT_W * 0.47;
        const rightW = SLIDE.CONTENT_W * 0.49;
        const gapX   = SLIDE.CONTENT_W * 0.04;
        const leftX  = SLIDE.MARGIN_X;
        const rightX = SLIDE.MARGIN_X + leftW + gapX;

        // Left card: avatar + demographics + painPoint
        addPremiumCard(bpSlide, {
          x: leftX, y: SLIDE.CONTENT_Y,
          w: leftW, h: SLIDE.CONTENT_H - 0.1,
          accentColor: roleColor, accentSide: 'top', bgColor: 'FFFFFF',
        });

        const demo = bp.demographics ?? {};
        const demoLines = [
          bp.avatar ? `"${bp.avatar}"` : '',
          demo.age      ? `${lang === 'es' ? 'Edad:'      : 'Age:'      } ${demo.age}`      : '',
          demo.location ? `${lang === 'es' ? 'Ubicación:' : 'Location:' } ${demo.location}` : '',
          demo.income   ? `${lang === 'es' ? 'Ingresos:'  : 'Income:'   } ${demo.income}`   : '',
          bp.painPoint  ? `\n${lang === 'es' ? 'Dolor:' : 'Pain:'} ${bp.painPoint}` : '',
        ].filter(Boolean);

        bpSlide.addText(demoLines.join('\n'), {
          x: leftX + 0.15, y: SLIDE.CONTENT_Y + 0.15,
          w: leftW - 0.25, h: SLIDE.CONTENT_H - 0.5,
          fontSize: FONT.BODY, color: TEXT_B, fontFace: 'Helvetica',
          valign: 'top', wrap: true,
        });

        // Right card: goals + objections
        addPremiumCard(bpSlide, {
          x: rightX, y: SLIDE.CONTENT_Y,
          w: rightW, h: SLIDE.CONTENT_H - 0.1,
          accentColor: roleColor, accentSide: 'top', bgColor: 'FFFFFF',
        });

        const goals      = Array.isArray(bp.goals)      ? bp.goals      : [];
        const objections = Array.isArray(bp.objections)  ? bp.objections  : [];

        const rightLines = [
          lang === 'es' ? 'OBJETIVOS:' : 'GOALS:',
          ...goals.slice(0, 4).map((g: string) => `• ${g}`),
          '',
          lang === 'es' ? 'OBJECIONES:' : 'OBJECTIONS:',
          ...objections.slice(0, 3).map((o: string) => `• ${o}`),
        ];

        bpSlide.addText(rightLines.join('\n'), {
          x: rightX + 0.15, y: SLIDE.CONTENT_Y + 0.15,
          w: rightW - 0.25, h: SLIDE.CONTENT_H - 0.5,
          fontSize: FONT.BODY, color: TEXT_B, fontFace: 'Helvetica',
          valign: 'top', wrap: true,
        });
      }

      // ── 06. Messaging Framework ───────────────────────────────────────────
      const mf = data.messagingFw;
      if (mf && (mf.valueProposition || mf.keyMessages)) {
        const mfSlide = pptx.addSlide({ masterName: 'SECTION_MASTER' });
        addSlideHeader(mfSlide, '06',
          lang === 'es' ? 'Marco de Mensajería' : 'Messaging Framework', roleColor);

        // Top card: value proposition
        const vpH = 1.35;
        addPremiumCard(mfSlide, {
          x: SLIDE.MARGIN_X, y: SLIDE.CONTENT_Y,
          w: SLIDE.CONTENT_W, h: vpH,
          accentColor: roleColor, accentSide: 'left', bgColor: 'FDF2F8',
        });

        mfSlide.addText(lang === 'es' ? 'PROPUESTA DE VALOR' : 'VALUE PROPOSITION', {
          x: SLIDE.MARGIN_X + 0.25, y: SLIDE.CONTENT_Y + 0.1,
          w: SLIDE.CONTENT_W - 0.35, h: 0.28,
          fontSize: FONT.MICRO, bold: true, color: roleColor, fontFace: 'Helvetica',
        });
        mfSlide.addText(String(mf.valueProposition ?? '').substring(0, 220), {
          x: SLIDE.MARGIN_X + 0.25, y: SLIDE.CONTENT_Y + 0.38,
          w: SLIDE.CONTENT_W - 0.35, h: vpH - 0.55,
          fontSize: FONT.BODY, color: TEXT_H, fontFace: 'Helvetica',
          italic: true, valign: 'top', wrap: true,
        });

        // Key messages table
        const keyMessages = Array.isArray(mf.keyMessages) ? mf.keyMessages.slice(0, 5) : [];
        if (keyMessages.length > 0) {
          const tableY = SLIDE.CONTENT_Y + vpH + 0.15;
          const tableH = SLIDE.CONTENT_H - vpH - 0.25;
          const headers = lang === 'es'
            ? ['Audiencia', 'Mensaje', 'Tono']
            : ['Audience', 'Message', 'Tone'];
          const COL_WIDTHS = [1.8, 6.2, 1.3];
          const rowH = Math.min(0.40, tableH / (keyMessages.length + 1));

          const tableData = [
            headers.map((h, ci) => ({
              text: h,
              options: {
                fontSize: FONT.MICRO, bold: true, color: 'FFFFFF',
                align: ci === 0 ? 'left' as const : 'center' as const,
                fill: { color: roleColor },
              },
            })),
            ...keyMessages.map((km: any, idx: number) => {
              const fill = { color: idx % 2 === 0 ? 'FFFFFF' : 'FDF2F8' };
              return [
                { text: String(km.audience ?? ''), options: { fontSize: FONT.MICRO, bold: true, color: roleColor, fill } },
                { text: String(km.message ?? '').substring(0, 100), options: { fontSize: FONT.MICRO, color: TEXT_B, fill } },
                { text: String(km.tone ?? ''), options: { fontSize: FONT.MICRO, color: TEXT_M, align: 'center' as const, fill } },
              ];
            }),
          ];

          mfSlide.addTable(tableData, {
            x: SLIDE.MARGIN_X, y: tableY,
            w: SLIDE.CONTENT_W, rowH,
            colW: COL_WIDTHS,
            border: { color: BORDER, pt: 0.5 },
          });
        }
      }

      // ── 07. Competitive Landscape ─────────────────────────────────────────
      if (data.competitiveMap.length > 0) {
        const compSlide = pptx.addSlide({ masterName: 'SECTION_MASTER' });
        addSlideHeader(compSlide, '07',
          lang === 'es' ? 'Mapa Competitivo' : 'Competitive Landscape', roleColor);

        const headers = lang === 'es'
          ? ['Competidor', 'Precio', 'Valor', 'Fortaleza', 'Diferenciación']
          : ['Competitor', 'Price', 'Value', 'Strength', 'Differentiation'];
        const COL_WIDTHS = [1.8, 0.8, 0.8, 2.6, 3.3];

        const comps = data.competitiveMap.slice(0, 8);
        const rowH  = Math.min(0.42, (SLIDE.CONTENT_H - 0.1) / (comps.length + 1));

        const tableData = [
          headers.map((h, ci) => ({
            text: h,
            options: {
              fontSize: FONT.MICRO, bold: true, color: 'FFFFFF',
              align: ci === 0 ? 'left' as const : 'center' as const,
              fill: { color: roleColor },
            },
          })),
          ...comps.map((comp: any, idx: number) => {
            const isUs  = comp.isUs === true;
            const fill  = isUs
              ? { color: 'FDF2F8' }
              : { color: idx % 2 === 0 ? 'FFFFFF' : 'F9FAFB' };
            return [
              { text: String(comp.name ?? ''), options: { fontSize: FONT.MICRO, bold: isUs, color: isUs ? roleColor : TEXT_H, fill } },
              { text: String(comp.price ?? ''), options: { fontSize: FONT.MICRO, color: TEXT_B, align: 'center' as const, fill } },
              { text: String(comp.value ?? ''), options: { fontSize: FONT.MICRO, color: TEXT_B, align: 'center' as const, fill } },
              { text: String(comp.strength ?? '').substring(0, 40), options: { fontSize: FONT.MICRO, color: TEXT_B, fill } },
              { text: String(comp.differentiation ?? '').substring(0, 55), options: { fontSize: FONT.MICRO, color: TEXT_B, fill } },
            ];
          }),
        ];

        compSlide.addTable(tableData, {
          x: SLIDE.MARGIN_X, y: SLIDE.CONTENT_Y,
          w: SLIDE.CONTENT_W, rowH,
          colW: COL_WIDTHS,
          border: { color: BORDER, pt: 0.5 },
        });
      }

      // ── Closing ───────────────────────────────────────────────────────────
      const closingSlide = pptx.addSlide();
      addClosingSlide(closingSlide, {
        roleColor,
        roleId:      roleConfig.roleId,
        projectName,
        lang,
      });

      // ── Save ──────────────────────────────────────────────────────────────
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
        lang === 'es'
          ? 'Error al generar presentación Marketing Manager'
          : 'Error generating Marketing Manager presentation',
        'marketingManagerPPT.generate',
        error
      );
    }
  },
};
