import jsPDF from 'jspdf';
import { toPng } from 'html-to-image';
import { NormalizedDocument } from './contentNormalizer';
import { getRoleExportProfile } from '../../constants/roleExportConfig';

interface ProjectData {
    summary: string;
    resources: any[];
    projectPhases: any[];
    techStack: any;
}


export const pdfGenerator = {
    /**
     * Fallback: Screenshot-based PDF (maintains backward compatibility)
     */
    generateScreenshotPDF: async (elementId: string, fileName: string) => {
        try {
            const element = document.getElementById(elementId);
            if (!element) {
                console.error(`Element with id ${elementId} not found`);
                return;
            }

            const dataUrl = await toPng(element as HTMLElement, { quality: 0.95, backgroundColor: '#ffffff' });
            const doc = new jsPDF();

            const imgProps = doc.getImageProperties(dataUrl);
            const pdfWidth = doc.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            doc.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
            doc.save(`${fileName}.pdf`);
        } catch (error) {
            console.error('Error generating PDF:', error);
        }
    },

    /**
     * NEW: Programmatic PDF generator for ANY role output.
     * Creates professional multi-page PDFs with cover, TOC, sections, and pagination.
     */
    generateProgrammaticPDF: async (
        roleId: string,
        roleName: string,
        normalizedDoc: NormalizedDocument,
        projectName: string,
        language: string = 'es'
    ) => {
        const { renderDocument, buildDocumentBaseName } = await import('./documentRenderer');
        const { PdfDriver } = await import('./drivers/pdfDriver');
        const roleColor = getRoleExportProfile(roleId).documentColor;
        const driver = new PdfDriver();
        const lang = language === 'es' ? 'es' : 'en' as 'es' | 'en';
        const baseName = buildDocumentBaseName(roleName, projectName);
        await renderDocument(driver, normalizedDoc, roleColor, lang, baseName);
    },

    generateExecutiveSummary: (data: ProjectData, projectName: string = "Estimación de Desarrollo") => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.width;
        const margin = 20;
        let y = 20;

        // Title
        doc.setFontSize(22);
        doc.setTextColor(41, 128, 185); // Blue
        doc.text("Resumen Ejecutivo (One-Pager)", margin, y);
        y += 10;

        doc.setFontSize(12);
        doc.setTextColor(100);
        doc.text(`Proyecto: ${projectName}`, margin, y);
        doc.text(`Fecha: ${new Date().toLocaleDateString()}`, margin + 100, y);
        y += 15;

        // Line
        doc.setDrawColor(200);
        doc.line(margin, y, pageWidth - margin, y);
        y += 10;

        // Executive Summary Text
        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.text("Visión General", margin, y);
        y += 8;
        doc.setFontSize(10);
        doc.setTextColor(80);

        const splitSummary = doc.splitTextToSize(data.summary || "Sin resumen disponible.", pageWidth - (margin * 2));
        doc.text(splitSummary, margin, y);
        y += (splitSummary.length * 5) + 10;

        // Key Metrics — use real project duration from phase schedule
        const maxEndWeek = data.projectPhases.length > 0
            ? Math.max(...data.projectPhases.map((p: any) => (p.startWeek || 1) + (p.duration || 0)))
            : 14;
        const durationMonths = maxEndWeek / 4.33;
        const totalCost = data.resources.reduce((acc, res) => acc + (res.rate * 160 * res.count * durationMonths), 0);
        const totalDuration = maxEndWeek;
        const teamSize = data.resources.reduce((acc, res) => acc + Number(res.count), 0);

        doc.setFillColor(245, 247, 250);
        doc.rect(margin, y, pageWidth - (margin * 2), 30, 'F');
        y += 10;

        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.text("Métricas Clave", margin + 5, y);
        y += 10;

        doc.setFontSize(10);
        doc.text(`Costo Estimado: $${Math.round(totalCost).toLocaleString()}`, margin + 5, y);
        doc.text(`Duración: ${totalDuration} Semanas`, margin + 60, y);
        doc.text(`Equipo: ${teamSize} Personas`, margin + 120, y);
        y += 20;

        // High Level Timeline
        doc.setFontSize(14);
        doc.text("Fases del Proyecto", margin, y);
        y += 10;

        data.projectPhases.forEach((phase, index) => {
            doc.setFontSize(11);
            doc.setTextColor(0);
            doc.text(`${index + 1}. ${phase.name}`, margin, y);
            doc.setTextColor(100);
            doc.text(`${phase.duration} semanas`, pageWidth - margin - 30, y);
            y += 7;
        });

        doc.save("Resumen_Ejecutivo.pdf");
    },

    generateRiskPlan: (data: ProjectData) => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.width;
        const margin = 20;
        let y = 20;

        // Title
        doc.setFontSize(22);
        doc.setTextColor(192, 57, 43); // Red
        doc.text("Plan de Mitigación de Riesgos", margin, y);
        y += 15;

        doc.setDrawColor(200);
        doc.line(margin, y, pageWidth - margin, y);
        y += 10;

        // Collect all risks
        const allRisks: any[] = [];
        data.projectPhases.forEach(phase => {
            if (phase.tasks) {
                phase.tasks.forEach((task: any) => {
                    if (task.risk) {
                        allRisks.push({ ...task.risk, taskName: task.name, phaseName: phase.name });
                    }
                });
            }
        });

        // Sort by impact * prob
        allRisks.sort((a, b) => (b.impact * b.prob) - (a.impact * a.prob));

        allRisks.forEach((risk, index) => {
            // Risk Card
            const riskScore = risk.prob * risk.impact;
            const color = riskScore > 6 ? [231, 76, 60] : riskScore > 3 ? [241, 196, 15] : [46, 204, 113];

            // Calculate height based on text content
            const descLines = doc.splitTextToSize(`Riesgo #${index + 1}: ${risk.desc}`, pageWidth - (margin * 2) - 10);
            const contextLines = doc.splitTextToSize(`Contexto: ${risk.taskName} (${risk.phaseName})`, pageWidth - (margin * 2) - 10);
            const cardHeight = 25 + (descLines.length * 5) + (contextLines.length * 5);

            // Check for page break
            if (y + cardHeight > 280) {
                doc.addPage();
                y = 20;
            }

            doc.setFillColor(250, 250, 250);
            doc.rect(margin, y, pageWidth - (margin * 2), cardHeight, 'F');

            // Risk Level Indicator
            doc.setFillColor(color[0], color[1], color[2]);
            doc.rect(margin, y, 2, cardHeight, 'F');

            doc.setFontSize(12);
            doc.setTextColor(0);
            doc.text(descLines, margin + 5, y + 8);

            let currentY = y + 8 + (descLines.length * 5);

            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text(contextLines, margin + 5, currentY);

            currentY += (contextLines.length * 5) + 5;

            doc.setTextColor(0);
            doc.text(`Probabilidad: ${risk.prob}/3`, margin + 5, currentY);
            doc.text(`Impacto: ${risk.impact}/3`, margin + 50, currentY);
            doc.text(`Severidad: ${riskScore}/9`, margin + 90, currentY);

            y += cardHeight + 5;
        });

        if (allRisks.length === 0) {
            doc.text("No se han detectado riesgos críticos en este plan.", margin, y);
        }

        doc.save("Plan_Mitigacion_Riesgos.pdf");
    }
};
