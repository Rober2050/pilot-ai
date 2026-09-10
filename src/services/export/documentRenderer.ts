/**
 * documentRenderer.ts — Shared Document Rendering Engine
 *
 * Implements the Driver pattern: a single rendering loop (renderDocument)
 * drives format-specific implementations (DocxDriver, PdfDriver).
 *
 * Benefits:
 * - DOCX and PDF receive identical calls in identical order → visual consistency
 * - Adding a new format (e.g. HTML export) = implement DocumentDriver + register it
 * - Role color is sourced from roleExportConfig — no per-format color definitions
 *
 * NOT used by: generateReport (multi-role PMBOK Word), generateScreenshotPDF (screenshot-based).
 * Those serve different use cases and are intentionally excluded.
 */

import { NormalizedDocument, NormalizedSection } from './contentNormalizer';

export interface DocumentMeta {
  roleName:    string;
  projectName: string;
  language:    'es' | 'en';
  generatedAt: Date;
}

/**
 * Contract every document format driver must implement.
 * Methods are called in the order defined in renderDocument below.
 */
export interface DocumentDriver {
  /** Called once before any content — initializes the document object */
  beginDocument(meta: DocumentMeta, roleColor: string): void;

  /** Cover page: role name, document title, project name, date */
  renderCover(meta: DocumentMeta, roleColor: string, documentTitle?: string): void;

  /** Table of contents */
  renderTOC(lang: 'es' | 'en'): void;

  /** Section heading (H2 equivalent) */
  renderSectionHeading(title: string, roleColor: string): void;

  /** Body paragraph */
  renderParagraph(text: string): void;

  /** Bulleted list */
  renderList(items: string[]): void;

  /** Data table with typed header row */
  renderTable(headers: string[], rows: Record<string, any>[], roleColor: string): void;

  /** KPI grid as 2-column label/value table */
  renderKPIGrid(pairs: Record<string, any>, roleColor: string): void;

  /** Called once at the end — triggers save/download */
  finalizeDocument(filename: string): Promise<void>;
}

/**
 * Generates a consistent filename for document exports.
 * Format: RoleName_ProjectName.ext (extension added by the driver)
 */
export function buildDocumentBaseName(roleName: string, projectName: string): string {
  const safe = (s: string) => s.replace(/[^a-zA-Z0-9\u00C0-\u024F\s]/g, '').replace(/\s+/g, '_').substring(0, 40);
  return `${safe(roleName)}_${safe(projectName)}`;
}

/**
 * Shared rendering loop — format-agnostic.
 * DocxDriver and PdfDriver receive identical calls in identical order,
 * guaranteeing consistent content structure across formats.
 */
export async function renderDocument(
  driver: DocumentDriver,
  normalizedDoc: NormalizedDocument,
  roleColor: string,
  lang: 'es' | 'en',
  baseName: string
): Promise<void> {
  const meta: DocumentMeta = {
    roleName:    normalizedDoc.roleName,
    projectName: normalizedDoc.projectName,
    language:    lang,
    generatedAt: new Date(),
  };

  driver.beginDocument(meta, roleColor);
  driver.renderCover(meta, roleColor, normalizedDoc.metadata?.documentTitle);
  driver.renderTOC(lang);

  for (const section of normalizedDoc.sections) {
    driver.renderSectionHeading(section.title, roleColor);
    renderSection(driver, section, roleColor);
  }

  await driver.finalizeDocument(baseName);
}

function renderSection(driver: DocumentDriver, section: NormalizedSection, roleColor: string): void {
  switch (section.type) {
    case 'text':
      if (typeof section.data === 'string') {
        driver.renderParagraph(section.data);
      }
      break;

    case 'list':
      if (Array.isArray(section.data)) {
        driver.renderList(section.data.map(String));
      }
      break;

    case 'table':
      if (Array.isArray(section.data) && section.data.length > 0) {
        const rows = section.data as Record<string, any>[];
        driver.renderTable(Object.keys(rows[0]), rows, roleColor);
      }
      break;

    case 'kpi_grid':
      if (section.data && typeof section.data === 'object' && !Array.isArray(section.data)) {
        driver.renderKPIGrid(section.data as Record<string, any>, roleColor);
      }
      break;

    default:
      // Unknown section type — skip gracefully, no crash
      break;
  }
}
