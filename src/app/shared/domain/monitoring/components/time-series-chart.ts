import {
  AfterViewInit, Component, ElementRef, NgZone, OnDestroy,
  effect, inject, input, untracked, viewChild,
} from '@angular/core';

import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';

import { GridComponent,  TooltipComponent,  LegendComponent } from 'echarts/components';

import { CanvasRenderer } from 'echarts/renderers';
import { TimeSeries } from '../models/time-series';
import { EChartsOption, LegendComponentOption, LineSeriesOption, XAXisOption, YAXisOption } from 'echarts/types/dist/shared';

echarts.use([
  LineChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  CanvasRenderer,
]);

const EMPTY_SERIES: TimeSeries = { title: '', values: [] };
const FALLBACK_PALETTE = ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272'];
const EXPORT_TEXT_COLOR = '#212529';
const MOBILE_BREAKPOINT_PX = 768;

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const pad = (n: number) => n.toString().padStart(2, '0');

// ─── Função pura para o rótulo do eixo X ──────────────────────────
function formatXAxisLabel(value: number, rangeMs: number): string {
  const d = new Date(value);
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const day = `${d.getDate()}/${d.getMonth() + 1}`;
  const isMidnight = d.getHours() === 0 && d.getMinutes() === 0 && d.getSeconds() === 0;

  if (rangeMs <= HOUR) {
    return `${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }
  if (rangeMs <= 7 * DAY) {
    return isMidnight ? `${day} ${time}` : time;
  }
  return day;
}

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

  readonly timestamps = input<Date[]>([]);
  readonly primary = input<TimeSeries>(EMPTY_SERIES);
  readonly secondary = input<TimeSeries>(EMPTY_SERIES);
  readonly extraSeries = input<TimeSeries[]>([]);
  readonly title = input('');
  readonly subtitle = input('');

  private chart?: echarts.ECharts;
  private resizeObserver?: ResizeObserver;
  private themeObserver?: MutationObserver;

  private rangeMs = 0;
  private hasContent = false;

  constructor() {
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
        if (this.hasContent) {
          this.chart?.setOption({ xAxis: { axisLabel: { rotate: this.labelRotation() } } });
        }
      });
      this.resizeObserver.observe(el);

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

  private buildOption(textColor: string, animate: boolean): EChartsOption {
    const times = this.timestamps().map(t => new Date(t).getTime());
    this.rangeMs = times.length > 1 ? times[times.length - 1] - times[0] : 0;

    const seriesList = this.buildSeriesList(times);
    const hasSecondary = this.secondary().values.some(v => v !== null && v !== undefined);

    return {
      animation: animate,
      animationDuration: 500,
      animationEasing: 'cubicOut',
      textStyle: { color: textColor },
      grid: { left: '12%', right: '12%', top: '10%', bottom: '20%', containLabel: true },
      tooltip: { trigger: 'axis' },
      legend: this.buildLegend(seriesList, textColor),
      xAxis: this.buildXAxis(textColor),
      yAxis: this.buildYAxes(textColor, hasSecondary),
      series: seriesList,
    };
  }

  // ─── Builders Específicos ───

  private buildSeriesList(times: number[]): LineSeriesOption[] {
    const series: LineSeriesOption[] = [this.buildSeries(this.primary(), times, 0, 0)];

    let colorIndex = 1;
    if (this.secondary().values.some(v => v != null)) {
      series.push(this.buildSeries(this.secondary(), times, 1, colorIndex++));
    }
    this.extraSeries().forEach(s => series.push(this.buildSeries(s, times, 0, colorIndex++)));

    return series;
  }

  private buildSeries(data: TimeSeries, times: number[], yAxisIndex: number, colorIndex: number): LineSeriesOption {
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

  private buildYAxes(textColor: string, hasSecondary: boolean): YAXisOption[] {
    const axisCommon = {
      type: 'value' as const,
      nameLocation: 'middle' as const,
      nameGap: 45,
      nameRotate: 90,
      nameTextStyle: { color: textColor },
      axisLabel: { color: textColor },
      axisLine: { lineStyle: { color: textColor, opacity: 0.3 } },
    };

    const axes: YAXisOption[] = [{
      ...axisCommon,
      id: 'left',
      position: 'left',
      name: this.primary().title,
      splitLine: { lineStyle: { color: textColor, opacity: 0.15 } },
    }];

    if (hasSecondary) {
      axes.push({
        ...axisCommon,
        id: 'right',
        position: 'right',
        name: this.secondary().title,
        splitLine: { show: false },
      });
    }
    return axes;
  }

  private buildXAxis(textColor: string): XAXisOption {
    return {
      type: 'time',
      axisLabel: {
        color: textColor,
        hideOverlap: true,
        rotate: this.labelRotation(),
        formatter: (value: number) => formatXAxisLabel(value, this.rangeMs),
      },
      axisLine: { lineStyle: { color: textColor, opacity: 0.3 } },
    };
  }

  private buildLegend(series: LineSeriesOption[], textColor: string): LegendComponentOption {
    return {
      show: series.length > 1,
      bottom: '0%',
      itemGap: 12,
      itemWidth: 14,
      itemHeight: 10,
      textStyle: { color: textColor, fontSize: 11 },
      data: series.map(s => s.name as string),
    };
  }

  private labelRotation(): number {
    const width = this.chart?.getWidth() ?? window.innerWidth;
    return width < MOBILE_BREAKPOINT_PX ? 45 : 0;
  }

  private themeTextColor(): string {
    return this.cssVar('--color-default') || EXPORT_TEXT_COLOR;
  }

  private seriesColor(index: number): string {
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
