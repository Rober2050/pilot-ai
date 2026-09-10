/**
 * uxDesignerPPT.ts — Specialist PPT Generator for UX/UI Designer Role
 *
 * C-Level quality presentation. UX Designer protocol returns ONLY:
 *   { "prototype": "<!DOCTYPE html>...complete landing page HTML...</html>" }
 *
 * This specialist parses the HTML to extract meaningful business content
 * and creates 7 executive slides — WITHOUT dumping raw code.
 *
 * Slides:
 *   Cover          — UX/UI Designer | Landing Page Prototype
 *   01 — Design Strategy    (parsed hero headline + product description)
 *   02 — Page Structure     (sections found in the HTML: hero, features, pricing…)
 *   03 — Visual Identity    (color palette + font + design system detected)
 *   04 — Key Messages       (h2 headings = section value props)
 *   05 — Value Proposition  (hero headline + CTA text)
 *   06 — Prototype Summary  (tech stack + status + sections count)
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

// ── HTML parser helpers ───────────────────────────────────────────────────────

/** Extract content of the first match of a tag or regex */
function extractFirst(html: string, regex: RegExp): string {
  return (html.match(regex)?.[1] ?? '').trim().replace(/<[^>]+>/g, '').trim();
}

/** Extract all matches of a regex capturing group */
function extractAll(html: string, regex: RegExp): string[] {
  const results: string[] = [];
  let m: RegExpExecArray | null;
  const re = new RegExp(regex.source, regex.flags.includes('g') ? regex.flags : regex.flags + 'g');
  while ((m = re.exec(html)) !== null) {
    const text = (m[1] ?? '').replace(/<[^>]+>/g, '').trim();
    if (text.length > 3 && text.length < 120) results.push(text);
  }
  return results;
}

/** Detect page sections from id/section comments in HTML */
function detectSections(html: string): string[] {
  const sectionPatterns = [
    /id=["'](home|hero)["']/i,
    /id=["'](features?|caracteristicas?)["']/i,
    /id=["'](how|como)["']/i,
    /id=["'](pricing|precios?)["']/i,
    /id=["'](testimonials?|testimonios?)["']/i,
    /id=["'](contact|contacto)["']/i,
    /id=["'](about|nosotros|about-us)["']/i,
    /id=["'](faq|faqs?)["']/i,
    /id=["'](results?|resultados?)["']/i,
    /id=["'](cta|sign-?up|registro)["']/i,
  ];
  const labels: Record<string, string> = {
    home: 'Hero', hero: 'Hero',
    features: 'Features', caracteristicas: 'Características',
    how: 'How It Works', como: 'Cómo Funciona',
    pricing: 'Pricing', precios: 'Precios',
    testimonials: 'Testimonials', testimonios: 'Testimonios',
    contact: 'Contact', contacto: 'Contacto',
    about: 'About', nosotros: 'Nosotros',
    faq: 'FAQ',
    results: 'Results', resultados: 'Resultados',
    cta: 'Call to Action', signup: 'Sign Up', registro: 'Registro',
  };
  const found: string[] = [];
  for (const pat of sectionPatterns) {
    const match = html.match(pat);
    if (match) {
      const id = match[1].toLowerCase().replace(/-/g, '');
      found.push(labels[id] ?? id);
    }
  }
  // If no ids found, count <section> tags
  if (found.length === 0) {
    const sectionCount = (html.match(/<section/gi) ?? []).length;
    if (sectionCount > 0)
      for (let i = 1; i <= Math.min(sectionCount, 6); i++) found.push(`Section ${i}`);
  }
  return found;
}

/** Detect design system from Tailwind classes */
function detectDesignSystem(html: string): { style: string; primaryColor: string; font: string; mode: string } {
  // Color palette detection
  let primaryColor = 'Custom';
  const colorMap: Array<[RegExp, string]> = [
    [/indigo-[456789]00/,  'Indigo (Trust & Tech)'],
    [/violet-[456789]00/,  'Violet (Creative)'],
    [/purple-[456789]00/,  'Purple (Premium)'],
    [/blue-[456789]00/,    'Blue (Professional)'],
    [/emerald-[456789]00/, 'Emerald (Growth)'],
    [/teal-[456789]00/,    'Teal (Innovation)'],
    [/pink-[456789]00/,    'Pink (Lifestyle)'],
    [/rose-[456789]00/,    'Rose (Passion)'],
    [/orange-[456789]00/,  'Orange (Energy)'],
    [/amber-[456789]00/,   'Amber (Warmth)'],
    [/sky-[456789]00/,     'Sky Blue (Fresh)'],
    [/cyan-[456789]00/,    'Cyan (Modern)'],
  ];
  for (const [re, name] of colorMap) {
    if (re.test(html)) { primaryColor = name; break; }
  }

  // Dark/light detection
  const isDark = /bg-slate-9[0-9]{2}|bg-gray-9[0-9]{2}|bg-black|dark.mode/i.test(html);
  const mode = isDark ? 'Dark Mode' : 'Light Mode';

  // Design style
  const hasGlass = /backdrop-blur|glass/i.test(html);
  const hasBento = /grid-cols-[34]/i.test(html);
  const style = hasGlass ? 'Glassmorphism' : hasBento ? 'Bento Grid' : 'Modern Card';

  // Font
  const font = /Plus Jakarta Sans/i.test(html) ? 'Plus Jakarta Sans' : 'System';

  return { style, primaryColor, font, mode };
}

/** Extract UX data from the raw HTML prototype */
function extractUXData(raw: any) {
  const html: string = typeof raw === 'string' ? raw
    : (typeof raw?.prototype === 'string' ? raw.prototype : '');

  if (!html) return null;

  // Product name from <title>
  const productName = extractFirst(html, /<title[^>]*>([^<]+)<\/title>/i) || 'Product';

  // Hero headline (first h1)
  const heroH1 = extractFirst(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i).substring(0, 120);

  // Hero subtext (first p in hero section or large text near h1)
  const heroP = extractFirst(html, /<p[^>]*class="[^"]*text-(?:xl|2xl|lg)[^"]*"[^>]*>([\s\S]*?)<\/p>/i).substring(0, 160);

  // Primary CTA text
  const ctaText = extractFirst(html, /<button[^>]*class="[^"]*(?:bg-|fill)[^"]*"[^>]*>([\s\S]*?)<\/button>/i).substring(0, 60)
    || extractFirst(html, /Get Started|Empezar|Comenzar|Sign Up|Registrarse|Prueba gratis|Try Free/i).substring(0, 60);

  // All h2 headings → key messages
  const h2s = extractAll(html, /<h2[^>]*>([\s\S]*?)<\/h2>/i).slice(0, 6);

  // Page sections
  const sections = detectSections(html);

  // Design system
  const design = detectDesignSystem(html);

  // Languages/tech stack
  const hasTailwind = /tailwindcss\.com/i.test(html);
  const hasAnims    = /animate-|@keyframes/i.test(html);
  const hasResponsive = /md:|sm:|lg:/i.test(html);
  const sectionCount = sections.length || (html.match(/<section/gi) ?? []).length;

  return {
    productName,
    heroH1:    heroH1  || productName,
    heroP:     heroP   || '',
    ctaText:   ctaText || 'Get Started',
    h2s,
    sections,
    design,
    techStack: {
      framework:   hasTailwind   ? 'Tailwind CSS v3'     : 'Custom CSS',
      typography:  design.font,
      animations:  hasAnims      ? 'CSS Keyframe Animations' : 'Static',
      responsive:  hasResponsive ? 'Mobile-first Responsive' : 'Desktop',
      sectionCount: String(sectionCount),
    },
  };
}

// ── Main generator ────────────────────────────────────────────────────────────

export const uxDesignerPPT = {
  generate: async (
    rawContent: any,
    roleConfig: RoleConfig,
    lang: 'es' | 'en',
    projectName: string
  ): Promise<void> => {
    try {
      const pptx      = new PptxGenJS();
      pptx.layout     = 'LAYOUT_16x9';
      const roleColor = ROLE_COLORS[roleConfig.roleId] || '6366F1';
      const roleName  = roleConfig.displayName;

      // Extract HTML (could be { prototype: "..." } or raw string)
      const ux = extractUXData(rawContent);

      registerSectionMaster(pptx, roleColor, roleName);

      // ── Cover ─────────────────────────────────────────────────────────────
      const dateStr = new Date().toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
      });
      addCoverSlide(pptx, {
        title:       roleName,
        subtitle:    lang === 'es' ? 'Prototipo Landing Page' : 'Landing Page Prototype',
        projectName,
        date:        dateStr,
        roleColor,
        lang,
        roleId:      roleConfig.roleId,
      });

      if (!ux) {
        // Fallback if HTML couldn't be extracted
        const slide = pptx.addSlide({ masterName: 'SECTION_MASTER' });
        addSlideHeader(slide, '01', lang === 'es' ? 'Prototipo Generado' : 'Prototype Generated', roleColor);
        addPremiumCard(slide, { x: SLIDE.MARGIN_X, y: SLIDE.CONTENT_Y, w: SLIDE.CONTENT_W, h: SLIDE.CONTENT_H - 0.1, accentColor: roleColor, accentSide: 'left', bgColor: 'FFFFFF' });
        slide.addText(lang === 'es' ? 'El prototipo HTML fue generado. Acceda al resultado en la plataforma para visualizarlo.' : 'HTML prototype was generated. Access the result in the platform to visualize it.', {
          x: SLIDE.MARGIN_X + 0.25, y: SLIDE.CONTENT_Y + 0.5, w: SLIDE.CONTENT_W - 0.35, h: 2,
          fontSize: FONT.BODY + 2, color: TEXT_B, fontFace: 'Helvetica', wrap: true,
        });
        const cs = pptx.addSlide();
        addClosingSlide(cs, { roleColor, roleId: roleConfig.roleId, projectName, lang });
        const safe2 = (s: string) => s.replace(/[^a-zA-Z0-9\u00C0-\u024F\s]/g, '').replace(/\s+/g, '_').substring(0, 35);
        await pptx.writeFile({ fileName: `${safe2(roleName)}_${new Date().toISOString().split('T')[0]}.pptx` });
        notificationService.showSuccess(lang === 'es' ? 'Presentación generada con éxito' : 'Presentation generated successfully');
        return;
      }

      // ── 01. Design Strategy (Hero) ────────────────────────────────────────
      {
        const slide = pptx.addSlide({ masterName: 'SECTION_MASTER' });
        addSlideHeader(slide, '01',
          lang === 'es' ? 'Estrategia de Diseño' : 'Design Strategy', roleColor);

        addPremiumCard(slide, {
          x: SLIDE.MARGIN_X, y: SLIDE.CONTENT_Y,
          w: SLIDE.CONTENT_W, h: SLIDE.CONTENT_H - 0.1,
          accentColor: roleColor, accentSide: 'left', bgColor: 'FFFFFF',
        });

        const lines = [
          ux.productName !== projectName ? `${lang === 'es' ? 'Producto:' : 'Product:'} ${ux.productName}` : '',
          ux.heroH1 ? `${lang === 'es' ? 'Headline:' : 'Headline:'} "${ux.heroH1}"` : '',
          ux.heroP  ? `${lang === 'es' ? 'Subtítulo:' : 'Subtitle:'} ${ux.heroP}` : '',
          ux.ctaText ? `${lang === 'es' ? 'CTA Principal:' : 'Primary CTA:'} ${ux.ctaText}` : '',
        ].filter(Boolean).join('\n\n');

        slide.addText(lines, {
          x: SLIDE.MARGIN_X + 0.25, y: SLIDE.CONTENT_Y + 0.2,
          w: SLIDE.CONTENT_W - 0.35, h: SLIDE.CONTENT_H - 0.45,
          fontSize: FONT.BODY, color: TEXT_B, fontFace: 'Helvetica',
          valign: 'top', wrap: true,
        });
      }

      // ── 02. Page Structure ────────────────────────────────────────────────
      if (ux.sections.length > 0) {
        const slide = pptx.addSlide({ masterName: 'SECTION_MASTER' });
        addSlideHeader(slide, '02',
          lang === 'es' ? 'Estructura de la Página' : 'Page Structure', roleColor);

        const sections = ux.sections;
        const cols  = sections.length <= 3 ? 1 : 2;
        const gapX  = 0.25;
        const cardW = cols === 1 ? SLIDE.CONTENT_W : (SLIDE.CONTENT_W - gapX) / 2;
        const cardH = Math.min(0.7, (SLIDE.CONTENT_H - 0.2) / Math.ceil(sections.length / cols));

        sections.forEach((sec, i) => {
          const col = i % cols;
          const row = Math.floor(i / cols);
          const x   = SLIDE.MARGIN_X + col * (cardW + gapX);
          const y   = SLIDE.CONTENT_Y + row * (cardH + 0.1);

          addPremiumCard(slide, {
            x, y, w: cardW, h: cardH - 0.05,
            accentColor: roleColor, accentSide: 'left', bgColor: 'F5F3FF',
          });
          slide.addText(`${String(i + 1).padStart(2, '0')}  ${sec}`, {
            x: x + 0.2, y: y + 0.05, w: cardW - 0.3, h: cardH - 0.15,
            fontSize: FONT.BODY, bold: true, color: TEXT_H, fontFace: 'Helvetica', valign: 'middle',
          });
        });
      }

      // ── 03. Visual Identity ───────────────────────────────────────────────
      {
        const slide = pptx.addSlide({ masterName: 'SECTION_MASTER' });
        addSlideHeader(slide, '03',
          lang === 'es' ? 'Identidad Visual' : 'Visual Identity', roleColor);

        const identityCards = [
          { label: lang === 'es' ? 'Paleta de Color' : 'Color Palette', value: ux.design.primaryColor },
          { label: lang === 'es' ? 'Modo'            : 'Mode',           value: ux.design.mode },
          { label: lang === 'es' ? 'Estilo'          : 'Style',          value: ux.design.style },
          { label: lang === 'es' ? 'Tipografía'      : 'Typography',     value: ux.design.font },
        ];

        const gapX  = 0.18;
        const cardW = (SLIDE.CONTENT_W - gapX * 3) / 4;
        const cardH = SLIDE.CONTENT_H - 0.3;

        identityCards.forEach((card, i) => {
          const x = SLIDE.MARGIN_X + i * (cardW + gapX);
          const y = SLIDE.CONTENT_Y;
          addPremiumCard(slide, { x, y, w: cardW, h: cardH, accentColor: roleColor, accentSide: 'top', bgColor: 'FFFFFF' });
          slide.addText(card.label, {
            x: x + 0.1, y: y + 0.2, w: cardW - 0.2, h: 0.4,
            fontSize: FONT.CAPTION, color: TEXT_M, fontFace: 'Helvetica', align: 'center',
          });
          slide.addText(card.value, {
            x: x + 0.1, y: y + 0.65, w: cardW - 0.2, h: cardH - 0.85,
            fontSize: FONT.BODY, bold: true, color: roleColor,
            fontFace: 'Helvetica', align: 'center', valign: 'middle', wrap: true,
          });
        });
      }

      // ── 04. Key Messages (H2 headings) ────────────────────────────────────
      if (ux.h2s.length > 0) {
        const slide = pptx.addSlide({ masterName: 'SECTION_MASTER' });
        addSlideHeader(slide, '04',
          lang === 'es' ? 'Mensajes Clave' : 'Key Messages', roleColor);

        const msgs   = ux.h2s.slice(0, 6);
        const itemH  = Math.min(0.65, (SLIDE.CONTENT_H - 0.1) / msgs.length);
        let y = SLIDE.CONTENT_Y + 0.05;

        msgs.forEach((msg, i) => {
          addPremiumCard(slide, {
            x: SLIDE.MARGIN_X, y, w: SLIDE.CONTENT_W, h: itemH - 0.06,
            accentColor: roleColor, accentSide: 'left',
            bgColor: i % 2 === 0 ? 'FFFFFF' : 'F5F3FF',
          });
          slide.addText(`${String(i + 1).padStart(2, '0')}`, {
            x: SLIDE.MARGIN_X + 0.1, y: y + 0.04, w: 0.3, h: itemH - 0.12,
            fontSize: FONT.BODY, bold: true, color: roleColor, fontFace: 'Helvetica', align: 'center', valign: 'middle',
          });
          slide.addText(msg, {
            x: SLIDE.MARGIN_X + 0.45, y: y + 0.04, w: SLIDE.CONTENT_W - 0.6, h: itemH - 0.12,
            fontSize: FONT.BODY, color: TEXT_H, fontFace: 'Helvetica', valign: 'middle', wrap: true,
          });
          y += itemH;
        });
      }

      // ── 05. Value Proposition + CTA ───────────────────────────────────────
      {
        const slide = pptx.addSlide({ masterName: 'SECTION_MASTER' });
        addSlideHeader(slide, '05',
          lang === 'es' ? 'Propuesta de Valor' : 'Value Proposition', roleColor);

        // Top: hero headline in big card
        const vpH = 1.6;
        addPremiumCard(slide, {
          x: SLIDE.MARGIN_X, y: SLIDE.CONTENT_Y,
          w: SLIDE.CONTENT_W, h: vpH,
          accentColor: roleColor, accentSide: 'left', bgColor: 'F5F3FF',
        });
        slide.addText(`"${ux.heroH1}"`, {
          x: SLIDE.MARGIN_X + 0.3, y: SLIDE.CONTENT_Y + 0.1,
          w: SLIDE.CONTENT_W - 0.5, h: vpH - 0.25,
          fontSize: FONT.BODY + 3, bold: true, italic: true, color: TEXT_H,
          fontFace: 'Helvetica', valign: 'middle', wrap: true,
        });

        // Bottom: 2-col with hero description + CTA
        const bottomY = SLIDE.CONTENT_Y + vpH + 0.15;
        const bottomH = SLIDE.CONTENT_H - vpH - 0.2;
        const halfW   = (SLIDE.CONTENT_W - 0.2) / 2;

        if (ux.heroP) {
          addPremiumCard(slide, { x: SLIDE.MARGIN_X, y: bottomY, w: halfW, h: bottomH, accentColor: roleColor, accentSide: 'top', bgColor: 'FFFFFF' });
          slide.addText(ux.heroP, {
            x: SLIDE.MARGIN_X + 0.1, y: bottomY + 0.1, w: halfW - 0.2, h: bottomH - 0.2,
            fontSize: FONT.BODY, color: TEXT_B, fontFace: 'Helvetica', valign: 'top', wrap: true,
          });
        }
        addPremiumCard(slide, { x: SLIDE.MARGIN_X + halfW + 0.2, y: bottomY, w: halfW, h: bottomH, accentColor: roleColor, accentSide: 'top', bgColor: 'FFFFFF' });
        slide.addText(lang === 'es' ? 'CTA Principal' : 'Primary CTA', {
          x: SLIDE.MARGIN_X + halfW + 0.3, y: bottomY + 0.1, w: halfW - 0.2, h: 0.3,
          fontSize: FONT.MICRO, bold: true, color: TEXT_M, fontFace: 'Helvetica',
        });
        slide.addText(ux.ctaText, {
          x: SLIDE.MARGIN_X + halfW + 0.3, y: bottomY + 0.4, w: halfW - 0.2, h: bottomH - 0.55,
          fontSize: FONT.BODY + 2, bold: true, color: roleColor, fontFace: 'Helvetica', valign: 'middle', wrap: true,
        });
      }

      // ── 06. Prototype Tech Summary ─────────────────────────────────────────
      {
        const slide = pptx.addSlide({ masterName: 'SECTION_MASTER' });
        addSlideHeader(slide, '06',
          lang === 'es' ? 'Resumen del Prototipo' : 'Prototype Summary', roleColor);

        const rows = [
          { [lang === 'es' ? 'Componente' : 'Component']: lang === 'es' ? 'CSS Framework' : 'CSS Framework', [lang === 'es' ? 'Detalle' : 'Detail']: ux.techStack.framework },
          { [lang === 'es' ? 'Componente' : 'Component']: lang === 'es' ? 'Tipografía' : 'Typography',       [lang === 'es' ? 'Detalle' : 'Detail']: ux.techStack.typography },
          { [lang === 'es' ? 'Componente' : 'Component']: lang === 'es' ? 'Animaciones' : 'Animations',      [lang === 'es' ? 'Detalle' : 'Detail']: ux.techStack.animations },
          { [lang === 'es' ? 'Componente' : 'Component']: lang === 'es' ? 'Responsivo' : 'Responsive',        [lang === 'es' ? 'Detalle' : 'Detail']: ux.techStack.responsive },
          { [lang === 'es' ? 'Componente' : 'Component']: lang === 'es' ? 'Secciones' : 'Sections',           [lang === 'es' ? 'Detalle' : 'Detail']: ux.techStack.sectionCount },
          { [lang === 'es' ? 'Componente' : 'Component']: lang === 'es' ? 'Tipo de archivo' : 'File type',   [lang === 'es' ? 'Detalle' : 'Detail']: 'Single-file HTML (self-contained)' },
          { [lang === 'es' ? 'Componente' : 'Component']: lang === 'es' ? 'Estado' : 'Status',               [lang === 'es' ? 'Detalle' : 'Detail']: lang === 'es' ? '✓ Prototipo generado' : '✓ Prototype generated' },
        ];

        const headers = Object.keys(rows[0]);
        const rowH = Math.min(0.44, (SLIDE.CONTENT_H - 0.1) / (rows.length + 1));

        const tableData = [
          headers.map((h, ci) => ({
            text: h,
            options: { fontSize: FONT.MICRO, bold: true, color: 'FFFFFF', align: ci === 0 ? 'left' as const : 'left' as const, fill: { color: roleColor } },
          })),
          ...rows.map((row, idx) => {
            const fill = { color: idx % 2 === 0 ? 'FFFFFF' : 'F5F3FF' };
            return headers.map((h, ci) => ({
              text: String(row[h as keyof typeof row] ?? ''),
              options: { fontSize: FONT.MICRO, color: ci === 0 ? TEXT_H : TEXT_B, bold: ci === 0, fill },
            }));
          }),
        ];

        slide.addTable(tableData, {
          x: SLIDE.MARGIN_X, y: SLIDE.CONTENT_Y,
          w: SLIDE.CONTENT_W, rowH,
          colW: [2.8, 6.5],
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
          ? 'Error al generar presentación UX Designer'
          : 'Error generating UX Designer presentation',
        'uxDesignerPPT.generate',
        error
      );
    }
  },
};
