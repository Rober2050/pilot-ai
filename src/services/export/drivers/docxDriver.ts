/**
 * docxDriver.ts — DOCX implementation of DocumentDriver
 *
 * Wraps the `docx` library to produce branded Word documents.
 * Role color (documentColor from roleExportConfig) is injected by the caller.
 */

import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, TableOfContents,
  PageBreak, AlignmentType, Table, TableRow, TableCell, WidthType,
  BorderStyle, Header, Footer, PageNumber,
} from 'docx';
import { saveAs } from 'file-saver';
import { DocumentDriver, DocumentMeta } from '../documentRenderer';

const SHORT_COL_RE = /^(id|code|type|category|status|priority|impact|prob|pct|cost|value|score|owner|source|auto|moscow|suite|component)$/i;
const LONG_COL_RE  = /^(text|description|rule|title|name|rationale|mitigation|journey|scenario|strategy|recommended|summary)$/i;

function calcColWidths(headers: string[], totalDXA: number): number[] {
  const weights = headers.map(h => LONG_COL_RE.test(h) ? 3 : SHORT_COL_RE.test(h) ? 1 : 2);
  const total   = weights.reduce((a, b) => a + b, 0);
  return weights.map(w => Math.round((w / total) * totalDXA));
}

export class DocxDriver implements DocumentDriver {
  private sections: any[] = [];
  private meta!: DocumentMeta;
  private roleColor!: string;

  beginDocument(meta: DocumentMeta, roleColor: string): void {
    this.sections = [];
    this.meta      = meta;
    this.roleColor = roleColor;
  }

  renderCover(meta: DocumentMeta, roleColor: string, documentTitle?: string): void {
    const locale = meta.language === 'es' ? 'es-ES' : 'en-US';
    const items: any[] = [
      new Paragraph({
        text: meta.roleName,
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
        spacing: { before: 2400, after: 200 },
        run: { bold: true, size: 52, color: roleColor },
      }),
    ];
    if (documentTitle) {
      items.push(new Paragraph({
        text: documentTitle,
        alignment: AlignmentType.CENTER,
        spacing: { after: 150 },
        run: { size: 32, color: roleColor },
      }));
    }
    items.push(
      new Paragraph({
        text: meta.projectName,
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 },
        run: { size: 28, color: '666666' },
      }),
      new Paragraph({
        text: meta.generatedAt.toLocaleDateString(locale),
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
        run: { size: 24, italics: true, color: '999999' },
      }),
      new Paragraph({
        text: 'PILOT AI Generated Report',
        alignment: AlignmentType.CENTER,
        spacing: { after: 2400 },
        run: { size: 20, color: 'AAAAAA' },
      }),
      new Paragraph({ children: [new PageBreak()] })
    );
    this.sections.push(...items);
  }

  renderTOC(lang: 'es' | 'en'): void {
    this.sections.push(
      new Paragraph({
        text: lang === 'es' ? 'Tabla de Contenidos' : 'Table of Contents',
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        pageBreakBefore: true,
        spacing: { after: 400 },
        run: { color: this.roleColor, bold: true },
      }),
      new TableOfContents('Summary', { hyperlink: true, headingStyleRange: '1-5' }),
      new Paragraph({ children: [new PageBreak()] })
    );
  }

  renderSectionHeading(title: string, roleColor: string): void {
    this.sections.push(
      new Paragraph({
        text: title,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 200 },
        run: { color: roleColor, bold: true, size: 28 },
      })
    );
  }

  renderParagraph(text: string): void {
    this.sections.push(
      new Paragraph({
        text,
        spacing: { after: 300, line: 360 },
        alignment: AlignmentType.LEFT,
        run: { size: 22, color: '333333' },
      })
    );
  }

  renderList(items: string[]): void {
    items.forEach(item => {
      this.sections.push(
        new Paragraph({
          text: String(item),
          spacing: { after: 150 },
          bullet: { level: 0 },
          run: { size: 22, color: '333333' },
        })
      );
    });
    this.sections.push(new Paragraph({ text: '', spacing: { after: 300 } }));
  }

  renderTable(headers: string[], rows: Record<string, any>[], roleColor: string): void {
    const colWidths = calcColWidths(headers, 8350);
    // Cell padding: top/bottom 90 DXA (~1.6mm), left/right 120 DXA (~2.1mm)
    const cellPad   = { top: 90, bottom: 90, left: 120, right: 120 };

    const tableRows: TableRow[] = [
      new TableRow({
        children: headers.map((h, i) =>
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: h, bold: true, color: 'FFFFFF', size: 22 })],
            })],
            shading:  { fill: roleColor },
            width:    { size: colWidths[i], type: WidthType.DXA },
            margins:  cellPad,
          })
        ),
      }),
      ...rows.map((row, idx) =>
        new TableRow({
          children: headers.map((h, i) =>
            new TableCell({
              children: [new Paragraph({
                children: [new TextRun({ text: String(row[h] ?? ''), color: '222222', size: 21 })],
              })],
              shading:  { fill: idx % 2 === 0 ? 'FFFFFF' : 'F0F4F8' },
              width:    { size: colWidths[i], type: WidthType.DXA },
              margins:  cellPad,
            })
          ),
        })
      ),
    ];

    this.sections.push(
      new Table({
        rows: tableRows,
        width: { size: 8350, type: WidthType.DXA },
        borders: {
          top:              { style: BorderStyle.SINGLE, size: 6, color: 'CCCCCC' },
          bottom:           { style: BorderStyle.SINGLE, size: 6, color: 'CCCCCC' },
          left:             { style: BorderStyle.SINGLE, size: 6, color: 'CCCCCC' },
          right:            { style: BorderStyle.SINGLE, size: 6, color: 'CCCCCC' },
          insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: 'EEEEEE' },
          insideVertical:   { style: BorderStyle.SINGLE, size: 1, color: 'EEEEEE' },
        },
      }),
      new Paragraph({ text: '', spacing: { after: 300 } })
    );
  }

  renderKPIGrid(pairs: Record<string, any>, roleColor: string): void {
    const kpiRows = Object.entries(pairs);
    const cellPad = { top: 90, bottom: 90, left: 120, right: 120 };
    const tableRows: TableRow[] = kpiRows.map(([label, value], idx) =>
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: String(label), bold: true, color: 'FFFFFF', size: 22 })],
            })],
            shading:  { fill: roleColor },
            width:    { size: 35, type: WidthType.PERCENTAGE },
            margins:  cellPad,
          }),
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: String(value), bold: true, color: roleColor, size: 24 })],
            })],
            shading:  { fill: idx % 2 === 0 ? 'FFFFFF' : 'F0F4F8' },
            margins:  cellPad,
          }),
        ],
      })
    );

    this.sections.push(
      new Table({
        rows: tableRows,
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
          top:              { style: BorderStyle.SINGLE, size: 6, color: roleColor },
          bottom:           { style: BorderStyle.SINGLE, size: 6, color: roleColor },
          left:             { style: BorderStyle.SINGLE, size: 6, color: roleColor },
          right:            { style: BorderStyle.SINGLE, size: 6, color: roleColor },
          insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: 'EEEEEE' },
          insideVertical:   { style: BorderStyle.SINGLE, size: 1, color: 'EEEEEE' },
        },
      }),
      new Paragraph({ text: '', spacing: { after: 300 } })
    );
  }

  async finalizeDocument(baseName: string): Promise<void> {
    const { roleName, projectName } = this.meta;
    const roleColor = this.roleColor;

    const doc = new Document({
      styles: {
        default: {
          heading1: {
            run: { font: 'Calibri', size: 52, bold: true, color: roleColor },
            paragraph: { spacing: { before: 240, after: 120 } },
          },
          heading2: {
            run: { font: 'Calibri', size: 32, bold: true, color: roleColor },
            paragraph: { spacing: { before: 240, after: 120 } },
          },
          document: { run: { font: 'Calibri', size: 24, color: '333333' } },
        },
      },
      sections: [{
        properties: {
          page: { margin: { top: 1200, right: 1200, bottom: 1200, left: 1200 } },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                spacing: { after: 300 },
                border: { bottom: { color: 'CCCCCC', space: 10, style: BorderStyle.SINGLE, size: 6 } },
                children: [
                  new TextRun({ text: `${roleName} | `, color: '888888', size: 18 }),
                  new TextRun({ text: projectName, color: '555555', size: 18, bold: true }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 300 },
                border: { top: { color: 'CCCCCC', space: 10, style: BorderStyle.SINGLE, size: 6 } },
                children: [
                  new TextRun({ text: 'PILOT AI Generated Report | Página ', color: '888888', size: 18 }),
                  new TextRun({ children: [PageNumber.CURRENT], color: '888888', size: 18 }),
                ],
              }),
            ],
          }),
        },
        children: this.sections,
      }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${baseName}.docx`);
  }
}
