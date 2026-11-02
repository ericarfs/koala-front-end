import { inject, Injectable } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import jsPDF from 'jspdf';
import { CURRENT_USER } from '@shared/tokens/current-user';
import { DEFAULT_LABELS } from './pdf-export.constants';
import {
  buildInfoItems, drawFooters, drawHeader, drawInfoBox, drawStats, prepareLogo, statsBlockHeight
} from './pdf-drawers';
import { getImageDimensions, loadImageAsDataUrl, localeFromLang } from './pdf-export.utils';
import { ChartExportItem, HeaderContext, PdfExportContext, PdfExportLabels, PdfExportOptions } from './pdf-expert.types';

@Injectable({ providedIn: 'root' })
export class PdfExportService {
  private readonly transloco = inject(TranslocoService);
  private readonly currentUser = inject(CURRENT_USER);

  async export(charts: ChartExportItem[], options: PdfExportOptions = {}): Promise<void> {
    if (charts.length === 0) return;

    const ctx = await this.createPdfContext(options);

    let isFirstPage = true;
    for (const chart of charts) {
      if (!isFirstPage) ctx.pdf.addPage();
      isFirstPage = false;
      await this.drawChartPage(ctx, chart);
    }

    drawFooters(ctx);
    ctx.pdf.save(options.fileName ?? 'graph.pdf');
  }

  private async createPdfContext(options: PdfExportOptions): Promise<PdfExportContext> {
    const {
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

    const generatedAt = new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeStyle: 'short' }).format(new Date());

    pdf.setProperties({
      title: reportTitle,
      subject: reportTitle,
      author: generatedBy ?? appName,
      creator: appName,
    });

    const logo = await prepareLogo(options.logoDataUrl);
    const header: HeaderContext = { pageWidth, margin, headerHeight, appName, reportTitle, generatedAt, generatedBy, labels, logo };

    return { pdf, pageWidth, pageHeight, margin, contentWidth, headerHeight, footerHeight, labels, locale, header, appName, reportTitle };
  }

  private async drawChartPage(ctx: PdfExportContext, chart: ChartExportItem): Promise<void> {
    const dimensions = await getImageDimensions(chart.imageDataUrl);
    if (!dimensions) return;

    drawHeader(ctx.pdf, ctx.header);
    let y = ctx.headerHeight + 12;

    // ─── Título e Subtítulo ───
    ctx.pdf.setTextColor(41, 37, 36); // COLORS.text
    ctx.pdf.setFont('helvetica', 'bold');
    ctx.pdf.setFontSize(15);
    const titleLines: string[] = ctx.pdf.splitTextToSize(chart.title, ctx.contentWidth);
    ctx.pdf.text(titleLines, ctx.margin, y);
    y += titleLines.length * 6.5;

    ctx.pdf.setDrawColor(217, 119, 6); // COLORS.primary
    ctx.pdf.setLineWidth(0.8);
    ctx.pdf.line(ctx.margin, y - 3, ctx.margin + 20, y - 3);

    if (chart.subtitle) {
      ctx.pdf.setFont('helvetica', 'normal');
      ctx.pdf.setFontSize(10);
      ctx.pdf.setTextColor(120, 113, 108); // COLORS.muted
      const subLines: string[] = ctx.pdf.splitTextToSize(chart.subtitle, ctx.contentWidth);
      ctx.pdf.text(subLines, ctx.margin, y + 3);
      y += subLines.length * 5 + 4;
    }
    y += 4;

    // ─── Info Box ───
    const items = buildInfoItems(chart.info, ctx.labels);
    if (items.length) {
      const boxHeight = drawInfoBox(ctx.pdf, items, ctx.margin, y, ctx.contentWidth);
      y += boxHeight + 8;
    }

    // ─── Cálculo de espaço do Gráfico ───
    const cardPadding = 4;
    const sectionGap = 8;
    const minChartHeight = 70;
    const stats = chart.stats ?? [];
    const sHeight = stats.length ? statsBlockHeight(stats.length) : 0;

    const availableW = ctx.contentWidth - cardPadding * 2;
    let availableH = ctx.pageHeight - ctx.footerHeight - ctx.margin - y - cardPadding * 2;
    let statsOnNewPage = false;

    if (sHeight) {
      const withStats = availableH - sHeight - sectionGap;
      if (withStats >= minChartHeight) {
        availableH = withStats;
      } else {
        statsOnNewPage = true;
      }
    }

    const scale = Math.min(availableW / dimensions.width, availableH / dimensions.height);
    const imgW = dimensions.width * scale;
    const imgH = dimensions.height * scale;
    const cardH = imgH + cardPadding * 2;

    // ─── Card do Gráfico ───
    ctx.pdf.setDrawColor(203, 213, 225); // COLORS.border
    ctx.pdf.setFillColor(255, 255, 255);
    ctx.pdf.setLineWidth(0.3);
    ctx.pdf.roundedRect(ctx.margin, y, ctx.contentWidth, cardH, 2, 2, 'FD');

    ctx.pdf.addImage(chart.imageDataUrl, 'PNG', ctx.margin + (ctx.contentWidth - imgW) / 2, y + cardPadding, imgW, imgH, undefined, 'FAST');
    y += cardH + sectionGap;

    // ─── Tabela de Stats ───
    if (stats.length) {
      if (statsOnNewPage) {
        ctx.pdf.addPage();
        drawHeader(ctx.pdf, ctx.header);
        y = ctx.headerHeight + 12;
      }
      drawStats(ctx.pdf, stats, ctx.margin, y, ctx.contentWidth, ctx.labels, ctx.locale);
    }
  }

  async exportReport(charts: ChartExportItem[], fileName: string): Promise<void> {
    const t = (key: string) => this.transloco.translate(`MONITORING.PDF.${key}`);
    const locale = localeFromLang(this.transloco.getActiveLang());
    const logoDataUrl = await loadImageAsDataUrl('assets/logo-white.png');

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
