import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';

export interface ChartExportItem {
  title: string;
  subtitle?: string;
  imageDataUrl: string;
}

@Injectable({ providedIn: 'root' })
export class PdfExportService {

  async export(charts: ChartExportItem[], fileName = 'graficos.pdf'): Promise<void> {
    if (charts.length === 0) return;

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - margin * 2;

    for (let i = 0; i < charts.length; i++) {
      const chart = charts[i];

      if (i > 0) pdf.addPage();
      let cursorY = margin + 5;

      // Título
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0);
      pdf.text(chart.title, margin, cursorY);
      cursorY += 8;

      // Subtitle
      if (chart.subtitle) {
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(100);
        pdf.text(chart.subtitle, margin, cursorY);
        cursorY += 8;
        pdf.setTextColor(0);
      }

      cursorY += 4;

      // Esperar a imagem carregar
      const dimensions = await this.getImageDimensions(chart.imageDataUrl);
      if (!dimensions) continue;

      const imgRatio = dimensions.height / dimensions.width;
      const imgWidth = contentWidth;
      const imgHeight = imgWidth * imgRatio;
      const maxHeight = pageHeight - cursorY - margin;

      let finalWidth = imgWidth;
      let finalHeight = imgHeight;

      if (imgHeight > maxHeight) {
        finalHeight = maxHeight;
        finalWidth = finalHeight / imgRatio;
      }

      pdf.addImage(
        chart.imageDataUrl,
        'PNG',
        margin,
        cursorY,
        finalWidth,
        finalHeight
      );
    }

    pdf.save(fileName);
  }

  /**
   * Aguarda a imagem carregar e retorna suas dimensões naturais.
   */
  private getImageDimensions(dataUrl: string): Promise<{ width: number; height: number } | null> {
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => resolve({ width: img.width, height: img.height });
      img.onerror = () => resolve(null);
      img.src = dataUrl;
    });
  }
}
