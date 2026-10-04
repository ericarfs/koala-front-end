import {
  Component, ElementRef, OnDestroy, AfterViewInit, NgZone,
  inject, input, viewChild, effect, untracked,
} from '@angular/core';
import * as echarts from 'echarts';

export interface ChartSeriesData {
  title: string;
  values: Array<number | null>;
  dashed?: boolean;
}

@Component({
  selector: 'app-device-chart',
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
export class DeviceChartComponent implements OnDestroy, AfterViewInit {
  private readonly chartEl = viewChild.required<ElementRef<HTMLDivElement>>('chartEl');

  readonly deviceSeries = input<ChartSeriesData[]>([]);
  readonly fields = input<Date[]>([]);
  readonly primary = input<ChartSeriesData>({ title: '', values: [] });
  readonly secondary = input<ChartSeriesData>({ title: '', values: [] });
  readonly locationName = input('');
  readonly title = input('');
  readonly subtitle = input('');

  private chart?: echarts.ECharts;
  private resizeObserver?: ResizeObserver;
  private themeObserver?: MutationObserver;
  private readonly zone = inject(NgZone);
  private lastRenderedDay = '';
  private viewInitialized = false;
  private exportMode = false;

  constructor() {
    effect(() => {
      this.deviceSeries();
      this.fields();
      this.primary();
      this.secondary();
      this.locationName();
      this.title();

      if (this.viewInitialized) {
        untracked(() => this.render());
      }
    });
  }

  ngAfterViewInit(): void {
    this.chart = echarts.init(this.chartEl().nativeElement);
    this.viewInitialized = true;
    this.render();

    this.resizeObserver = new ResizeObserver(() => {
      this.zone.runOutsideAngular(() => this.chart?.resize());
    });
    this.resizeObserver.observe(this.chartEl().nativeElement);

    this.themeObserver = new MutationObserver(() => {
      requestAnimationFrame(() => {
        this.zone.runOutsideAngular(() => this.render());
      });
    });
    this.themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
      subtree: true,
    });
  }

  private cssVar(name: string): string {
    return getComputedStyle(document.documentElement)
      .getPropertyValue(name)
      .trim();
  }

  private render(): void {
    const fields = this.fields();
    if (!this.chart || fields.length === 0) return;

    this.lastRenderedDay = '';



    const labelColor = this.exportMode ? '#212529' : this.cssVar('--color-default');
    const primary = this.primary();
    const secondary = this.secondary();
    const deviceSeries = this.deviceSeries();

    const hasSecondary = secondary.values.some(v => v !== null && v !== undefined);
    const hasDeviceSeries = deviceSeries.length > 0;

    const colorPalette = ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272'];
    let colorIndex = 0;

    const series: any[] = [this.buildSeries(primary, 0, colorPalette[colorIndex++])];

    if (hasSecondary) {
      series.push(this.buildSeries(secondary, 1, colorPalette[colorIndex++]));
    }

    deviceSeries.forEach(s => {
      series.push(this.buildSeries(s, 0, colorPalette[colorIndex % colorPalette.length]));
      colorIndex++;
    });

    const yAxis: any[] = hasSecondary
      ? [
          { id: 'left',  type: 'value', position: 'left',  name: primary.title },
          { id: 'right', type: 'value', position: 'right', name: secondary.title, splitLine: { show: false } },
        ]
      : [{ id: 'left', type: 'value', name: primary.title }];

    this.chart.setOption(
      {
        animationDuration: 500,
        animationEasing: 'cubicOut',
        textStyle: { color: labelColor },
        grid: {
          left: '12%',
          right: '12%',
          top: '10%',
          bottom: '20%',
          containLabel: true,
        },
        tooltip: { trigger: 'axis' },
        legend: {
          show: hasSecondary || hasDeviceSeries,
          bottom: '0%',
          itemGap: 12,
          itemWidth: 14,
          itemHeight: 10,
          textStyle: { color: labelColor, fontSize: 11 },
          data: series.map(s => s.name),
        },
        xAxis: {
          type: 'time',
          axisLabel: {
            color: labelColor,
            hideOverlap: true,
            showMaxLabel: 6,
            rotate: window.innerWidth < 768 ? 45 : 0,
            formatter: (value: number) => this.formatXAxisLabel(value),
          },
          axisLine: { lineStyle: { color: labelColor, opacity: 0.3 } },
        },
        yAxis: yAxis.map(axis => ({
          ...axis,
          nameLocation: 'middle',
          nameGap: 45,
          nameRotate: 90,
          nameTextStyle: { color: labelColor },
          axisLabel: { color: labelColor },
          axisLine: { lineStyle: { color: labelColor, opacity: 0.3 } },
          splitLine: { lineStyle: { color: labelColor, opacity: 0.15 } },
        })),
        series,
      },
      { notMerge: true }
    );
  }

  getImageDataURL(): string | null {
    if (!this.chart) return null;
    this.exportMode = true;
    this.render();

    const dataUrl = this.chart.getDataURL({
      type: 'png',
      pixelRatio: 2,
      backgroundColor: '#ffffff',
    });

    this.exportMode = false;
    this.render();

    return dataUrl;
  }

  private formatXAxisLabel(value: number): string {
    const d = new Date(value);
    const rangeMs = this.getDateRange();
    const isSmall = window.innerWidth < 768;

    const day = `${d.getDate()}/${d.getMonth() + 1}`;
    const time = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    const isNewDay = day !== this.lastRenderedDay;

    // ≤ 1 hora → mm:ss
    if (rangeMs <= 60 * 60 * 1000) {
      return `${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
    }

    // ≤ 24 horas → HH:mm, com data só na virada do dia
    if (rangeMs <= 24 * 60 * 60 * 1000) {
      if (isNewDay) {
        this.lastRenderedDay = day;
        return isSmall ? `${day} ${time}` : `${day} ${time}`;
      }
      return time;
    }

    // ≤ 7 dias → DD/M HH:mm (mobile e desktop)
    if (rangeMs <= 7 * 24 * 60 * 60 * 1000) {
      if (isNewDay) {
        this.lastRenderedDay = day;
        return `${day} ${time}`;
      }
      return time;
    }

    // > 7 dias → só data (hora seria irrelevante)
    if (isNewDay) {
      this.lastRenderedDay = day;
      return day;
    }
    return '';
  }

  private getDateRange(): number {
    const fields = this.fields();
    if (fields.length < 2) return 0;
    const min = Math.min(...fields.map(f => new Date(f).getTime()));
    const max = Math.max(...fields.map(f => new Date(f).getTime()));
    return max - min;
  }

  private buildSeries(data: ChartSeriesData, yAxisIndex: number, color: string): any {
    const fields = this.fields();
    const s: any = {
      id: `${data.title}-${yAxisIndex}`,
      name: data.title,
      type: 'line',
      smooth: true,
      showSymbol: false,
      connectNulls: false,
      yAxisIndex,
      itemStyle: { color },
      data: fields.map((f, i) => [new Date(f).toISOString(), data.values[i] ?? null]),
    };
    if (data.dashed) s.lineStyle = { type: 'dashed' };
    return s;
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.themeObserver?.disconnect();
    this.chart?.dispose();
  }
}
