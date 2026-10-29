import { inject, Injectable } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import jsPDF from 'jspdf';
import { CURRENT_USER } from '@shared/tokens/current-user';

type RGB = [number, number, number];

export interface ChartExportInfo {
  location?: string;
  devices?: string[];
  period?: string;
  interval?: string;
  sensors?: string[];
}

export interface SensorStats {
  name: string;
  unit?: string;
  min: number;
  max: number;
  avg: number;
}

export interface ChartExportItem {
  title: string;
  subtitle?: string;
  imageDataUrl: string;
  info?: ChartExportInfo;
  stats?: SensorStats[];
}

export interface PdfExportLabels {
  generatedAt: string;
  generatedBy: string;
  page: string;
  of: string;
  location: string;
  devices: string;
  period: string;
  interval: string;
  sensors: string;
  stats: string;
  sensor: string;
  min: string;
  max: string;
  avg: string;
}

export interface PdfExportOptions {
  fileName?: string;
  appName?: string;
  reportTitle?: string;
  generatedBy?: string;
  locale?: string;
  /** Logo em data URL (PNG/JPEG/WEBP). Use uma versão clara/branca, pois o fundo é âmbar. */
  logoDataUrl?: string;
  labels?: Partial<PdfExportLabels>;
}

interface InfoItem {
  label: string;
  value: string;
  full: boolean;
}

interface LogoInfo {
  dataUrl: string;
  format: 'PNG' | 'JPEG' | 'WEBP';
  w: number;
  h: number;
}

interface HeaderContext {
  pageWidth: number;
  margin: number;
  headerHeight: number;
  appName: string;
  reportTitle: string;
  generatedAt: string;
  generatedBy?: string;
  labels: PdfExportLabels;
  logo: LogoInfo | null;
}

const DEFAULT_LABELS: PdfExportLabels = {
  generatedAt: 'Gerado em',
  generatedBy: 'Por',
  page: 'Página',
  of: 'de',
  location: 'Localização',
  devices: 'Dispositivos',
  period: 'Período',
  interval: 'Intervalo',
  sensors: 'Sensores',
  stats: 'Estatísticas',
  sensor: 'Sensor',
  min: 'Mínimo',
  max: 'Máximo',
  avg: 'Média',
};

const COLORS = {
  primary: [217, 119, 6] as RGB,      // amber-600
  primaryDark: [146, 64, 14] as RGB,  // amber-800
  secondary: [13, 148, 136] as RGB,     // teal-600
  secondaryDark: [15, 118, 110] as RGB, // teal-700
  tint: [255, 251, 235] as RGB,       // amber-50
  border: [203, 213, 225] as RGB,     // slate-300
  zebra: [248, 250, 252] as RGB,      // slate-50
  text: [41, 37, 36] as RGB,
  muted: [120, 113, 108] as RGB,
};

/** Calcula mín/máx/média ignorando nulos e NaN. Retorna null se não houver dados. */
export function computeSensorStats(
  name: string,
  values: readonly (number | null | undefined)[],
  unit?: string,
): SensorStats | null {
  const nums = values.filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
  if (nums.length === 0) return null;

  let min = nums[0];
  let max = nums[0];
  let sum = 0;
  for (const n of nums) {
    if (n < min) min = n;
    if (n > max) max = n;
    sum += n;
  }
  return { name, unit, min, max, avg: sum / nums.length };
}

const LOCALES: Record<string, string> = { pt: 'pt-BR', en: 'en-US' };

export function localeFromLang(lang: string): string {
  return LOCALES[lang] ?? lang;
}

@Injectable({ providedIn: 'root' })
export class PdfExportService {
  private readonly transloco = inject(TranslocoService);
  private readonly currentUser = inject(CURRENT_USER);

  async export(charts: ChartExportItem[], options: PdfExportOptions = {}): Promise<void> {
    if (charts.length === 0) return;

    const {
      fileName = 'graph.pdf',
      appName = 'SMART LAB',
      reportTitle = 'MONITORING REPORT',
      generatedBy,
      locale = 'pt-BR',
    } = options;
    const labels: PdfExportLabels = { ...DEFAULT_LABELS, ...options.labels };

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - margin * 2;
    const headerHeight = 26;
    const footerHeight = 12;

    const generatedAt = new Intl.DateTimeFormat(locale, {
      dateStyle: 'long',
      timeStyle: 'short',
    }).format(new Date());

    pdf.setProperties({
      title: reportTitle,
      subject: reportTitle,
      author: generatedBy ?? appName,
      creator: appName,
    });

    const logo = await this.prepareLogo(options.logoDataUrl);

    const header: HeaderContext = {
      pageWidth, margin, headerHeight, appName, reportTitle, generatedAt, generatedBy, labels, logo,
    };

    let isFirstPage = true;

    for (const chart of charts) {
      const dimensions = await this.getImageDimensions(chart.imageDataUrl);
      if (!dimensions) continue;

      if (!isFirstPage) pdf.addPage();
      isFirstPage = false;

      this.drawHeader(pdf, header);

      let y = headerHeight + 12;

      // ───────── Título e subtítulo ─────────
      pdf.setTextColor(...COLORS.text);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(15);
      const titleLines: string[] = pdf.splitTextToSize(chart.title, contentWidth);
      pdf.text(titleLines, margin, y);
      y += titleLines.length * 6.5;

      pdf.setDrawColor(...COLORS.primary);
      pdf.setLineWidth(0.8);
      pdf.line(margin, y - 3, margin + 20, y - 3);

      if (chart.subtitle) {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        pdf.setTextColor(...COLORS.muted);
        const subLines: string[] = pdf.splitTextToSize(chart.subtitle, contentWidth);
        pdf.text(subLines, margin, y + 3);
        y += subLines.length * 5 + 4;
      }

      y += 4;

      // ───────── Bloco de informações ─────────
      const items = this.buildInfoItems(chart.info, labels);
      if (items.length) {
        const boxHeight = this.drawInfoBox(pdf, items, margin, y, contentWidth);
        y += boxHeight + 8;
      }

      // ───────── Dimensionamento do gráfico (reserva espaço para a tabela) ─────────
      const cardPadding = 4;
      const sectionGap = 8;
      const minChartHeight = 70;
      const stats = chart.stats ?? [];
      const statsHeight = stats.length ? this.statsBlockHeight(stats.length) : 0;

      const availableW = contentWidth - cardPadding * 2;
      let availableH = pageHeight - footerHeight - margin - y - cardPadding * 2;
      let statsOnNewPage = false;

      if (statsHeight) {
        const withStats = availableH - statsHeight - sectionGap;
        if (withStats >= minChartHeight) {
          availableH = withStats;
        } else {
          statsOnNewPage = true; // gráfico ocupa o espaço todo, tabela vai para a próxima página
        }
      }

      const scale = Math.min(availableW / dimensions.width, availableH / dimensions.height);
      const imgW = dimensions.width * scale;
      const imgH = dimensions.height * scale;
      const cardH = imgH + cardPadding * 2;

      // ───────── Gráfico dentro de um card ─────────
      pdf.setDrawColor(...COLORS.border);
      pdf.setFillColor(255, 255, 255);
      pdf.setLineWidth(0.3);
      pdf.roundedRect(margin, y, contentWidth, cardH, 2, 2, 'FD');

      pdf.addImage(
        chart.imageDataUrl,
        'PNG',
        margin + (contentWidth - imgW) / 2,
        y + cardPadding,
        imgW,
        imgH,
        undefined,
        'FAST',
      );

      y += cardH + sectionGap;

      // ───────── Tabela de estatísticas ─────────
      if (stats.length) {
        if (statsOnNewPage) {
          pdf.addPage();
          this.drawHeader(pdf, header);
          y = headerHeight + 12;
        }
        this.drawStats(pdf, stats, margin, y, contentWidth, labels, locale);
      }
    }

    // ───────── Rodapé ─────────
    const totalPages = pdf.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);

      pdf.setDrawColor(...COLORS.border);
      pdf.setLineWidth(0.3);
      pdf.line(margin, pageHeight - footerHeight, pageWidth - margin, pageHeight - footerHeight);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(...COLORS.muted);
      pdf.text(`${appName} • ${reportTitle}`, margin, pageHeight - footerHeight + 6);
      pdf.text(
        `${labels.page} ${i} ${labels.of} ${totalPages}`,
        pageWidth - margin,
        pageHeight - footerHeight + 6,
        { align: 'right' },
      );
    }

    pdf.save(fileName);
  }

  /** Carrega uma imagem (ex.: 'assets/logo-white.png') e devolve como data URL. */
  async loadImageAsDataUrl(url: string): Promise<string | null> {
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      const blob = await res.blob();
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  }

  // ───────────────────────── Cabeçalho ─────────────────────────

  private async prepareLogo(dataUrl?: string): Promise<LogoInfo | null> {
    if (!dataUrl) return null;

    const dim = await this.getImageDimensions(dataUrl);
    if (!dim) return null;

    const maxH = 14;
    const maxW = 40;
    const scale = Math.min(maxH / dim.height, maxW / dim.width);

    const match = /^data:image\/(png|jpe?g|webp)/i.exec(dataUrl);
    const raw = match?.[1].toLowerCase() ?? 'png';
    const format = raw.startsWith('jp') ? 'JPEG' : (raw.toUpperCase() as 'PNG' | 'WEBP');

    return { dataUrl, format, w: dim.width * scale, h: dim.height * scale };
  }

  private drawHeader(pdf: jsPDF, ctx: HeaderContext): void {
    const { pageWidth, margin, headerHeight, appName, reportTitle, generatedAt, generatedBy, labels, logo } = ctx;

    pdf.setFillColor(...COLORS.primary);
    pdf.rect(0, 0, pageWidth, headerHeight, 'F');

    let textX = margin;
    if (logo) {
      pdf.addImage(
        logo.dataUrl,
        logo.format,
        margin,
        (headerHeight - logo.h) / 2,
        logo.w,
        logo.h,
        undefined,
        'FAST',
      );
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

  // ───────────────────────── Estatísticas ─────────────────────────

  private readonly statsTitleH = 7;
  private readonly statsHeaderH = 7;
  private readonly statsRowH = 6.5;

  private statsBlockHeight(rowCount: number): number {
    return this.statsTitleH + this.statsHeaderH + rowCount * this.statsRowH;
  }

  private drawStats(
    pdf: jsPDF,
    stats: SensorStats[],
    x: number,
    y: number,
    width: number,
    labels: PdfExportLabels,
    locale: string,
  ): void {
    const fmt = new Intl.NumberFormat(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    const format = (n: number, unit?: string) => fmt.format(n) + (unit ? ` ${unit}` : '');

    const colRatios = [0.4, 0.2, 0.2, 0.2];
    const colWidths = colRatios.map(r => r * width);
    const colX = colWidths.map((_, i) => x + colWidths.slice(0, i).reduce((a, b) => a + b, 0));
    const cellPad = 3;

    // Título da seção
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(...COLORS.text);
    pdf.text(labels.stats, x, y + 4);
    y += this.statsTitleH;

    const tableTop = y;
    const totalH = this.statsHeaderH + stats.length * this.statsRowH;

    // Cabeçalho da tabela
    pdf.setFillColor(...COLORS.primary);
    pdf.rect(x, y, width, this.statsHeaderH, 'F');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(255);
    const headerTextY = y + this.statsHeaderH / 2 + 1.1;
    pdf.text(labels.sensor.toUpperCase(), colX[0] + cellPad, headerTextY);
    [labels.min, labels.max, labels.avg].forEach((label, i) => {
      pdf.text(label.toUpperCase(), colX[i + 1] + colWidths[i + 1] - cellPad, headerTextY, { align: 'right' });
    });
    y += this.statsHeaderH;

    // Linhas
    stats.forEach((s, idx) => {
      if (idx % 2 === 1) {
        pdf.setFillColor(...COLORS.zebra);
        pdf.rect(x, y, width, this.statsRowH, 'F');
      }

      const textY = y + this.statsRowH / 2 + 1.2;

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.setTextColor(...COLORS.text);
      const nameLines: string[] = pdf.splitTextToSize(s.name, colWidths[0] - cellPad * 2);
      pdf.text(nameLines[0] ?? '', colX[0] + cellPad, textY);

      pdf.setFont('helvetica', 'normal');
      [s.min, s.max, s.avg].forEach((value, i) => {
        pdf.text(format(value, s.unit), colX[i + 1] + colWidths[i + 1] - cellPad, textY, { align: 'right' });
      });

      // Separador entre linhas
      if (idx < stats.length - 1) {
        pdf.setDrawColor(...COLORS.border);
        pdf.setLineWidth(0.15);
        pdf.line(x, y + this.statsRowH, x + width, y + this.statsRowH);
      }

      y += this.statsRowH;
    });

    // Borda externa
    pdf.setDrawColor(...COLORS.border);
    pdf.setLineWidth(0.3);
    pdf.rect(x, tableTop, width, totalH, 'S');
  }

  // ───────────────────────── Bloco de informações ─────────────────────────

  private buildInfoItems(info: ChartExportInfo | undefined, l: PdfExportLabels): InfoItem[] {
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

  private drawInfoBox(pdf: jsPDF, items: InfoItem[], x: number, y: number, width: number): number {
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

  private getImageDimensions(dataUrl: string): Promise<{ width: number; height: number } | null> {
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => resolve({ width: img.width, height: img.height });
      img.onerror = () => resolve(null);
      img.src = dataUrl;
    });
  }

  async exportReport(charts: ChartExportItem[], fileName: string): Promise<void> {
    const t = (key: string) => this.transloco.translate(`MONITORING.PDF.${key}`);
    const locale = localeFromLang(this.transloco.getActiveLang());
    const logoDataUrl = await this.loadImageAsDataUrl('assets/logo-white.png');

    await this.export(charts, {
      fileName,
      appName: 'Smart Lab',
      reportTitle: t('REPORT_TITLE'),
      generatedBy: this.currentUser.displayName() ?? undefined,
      locale,
      logoDataUrl: logoDataUrl ?? undefined,
      labels: {
        generatedAt: t('GENERATED_AT'),
        generatedBy: t('GENERATED_BY'),
        page: t('PAGE'),
        of: t('OF'),
        location: t('LOCATION'),
        devices: t('DEVICES'),
        period: t('PERIOD'),
        interval: t('INTERVAL'),
        sensors: t('SENSORS'),
        stats: t('STATS'),
        sensor: t('SENSOR'),
        min: t('MIN'),
        max: t('MAX'),
        avg: t('AVG'),
      },
    });
  }
}
