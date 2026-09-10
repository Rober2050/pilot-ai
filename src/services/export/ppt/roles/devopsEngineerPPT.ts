/**
 * devopsEngineerPPT.ts — Specialist PPT Generator for DevOps Engineer Role
 *
 * C-Level infrastructure & reliability presentation.
 * Reads rawContent.dashboard directly — DEVOPS_ENGINEER_PROTOCOL uses tabs[] structure.
 *
 * Data extracted from DEVOPS_ENGINEER_PROTOCOL:
 *   dashboard.summary              → Executive Summary slide
 *   dashboard.kpis[]               → Infrastructure KPI Dashboard
 *   tabs['cicd-pipeline'].data[]   → CI/CD Pipeline table
 *   tabs['monitoring'].data[]      → Monitoring & Observability table
 *   tabs['security'].data[]        → Security & Compliance table
 *   tabs['slos'].data[]            → SLOs & Reliability cards
 *   tabs['aws-costs'].data[]       → AWS Cost Estimate table
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

// Priority color mapping
const PRIORITY_COLORS: Record<string, string> = {
  Critical: 'DC2626',
  High:     'D97706',
  Medium:   '2563EB',
  Low:      '059669',
  Crítico:  'DC2626',
  Alto:     'D97706',
  Medio:    '2563EB',
  Bajo:     '059669',
};

interface DevOpsData {
  summary:      string;
  kpis:         any[];
  cicdPipeline: any[];
  monitoring:   any[];
  security:     any[];
  slos:         any[];
  awsCosts:     any[];
}

function findTab(tabs: any[], id: string): any[] {
  if (!Array.isArray(tabs)) return [];
  const tab = tabs.find((t: any) => t.id === id);
  return Array.isArray(tab?.data) ? tab.data : [];
}

function extractDevOpsData(rawContent: any): DevOpsData {
  const d    = rawContent?.dashboard ?? rawContent ?? {};
  const tabs = Array.isArray(d.tabs) ? d.tabs : [];
  return {
    summary:      typeof d.summary === 'string' ? d.summary : '',
    kpis:         Array.isArray(d.kpis) ? d.kpis : [],
    cicdPipeline: findTab(tabs, 'cicd-pipeline'),
    monitoring:   findTab(tabs, 'monitoring'),
    security:     findTab(tabs, 'security'),
    slos:         findTab(tabs, 'slos'),
    awsCosts:     findTab(tabs, 'aws-costs'),
  };
}

function headerRow(labels: string[], roleColor: string): any[] {
  return labels.map(h => ({
    text: h,
    options: {
      bold: true, color: 'FFFFFF', fontSize: FONT.CAPTION,
      fill: { color: roleColor }, align: 'center' as const,
    },
  }));
}

export const devopsEngineerPPT = {
  generate: async (
    rawContent: any,
    roleConfig: RoleConfig,
    lang: 'es' | 'en',
    projectName: string
  ): Promise<void> => {
    try {
      const pptx      = new PptxGenJS();
      pptx.layout     = 'LAYOUT_16x9';
      const roleColor = ROLE_COLORS[roleConfig.roleId] || 'F97316';
      const roleName  = roleConfig.displayName;
      const data      = extractDevOpsData(rawContent);
      const es        = lang === 'es';

      // ── 1. Master ────────────────────────────────────────────────────────
      registerSectionMaster(pptx, roleColor, roleName);

      // ── 2. Cover ─────────────────────────────────────────────────────────
      const dateStr = new Date().toLocaleDateString(es ? 'es-ES' : 'en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
      });
      addCoverSlide(pptx, {
        title:       roleName,
        subtitle:    es ? 'Infraestructura & Confiabilidad' : 'Infrastructure & Reliability',
        projectName,
        date:        dateStr,
        roleColor,
        lang,
        roleId:      roleConfig.roleId,
      });

      let slideNum = 1;

      // ── 3. Executive Summary ──────────────────────────────────────────────
      if (data.summary) {
        const slide = pptx.addSlide({ masterName: 'SECTION_MASTER' });
        addSlideHeader(slide, `0${slideNum++}`,
          es ? 'Resumen Ejecutivo' : 'Executive Summary', roleColor);

        addPremiumCard(slide, {
          x: SLIDE.MARGIN_X, y: SLIDE.CONTENT_Y,
          w: SLIDE.CONTENT_W, h: SLIDE.CONTENT_H - 0.1,
          accentColor: roleColor, accentSide: 'left', bgColor: 'FFFFFF',
        });
        slide.addText(data.summary, {
          x: SLIDE.MARGIN_X + 0.25, y: SLIDE.CONTENT_Y + 0.15,
          w: SLIDE.CONTENT_W - 0.35, h: SLIDE.CONTENT_H - 0.4,
          fontSize: FONT.BODY, color: TEXT_B, fontFace: 'Helvetica',
          valign: 'top', wrap: true,
        });
      }

      // ── 4. Infrastructure KPI Dashboard ───────────────────────────────────
      if (data.kpis.length > 0) {
        const slide = pptx.addSlide({ masterName: 'SECTION_MASTER' });
        addSlideHeader(slide, `0${slideNum++}`,
          es ? 'Métricas de Infraestructura' : 'Infrastructure KPIs', roleColor);

        const kpis  = data.kpis.slice(0, 4);
        const cols  = Math.min(kpis.length, 4);
        const gapX  = 0.18;
        const cardW = (SLIDE.CONTENT_W - gapX * (cols - 1)) / cols;
        const cardH = SLIDE.CONTENT_H - 0.3;

        kpis.forEach((kpi: any, i: number) => {
          const x = SLIDE.MARGIN_X + i * (cardW + gapX);
          const y = SLIDE.CONTENT_Y;

          addPremiumCard(slide, {
            x, y, w: cardW, h: cardH,
            accentColor: roleColor, accentSide: 'top', bgColor: 'FFFFFF',
          });
          slide.addText(String(kpi.label ?? ''), {
            x: x + 0.1, y: y + 0.25, w: cardW - 0.2, h: 0.4,
            fontSize: FONT.CAPTION, color: TEXT_M, fontFace: 'Helvetica', align: 'center',
          });
          slide.addText(String(kpi.value ?? ''), {
            x: x + 0.1, y: y + 0.7, w: cardW - 0.2, h: 1.1,
            fontSize: 24, bold: true, color: roleColor, fontFace: 'Helvetica',
            align: 'center', valign: 'middle',
          });
          if (kpi.trendValue) {
            slide.addText(String(kpi.trendValue).substring(0, 35), {
              x: x + 0.1, y: y + 1.85, w: cardW - 0.2, h: 0.5,
              fontSize: FONT.MICRO, color: TEXT_M, fontFace: 'Helvetica',
              align: 'center', wrap: true,
            });
          }
        });
      }

      // ── 5. CI/CD Pipeline ─────────────────────────────────────────────────
      if (data.cicdPipeline.length > 0) {
        const slide = pptx.addSlide({ masterName: 'SECTION_MASTER' });
        addSlideHeader(slide, `0${slideNum++}`,
          es ? 'Pipeline CI/CD' : 'CI/CD Pipeline', roleColor);

        const rows   = data.cicdPipeline.slice(0, 7);
        const rowH   = Math.min(0.44, (SLIDE.CONTENT_H - 0.1) / (rows.length + 1));
        const headers = es
          ? ['Etapa', 'Herramienta', 'Disparador', 'Quality Gate', 'Aprobaciones']
          : ['Stage', 'Tool', 'Trigger', 'Quality Gate', 'Approvals'];

        const tableData: any[][] = [
          headerRow(headers, roleColor),
          ...rows.map((r: any, i: number) => {
            const bg = i % 2 === 0 ? 'FFFFFF' : 'F8FAFC';
            return [
              { text: String(r.Stage ?? r.Etapa ?? '').substring(0, 30),         options: { fontSize: FONT.MICRO, color: roleColor, bold: true, fill: { color: bg } } },
              { text: String(r.Tool ?? r.Herramienta ?? '').substring(0, 30),    options: { fontSize: FONT.MICRO, color: TEXT_H, bold: true, fill: { color: bg } } },
              { text: String(r.Trigger ?? r.Disparador ?? '').substring(0, 35),  options: { fontSize: FONT.MICRO, color: TEXT_B, fill: { color: bg } } },
              { text: String(r['Quality Gate'] ?? '').substring(0, 55),          options: { fontSize: FONT.MICRO, color: TEXT_B, fill: { color: bg } } },
              { text: String(r.Approvals ?? r.Aprobaciones ?? '').substring(0, 25), options: { fontSize: FONT.MICRO, color: TEXT_M, align: 'center' as const, fill: { color: bg } } },
            ];
          }),
        ];

        slide.addTable(tableData, {
          x: SLIDE.MARGIN_X, y: SLIDE.CONTENT_Y,
          w: SLIDE.CONTENT_W, rowH,
          border: { color: BORDER, pt: 0.5 },
          colW: [1.8, 2.0, 2.4, 3.4, 1.2],
        });
      }

      // ── 6. Monitoring & Observability ─────────────────────────────────────
      if (data.monitoring.length > 0) {
        const slide = pptx.addSlide({ masterName: 'SECTION_MASTER' });
        addSlideHeader(slide, `0${slideNum++}`,
          es ? 'Monitoreo y Observabilidad' : 'Monitoring & Observability', roleColor);

        const rows   = data.monitoring.slice(0, 6);
        const rowH   = Math.min(0.44, (SLIDE.CONTENT_H - 0.1) / (rows.length + 1));
        const headers = es
          ? ['Capa', 'Herramienta', 'Métricas Clave', 'Umbral de Alerta', 'Acción']
          : ['Layer', 'Tool', 'Key Metrics', 'Alert Threshold', 'On-Call Action'];

        const tableData: any[][] = [
          headerRow(headers, roleColor),
          ...rows.map((r: any, i: number) => {
            const bg = i % 2 === 0 ? 'FFFFFF' : 'F8FAFC';
            return [
              { text: String(r.Layer ?? r.Capa ?? '').substring(0, 20),                    options: { fontSize: FONT.MICRO, color: roleColor, bold: true, fill: { color: bg } } },
              { text: String(r.Tool ?? r.Herramienta ?? '').substring(0, 30),              options: { fontSize: FONT.MICRO, color: TEXT_H, bold: true, fill: { color: bg } } },
              { text: String(r['Key Metrics'] ?? r['Métricas Clave'] ?? '').substring(0, 60), options: { fontSize: FONT.MICRO, color: TEXT_B, fill: { color: bg } } },
              { text: String(r['Alert Threshold'] ?? r['Umbral de Alerta'] ?? '').substring(0, 50), options: { fontSize: FONT.MICRO, color: TEXT_M, fill: { color: bg } } },
              { text: String(r['On-Call Action'] ?? r.Acción ?? '').substring(0, 45),      options: { fontSize: FONT.MICRO, color: TEXT_M, fill: { color: bg } } },
            ];
          }),
        ];

        slide.addTable(tableData, {
          x: SLIDE.MARGIN_X, y: SLIDE.CONTENT_Y,
          w: SLIDE.CONTENT_W, rowH,
          border: { color: BORDER, pt: 0.5 },
          colW: [1.3, 1.9, 2.8, 2.4, 2.4],
        });
      }

      // ── 7. Security & Compliance ──────────────────────────────────────────
      if (data.security.length > 0) {
        const slide = pptx.addSlide({ masterName: 'SECTION_MASTER' });
        addSlideHeader(slide, `0${slideNum++}`,
          es ? 'Seguridad y Cumplimiento' : 'Security & Compliance', roleColor);

        const rows   = data.security.slice(0, 8);
        const rowH   = Math.min(0.44, (SLIDE.CONTENT_H - 0.1) / (rows.length + 1));
        const headers = es
          ? ['Capa', 'Control', 'Herramienta', 'OWASP/CIS', 'Estado']
          : ['Layer', 'Control', 'Tool', 'OWASP/CIS Ref', 'Status'];

        const tableData: any[][] = [
          headerRow(headers, roleColor),
          ...rows.map((r: any, i: number) => {
            const bg = i % 2 === 0 ? 'FFFFFF' : 'F8FAFC';
            const statusColor = r.Status === 'Enforced' ? 'DC2626' : '059669';
            return [
              { text: String(r.Layer ?? r.Capa ?? '').substring(0, 20),            options: { fontSize: FONT.MICRO, color: roleColor, bold: true, fill: { color: bg } } },
              { text: String(r.Control ?? '').substring(0, 40),                    options: { fontSize: FONT.MICRO, color: TEXT_H, bold: true, fill: { color: bg } } },
              { text: String(r.Tool ?? r.Herramienta ?? '').substring(0, 35),      options: { fontSize: FONT.MICRO, color: TEXT_B, fill: { color: bg } } },
              { text: String(r['OWASP/CIS Ref'] ?? r['OWASP/CIS'] ?? '').substring(0, 25), options: { fontSize: FONT.MICRO, color: TEXT_M, align: 'center' as const, fill: { color: bg } } },
              { text: String(r.Status ?? r.Estado ?? '').substring(0, 20),         options: { fontSize: FONT.MICRO, color: statusColor, bold: true, align: 'center' as const, fill: { color: bg } } },
            ];
          }),
        ];

        slide.addTable(tableData, {
          x: SLIDE.MARGIN_X, y: SLIDE.CONTENT_Y,
          w: SLIDE.CONTENT_W, rowH,
          border: { color: BORDER, pt: 0.5 },
          colW: [1.3, 2.8, 2.4, 1.7, 1.6],
        });
      }

      // ── 8. SLOs & Reliability (3-col cards) ──────────────────────────────
      if (data.slos.length > 0) {
        const slide = pptx.addSlide({ masterName: 'SECTION_MASTER' });
        addSlideHeader(slide, `0${slideNum++}`,
          es ? 'SLOs y Confiabilidad' : 'SLOs & Reliability', roleColor);

        const slos  = data.slos.slice(0, 3);
        const cols  = slos.length;
        const gapX  = 0.22;
        const cardW = (SLIDE.CONTENT_W - gapX * (cols - 1)) / cols;
        const cardH = SLIDE.CONTENT_H - 0.1;

        slos.forEach((slo: any, i: number) => {
          const x = SLIDE.MARGIN_X + i * (cardW + gapX);
          const y = SLIDE.CONTENT_Y;
          const pColor = PRIORITY_COLORS[slo.priority] ?? roleColor;

          addPremiumCard(slide, {
            x, y, w: cardW, h: cardH,
            accentColor: pColor, accentSide: 'top', bgColor: 'FFFFFF',
          });

          // SLO attribute title
          slide.addText(String(slo.attribute ?? '').substring(0, 35), {
            x: x + 0.12, y: y + 0.22, w: cardW - 0.24, h: 0.4,
            fontSize: FONT.BODY, color: TEXT_H, bold: true, fontFace: 'Helvetica',
            wrap: true,
          });

          // Measure (large highlight)
          const measure = String(slo.measure ?? '').substring(0, 35);
          slide.addText(measure, {
            x: x + 0.12, y: y + 0.65, w: cardW - 0.24, h: 0.55,
            fontSize: 15, bold: true, color: pColor, fontFace: 'Helvetica',
            wrap: true, valign: 'middle',
          });

          // Priority badge
          slide.addText(String(slo.priority ?? ''), {
            x: x + 0.12, y: y + 1.22, w: cardW - 0.24, h: 0.28,
            fontSize: FONT.MICRO, color: pColor, bold: true, fontFace: 'Helvetica',
          });

          // Tactics
          const tactics: string[] = Array.isArray(slo.tactics) ? slo.tactics.slice(0, 3) : [];
          let tacticY = y + 1.58;
          for (const tactic of tactics) {
            slide.addText(`• ${String(tactic).substring(0, 48)}`, {
              x: x + 0.12, y: tacticY, w: cardW - 0.24, h: 0.32,
              fontSize: FONT.MICRO, color: TEXT_M, fontFace: 'Helvetica', wrap: true,
            });
            tacticY += 0.3;
          }
        });
      }

      // ── 9. AWS Cost Estimate ──────────────────────────────────────────────
      if (data.awsCosts.length > 0) {
        const slide = pptx.addSlide({ masterName: 'SECTION_MASTER' });
        addSlideHeader(slide, `0${slideNum++}`,
          es ? 'Estimación de Costos Cloud' : 'Cloud Cost Estimate', roleColor);

        const rows    = data.awsCosts.slice(0, 9);
        const rowH    = Math.min(0.44, (SLIDE.CONTENT_H - 0.1) / (rows.length + 1));
        const headers = es
          ? ['Componente', 'Servicio AWS', 'Configuración', 'Costo Mensual (USD)']
          : ['Component', 'AWS Service', 'Size / Config', 'Est. Monthly ($)'];

        const tableData: any[][] = [
          headerRow(headers, roleColor),
          ...rows.map((r: any, i: number) => {
            const isTotal = String(r.Component ?? r.Componente ?? '').toLowerCase().includes('total');
            const bg      = isTotal ? 'FFF7ED' : (i % 2 === 0 ? 'FFFFFF' : 'F8FAFC');
            const textColor = isTotal ? roleColor : TEXT_B;
            return [
              { text: String(r.Component ?? r.Componente ?? '').substring(0, 40),          options: { fontSize: FONT.MICRO, color: textColor, bold: isTotal, fill: { color: bg } } },
              { text: String(r['AWS Service'] ?? r['Servicio AWS'] ?? '').substring(0, 35), options: { fontSize: FONT.MICRO, color: isTotal ? roleColor : TEXT_H, bold: isTotal, fill: { color: bg } } },
              { text: String(r['Size / Config'] ?? r.Configuración ?? '').substring(0, 35), options: { fontSize: FONT.MICRO, color: TEXT_M, fill: { color: bg } } },
              { text: String(r['Est. Monthly ($)'] ?? r['Costo Mensual (USD)'] ?? '').substring(0, 20), options: { fontSize: FONT.MICRO, color: textColor, bold: isTotal, align: 'center' as const, fill: { color: bg } } },
            ];
          }),
        ];

        slide.addTable(tableData, {
          x: SLIDE.MARGIN_X, y: SLIDE.CONTENT_Y,
          w: SLIDE.CONTENT_W, rowH,
          border: { color: BORDER, pt: 0.5 },
          colW: [2.8, 2.8, 2.6, 1.6],
        });
      }

      // ── 10. Closing ───────────────────────────────────────────────────────
      const closingSlide = pptx.addSlide();
      addClosingSlide(closingSlide, {
        roleColor,
        roleId: roleConfig.roleId,
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
        es ? 'Presentación generada con éxito' : 'Presentation generated successfully'
      );
    } catch (error) {
      notificationService.showError(
        lang === 'es'
          ? 'Error al generar presentación DevOps Engineer'
          : 'Error generating DevOps Engineer presentation',
        'devopsEngineerPPT.generate',
        error
      );
    }
  },
};
