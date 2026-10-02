import {
  Component, ElementRef, Input, OnChanges, OnDestroy, SimpleChanges,
  ViewChild, AfterViewInit, NgZone, inject
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
  template: `<div #chartEl class="w-full h-96"></div>`,
})
export class DeviceChartComponent implements OnChanges, OnDestroy, AfterViewInit {
  @ViewChild('chartEl', { static: true }) chartEl!: ElementRef<HTMLDivElement>;

  @Input() deviceSeries: ChartSeriesData[] = [];
  @Input() fields: Date[] = [];
  @Input() primary: ChartSeriesData = { title: '', values: [] };
  @Input() secondary: ChartSeriesData = { title: '', values: [] };


  private chart?: echarts.ECharts;
  private resizeObserver?: ResizeObserver;
  private themeObserver?: MutationObserver;
  private readonly colors = ['#5470c6', '#91cc75'];
  private readonly zone = inject(NgZone);
  private lastRenderedDay = '';

  ngOnChanges(_changes: SimpleChanges): void {
    if (this.chart) {
      this.render();
    }
  }

  private cssVar(name: string): string {
    return getComputedStyle(document.documentElement)
      .getPropertyValue(name)
      .trim();
  }

  ngAfterViewInit(): void {
    this.chart = echarts.init(this.chartEl.nativeElement);
    this.render();

    // Resize
    this.resizeObserver = new ResizeObserver(() => {
      this.zone.runOutsideAngular(() => this.chart?.resize());
    });
    this.resizeObserver.observe(this.chartEl.nativeElement);

    // 👇 Theme observer com requestAnimationFrame + subtree
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

  private render(): void {
    if (!this.chart || this.fields.length === 0) return;
    this.lastRenderedDay = '';

    const labelColor = this.cssVar('--color-default');
    const hasSecondary = this.secondary.values.some(v => v !== null && v !== undefined);
    const hasDeviceSeries = this.deviceSeries.length > 0;

    const colorPalette = ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272'];
    let colorIndex = 0;

    const series: any[] = [this.buildSeries(this.primary, 0, colorPalette[colorIndex++])];

    if (hasSecondary) {
      series.push(this.buildSeries(this.secondary, 1, colorPalette[colorIndex++]));
    }

    this.deviceSeries.forEach(s => {
      series.push(this.buildSeries(s, 0, colorPalette[colorIndex % colorPalette.length]));
      colorIndex++;
    });

    const isSmall = window.innerWidth < 768;

    const yAxis: any[] = hasSecondary
      ? [
          { type: 'value', position: 'left', name: this.primary.title },
          { type: 'value', position: 'right', name: this.secondary.title, splitLine: { show: false } },
        ]
      : [{ type: 'value', name: this.primary.title }];

    this.chart.setOption({
      animationDuration: 200,
      animationEasing: 'cubicOut',
      textStyle: { color: labelColor },
      grid: { left: '12%', right: '12%', top: '10%', bottom: '20%', containLabel: true },
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
          rotate: isSmall ? 45 : 0,
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
        axisLabel: { ...axis.axisLabel, color: labelColor },
        axisLine: { lineStyle: { color: labelColor, opacity: 0.3 } },
        splitLine: { ...axis.splitLine, lineStyle: { color: labelColor, opacity: 0.15 } },
      })),
      series,
    },
    { replaceMerge: ['series', 'yAxis', 'xAxis', 'legend'] });
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
    if (this.fields.length < 2) return 0;
    const min = Math.min(...this.fields.map(f => new Date(f).getTime()));
    const max = Math.max(...this.fields.map(f => new Date(f).getTime()));
    return max - min;
  }

  private buildSeries(data: ChartSeriesData, yAxisIndex: number, color: string): any {
    const s: any = {
      id: `${data.title}-${yAxisIndex}`,
      name: data.title,
      type: 'line',
      smooth: true,
      showSymbol: false,
      connectNulls: false,
      yAxisIndex,
      itemStyle: { color },
      data: this.fields.map((f, i) => [new Date(f).toISOString(), data.values[i] ?? null]),
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
