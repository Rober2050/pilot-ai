/**
 * qaEngineerPPT.ts — Specialist PPT Generator for QA Engineer Role
 *
 * C-Level quality presentation for Quality Assurance strategy.
 * Reads rawContent directly from AI output — bypasses generic normalizer.
 *
 * Data extracted from QA_PROTOCOL (direct dashboard fields, no tabs):
 *   dashboard.summary          → Executive Summary slide
 *   dashboard.kpis[]           → KPI Dashboard (Release Readiness, Critical Risks, etc.)
 *   dashboard.criticalScenarios[] → Critical Scenarios table
 *   dashboard.risks[]          → Risk Matrix table
 *   dashboard.criticalPaths[]  → Critical User Journeys 2-col layout
 *   dashboard.testingPyramid   → Testing Pyramid 3-card visual
 *   dashboard.qaStack          → QA Tech Stack table
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

// Priority color mapping for QA items
const PRIORITY_COLORS: Record<string, string> = {
  Critical: 'DC2626',
  High:     'D97706',
  Medium:   '2563EB',
  Low:      '059669',
  // Spanish variants
  Crítico:  'DC2626',
  Alto:     'D97706',
  Medio:    '2563EB',
  Bajo:     '059669',
};

interface QAData {
  summary:           string;
  kpis:              any[];
  criticalScenarios: any[];
  risks:             any[];
  criticalPaths:     any[];
  testingPyramid:    any;
  qaStack:           any;
}

function extractQAData(rawContent: any): QAData {
  const d = rawContent?.dashboard ?? rawContent ?? {};
  return {
    summary:           typeof d.summary === 'string' ? d.summary : '',
    kpis:              Array.isArray(d.kpis) ? d.kpis : [],
    criticalScenarios: Array.isArray(d.criticalScenarios) ? d.criticalScenarios : [],
    risks:             Array.isArray(d.risks) ? d.risks : [],
    criticalPaths:     Array.isArray(d.criticalPaths) ? d.criticalPaths : [],
    testingPyramid:    d.testingPyramid && typeof d.testingPyramid === 'object' ? d.testingPyramid : null,
    qaStack:           d.qaStack && typeof d.qaStack === 'object' ? d.qaStack : null,
  };
}

// Build a styled table row with alternating background
function styleRow(cells: string[], roleColor: string, idx: number, widths?: number[]): any[] {
  const bg = idx % 2 === 0 ? 'FFFFFF' : 'F8FAFC';
  return cells.map((text, ci) => ({
    text: text.substring(0, ci === 0 ? 60 : 100),
    options: {
      fontSize: FONT.MICRO,
      color: ci === 0 ? roleColor : TEXT_B,
      bold: ci === 0,
      fill: { color: bg },
      align: (ci === 0 ? 'left' : 'left') as 'left',
    },
  }));
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

export const qaEngineerPPT = {
  generate: async (
    rawContent: any,
    roleConfig: RoleConfig,
    lang: 'es' | 'en',
    projectName: string
  ): Promise<void> => {
    try {
      const pptx      = new PptxGenJS();
      pptx.layout     = 'LAYOUT_16x9';
      const roleColor = ROLE_COLORS[roleConfig.roleId] || '10B981';
      const roleName  = roleConfig.displayName;
      const data      = extractQAData(rawContent);
      const es        = lang === 'es';

      // ── 1. Master ────────────────────────────────────────────────────────
      registerSectionMaster(pptx, roleColor, roleName);

      // ── 2. Cover ─────────────────────────────────────────────────────────
      const dateStr = new Date().toLocaleDateString(es ? 'es-ES' : 'en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
      });
      addCoverSlide(pptx, {
        title:       roleName,
        subtitle:    es ? 'Estrategia de Calidad y Testing' : 'Quality & Testing Strategy',
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

      // ── 4. KPI Dashboard ─────────────────────────────────────────────────
      if (data.kpis.length > 0) {
        const slide = pptx.addSlide({ masterName: 'SECTION_MASTER' });
        addSlideHeader(slide, `0${slideNum++}`,
          es ? 'Panel de Calidad' : 'Quality Dashboard', roleColor);

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
            x: x + 0.1, y: y + 0.7, w: cardW - 0.2, h: 1.2,
            fontSize: 28, bold: true, color: roleColor, fontFace: 'Helvetica',
            align: 'center', valign: 'middle',
          });
        });
      }

      // ── 5. Critical Scenarios ─────────────────────────────────────────────
      if (data.criticalScenarios.length > 0) {
        const slide = pptx.addSlide({ masterName: 'SECTION_MASTER' });
        addSlideHeader(slide, `0${slideNum++}`,
          es ? 'Escenarios Críticos' : 'Critical Scenarios', roleColor);

        const scenarios = data.criticalScenarios.slice(0, 8);
        const rowH = Math.min(0.44, (SLIDE.CONTENT_H - 0.1) / (scenarios.length + 1));
        const headers = es
          ? ['Escenario', 'Prioridad', 'Cobertura', 'Descripción']
          : ['Scenario', 'Priority', 'Coverage', 'Description'];

        const tableData: any[][] = [
          headerRow(headers, roleColor),
          ...scenarios.map((s: any, i: number) => {
            const pColor = PRIORITY_COLORS[s.priority] ?? TEXT_M;
            const bg = i % 2 === 0 ? 'FFFFFF' : 'F8FAFC';
            return [
              { text: String(s.name ?? '').substring(0, 40), options: { fontSize: FONT.MICRO, color: roleColor, bold: true, fill: { color: bg } } },
              { text: String(s.priority ?? ''), options: { fontSize: FONT.MICRO, color: pColor, bold: true, align: 'center' as const, fill: { color: bg } } },
              { text: s.coverage !== undefined ? `${s.coverage}%` : '', options: { fontSize: FONT.MICRO, color: TEXT_M, align: 'center' as const, fill: { color: bg } } },
              { text: String(s.description ?? '').substring(0, 80), options: { fontSize: FONT.MICRO, color: TEXT_B, fill: { color: bg } } },
            ];
          }),
        ];

        slide.addTable(tableData, {
          x: SLIDE.MARGIN_X, y: SLIDE.CONTENT_Y,
          w: SLIDE.CONTENT_W, rowH,
          border: { color: BORDER, pt: 0.5 },
          colW: [2.4, 1.2, 1.0, 4.2],
        });
      }

      // ── 6. Risk Matrix ────────────────────────────────────────────────────
      if (data.risks.length > 0) {
        const slide = pptx.addSlide({ masterName: 'SECTION_MASTER' });
        addSlideHeader(slide, `0${slideNum++}`,
          es ? 'Matriz de Riesgos' : 'Risk Matrix', roleColor);

        const risks  = data.risks.slice(0, 9);
        const rowH   = Math.min(0.44, (SLIDE.CONTENT_H - 0.1) / (risks.length + 1));
        const headers = es
          ? ['Riesgo', 'Impacto', 'Probabilidad', 'Responsable', 'Mitigación']
          : ['Risk', 'Impact', 'Probability', 'Owner', 'Mitigation'];

        const tableData: any[][] = [
          headerRow(headers, roleColor),
          ...risks.map((r: any, i: number) => {
            const impactColor = PRIORITY_COLORS[r.impact] ?? TEXT_M;
            const bg = i % 2 === 0 ? 'FFFFFF' : 'F8FAFC';
            return [
              { text: String(r.name ?? '').substring(0, 40), options: { fontSize: FONT.MICRO, color: roleColor, bold: true, fill: { color: bg } } },
              { text: String(r.impact ?? ''), options: { fontSize: FONT.MICRO, color: impactColor, bold: true, align: 'center' as const, fill: { color: bg } } },
              { text: String(r.probability ?? ''), options: { fontSize: FONT.MICRO, color: TEXT_M, align: 'center' as const, fill: { color: bg } } },
              { text: String(r.owner ?? ''), options: { fontSize: FONT.MICRO, color: TEXT_M, align: 'center' as const, fill: { color: bg } } },
              { text: String(r.mitigation ?? '').substring(0, 80), options: { fontSize: FONT.MICRO, color: TEXT_B, fill: { color: bg } } },
            ];
          }),
        ];

        slide.addTable(tableData, {
          x: SLIDE.MARGIN_X, y: SLIDE.CONTENT_Y,
          w: SLIDE.CONTENT_W, rowH,
          border: { color: BORDER, pt: 0.5 },
          colW: [2.2, 1.1, 1.2, 1.4, 2.9],
        });
      }

      // ── 7. Critical User Journeys (2-col) ─────────────────────────────────
      if (data.criticalPaths.length > 0) {
        const slide = pptx.addSlide({ masterName: 'SECTION_MASTER' });
        addSlideHeader(slide, `0${slideNum++}`,
          es ? 'Flujos Críticos de Usuario' : 'Critical User Journeys', roleColor);

        const paths  = data.criticalPaths.slice(0, 4);
        const gapX   = 0.3;
        const colW   = (SLIDE.CONTENT_W - gapX) / 2;
        const half   = Math.ceil(paths.length / 2);
        const left   = paths.slice(0, half);
        const right  = paths.slice(half);

        // Background cards
        addPremiumCard(slide, {
          x: SLIDE.MARGIN_X, y: SLIDE.CONTENT_Y,
          w: colW, h: SLIDE.CONTENT_H - 0.1,
          accentColor: roleColor, accentSide: 'top', bgColor: 'FFFFFF',
        });
        if (right.length > 0) {
          addPremiumCard(slide, {
            x: SLIDE.MARGIN_X + colW + gapX, y: SLIDE.CONTENT_Y,
            w: colW, h: SLIDE.CONTENT_H - 0.1,
            accentColor: roleColor, accentSide: 'top', bgColor: 'FFFFFF',
          });
        }

        const renderJourneys = (items: any[], startX: number) => {
          let y = SLIDE.CONTENT_Y + 0.22;
          for (const path of items) {
            const journeyTitle = String(path.journey ?? path.name ?? '').substring(0, 50);
            const steps: string[] = Array.isArray(path.steps) ? path.steps.slice(0, 3) : [];
            const mustPass = path.mustPassBeforeLaunch === true;

            // Accent bar
            slide.addShape('rect', {
              x: startX, y: y + 0.05, w: 0.06, h: 0.26,
              fill: { color: mustPass ? 'DC2626' : roleColor },
              line: { color: mustPass ? 'DC2626' : roleColor, width: 0 },
            });
            // Journey title
            slide.addText(journeyTitle, {
              x: startX + 0.14, y,
              w: colW - 0.2, h: 0.38,
              fontSize: FONT.BODY, color: TEXT_H, bold: true, fontFace: 'Helvetica',
              valign: 'middle', wrap: true,
            });
            y += 0.4;

            // Steps as bullet points
            for (const step of steps) {
              slide.addText(`• ${String(step).substring(0, 55)}`, {
                x: startX + 0.18, y,
                w: colW - 0.28, h: 0.3,
                fontSize: FONT.MICRO, color: TEXT_M, fontFace: 'Helvetica', wrap: true,
              });
              y += 0.28;
            }
            y += 0.1;
          }
        };

        renderJourneys(left, SLIDE.MARGIN_X + 0.1);
        if (right.length > 0) renderJourneys(right, SLIDE.MARGIN_X + colW + gapX + 0.1);
      }

      // ── 8. Testing Pyramid ────────────────────────────────────────────────
      if (data.testingPyramid) {
        const slide = pptx.addSlide({ masterName: 'SECTION_MASTER' });
        addSlideHeader(slide, `0${slideNum++}`,
          es ? 'Pirámide de Testing' : 'Testing Pyramid', roleColor);

        const pyramid = data.testingPyramid;
        const levels: Array<{ key: string; label: string; color: string }> = [
          { key: 'unit',        label: es ? 'Pruebas Unitarias' : 'Unit Tests',        color: roleColor },
          { key: 'integration', label: es ? 'Pruebas de Integración' : 'Integration Tests', color: '2563EB' },
          { key: 'e2e',         label: es ? 'Pruebas E2E' : 'E2E Tests',               color: 'D97706' },
        ];

        const gapX  = 0.25;
        const cardW = (SLIDE.CONTENT_W - gapX * (levels.length - 1)) / levels.length;
        const cardH = SLIDE.CONTENT_H - 0.3;

        levels.forEach(({ key, label, color }, i) => {
          const lvl = pyramid[key] ?? {};
          const pct = lvl.pct !== undefined ? `${lvl.pct}%` : '';
          const rationale = typeof lvl.rationale === 'string' ? lvl.rationale.substring(0, 120) : '';
          const x = SLIDE.MARGIN_X + i * (cardW + gapX);
          const y = SLIDE.CONTENT_Y;

          addPremiumCard(slide, {
            x, y, w: cardW, h: cardH,
            accentColor: color, accentSide: 'top', bgColor: 'FFFFFF',
          });

          // Label
          slide.addText(label, {
            x: x + 0.1, y: y + 0.25, w: cardW - 0.2, h: 0.4,
            fontSize: FONT.CAPTION, color: TEXT_M, fontFace: 'Helvetica', align: 'center',
          });
          // Percentage (large)
          slide.addText(pct, {
            x: x + 0.1, y: y + 0.65, w: cardW - 0.2, h: 1.0,
            fontSize: 32, bold: true, color, fontFace: 'Helvetica',
            align: 'center', valign: 'middle',
          });
          // Rationale
          if (rationale) {
            slide.addText(rationale, {
              x: x + 0.12, y: y + 1.75, w: cardW - 0.24, h: cardH - 1.95,
              fontSize: FONT.MICRO, color: TEXT_M, fontFace: 'Helvetica',
              valign: 'top', wrap: true, align: 'left',
            });
          }
        });
      }

      // ── 9. QA Tech Stack ─────────────────────────────────────────────────
      if (data.qaStack) {
        const slide = pptx.addSlide({ masterName: 'SECTION_MASTER' });
        addSlideHeader(slide, `0${slideNum++}`,
          es ? 'Pila Tecnológica QA' : 'QA Tech Stack', roleColor);

        // Flatten qaStack object into rows
        const COMPONENT_LABELS: Record<string, string> = {
          unitTestFramework:   es ? 'Unit Testing'    : 'Unit Testing',
          e2eFramework:        es ? 'Testing E2E'     : 'E2E Testing',
          cicdPlatform:        es ? 'CI/CD'           : 'CI/CD',
          coverageReporting:   es ? 'Cobertura'       : 'Coverage',
          performanceTesting:  es ? 'Performance'     : 'Performance',
          apiTesting:          es ? 'API Testing'     : 'API Testing',
        };

        const stackRows = Object.entries(data.qaStack)
          .filter(([k]) => COMPONENT_LABELS[k])
          .map(([k, v]: [string, any]) => ({
            component:   COMPONENT_LABELS[k] ?? k,
            recommended: String(v?.recommended ?? '').substring(0, 30),
            rationale:   String(v?.rationale ?? '').substring(0, 70),
            cost:        String(v?.cost ?? '').substring(0, 20),
          }));

        if (stackRows.length > 0) {
          const rowH = Math.min(0.46, (SLIDE.CONTENT_H - 0.1) / (stackRows.length + 1));
          const headers = es
            ? ['Componente', 'Recomendado', 'Justificación', 'Costo']
            : ['Component', 'Recommended', 'Rationale', 'Cost'];

          const tableData: any[][] = [
            headerRow(headers, roleColor),
            ...stackRows.map((r, i) => {
              const bg = i % 2 === 0 ? 'FFFFFF' : 'F8FAFC';
              return [
                { text: r.component,   options: { fontSize: FONT.MICRO, color: roleColor, bold: true, fill: { color: bg } } },
                { text: r.recommended, options: { fontSize: FONT.MICRO, color: TEXT_H, bold: true, fill: { color: bg } } },
                { text: r.rationale,   options: { fontSize: FONT.MICRO, color: TEXT_B, fill: { color: bg } } },
                { text: r.cost,        options: { fontSize: FONT.MICRO, color: TEXT_M, align: 'center' as const, fill: { color: bg } } },
              ];
            }),
          ];

          slide.addTable(tableData, {
            x: SLIDE.MARGIN_X, y: SLIDE.CONTENT_Y,
            w: SLIDE.CONTENT_W, rowH,
            border: { color: BORDER, pt: 0.5 },
            colW: [1.6, 2.0, 4.0, 1.2],
          });
        }
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
          ? 'Error al generar presentación QA Engineer'
          : 'Error generating QA Engineer presentation',
        'qaEngineerPPT.generate',
        error
      );
    }
  },
};
