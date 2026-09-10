/**
 * Content Normalizer — Transforms ANY role JSON output into a consistent structure.
 * All document generators (PDF, PPT, Excel, Word) consume NormalizedDocument.
 */

import { getRoleExportProfile } from '../../constants/roleExportConfig';

export interface NormalizedSection {
  title: string;
  type: 'text' | 'list' | 'table' | 'kpi_grid' | 'heading';
  data: string | string[] | Record<string, any>[] | Record<string, string | number>;
}

export interface NormalizedDocument {
  roleId: string;
  roleName: string;
  projectName: string;
  language: string;
  sections: NormalizedSection[];
  metadata?: {
    generatedAt?: Date;
    userId?: string;
    documentTitle?: string;
    documentSubtitle?: string;
  };
}

// ── Smart Table Column Filter ────────────────────────────────────────────────
// Reduces any table to MAX 5 columns using semantic key scoring.
// Applied universally — no per-role configuration needed.
const MAX_TABLE_COLS = 5;
const ALWAYS_KEEP_COLS = new Set([
  'id', 'name', 'title', 'text', 'description', 'rule', 'journey', 'risk', 'scenario',
]);
const SKIP_TABLE_COLS  = new Set([
  'acceptanceCriteria', 'given', 'when', 'then', 'steps', 'testTypes',
  'cases', 'items', 'entries', 'suites', 'rawContent',
]);
const MEDIUM_TABLE_COLS = new Set([
  'type', 'priority', 'category', 'status', 'impact', 'probability', 'owner',
  'source', 'coverage', 'cost', 'automatable', 'value', 'pct', 'label', 'moscow',
  'suite', 'component', 'recommended',
]);

function smartFilterTableColumns(rows: Record<string, any>[]): Record<string, any>[] {
  if (!rows.length) return rows;
  const allKeys = Object.keys(rows[0]);
  if (allKeys.length <= MAX_TABLE_COLS) return rows;

  const isSimple = (v: any) =>
    typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean';

  const kept: string[] = [];
  // Pass 1: always-keep content keys (non-complex values only)
  for (const k of allKeys) {
    if (ALWAYS_KEEP_COLS.has(k.toLowerCase()) && isSimple(rows[0][k])) kept.push(k);
  }
  // Pass 2: medium-priority categorization keys
  for (const k of allKeys) {
    if (kept.length >= MAX_TABLE_COLS) break;
    if (!kept.includes(k) && !SKIP_TABLE_COLS.has(k) &&
        MEDIUM_TABLE_COLS.has(k.toLowerCase()) && isSimple(rows[0][k])) {
      kept.push(k);
    }
  }
  // Pass 3: any remaining simple non-skip field
  for (const k of allKeys) {
    if (kept.length >= MAX_TABLE_COLS) break;
    if (!kept.includes(k) && !SKIP_TABLE_COLS.has(k) && isSimple(rows[0][k])) {
      kept.push(k);
    }
  }

  return rows.map(r => Object.fromEntries(kept.map(k => [k, r[k]])));
}

// ── Section Title Localization Map ──────────────────────────────────────────
// Converts dashboard field keys to human-readable section titles.
const DASH_TITLE_MAP: Record<string, { es: string; en: string }> = {
  criticalScenarios: { es: 'Escenarios Críticos',         en: 'Critical Scenarios' },
  risks:             { es: 'Matriz de Riesgos',            en: 'Risk Matrix' },
  testSuites:        { es: 'Casos de Prueba',              en: 'Test Cases' },
  testingPyramid:    { es: 'Pirámide de Testing',          en: 'Testing Pyramid' },
  qaStack:           { es: 'Pila Tecnológica QA',          en: 'QA Tech Stack' },
  criticalPaths:     { es: 'Flujos Críticos de Usuario',   en: 'Critical User Journeys' },
  channelStrategy:   { es: 'Estrategia de Canales',        en: 'Channel Strategy' },
  unitEconomics:     { es: 'Economía de la Unidad',        en: 'Unit Economics' },
  competitiveMap:    { es: 'Mapa Competitivo',             en: 'Competitive Landscape' },
  buyerPersona:      { es: 'Buyer Persona',                en: 'Buyer Persona' },
  messagingFramework:{ es: 'Marco de Mensajes',            en: 'Messaging Framework' },
};
function dashSectionTitle(key: string, lang: 'es' | 'en'): string {
  return DASH_TITLE_MAP[key]?.[lang] ?? key;
}

// ── URL / Citation Cleaner ──────────────────────────────────────────────────
// Strips web-search grounding URLs, markdown links, and bare http(s) links.
// Prevents raw AI search citations from polluting DOCX/PDF/Excel output.
function cleanText(str: string): string {
  if (!str || typeof str !== 'string') return str;
  // Remove markdown links: [text](url) → text
  let s = str.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  // Remove bare URLs including grounding-api redirects
  s = s.replace(/https?:\/\/[^\s)>\]"',\u00A0]+/g, '');
  // Collapse multiple spaces but preserve single line-breaks
  s = s.replace(/[ \t]{2,}/g, ' ');
  // Collapse 3+ consecutive newlines to 2
  s = s.replace(/\n{3,}/g, '\n\n');
  return s.trim();
}

// Keys that are generic wrappers — strip from titles
const CONTAINER_KEYS = new Set(['dashboard', 'data', 'content', 'result', 'results', 'output', 'analysis']);

// Known acronyms and special-case key → readable title
const KEY_TITLE_MAP: Record<string, Record<string, string>> = {
  es: {
    classification: 'Clasificación',
    ideo: 'Validación IDEO',
    desirability: 'Deseabilidad',
    feasibility: 'Factibilidad',
    viability: 'Viabilidad',
    marketIntelligence: 'Inteligencia de Mercado',
    trends: 'Tendencias',
    unitEconomics: 'Economía Unitaria',
    swot: 'Análisis FODA',
    strengths: 'Fortalezas',
    weaknesses: 'Debilidades',
    opportunities: 'Oportunidades',
    threats: 'Amenazas',
    tows: 'Matriz TOWS',
    so: 'Estrategias SO',
    wo: 'Estrategias WO',
    st: 'Estrategias ST',
    wt: 'Estrategias WT',
    executiveSummary: 'Resumen Ejecutivo',
    recommendations: 'Recomendaciones',
    riskAnalysis: 'Análisis de Riesgos',
    competitors: 'Competidores',
    targetAudience: 'Público Objetivo',
    valueProposition: 'Propuesta de Valor',
    businessModel: 'Modelo de Negocio',
    techStack: 'Stack Tecnológico',
    architecture: 'Arquitectura',
    userStories: 'Historias de Usuario',
    wireframes: 'Wireframes',
    testPlan: 'Plan de Testing',
    sources: 'Fuentes',
    metrics: 'Métricas',
    kpis: 'KPIs',
    budget: 'Presupuesto',
    timeline: 'Cronograma',
    milestones: 'Hitos',
    dependencies: 'Dependencias',
    assumptions: 'Supuestos',
    constraints: 'Restricciones',
    scope: 'Alcance',
    objectives: 'Objetivos',
    deliverables: 'Entregables',
  },
  en: {
    classification: 'Classification',
    ideo: 'IDEO Validation',
    desirability: 'Desirability',
    feasibility: 'Feasibility',
    viability: 'Viability',
    marketIntelligence: 'Market Intelligence',
    trends: 'Trends',
    unitEconomics: 'Unit Economics',
    swot: 'SWOT Analysis',
    strengths: 'Strengths',
    weaknesses: 'Weaknesses',
    opportunities: 'Opportunities',
    threats: 'Threats',
    tows: 'TOWS Matrix',
    so: 'SO Strategies',
    wo: 'WO Strategies',
    st: 'ST Strategies',
    wt: 'WT Strategies',
    executiveSummary: 'Executive Summary',
    recommendations: 'Recommendations',
    riskAnalysis: 'Risk Analysis',
    competitors: 'Competitors',
    targetAudience: 'Target Audience',
    valueProposition: 'Value Proposition',
    businessModel: 'Business Model',
    techStack: 'Tech Stack',
    architecture: 'Architecture',
    userStories: 'User Stories',
    wireframes: 'Wireframes',
    testPlan: 'Test Plan',
    sources: 'Sources',
    metrics: 'Metrics',
    kpis: 'KPIs',
    budget: 'Budget',
    timeline: 'Timeline',
    milestones: 'Milestones',
    dependencies: 'Dependencies',
    assumptions: 'Assumptions',
    constraints: 'Constraints',
    scope: 'Scope',
    objectives: 'Objectives',
    deliverables: 'Deliverables',
  },
};

/**
 * Extracts structured content from a UX/UI Designer HTML prototype using DOMParser.
 * The protocol generates { "prototype": "<!DOCTYPE html>..." } — this converts it into
 * meaningful DOCX/PDF sections (Value Proposition, Features, How It Works, Pricing, CTA).
 */
function extractUXDesignerContent(htmlStr: string, lang: 'es' | 'en'): NormalizedSection[] {
  const out: NormalizedSection[] = [];
  try {
    const parser = new DOMParser();
    const dom    = parser.parseFromString(htmlStr, 'text/html');
    dom.querySelectorAll('script, style, svg').forEach(el => el.remove());

    const getText = (el: Element | null): string =>
      (el?.textContent ?? '').replace(/\s+/g, ' ').trim();

    // ── 1. Value Proposition (Hero) ────────────────────────────────────────
    const homeEl   = dom.querySelector('#home') ?? dom.querySelector('section') ?? dom.body;
    const h1       = homeEl.querySelector('h1') ?? dom.querySelector('h1');
    const heroParas = Array.from(homeEl.querySelectorAll('p'))
                       .filter(p => (p.textContent ?? '').trim().length > 50);
    const headline = getText(h1);
    const heroDesc = getText(heroParas[0] ?? null);
    if (headline) {
      out.push({
        title: lang === 'es' ? 'Propuesta de Valor' : 'Value Proposition',
        type: 'text',
        data:  heroDesc ? `${headline}\n\n${heroDesc}` : headline,
      });
    }

    // ── 2. Key Features ────────────────────────────────────────────────────
    const featEl = dom.querySelector('#features') ?? dom.querySelector('[id*="feature"]');
    if (featEl) {
      const featureRows: Record<string, string>[] = [];
      featEl.querySelectorAll('h3, h4').forEach(h => {
        const title = getText(h);
        const card  = h.parentElement;
        const desc  = getText(card?.querySelector('p') ?? null);
        if (title.length > 2) {
          featureRows.push({
            [lang === 'es' ? 'Característica' : 'Feature']:   title,
            [lang === 'es' ? 'Descripción'   : 'Description']: desc.substring(0, 150) || '-',
          });
        }
      });
      if (featureRows.length) {
        out.push({
          title: lang === 'es' ? 'Características Principales' : 'Key Features',
          type:  'table',
          data:  featureRows.slice(0, 8),
        });
      }
    }

    // ── 3. How It Works ────────────────────────────────────────────────────
    const howEl = dom.querySelector('#how')
               ?? dom.querySelector('[id*="how"]')
               ?? dom.querySelector('[id*="step"]');
    if (howEl) {
      const steps: string[] = [];
      howEl.querySelectorAll('h3, h4').forEach(h => {
        const title = getText(h);
        const desc  = getText(h.parentElement?.querySelector('p') ?? null);
        if (title.length > 2) steps.push(desc ? `${title}: ${desc.substring(0, 120)}` : title);
      });
      if (steps.length) {
        out.push({
          title: lang === 'es' ? 'Cómo Funciona' : 'How It Works',
          type:  'list',
          data:  steps.slice(0, 6),
        });
      }
    }

    // ── 4. Pricing Plans ───────────────────────────────────────────────────
    const pricingEl = dom.querySelector('#pricing')
                   ?? dom.querySelector('[id*="pricing"]')
                   ?? dom.querySelector('[id*="plan"]');
    if (pricingEl) {
      const planRows: Record<string, string>[] = [];
      pricingEl.querySelectorAll('h3, h4').forEach(h => {
        const name  = getText(h);
        const card  = h.closest('div') ?? h.parentElement;
        const priceEl = Array.from(card?.querySelectorAll('span, p, div') ?? [])
          .find(el => /\$|€|free|gratis|\d+\s*\/\s*mo/i.test(el.textContent ?? ''));
        const price     = priceEl ? getText(priceEl).split('\n')[0].trim() : '-';
        const featureList = Array.from(card?.querySelectorAll('li') ?? [])
          .map(getText).filter(t => t.length > 2).slice(0, 3).join(', ');
        if (name.length > 1) {
          planRows.push({
            [lang === 'es' ? 'Plan'     : 'Plan']:     name,
            [lang === 'es' ? 'Precio'   : 'Price']:    price,
            [lang === 'es' ? 'Incluye'  : 'Includes']: featureList || '-',
          });
        }
      });
      if (planRows.length) {
        out.push({
          title: lang === 'es' ? 'Planes de Precio' : 'Pricing Plans',
          type:  'table',
          data:  planRows,
        });
      }
    }

    // ── 5. CTA / Closing ──────────────────────────────────────────────────
    const ctaEl = dom.querySelector('#cta')
               ?? dom.querySelector('[id*="cta"]')
               ?? dom.querySelector('[id*="contact"]');
    if (ctaEl) {
      const ctaHeading = getText(ctaEl.querySelector('h2, h3'));
      const ctaBody    = getText(ctaEl.querySelector('p'));
      const ctaText    = [ctaHeading, ctaBody].filter(Boolean).join('\n');
      if (ctaText.length > 20) {
        out.push({
          title: lang === 'es' ? 'Llamada a la Acción' : 'Call to Action',
          type:  'text',
          data:  ctaText,
        });
      }
    }
  } catch (_) { /* DOMParser unavailable or invalid HTML — return empty */ }
  return out;
}

/**
 * Converts a camelCase key to a human-readable Title Case string.
 * Uses known mappings first, then falls back to camelCase splitting.
 */
function formatKeyToTitle(key: string, lang: string = 'es'): string {
  const map = KEY_TITLE_MAP[lang] || KEY_TITLE_MAP['es'];
  if (map[key]) return map[key];

  // camelCase → "Title Case"
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

/**
 * Builds a readable section title from a path like "dashboard > ideo > desirability".
 * Strips container keys and formats each segment.
 */
function buildSectionTitle(rawPath: string, lang: string = 'es'): string {
  const segments = rawPath.split(' > ').filter((s) => !CONTAINER_KEYS.has(s.toLowerCase()));
  if (segments.length === 0) return formatKeyToTitle(rawPath, lang);
  return segments.map((s) => formatKeyToTitle(s, lang)).join(' — ');
}

/**
 * Converts an object value to a section type.
 * - Strings < 80 chars → kpi_grid (or list if part of array)
 * - Strings 80-200 chars → list item or heading
 * - Strings >= 200 chars → text
 * - Array of strings → list
 * - Array of objects → table
 * - Flat object with primitives → kpi_grid
 */
function determineSectionType(
  value: any
): 'text' | 'list' | 'table' | 'kpi_grid' | 'heading' | null {
  if (typeof value === 'string') {
    if (value.length < 80) return 'kpi_grid';
    if (value.length < 200) return 'heading';
    return 'text';
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return null;
    if (typeof value[0] === 'string') return 'list';
    if (typeof value[0] === 'object') return 'table';
  }

  if (typeof value === 'object' && value !== null) {
    // Check if it's a flat object with primitive values
    const values = Object.values(value);
    const allPrimitive = values.every(
      (v) => typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean'
    );
    if (allPrimitive) return 'kpi_grid';
  }

  return null;
}

/**
 * Recursively normalize content, respecting max depth to prevent infinite loops.
 */
function normalizeValue(
  value: any,
  currentDepth: number = 0,
  maxDepth: number = 3
): NormalizedSection[] {
  const sections: NormalizedSection[] = [];

  if (currentDepth > maxDepth) {
    return sections;
  }

  if (typeof value === 'string') {
    // Strings are normalized to text sections
    if (value.length >= 200) {
      sections.push({
        title: '',
        type: 'text',
        data: value,
      });
    }
    return sections;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return sections;
    }

    // Array of strings → list
    if (typeof value[0] === 'string') {
      sections.push({
        title: '',
        type: 'list',
        data: value.filter((v) => typeof v === 'string'),
      });
    }
    // Array of objects → table (smart column filter applied)
    else if (typeof value[0] === 'object' && value[0] !== null) {
      const rows = value.filter((v) => typeof v === 'object' && v !== null);
      sections.push({
        title: '',
        type: 'table',
        data: smartFilterTableColumns(rows),
      });
    }

    return sections;
  }

  if (typeof value === 'object' && value !== null) {
    // Flat object with primitives → kpi_grid
    const entries = Object.entries(value);
    const isFlat = entries.every(
      ([_, v]) => typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean'
    );

    if (isFlat && entries.length > 0) {
      const kpiData = Object.fromEntries(entries) as Record<string, string | number>;
      sections.push({
        title: '',
        type: 'kpi_grid',
        data: kpiData,
      });
      return sections;
    }

    // Nested object → recurse into keys
    for (const [key, val] of entries) {
      if (val === null || val === undefined) continue;

      const subsections = normalizeValue(val, currentDepth + 1, maxDepth);
      for (const sub of subsections) {
        sections.push({
          ...sub,
          title: sub.title ? `${key} > ${sub.title}` : key,
        });
      }
    }
  }

  return sections;
}

/**
 * Converts a single DashboardTab into a NormalizedSection based on its semantic type.
 * Skips visual/diagram tabs that cannot be represented in text-based documents.
 */
function normalizeDashboardTab(tab: any, lang: string): NormalizedSection | null {
  if (!tab || !tab.data) return null;
  const data = tab.data;

  switch (tab.type) {
    case 'markdown':
      if (typeof data === 'string' && data.length > 50) {
        // Skip HTML prototypes — they are code, not business text for DOCX/PDF
        const isHtml = data.trimStart().startsWith('<') || data.includes('<!DOCTYPE');
        if (!isHtml) return { title: '', type: 'text', data };
      }
      break;

    // HTML prototype tabs — skip entirely (not renderable in text-based documents)
    case 'prototype':
      return null;

    case 'requirements': {
      const reqs = Array.isArray(data) ? data : (data.requirements ?? []);
      if (Array.isArray(reqs) && reqs.length > 0)
        return { title: '', type: 'table', data: smartFilterTableColumns(reqs.filter((v: any) => typeof v === 'object' && v !== null)) };
      break;
    }

    case 'user-stories': {
      const stories = Array.isArray(data) ? data : (data.stories ?? []);
      if (Array.isArray(stories) && stories.length > 0) {
        const items = stories.map((s: any) => {
          if (typeof s === 'string') return s;
          return s.title || s.description || `${s.id ?? ''}: ${s.summary ?? ''}`.trim();
        }).filter(Boolean);
        if (items.length > 0) return { title: '', type: 'list', data: items };
      }
      break;
    }

    case 'business-rules': {
      const rules = Array.isArray(data) ? data : (data.rules ?? []);
      if (Array.isArray(rules) && rules.length > 0)
        return { title: '', type: 'table', data: smartFilterTableColumns(rules.filter((v: any) => typeof v === 'object' && v !== null)) };
      break;
    }

    case 'table': {
      // Pass-through: array of objects → table (same handling as 'custom' arrays)
      if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object') {
        const rows = data.filter((v: any) => typeof v === 'object' && v !== null);
        return { title: '', type: 'table', data: rows };
      }
      break;
    }

    case 'custom': {
      // Array of objects → table
      if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object')
        return { title: '', type: 'table', data: smartFilterTableColumns(data.filter((v: any) => typeof v === 'object' && v !== null)) };
      // Flat object → kpi_grid
      if (typeof data === 'object' && !Array.isArray(data)) {
        const flat: Record<string, string | number> = {};
        for (const [k, v] of Object.entries(data)) {
          if (typeof v === 'string' || typeof v === 'number') flat[k] = v;
        }
        if (Object.keys(flat).length > 0) return { title: '', type: 'kpi_grid', data: flat };
      }
      break;
    }

    case 'charts': {
      // Normalize first chart's data → clean 2–3 column Category/Value table
      const charts = Array.isArray(data) ? data : [];
      if (charts.length > 0 && Array.isArray(charts[0]?.data) && charts[0].data.length > 0) {
        const chartRows = (charts[0].data as any[])
          .filter((d: any) => typeof d === 'object' && d !== null)
          .map((d: any) => {
            const row: Record<string, string> = {
              [lang === 'es' ? 'Categoría' : 'Category']: String(d.name ?? d.label ?? d.x ?? ''),
              [lang === 'es' ? 'Valor' : 'Value']:         String(d.value ?? d.y ?? d.count ?? ''),
            };
            if (d.percentage !== undefined) row['%'] = `${d.percentage}%`;
            return row;
          });
        if (chartRows.length > 0) return { title: '', type: 'table', data: chartRows };
      }
      break;
    }

    // ── Architect: Architectural Decision Records ────────────────────────────
    case 'adrs': {
      const adrs = Array.isArray(data) ? data : [];
      if (adrs.length > 0) {
        const rows = adrs.map((adr: any) => ({
          ID:          String(adr.id ?? ''),
          [lang === 'es' ? 'Decisión' : 'Decision']:   String(adr.title ?? adr.decision ?? ''),
          [lang === 'es' ? 'Estado' : 'Status']:        String(adr.status ?? ''),
          [lang === 'es' ? 'Contexto' : 'Context']:     String(adr.context ?? '').substring(0, 80),
        }));
        return { title: '', type: 'table', data: rows };
      }
      break;
    }

    // ── Architect: Quality Attributes ────────────────────────────────────────
    case 'quality-attributes': {
      const attrs = Array.isArray(data) ? data : [];
      if (attrs.length > 0) {
        const rows = attrs.map((a: any) => ({
          [lang === 'es' ? 'Atributo' : 'Attribute']:   String(a.attribute ?? ''),
          [lang === 'es' ? 'Métrica' : 'Measure']:      String(a.measure ?? ''),
          [lang === 'es' ? 'Prioridad' : 'Priority']:   String(a.priority ?? ''),
          [lang === 'es' ? 'Categoría' : 'Category']:   String(a.category ?? ''),
        }));
        return { title: '', type: 'table', data: rows };
      }
      break;
    }

    // ── Architect: Tech Radar ─────────────────────────────────────────────────
    case 'tech-radar': {
      const techs = Array.isArray(data) ? data : [];
      if (techs.length > 0) {
        const rows = techs.map((t: any) => ({
          [lang === 'es' ? 'Tecnología' : 'Technology']: String(t.name ?? ''),
          Ring:                                            String(t.ring ?? ''),
          [lang === 'es' ? 'Cuadrante' : 'Quadrant']:   String(t.quadrant ?? ''),
          [lang === 'es' ? 'Justificación' : 'Rationale']: String(t.rationale ?? t.description ?? '').substring(0, 80),
        }));
        return { title: '', type: 'table', data: rows };
      }
      break;
    }

    // ── Architect: DB Schema → list of tables ────────────────────────────────
    case 'schema-visualizer': {
      if (typeof data === 'object' && Array.isArray(data.tables) && data.tables.length > 0) {
        const items = data.tables.map((t: any) =>
          `${String(t.name ?? '')} — ${String(t.description ?? '').substring(0, 60)}`
        ).filter(Boolean);
        if (items.length > 0) return { title: '', type: 'list', data: items };
      }
      break;
    }

    // Visual/structural tabs not representable in DOCX/PDF/PPT text layouts — skip
    case 'diagram':
    case 'c4-diagram':
    case 'timeline':
    case 'gantt':
    default:
      return null;
  }

  return null;
}

/**
 * Main function: transforms ANY role JSON output into NormalizedDocument.
 *
 * @param roleId - Role identifier (e.g., 'strategy-analyst')
 * @param roleName - Human-readable role name (e.g., 'Strategy Analyst')
 * @param content - Raw JSON output from the role
 * @param projectName - Name of the project
 * @param language - ISO language code ('es', 'en')
 * @returns NormalizedDocument with consistent structure
 */
export function normalizeRoleOutput(
  roleId: string,
  roleName: string,
  content: Record<string, any>,
  projectName: string,
  language: string = 'es'
): NormalizedDocument {
  const sections: NormalizedSection[] = [];

  if (!content || typeof content !== 'object') {
    return {
      roleId,
      roleName,
      projectName,
      language,
      sections: [],
    };
  }

  // Exclude metadata, internal keys, and AI grounding/search artifacts
  const excludeKeys = new Set([
    'rawContent', 'timestamp', 'processingTime', '_meta',
    'id', 'userId', 'projectId',
    // Google Vertex AI grounding artifacts — raw search citations, not business content
    'grounding_metadata', 'groundingMetadata', 'groundingChunks',
    'web_search_queries', 'webSearchQueries', 'searchQueries',
    'search_results', 'searchResults', 'sources', 'citations',
    'raw', 'rawData', 'groundingSupports',
  ]);

  // Collect short strings (< 80 chars) from top level for KPI grid
  const topLevelKpis: Record<string, string | number> = {};

  // Process each key in the content
  for (const [key, value] of Object.entries(content)) {
    if (excludeKeys.has(key) || !value) {
      continue;
    }

    // UX Designer HTML prototype — extract structured content via DOMParser
    if (key === 'prototype' && typeof value === 'string' &&
        (value.trimStart().startsWith('<') || value.includes('<!DOCTYPE'))) {
      const uxSections = extractUXDesignerContent(value, language as 'es' | 'en');
      sections.push(...uxSections);
      continue;
    }

    // Collect short strings AND numbers as KPIs instead of discarding them
    if ((typeof value === 'string' && value.length > 0 && value.length < 80) ||
        typeof value === 'number') {
      topLevelKpis[formatKeyToTitle(key, language)] = value as string | number;
      continue;
    }

    // ── UniversalDashboardSchema: { dashboard: { summary, kpis[], tabs[] } } ──
    // All generic roles (BA, Marketing, Architect, QA, UX) use this structure.
    // Must be handled BEFORE generic normalization to avoid raw-metadata tables.
    if (key === 'dashboard' && typeof value === 'object' && value !== null) {
      // 1. summary → text section (Executive Summary)
      if (typeof value.summary === 'string' && value.summary.length > 50) {
        sections.push({
          title: language === 'es' ? 'Resumen Ejecutivo' : 'Executive Summary',
          type: 'text',
          data: value.summary,
        });
      }

      // 2. kpis[] → kpi_grid using label→value pairs only (ignore trend/icon/color internals)
      if (Array.isArray(value.kpis) && value.kpis.length > 0) {
        const kpiData: Record<string, string | number> = {};
        for (const kpi of value.kpis) {
          if (kpi.label && kpi.value !== undefined) {
            kpiData[String(kpi.label)] = kpi.value;
          }
        }
        if (Object.keys(kpiData).length > 0) {
          sections.push({
            title: language === 'es' ? 'Indicadores Clave' : 'Key Indicators',
            type: 'kpi_grid',
            data: kpiData,
          });
        }
      }

      // 3. tabs[] → process each tab by its semantic type, NOT as raw table
      if (Array.isArray(value.tabs)) {
        for (const tab of value.tabs) {
          const tabSection = normalizeDashboardTab(tab, language);
          if (tabSection) {
            sections.push({ ...tabSection, title: tab.label || tabSection.title });
          }
        }
      }

      // 4. Marketing Manager fields inside dashboard (AI may wrap per UniversalDashboardSchema)
      //    These keys are NOT in tabs[] — they are siblings of summary/kpis/tabs at dashboard level.
      if (value.channelStrategy || value.unitEconomics || value.buyerPersona ||
          value.messagingFramework || value.roasScenarios || value.competitiveMap) {
        // Reuse the same Marketing handlers by iterating dashboard sub-keys
        const mktKeys = ['industryBenchmarks','buyerPersona','messagingFramework','channelStrategy',
                         'roasScenarios','unitEconomics','gtmCalendar','tacticalFunnel',
                         'competitiveMap','roadmapData','psychoData'];
        for (const mktKey of mktKeys) {
          const mktVal = value[mktKey];
          if (!mktVal) continue;
          // Inject as top-level key so the Marketing-specific handlers below process it
          // (we do this by recursively checking the key — simpler to inline minimal logic)
          if (mktKey === 'unitEconomics' && typeof mktVal === 'object') {
            const kpiData: Record<string, string | number> = {};
            if (mktVal.cac !== undefined)          kpiData['CAC']         = `$${mktVal.cac}`;
            if (mktVal.ltv !== undefined)          kpiData['LTV']         = `$${mktVal.ltv}`;
            if (mktVal.ltvCacRatio !== undefined)  kpiData['LTV/CAC']     = `${mktVal.ltvCacRatio}x`;
            if (mktVal.paybackMonths !== undefined) kpiData[language === 'es' ? 'Payback (meses)' : 'Payback (mo)'] = `${mktVal.paybackMonths}m`;
            if (Object.keys(kpiData).length > 0)
              sections.push({ title: language === 'es' ? 'Economía Unitaria' : 'Unit Economics', type: 'kpi_grid', data: kpiData });
          }
          if (mktKey === 'channelStrategy' && Array.isArray(mktVal) && mktVal.length > 0) {
            const rows = mktVal.map((ch: any) => ({
              [language === 'es' ? 'Canal' : 'Channel']:  String(ch.canal ?? ch.channel ?? ''),
              [language === 'es' ? 'Impacto' : 'Impact']: String(ch.impact ?? ''),
              [language === 'es' ? 'Presupuesto' : 'Budget']: ch.budgetPct ? `${ch.budgetPct}%` : '—',
              [language === 'es' ? 'Justificación' : 'Rationale']: String(ch.rationale ?? ''),
            }));
            sections.push({ title: language === 'es' ? 'Estrategia de Canales' : 'Channel Strategy', type: 'table', data: rows });
          }
          if (mktKey === 'competitiveMap' && Array.isArray(mktVal) && mktVal.length > 0) {
            const rows = mktVal.map((c: any) => ({
              [language === 'es' ? 'Competidor' : 'Competitor']:       String(c.name ?? ''),
              [language === 'es' ? 'Fortaleza'  : 'Strength']:         String(c.strength ?? ''),
              [language === 'es' ? 'Diferenciación' : 'Differentiation']: String(c.differentiation ?? ''),
            }));
            sections.push({ title: language === 'es' ? 'Mapa Competitivo' : 'Competitive Landscape', type: 'table', data: rows });
          }
          if (mktKey === 'buyerPersona' && typeof mktVal === 'object') {
            const lines: string[] = [];
            if (mktVal.avatar) lines.push(`"${mktVal.avatar}"`);
            if (mktVal.painPoint) lines.push(`${language === 'es' ? 'Dolor' : 'Pain'}: ${mktVal.painPoint}`);
            if (Array.isArray(mktVal.goals) && mktVal.goals.length > 0)
              lines.push(`${language === 'es' ? 'Objetivos' : 'Goals'}: ${mktVal.goals.join(' | ')}`);
            if (lines.length > 0)
              sections.push({ title: 'Buyer Persona', type: 'text', data: lines.join('\n') });
          }
          if (mktKey === 'messagingFramework' && typeof mktVal === 'object' && mktVal.valueProposition) {
            sections.push({ title: language === 'es' ? 'Propuesta de Valor' : 'Value Proposition', type: 'text', data: String(mktVal.valueProposition) });
          }
        }
      }

      // ── Generic pass: any remaining dashboard field (QA, future roles) ───────
      // Handles criticalScenarios, risks, testSuites, testingPyramid, qaStack,
      // criticalPaths, and any custom field added by future protocols.
      const processedDashKeys = new Set([
        'summary', 'kpis', 'tabs', 'rawContent', 'timestamp', '_id', '_meta',
        // Marketing fields already processed above
        'channelStrategy', 'unitEconomics', 'buyerPersona', 'messagingFramework',
        'roasScenarios', 'competitiveMap', 'industryBenchmarks', 'gtmCalendar',
        'tacticalFunnel', 'roadmapData', 'psychoData',
      ]);
      const lang2 = (language === 'es' ? 'es' : 'en') as 'es' | 'en';

      for (const [dashKey, dashVal] of Object.entries(value as Record<string, any>)) {
        if (processedDashKeys.has(dashKey) || !dashVal) continue;

        // testSuites: flatten cases[] from each suite → single test-cases table
        if (dashKey === 'testSuites' && Array.isArray(dashVal)) {
          const flat = (dashVal as any[]).flatMap((s: any) =>
            Array.isArray(s.cases) ? s.cases.map((c: any) => ({ ...c, suite: s.name })) : []
          );
          if (flat.length) {
            sections.push({ title: dashSectionTitle('testSuites', lang2), type: 'table', data: smartFilterTableColumns(flat) });
          }
          continue;
        }

        // testingPyramid: { unit:{pct,label}, integration, e2e } → kpi_grid
        if (dashKey === 'testingPyramid' && typeof dashVal === 'object' && dashVal !== null) {
          const grid: Record<string, string | number> = {};
          for (const [pk, pv] of Object.entries(dashVal as any)) {
            if (typeof (pv as any)?.pct === 'number') {
              grid[String((pv as any).label ?? pk)] = `${(pv as any).pct}%`;
            }
          }
          if (Object.keys(grid).length) {
            sections.push({ title: dashSectionTitle('testingPyramid', lang2), type: 'kpi_grid', data: grid });
          }
          continue;
        }

        // qaStack: object-of-objects → flat table (Component / Recommended / Rationale / Cost)
        if (dashKey === 'qaStack' && typeof dashVal === 'object' && dashVal !== null && !Array.isArray(dashVal)) {
          const stackRows = Object.entries(dashVal as any).map(([k, v]: [string, any]) => ({
            [language === 'es' ? 'Componente' : 'Component']:    k,
            [language === 'es' ? 'Recomendado' : 'Recommended']: String(v?.recommended ?? ''),
            [language === 'es' ? 'Justificación' : 'Rationale']: String(v?.rationale ?? '').substring(0, 100),
            [language === 'es' ? 'Costo' : 'Cost']:              String(v?.cost ?? ''),
          }));
          if (stackRows.length) {
            sections.push({ title: dashSectionTitle('qaStack', lang2), type: 'table', data: stackRows });
          }
          continue;
        }

        // criticalPaths: array with nested steps[] → list of journey names
        if (dashKey === 'criticalPaths' && Array.isArray(dashVal)) {
          const items = (dashVal as any[])
            .map((p: any) => String(p.journey ?? p.name ?? ''))
            .filter(Boolean);
          if (items.length) {
            sections.push({ title: dashSectionTitle('criticalPaths', lang2), type: 'list', data: items });
          }
          continue;
        }

        // Generic: array of objects → table with smart column filter
        if (Array.isArray(dashVal) && dashVal.length > 0 && typeof dashVal[0] === 'object') {
          const clean = smartFilterTableColumns((dashVal as any[]).filter(v => typeof v === 'object' && v !== null));
          if (clean.length) {
            sections.push({ title: dashSectionTitle(dashKey, lang2), type: 'table', data: clean });
          }
          continue;
        }

        // Generic: long string → text section
        if (typeof dashVal === 'string' && dashVal.length > 50) {
          sections.push({ title: dashSectionTitle(dashKey, lang2), type: 'text', data: dashVal });
          continue;
        }

        // Generic: array of strings → list
        if (Array.isArray(dashVal) && dashVal.length > 0 && typeof dashVal[0] === 'string') {
          sections.push({ title: dashSectionTitle(dashKey, lang2), type: 'list', data: (dashVal as any[]).filter(Boolean) });
          continue;
        }

        // Generic: flat object with primitive values → kpi_grid
        if (typeof dashVal === 'object' && !Array.isArray(dashVal) && dashVal !== null) {
          const grid: Record<string, string | number> = {};
          for (const [k2, v2] of Object.entries(dashVal as any)) {
            if (typeof v2 === 'string' || typeof v2 === 'number') grid[k2] = v2;
          }
          if (Object.keys(grid).length) {
            sections.push({ title: dashSectionTitle(dashKey, lang2), type: 'kpi_grid', data: grid });
          }
        }
      }

      continue; // skip generic normalization for 'dashboard'
    }

    // ── summary / executiveSummary at root: deduplicate into one section ────────
    if ((key === 'summary' || key === 'executiveSummary' || key === 'Executive_Summary' || key === 'projectSummary') &&
        typeof value === 'string' && value.length > 50) {
      const summaryTitle = language === 'es' ? 'Resumen Ejecutivo' : 'Executive Summary';
      const alreadyHasSummary = sections.some(s => s.title === summaryTitle);
      if (!alreadyHasSummary) {
        sections.push({ title: summaryTitle, type: 'text', data: value });
      }
      continue;
    }

    // ── Project Manager: phases[] with tasks as objects → readable table ─────
    if ((key === 'phases' || key === 'projectPhases') && Array.isArray(value)) {
      const phaseRows = value.map((phase: any) => ({
        [language === 'es' ? 'Fase' : 'Phase']:              String(phase.id ?? '').toUpperCase(),
        [language === 'es' ? 'Nombre' : 'Name']:             String(phase.name ?? ''),
        [language === 'es' ? 'Semana Inicio' : 'Start Week']:String(phase.startWeek ?? ''),
        [language === 'es' ? 'Duración (sem.)' : 'Duration']:String(phase.duration ?? ''),
        [language === 'es' ? 'Tareas' : 'Tasks']:            Array.isArray(phase.tasks)
          ? phase.tasks.map((t: any) => typeof t === 'string' ? t : String(t.name ?? '')).filter(Boolean).join(', ')
          : String(phase.tasks ?? ''),
      }));
      if (phaseRows.length > 0) {
        sections.push({
          title: language === 'es' ? 'Fases del Proyecto' : 'Project Phases',
          type: 'table',
          data: phaseRows,
        });
      }
      continue;
    }

    // ── Project Manager: resources[] → readable table ─────────────────────────
    if (key === 'resources' && Array.isArray(value) && value.length > 0 &&
        typeof value[0] === 'object' && (value[0].role || value[0].Role)) {
      const resRows = value.map((res: any) => ({
        [language === 'es' ? 'Rol' : 'Role']:        String(res.role ?? res.Role ?? ''),
        [language === 'es' ? 'Seniority' : 'Seniority']: String(res.seniority ?? '-'),
        [language === 'es' ? 'Cantidad' : 'Count']:   String(res.count ?? 1),
        [language === 'es' ? 'Rate/Mes' : 'Rate/Month']: String(res.rate ?? ''),
      }));
      sections.push({
        title: language === 'es' ? 'Equipo y Recursos' : 'Team & Resources',
        type: 'table',
        data: resRows,
      });
      continue;
    }

    // ── PPT_PROTOCOL: slides[] → agenda/deliverables list ────────────────────
    if (key === 'slides' && Array.isArray(value) && value.length > 0 &&
        typeof value[0] === 'object' && value[0].title) {
      const agendaItems = value
        .map((s: any) => {
          const bullets = Array.isArray(s.bullets) && s.bullets.length > 0
            ? ` — ${s.bullets.slice(0, 2).join(', ')}`
            : '';
          return `${String(s.title ?? '')}${bullets}`;
        })
        .filter(Boolean);
      if (agendaItems.length > 0) {
        sections.push({
          title: language === 'es' ? 'Entregables del Proyecto' : 'Project Deliverables',
          type: 'list',
          data: agendaItems,
        });
      }
      continue;
    }

    // ── EXCEL_PROTOCOL: excel_data[] → extract tables per sheet ──────────────
    if (key === 'excel_data' && Array.isArray(value)) {
      for (const sheet of value) {
        if (!sheet || !sheet.sheetName) continue;
        const cols: string[] = Array.isArray(sheet.columns) ? sheet.columns.map(String) : [];
        const rows: any[] = Array.isArray(sheet.rows) ? sheet.rows : [];
        if (cols.length > 0 && rows.length > 0) {
          const tableRows = rows.map((row: any) => {
            if (Array.isArray(row)) {
              // Correct EXCEL_PROTOCOL format: rows as flat arrays
              return Object.fromEntries(cols.map((c, i) => [c, String(row[i] ?? '')]));
            } else if (typeof row === 'object' && row !== null) {
              // AI deviation: rows returned as objects
              const result: Record<string, string> = {};
              for (const col of cols) {
                result[col] = String(row[col] ?? row[col.toLowerCase()] ?? '');
              }
              return result;
            }
            return { [language === 'es' ? 'Valor' : 'Value']: String(row) };
          });
          sections.push({ title: String(sheet.sheetName), type: 'table', data: tableRows });
        }
      }
      continue;
    }

    // ── CHART_PROTOCOL: charts[] → extract data tables per chart ─────────────
    if (key === 'charts' && Array.isArray(value)) {
      for (const chart of value) {
        if (!chart || !Array.isArray(chart.data) || chart.data.length === 0) continue;
        const rows = chart.data
          .filter((d: any) => typeof d === 'object' && d !== null)
          .map((d: any) => ({
            [language === 'es' ? 'Categoría' : 'Category']: String(d.name ?? d.label ?? ''),
            [language === 'es' ? 'Valor' : 'Value']:         String(d.value ?? d.count ?? ''),
          }));
        if (rows.length > 0) {
          sections.push({
            title: String(chart.title ?? (language === 'es' ? 'Gráfico' : 'Chart')),
            type: 'table',
            data: rows,
          });
        }
      }
      continue;
    }

    // ── DIAGRAM_PROTOCOL: diagrams[] → skip (not renderable in text docs) ────
    if (key === 'diagrams' && Array.isArray(value)) {
      continue;
    }

    // ── techStack: nested TechItem objects → flat table ─────────────────────
    if (key === 'techStack' && typeof value === 'object' && value !== null && !Array.isArray(value)) {
      const LAYER_LABELS: Record<string, { es: string; en: string }> = {
        architecture:   { es: 'Arquitectura',     en: 'Architecture' },
        frontend:       { es: 'Frontend',          en: 'Frontend' },
        backend:        { es: 'Backend',           en: 'Backend' },
        database:       { es: 'Base de Datos',     en: 'Database' },
        infrastructure: { es: 'Infraestructura',   en: 'Infrastructure' },
      };
      const techRows = Object.entries(value)
        .filter(([, v]) => typeof v === 'object' && v !== null && (v as any).name)
        .map(([layerKey, v]: [string, any]) => {
          const label = LAYER_LABELS[layerKey]
            ? LAYER_LABELS[layerKey][language === 'es' ? 'es' : 'en']
            : layerKey;
          return {
            [language === 'es' ? 'Capa' : 'Layer']:             label,
            [language === 'es' ? 'Tecnología' : 'Technology']:  String(v.name ?? ''),
            [language === 'es' ? 'Justificación' : 'Rationale']: String(v.reason ?? ''),
          };
        });
      if (techRows.length > 0) {
        sections.push({
          title: language === 'es' ? 'Stack Tecnológico' : 'Technology Stack',
          type: 'table',
          data: techRows,
        });
      }
      continue;
    }

    // ── Marketing Manager: buyerPersona → text block ─────────────────────────
    if (key === 'buyerPersona' && typeof value === 'object' && value !== null) {
      const demo = value.demographics ?? {};
      const lines: string[] = [];
      if (value.avatar) lines.push(`"${value.avatar}"`);
      if (demo.age)      lines.push(`${language === 'es' ? 'Edad' : 'Age'}: ${demo.age}`);
      if (demo.location) lines.push(`${language === 'es' ? 'Ubicación' : 'Location'}: ${demo.location}`);
      if (demo.income)   lines.push(`${language === 'es' ? 'Ingresos' : 'Income'}: ${demo.income}`);
      if (value.painPoint) lines.push(`${language === 'es' ? 'Dolor principal' : 'Pain point'}: ${value.painPoint}`);
      if (Array.isArray(value.goals) && value.goals.length > 0)
        lines.push(`${language === 'es' ? 'Objetivos' : 'Goals'}: ${value.goals.join(' | ')}`);
      if (Array.isArray(value.objections) && value.objections.length > 0)
        lines.push(`${language === 'es' ? 'Objeciones' : 'Objections'}: ${value.objections.join(' | ')}`);
      if (lines.length > 0) {
        sections.push({
          title: language === 'es' ? 'Buyer Persona' : 'Buyer Persona',
          type: 'text',
          data: lines.join('\n'),
        });
      }
      continue;
    }

    // ── Marketing Manager: messagingFramework → value prop + key messages table ─
    if (key === 'messagingFramework' && typeof value === 'object' && value !== null) {
      if (typeof value.valueProposition === 'string' && value.valueProposition.length > 0) {
        sections.push({
          title: language === 'es' ? 'Propuesta de Valor' : 'Value Proposition',
          type: 'text',
          data: value.valueProposition,
        });
      }
      if (typeof value.elevatorPitch === 'string' && value.elevatorPitch.length > 0) {
        sections.push({
          title: language === 'es' ? 'Elevator Pitch' : 'Elevator Pitch',
          type: 'text',
          data: value.elevatorPitch,
        });
      }
      const kms = Array.isArray(value.keyMessages) ? value.keyMessages : [];
      if (kms.length > 0) {
        const rows = kms.map((km: any) => ({
          [language === 'es' ? 'Audiencia' : 'Audience']: String(km.audience ?? ''),
          [language === 'es' ? 'Mensaje'   : 'Message']:  String(km.message ?? ''),
          [language === 'es' ? 'Tono'      : 'Tone']:     String(km.tone ?? ''),
        }));
        sections.push({
          title: language === 'es' ? 'Mensajes Clave' : 'Key Messages',
          type: 'table',
          data: rows,
        });
      }
      continue;
    }

    // ── Marketing Manager: channelStrategy[] → readable table ─────────────────
    if (key === 'channelStrategy' && Array.isArray(value) && value.length > 0) {
      const rows = value.map((ch: any) => ({
        [language === 'es' ? 'Canal'      : 'Channel']:       String(ch.canal ?? ch.channel ?? ''),
        [language === 'es' ? 'Impacto'    : 'Impact']:        String(ch.impact ?? ''),
        [language === 'es' ? 'Presupuesto': 'Budget']:        ch.budgetPct ? `${ch.budgetPct}%` : '—',
        [language === 'es' ? 'Rec.'       : 'Rec.']:          ch.recommended ? '✓' : '',
        [language === 'es' ? 'Justificación' : 'Rationale']:  String(ch.rationale ?? ''),
      }));
      sections.push({
        title: language === 'es' ? 'Estrategia de Canales' : 'Channel Strategy',
        type: 'table',
        data: rows,
      });
      continue;
    }

    // ── Marketing Manager: roasScenarios → kpi_grid with prefixed keys ────────
    if (key === 'roasScenarios' && typeof value === 'object' && value !== null) {
      const kpiData: Record<string, string | number> = {};
      const scenarios: Array<[string, string]> = [
        ['conservative', language === 'es' ? 'Conservador' : 'Conservative'],
        ['base',         'Base'],
        ['aggressive',   language === 'es' ? 'Agresivo' : 'Aggressive'],
      ];
      for (const [scKey, scLabel] of scenarios) {
        const sc = value[scKey];
        if (!sc) continue;
        if (sc.roas !== undefined)         kpiData[`${scLabel} ROAS`]         = `${sc.roas}x`;
        if (sc.monthlySales !== undefined) kpiData[`${scLabel} ${language === 'es' ? 'Ventas/mes' : 'Sales/mo'}`] =
          `$${Number(sc.monthlySales).toLocaleString()}`;
      }
      if (Object.keys(kpiData).length > 0) {
        sections.push({
          title: language === 'es' ? 'Escenarios ROAS' : 'ROAS Scenarios',
          type: 'kpi_grid',
          data: kpiData,
        });
      }
      continue;
    }

    // ── Marketing Manager: gtmCalendar[] → table with tasks joined as string ──
    if (key === 'gtmCalendar' && Array.isArray(value) && value.length > 0) {
      const rows = value.slice(0, 12).map((wk: any) => ({
        [language === 'es' ? 'Semana' : 'Week']:  String(wk.week ?? ''),
        [language === 'es' ? 'Fase'   : 'Phase']: String(wk.phase ?? ''),
        [language === 'es' ? 'Tareas' : 'Tasks']: Array.isArray(wk.tasks)
          ? wk.tasks.slice(0, 3).join(', ')
          : String(wk.tasks ?? ''),
        [language === 'es' ? 'Estado' : 'Status']: String(wk.status ?? ''),
      }));
      sections.push({
        title: language === 'es' ? 'Calendario GTM' : 'GTM Calendar',
        type: 'table',
        data: rows,
      });
      continue;
    }

    // ── Marketing Manager: tacticalFunnel[] → clean table (skip icon/color) ──
    if (key === 'tacticalFunnel' && Array.isArray(value) && value.length > 0) {
      const rows = value.map((stage: any) => ({
        Stage:                                              String(stage.stage ?? ''),
        [language === 'es' ? 'Métrica' : 'Metric']:       String(stage.metric ?? ''),
        [language === 'es' ? 'Valor'   : 'Value']:         String(stage.value ?? ''),
        [language === 'es' ? 'Acción'  : 'Action']:        String(stage.action ?? ''),
        [language === 'es' ? 'Conv. sig.' : 'Next Conv.']: stage.conversionToNext
          ? `${(Number(stage.conversionToNext) * 100).toFixed(0)}%`
          : '—',
      }));
      sections.push({
        title: language === 'es' ? 'Embudo Táctico' : 'Tactical Funnel',
        type: 'table',
        data: rows,
      });
      continue;
    }

    // ── Marketing Manager: competitiveMap[] → readable table ─────────────────
    if (key === 'competitiveMap' && Array.isArray(value) && value.length > 0) {
      const rows = value.map((comp: any) => ({
        [language === 'es' ? 'Competidor'     : 'Competitor']:    String(comp.name ?? ''),
        [language === 'es' ? 'Precio'         : 'Price Score']:   String(comp.price ?? ''),
        [language === 'es' ? 'Valor'          : 'Value Score']:   String(comp.value ?? ''),
        [language === 'es' ? 'Fortaleza'      : 'Strength']:      String(comp.strength ?? ''),
        [language === 'es' ? 'Diferenciación' : 'Differentiation']: String(comp.differentiation ?? ''),
      }));
      sections.push({
        title: language === 'es' ? 'Mapa Competitivo' : 'Competitive Landscape',
        type: 'table',
        data: rows,
      });
      continue;
    }

    // ── Marketing Manager: psychoData[] → skip (radar chart data, not useful) ─
    if (key === 'psychoData') {
      continue;
    }

    // ── Marketing Manager: roadmapData[] → readable table ────────────────────
    if (key === 'roadmapData' && Array.isArray(value) && value.length > 0) {
      const rows = value.map((item: any) => ({
        [language === 'es' ? 'Semana'  : 'Week']:   String(item.week ?? `Week ${item.id ?? ''}`),
        [language === 'es' ? 'Tarea'   : 'Task']:   String(item.task ?? ''),
        [language === 'es' ? 'Estado'  : 'Status']: String(item.status ?? ''),
        [language === 'es' ? 'Subtareas' : 'Subtasks']: Array.isArray(item.subtasks)
          ? item.subtasks.slice(0, 3).join(', ')
          : '',
      }));
      sections.push({
        title: language === 'es' ? 'Hoja de Ruta' : 'Roadmap',
        type: 'table',
        data: rows,
      });
      continue;
    }

    // ── Marketing Manager: industryBenchmarks → flat kpi_grid ─────────────────
    if (key === 'industryBenchmarks' && typeof value === 'object' && value !== null) {
      const kpiData: Record<string, string | number> = {};
      if (value.vertical)           kpiData[language === 'es' ? 'Vertical'   : 'Vertical']    = String(value.vertical);
      if (value.avgCPC !== undefined)          kpiData['Avg CPC']           = `$${value.avgCPC}`;
      if (value.avgConversionRate !== undefined) kpiData[language === 'es' ? 'Conv. promedio' : 'Avg Conv.'] =
        `${(Number(value.avgConversionRate) * 100).toFixed(1)}%`;
      if (value.avgCAC !== undefined)          kpiData['Avg CAC']           = `$${value.avgCAC}`;
      if (value.avgLTV !== undefined)          kpiData['Avg LTV']           = `$${value.avgLTV}`;
      if (value.avgTicket !== undefined)       kpiData[language === 'es' ? 'Ticket promedio' : 'Avg Ticket'] = `$${value.avgTicket}`;
      if (Object.keys(kpiData).length > 0) {
        sections.push({
          title: language === 'es' ? 'Benchmarks del Sector' : 'Industry Benchmarks',
          type: 'kpi_grid',
          data: kpiData,
        });
      }
      continue;
    }

    // Special handling for known structures
    if (key === 'sprints' && Array.isArray(value)) {
      // Agile structure: array of sprints
      sections.push({
        title: 'Sprints',
        type: 'table',
        data: smartFilterTableColumns(value.filter(v => typeof v === 'object' && v !== null)),
      });
      continue;
    }

    // General normalization for other keys
    const subsections = normalizeValue(value, 0, 3);

    for (const sub of subsections) {
      sections.push({
        ...sub,
        title: sub.title ? `${key} > ${sub.title}` : key,
      });
    }
  }

  // If we have short strings, add them as a KPI grid section at the beginning
  if (Object.keys(topLevelKpis).length > 0) {
    sections.unshift({
      title: language === 'es' ? 'Indicadores Clave' : 'Key Indicators',
      type: 'kpi_grid',
      data: topLevelKpis,
    });
  }

  // Format all section titles from raw paths to human-readable titles
  // Also format kpi_grid keys to be human-readable
  for (const section of sections) {
    if (section.title) {
      section.title = buildSectionTitle(section.title, language);
    }
    if (section.type === 'kpi_grid' && typeof section.data === 'object' && !Array.isArray(section.data)) {
      const formatted: Record<string, string | number> = {};
      for (const [k, v] of Object.entries(section.data)) {
        formatted[formatKeyToTitle(k, language)] = v as string | number;
      }
      section.data = formatted;
    }
  }

  // Post-process: strip URLs and grounding citations from all section content.
  // Applied universally — affects every role, every format (DOCX, PDF, Excel).
  for (const section of sections) {
    if (section.type === 'text' && typeof section.data === 'string') {
      section.data = cleanText(section.data);
    }
    if (section.type === 'list' && Array.isArray(section.data)) {
      section.data = (section.data as string[]).map(cleanText).filter(s => s.length > 2);
    }
    if (section.type === 'table' && Array.isArray(section.data)) {
      section.data = (section.data as Record<string, any>[]).map(row => {
        const cleaned: Record<string, any> = {};
        for (const [k, v] of Object.entries(row)) {
          cleaned[k] = typeof v === 'string' ? cleanText(v) : v;
        }
        return cleaned;
      });
    }
    if (section.type === 'kpi_grid' &&
        section.data && typeof section.data === 'object' && !Array.isArray(section.data)) {
      const cleaned: Record<string, string | number> = {};
      for (const [k, v] of Object.entries(section.data as Record<string, any>)) {
        const cleanedKey = cleanText(k);
        cleaned[cleanedKey] = typeof v === 'string' ? cleanText(v) : v as string | number;
      }
      section.data = cleaned;
    }
  }

  const profile = getRoleExportProfile(roleId);

  return {
    roleId,
    roleName,
    projectName,
    language,
    sections,
    metadata: {
      generatedAt:      new Date(),
      documentTitle:    profile.documentTitle,
      documentSubtitle: profile.documentSubtitle,
    },
  };
}

/**
 * Helper: flatten a NormalizedDocument to extract just text for previews.
 */
export function flattenDocumentToText(doc: NormalizedDocument): string {
  const lines: string[] = [];

  lines.push(`${doc.roleName} — ${doc.projectName}`);
  lines.push('');

  for (const section of doc.sections) {
    if (section.title) {
      lines.push(`## ${section.title}`);
    }

    if (section.type === 'text' && typeof section.data === 'string') {
      lines.push(section.data);
    } else if (section.type === 'list' && Array.isArray(section.data)) {
      for (const item of section.data) {
        lines.push(`- ${item}`);
      }
    } else if (section.type === 'table' && Array.isArray(section.data)) {
      lines.push('[Table with ' + section.data.length + ' rows]');
    } else if (section.type === 'kpi_grid' && typeof section.data === 'object') {
      for (const [key, val] of Object.entries(section.data)) {
        lines.push(`${key}: ${val}`);
      }
    }

    lines.push('');
  }

  return lines.join('\n');
}
