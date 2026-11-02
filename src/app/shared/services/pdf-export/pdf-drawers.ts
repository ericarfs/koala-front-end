import jsPDF from 'jspdf';
import { COLORS } from './pdf-export.constants';

import { getImageDimensions } from './pdf-export.utils';
import { ChartExportInfo, HeaderContext, InfoItem, LogoInfo, PdfExportContext, PdfExportLabels, SensorStats } from './pdf-expert.types';

// --- Cabeçalho ---
export async function prepareLogo(dataUrl?: string): Promise<LogoInfo | null> {
  if (!dataUrl) return null;
  const dim = await getImageDimensions(dataUrl);
  if (!dim) return null;

  const maxH = 14;
  const maxW = 40;
  const scale = Math.min(maxH / dim.height, maxW / dim.width);

  const match = /^data:image\/(png|jpe?g|webp)/i.exec(dataUrl);
  const raw = match?.[1].toLowerCase() ?? 'png';
  const format = raw.startsWith('jp') ? 'JPEG' : (raw.toUpperCase() as 'PNG' | 'WEBP');

  return { dataUrl, format, w: dim.width * scale, h: dim.height * scale };
}

export function drawHeader(pdf: jsPDF, ctx: HeaderContext): void {
  const { pageWidth, margin, headerHeight, appName, reportTitle, generatedAt, generatedBy, labels, logo } = ctx;

  pdf.setFillColor(...COLORS.primary);
  pdf.rect(0, 0, pageWidth, headerHeight, 'F');

  let textX = margin;
  if (logo) {
    pdf.addImage(logo.dataUrl, logo.format, margin, (headerHeight - logo.h) / 2, logo.w, logo.h, undefined, 'FAST');
    textX += logo.w + 4;
  }

  pdf.setTextColor(255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.text(appName, textX, 12);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.text(reportTitle, textX, 19);
  pdf.text(`${labels.generatedAt} ${generatedAt}`, pageWidth - margin, 12, { align: 'right' });
  if (generatedBy) {
    pdf.text(`${labels.generatedBy} ${generatedBy}`, pageWidth - margin, 19, { align: 'right' });
  }
}

// --- Rodapé ---
export function drawFooters(ctx: PdfExportContext): void {
  const totalPages = ctx.pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    ctx.pdf.setPage(i);

    ctx.pdf.setDrawColor(...COLORS.border);
    ctx.pdf.setLineWidth(0.3);
    ctx.pdf.line(ctx.margin, ctx.pageHeight - ctx.footerHeight, ctx.pageWidth - ctx.margin, ctx.pageHeight - ctx.footerHeight);

    ctx.pdf.setFont('helvetica', 'normal');
    ctx.pdf.setFontSize(8);
    ctx.pdf.setTextColor(...COLORS.muted);
    ctx.pdf.text(`${ctx.appName} • ${ctx.reportTitle}`, ctx.margin, ctx.pageHeight - ctx.footerHeight + 6);
    ctx.pdf.text(
      `${ctx.labels.page} ${i} ${ctx.labels.of} ${totalPages}`,
      ctx.pageWidth - ctx.margin,
      ctx.pageHeight - ctx.footerHeight + 6,
      { align: 'right' },
    );
  }
}

// --- Estatísticas ---
const statsTitleH = 7;
const statsHeaderH = 7;
const statsRowH = 6.5;

export function statsBlockHeight(rowCount: number): number {
  return statsTitleH + statsHeaderH + rowCount * statsRowH;
}

export function drawStats(
  pdf: jsPDF, stats: SensorStats[], x: number, y: number, width: number, labels: PdfExportLabels, locale: string,
): void {
  const fmt = new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const format = (n: number, unit?: string) => fmt.format(n) + (unit ? ` ${unit}` : '');

  const colRatios = [0.4, 0.2, 0.2, 0.2];
  const colWidths = colRatios.map(r => r * width);
  const colX = colWidths.map((_, i) => x + colWidths.slice(0, i).reduce((a, b) => a + b, 0));
  const cellPad = 3;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(...COLORS.text);
  pdf.text(labels.stats, x, y + 4);
  y += statsTitleH;

  const tableTop = y;
  const totalH = statsHeaderH + stats.length * statsRowH;

  pdf.setFillColor(...COLORS.primary);
  pdf.rect(x, y, width, statsHeaderH, 'F');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(255);
  const headerTextY = y + statsHeaderH / 2 + 1.1;
  pdf.text(labels.sensor.toUpperCase(), colX[0] + cellPad, headerTextY);
  [labels.min, labels.max, labels.avg].forEach((label, i) => {
    pdf.text(label.toUpperCase(), colX[i + 1] + colWidths[i + 1] - cellPad, headerTextY, { align: 'right' });
  });
  y += statsHeaderH;

  stats.forEach((s, idx) => {
    if (idx % 2 === 1) {
      pdf.setFillColor(...COLORS.zebra);
      pdf.rect(x, y, width, statsRowH, 'F');
    }

    const textY = y + statsRowH / 2 + 1.2;

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(...COLORS.text);
    const nameLines: string[] = pdf.splitTextToSize(s.name, colWidths[0] - cellPad * 2);
    pdf.text(nameLines[0] ?? '', colX[0] + cellPad, textY);

    pdf.setFont('helvetica', 'normal');
    [s.min, s.max, s.avg].forEach((value, i) => {
      pdf.text(format(value, s.unit), colX[i + 1] + colWidths[i + 1] - cellPad, textY, { align: 'right' });
    });

    if (idx < stats.length - 1) {
      pdf.setDrawColor(...COLORS.border);
      pdf.setLineWidth(0.15);
      pdf.line(x, y + statsRowH, x + width, y + statsRowH);
    }
    y += statsRowH;
  });

  pdf.setDrawColor(...COLORS.border);
  pdf.setLineWidth(0.3);
  pdf.rect(x, tableTop, width, totalH, 'S');
}

// --- Info Box ---
export function buildInfoItems(info: ChartExportInfo | undefined, l: PdfExportLabels): InfoItem[] {
  if (!info) return [];
  const items: InfoItem[] = [];
  const text = (v?: string) => v?.trim();
  const list = (v?: string[]) => v?.filter(Boolean).join(', ');

  const add = (label: string, value: string | undefined, full = false) => {
    if (value) items.push({ label, value, full });
  };

  add(l.location, text(info.location));
  add(l.period, text(info.period));
  add(l.interval, text(info.interval));
  add(l.devices, list(info.devices), true);
  add(l.sensors, list(info.sensors), true);

  return items;
}

export function drawInfoBox(pdf: jsPDF, items: InfoItem[], x: number, y: number, width: number): number {
  const padding = 5;
  const innerWidth = width - padding * 2;
  const colWidth = innerWidth / 2;
  const labelH = 4;
  const lineH = 4.4;
  const rowGap = 3;
  const maxLines = 4;

  const rows: InfoItem[][] = [];
  let current: InfoItem[] = [];
  for (const item of items) {
    if (item.full) {
      if (current.length) { rows.push(current); current = []; }
      rows.push([item]);
    } else {
      current.push(item);
      if (current.length === 2) { rows.push(current); current = []; }
    }
  }
  if (current.length) rows.push(current);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9.5);

  const measured = rows.map(row =>
    row.map(item => {
      const w = item.full ? innerWidth : colWidth - 4;
      let lines: string[] = pdf.splitTextToSize(item.value, w);
      if (lines.length > maxLines) {
        lines = lines.slice(0, maxLines);
        lines[maxLines - 1] = lines[maxLines - 1].replace(/.{0,2}$/, '…');
      }
      return { item, lines };
    }),
  );

  const rowHeights = measured.map(
    row => labelH + Math.max(...row.map(c => c.lines.length)) * lineH + rowGap,
  );
  const boxHeight = rowHeights.reduce((a, b) => a + b, 0) + padding * 2 - rowGap;

  pdf.setFillColor(...COLORS.zebra);
  pdf.setDrawColor(...COLORS.border);
  pdf.setLineWidth(0.3);
  pdf.roundedRect(x, y, width, boxHeight, 2, 2, 'FD');

  pdf.setFillColor(...COLORS.secondary);
  pdf.rect(x, y + 1, 1.5, boxHeight - 2, 'F');

  let cy = y + padding + 2;
  measured.forEach((row, rowIdx) => {
    row.forEach((cell, colIdx) => {
      const cx = x + padding + (cell.item.full ? 0 : colIdx * colWidth);

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7.5);
      pdf.setTextColor(...COLORS.secondaryDark);
      pdf.text(cell.item.label.toUpperCase(), cx, cy);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9.5);
      pdf.setTextColor(...COLORS.text);
      pdf.text(cell.lines, cx, cy + labelH);
    });
    cy += rowHeights[rowIdx];
  });

  return boxHeight;
}
