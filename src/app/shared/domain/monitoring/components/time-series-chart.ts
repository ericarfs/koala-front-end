import {
  AfterViewInit, Component, ElementRef, NgZone, OnDestroy,
  effect, inject, input, untracked, viewChild,
} from '@angular/core';
import * as echarts from 'echarts';
import { TimeSeries } from '../models/time-series';


const EMPTY_SERIES: TimeSeries = { title: '', values: [] };

const FALLBACK_PALETTE = ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272'];
const EXPORT_TEXT_COLOR = '#212529';
const MOBILE_BREAKPOINT_PX = 768;

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const pad = (n: number) => n.toString().padStart(2, '0');

@Component({
  selector: 'app-time-series-chart',
  standalone: true,
  template: `
    <div class="flex flex-col gap-2">
      @if (title()) {
        <div class="flex flex-col">
          <h3 class="text-base font-semibold text-default">{{ title() }}</h3>
          @if (subtitle()) {
            <p class="text-sm text-neutral">{{ subtitle() }}</p>
          }
        </div>
      }
      <div #chartEl class="w-full h-96"></div>
    </div>
  `,
})
export class TimeSeriesChart implements AfterViewInit, OnDestroy {
  private readonly chartEl = viewChild.required<ElementRef<HTMLDivElement>>('chartEl');
  private readonly zone = inject(NgZone);

  /** Eixo X. Deve estar ordenado do mais antigo para o mais recente. */
  readonly timestamps = input<Date[]>([]);
  /** Série do eixo Y esquerdo. */
  readonly primary = input<TimeSeries>(EMPTY_SERIES);
  /** Série do eixo Y direito (opcional). */
  readonly secondary = input<TimeSeries>(EMPTY_SERIES);
  /** Séries adicionais, plotadas no eixo esquerdo. */
  readonly extraSeries = input<TimeSeries[]>([]);
  readonly title = input('');
  readonly subtitle = input('');

  private chart?: echarts.ECharts;
  private resizeObserver?: ResizeObserver;
  private themeObserver?: MutationObserver;

  /** Calculado uma vez por render, usado pelo formatter do eixo X. */
  private rangeMs = 0;

  /** true só depois de um render com dados (gráfico vazio não tem eixos). */
  private hasContent = false;

  constructor() {
    // Só lê o que o render() realmente usa.
    effect(() => {
      this.timestamps();
      this.primary();
      this.secondary();
      this.extraSeries();

      if (this.chart) {
        untracked(() => this.render());
      }
    });
  }

  ngAfterViewInit(): void {
    const el = this.chartEl().nativeElement;

    this.zone.runOutsideAngular(() => {
      this.chart = echarts.init(el);

      this.resizeObserver = new ResizeObserver(() => {
        this.chart?.resize();
        // Só atualiza a rotação se já existe um eixo desenhado; num gráfico vazio
        // o merge parcial de xAxis quebra dentro do ECharts.
        if (this.hasContent) {
          this.chart?.setOption({ xAxis: { axisLabel: { rotate: this.labelRotation() } } });
        }
      });
      this.resizeObserver.observe(el);

      // Troca de tema: a classe fica no <html>, então não precisa de subtree.
      this.themeObserver = new MutationObserver(() =>
        requestAnimationFrame(() => this.render()),
      );
      this.themeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class', 'data-theme'],
      });
    });

    this.render();
  }

  /** Exporta o gráfico em PNG com cores legíveis em fundo branco. */
  getImageDataURL(): string | null {
    if (!this.chart || !this.hasContent) return null;

    this.chart.setOption(this.buildOption(EXPORT_TEXT_COLOR, false), { notMerge: true });
    const dataUrl = this.chart.getDataURL({
      type: 'png',
      pixelRatio: 2,
      backgroundColor: '#ffffff',
    });
    this.chart.setOption(this.buildOption(this.themeTextColor(), false), { notMerge: true });

    return dataUrl;
  }

  // Render
  private render(): void {
    if (!this.chart) return;

    if (this.timestamps().length === 0) {
      this.chart.clear();
      this.hasContent = false;
      return;
    }

    this.chart.setOption(this.buildOption(this.themeTextColor(), true), { notMerge: true });
    this.hasContent = true;
  }

  private buildOption(textColor: string, animate: boolean): echarts.EChartsOption {
    const times = this.timestamps().map(t => new Date(t).getTime());
    this.rangeMs = times.length > 1 ? times[times.length - 1] - times[0] : 0;

    const primary = this.primary();
    const secondary = this.secondary();
    const extra = this.extraSeries();

    const hasSecondary = secondary.values.some(v => v !== null && v !== undefined);

    const series: echarts.LineSeriesOption[] = [this.buildSeries(primary, times, 0, 0)];
    let colorIndex = 1;
    if (hasSecondary) {
      series.push(this.buildSeries(secondary, times, 1, colorIndex++));
    }
    extra.forEach(s => series.push(this.buildSeries(s, times, 0, colorIndex++)));

    const axisCommon = {
      type: 'value' as const,
      nameLocation: 'middle' as const,
      nameGap: 45,
      nameRotate: 90,
      nameTextStyle: { color: textColor },
      axisLabel: { color: textColor },
      axisLine: { lineStyle: { color: textColor, opacity: 0.3 } },
    };

    const yAxis: echarts.YAXisComponentOption[] = [
      {
        ...axisCommon,
        id: 'left',
        position: 'left',
        name: primary.title,
        splitLine: { lineStyle: { color: textColor, opacity: 0.15 } },
      },
    ];
    if (hasSecondary) {
      yAxis.push({
        ...axisCommon,
        id: 'right',
        position: 'right',
        name: secondary.title,
        splitLine: { show: false },
      });
    }

    return {
      animation: animate,
      animationDuration: 500,
      animationEasing: 'cubicOut',
      textStyle: { color: textColor },
      grid: { left: '12%', right: '12%', top: '10%', bottom: '20%', containLabel: true },
      tooltip: { trigger: 'axis' },
      legend: {
        show: hasSecondary || extra.length > 0,
        bottom: '0%',
        itemGap: 12,
        itemWidth: 14,
        itemHeight: 10,
        textStyle: { color: textColor, fontSize: 11 },
        data: series.map(s => s.name as string),
      },
      xAxis: {
        type: 'time',
        axisLabel: {
          color: textColor,
          hideOverlap: true,
          rotate: this.labelRotation(),
          formatter: (value: number) => this.formatXAxisLabel(value),
        },
        axisLine: { lineStyle: { color: textColor, opacity: 0.3 } },
      },
      yAxis,
      series,
    };
  }

  private buildSeries(
    data: TimeSeries,
    times: number[],
    yAxisIndex: number,
    colorIndex: number,
  ): echarts.LineSeriesOption {
    const color = this.seriesColor(colorIndex);
    return {
      id: `${data.title}-${yAxisIndex}-${colorIndex}`,
      name: data.title,
      type: 'line',
      smooth: true,
      showSymbol: false,
      connectNulls: false,
      yAxisIndex,
      itemStyle: { color },
      lineStyle: data.dashed ? { color, type: 'dashed' } : { color },
      data: times.map((t, i) => [t, data.values[i] ?? null]),
    };
  }

  // ---------- Formatter (puro: depende só do valor e do range) ----------

  private formatXAxisLabel(value: number): string {
    const d = new Date(value);
    const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    const day = `${d.getDate()}/${d.getMonth() + 1}`;
    const isMidnight = d.getHours() === 0 && d.getMinutes() === 0 && d.getSeconds() === 0;

    // ≤ 1 hora → mm:ss
    if (this.rangeMs <= HOUR) {
      return `${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    }

    // ≤ 7 dias → HH:mm, com a data na virada do dia
    if (this.rangeMs <= 7 * DAY) {
      return isMidnight ? `${day} ${time}` : time;
    }

    // > 7 dias → só a data
    return day;
  }

  // ---------- Helpers ----------

  private labelRotation(): number {
    const width = this.chart?.getWidth() ?? window.innerWidth;
    return width < MOBILE_BREAKPOINT_PX ? 45 : 0;
  }

  private themeTextColor(): string {
    return this.cssVar('--color-default') || EXPORT_TEXT_COLOR;
  }

  private seriesColor(index: number): string {
    // Se o tema definir --chart-1, --chart-2..., eles têm prioridade.
    return this.cssVar(`--chart-${index + 1}`) || FALLBACK_PALETTE[index % FALLBACK_PALETTE.length];
  }

  private cssVar(name: string): string {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.themeObserver?.disconnect();
    this.chart?.dispose();
  }
}
