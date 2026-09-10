/**
 * pdfDriver.ts — PDF implementation of DocumentDriver
 *
 * Wraps jsPDF to produce branded, multi-page PDF documents.
 * Role color (documentColor from roleExportConfig) is injected by the caller.
 */

import jsPDF from 'jspdf';
import { DocumentDriver, DocumentMeta } from '../documentRenderer';

const SLATE_600 = { r: 71, g: 85, b: 105 };

const SHORT_COL_RE = /^(id|code|type|category|status|priority|impact|prob|pct|cost|value|score|owner|source|auto|moscow|suite|component)$/i;
const LONG_COL_RE  = /^(text|description|rule|title|name|rationale|mitigation|journey|scenario|strategy|recommended|summary)$/i;

function calcColWidths(headers: string[], contentW: number): number[] {
  const weights = headers.map(h => LONG_COL_RE.test(h) ? 3 : SHORT_COL_RE.test(h) ? 1 : 2);
  const total   = weights.reduce((a, b) => a + b, 0);
  return weights.map(w => (w / total) * contentW);
}

export class PdfDriver implements DocumentDriver {
  private doc!: jsPDF;
  private meta!: DocumentMeta;
  private roleColor!: { r: number; g: number; b: number };
  private currentY!: number;
  private currentPage!: number;

  // Layout constants
  private readonly MARGIN   = 20;
  private readonly PAGE_W   = 210; // A4 mm
  private readonly PAGE_H   = 297;
  private readonly FOOTER_Y = 287;

  private get contentW(): number { return this.PAGE_W - this.MARGIN * 2; }

  beginDocument(meta: DocumentMeta, roleColor: string): void {
    this.meta        = meta;
    this.doc         = new jsPDF();
    this.currentPage = 1;
    this.currentY    = this.MARGIN;

    const hex        = roleColor;
    this.roleColor   = {
      r: (parseInt(hex, 16) >> 16) & 255,
      g: (parseInt(hex, 16) >> 8)  & 255,
      b:  parseInt(hex, 16)        & 255,
    };
  }

  renderCover(meta: DocumentMeta, _roleColor: string, documentTitle?: string): void {
    const { r, g, b } = this.roleColor;
    const locale = meta.language === 'es' ? 'es-ES' : 'en-US';

    // Full-width header bar
    this.doc.setFillColor(r, g, b);
    this.doc.rect(0, 0, this.PAGE_W, 40, 'F');

    // Role name
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(28);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(meta.roleName.toUpperCase(), this.PAGE_W / 2, 24, { align: 'center' });

    // Document title (if provided)
    let nextY = 70;
    if (documentTitle) {
      this.doc.setFontSize(18);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(r, g, b);
      this.doc.text(documentTitle, this.PAGE_W / 2, 58, { align: 'center' });
      nextY = 78;
    }

    // Project name
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(40, 40, 40);
    this.doc.text(meta.projectName, this.PAGE_W / 2, nextY, { align: 'center' });

    // Date
    this.doc.setFontSize(11);
    this.doc.setTextColor(100, 100, 100);
    this.doc.text(meta.generatedAt.toLocaleDateString(locale), this.PAGE_W / 2, nextY + 15, { align: 'center' });

    // PILOT AI branding
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(r, g, b);
    this.doc.text('PILOT AI Generated Report', this.PAGE_W / 2, nextY + 30, { align: 'center' });

    this.addFooter(this.currentPage, meta.roleName);
    this.addPageBreak();
  }

  renderTOC(lang: 'es' | 'en'): void {
    // PDF auto-TOC is not natively supported in jsPDF — render a note instead
    this.ensureSpace(20);
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(this.roleColor.r, this.roleColor.g, this.roleColor.b);
    const label = lang === 'es' ? 'Contenido del Reporte' : 'Report Contents';
    this.doc.text(label, this.MARGIN, this.currentY);
    this.currentY += 8;

    this.doc.setDrawColor(this.roleColor.r, this.roleColor.g, this.roleColor.b);
    this.doc.setLineWidth(0.5);
    this.doc.line(this.MARGIN, this.currentY, this.PAGE_W - this.MARGIN, this.currentY);
    this.currentY += 10;
  }

  renderSectionHeading(title: string, _roleColor: string): void {
    this.ensureSpace(20);
    this.doc.setFontSize(16);
    this.doc.setTextColor(this.roleColor.r, this.roleColor.g, this.roleColor.b);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(title, this.MARGIN, this.currentY);
    this.currentY += 10;
  }

  renderParagraph(text: string): void {
    this.ensureSpace(15);
    const lines = this.doc.splitTextToSize(text, this.contentW);
    this.doc.setFontSize(11);
    this.doc.setTextColor(40, 40, 40);
    this.doc.setFont('helvetica', 'normal');

    lines.forEach((line: string) => {
      this.ensureSpace(7);
      this.doc.text(line, this.MARGIN, this.currentY);
      this.currentY += 6;
    });
    this.currentY += 4;
  }

  renderList(items: string[]): void {
    const { r, g, b } = this.roleColor;
    items.forEach(item => {
      this.ensureSpace(8);
      // Bullet dot in role color
      this.doc.setFillColor(r, g, b);
      this.doc.circle(this.MARGIN + 2, this.currentY - 1.5, 1.2, 'F');
      // Item text
      this.doc.setFontSize(11);
      this.doc.setTextColor(40, 40, 40);
      this.doc.setFont('helvetica', 'normal');
      const lines = this.doc.splitTextToSize(String(item), this.contentW - 8);
      this.doc.text(lines, this.MARGIN + 6, this.currentY);
      this.currentY += 6 * lines.length;
    });
    this.currentY += 4;
  }

  renderTable(headers: string[], rows: Record<string, any>[], _roleColor: string): void {
    const colWidths  = calcColWidths(headers, this.contentW);
    const { r, g, b } = this.roleColor;
    const headerH    = 8;

    this.ensureSpace(headerH * 2);

    // Header row
    this.doc.setFillColor(r, g, b);
    this.doc.rect(this.MARGIN, this.currentY - 6, this.contentW, headerH, 'F');
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'bold');
    let xOff = 0;
    headers.forEach((h, i) => {
      this.doc.text(String(h), this.MARGIN + xOff + 2, this.currentY);
      xOff += colWidths[i];
    });
    this.currentY += headerH;

    // Data rows — proportional widths, no 30-char truncation, dynamic row height
    rows.forEach((row, rIdx) => {
      const cellLines: string[][] = headers.map((h, i) => {
        const text  = String(row[h] ?? '');
        const lines = (this.doc.splitTextToSize(text, colWidths[i] - 4) as string[]).slice(0, 2);
        return lines;
      });
      const maxLines = Math.max(1, ...cellLines.map(l => l.length));
      const rowH     = Math.max(8, maxLines * 5 + 3);

      this.ensureSpace(rowH);
      if (rIdx % 2 === 0) {
        this.doc.setFillColor(248, 250, 252);
        this.doc.rect(this.MARGIN, this.currentY - 6, this.contentW, rowH, 'F');
      }
      this.doc.setTextColor(40, 40, 40);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(9);

      let xOffset = 0;
      headers.forEach((h, i) => {
        this.doc.text(cellLines[i], this.MARGIN + xOffset + 2, this.currentY);
        xOffset += colWidths[i];
      });
      this.currentY += rowH;
    });

    this.currentY += 6;
  }

  renderKPIGrid(pairs: Record<string, any>, _roleColor: string): void {
    const { r, g, b } = this.roleColor;
    const labelW = this.contentW * 0.45;
    const valueW = this.contentW * 0.55;
    const rowH   = 9;

    Object.entries(pairs).forEach(([label, value], idx) => {
      this.ensureSpace(rowH);

      if (idx % 2 === 0) {
        this.doc.setFillColor(248, 250, 252);
        this.doc.rect(this.MARGIN, this.currentY - 6, this.contentW, rowH, 'F');
      }

      // Label (role color background strip)
      this.doc.setFillColor(r, g, b);
      this.doc.rect(this.MARGIN, this.currentY - 6, labelW, rowH, 'F');
      this.doc.setTextColor(255, 255, 255);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setFontSize(10);
      this.doc.text(String(label).substring(0, 35), this.MARGIN + 2, this.currentY);

      // Value
      this.doc.setTextColor(r, g, b);
      this.doc.text(String(value).substring(0, 40), this.MARGIN + labelW + 4, this.currentY);

      this.currentY += rowH;
    });
    this.currentY += 4;
  }

  async finalizeDocument(baseName: string): Promise<void> {
    this.addFooter(this.currentPage, this.meta.roleName);
    this.doc.save(`${baseName}.pdf`);
  }

  // ── Private helpers ──────────────────────────────────────────────────────────

  private ensureSpace(needed: number): void {
    if (this.currentY + needed > this.FOOTER_Y - 15) {
      this.addFooter(this.currentPage, this.meta.roleName);
      this.addPageBreak();
    }
  }

  private addFooter(pageNum: number, roleName: string): void {
    this.doc.setDrawColor(200, 200, 200);
    this.doc.line(this.MARGIN, this.FOOTER_Y - 5, this.PAGE_W - this.MARGIN, this.FOOTER_Y - 5);
    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(SLATE_600.r, SLATE_600.g, SLATE_600.b);
    this.doc.text(`PILOT AI | ${roleName}`, this.MARGIN, this.FOOTER_Y);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(`${pageNum}`, this.PAGE_W - this.MARGIN, this.FOOTER_Y, { align: 'right' });
    this.doc.setFont('helvetica', 'normal');
  }

  private addPageBreak(): void {
    this.doc.addPage();
    this.currentPage++;
    this.currentY = this.MARGIN + 10;

    // Draw page header with role color bar
    const { r, g, b } = this.roleColor;
    this.doc.setFillColor(r, g, b);
    this.doc.rect(0, 0, this.PAGE_W, 12, 'F');
    this.currentY = 22;
  }
}
