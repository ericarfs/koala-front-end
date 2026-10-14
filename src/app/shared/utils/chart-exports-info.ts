import { TimeBucket, timeBucketLabel } from '@shared/domain/monitoring/models/time-bucket';
import { ChartExportInfo } from '@shared/services/pdf-export';


interface Named {
  name: string;
}

export interface ChartInfoParams {
  location?: string;
  sensors?: readonly Named[];
  devices?: readonly Named[];
  timeBucket?: TimeBucket;
  start?: Date | null;
  end?: Date | null;
  locale?: string;
}

export function buildChartInfo(params: ChartInfoParams): ChartExportInfo {
  const { location, sensors, devices, timeBucket, start, end, locale = 'pt-BR' } = params;
  const fmt = new Intl.DateTimeFormat(locale, { dateStyle: 'short' });

  return {
    location,
    devices: devices?.map(d => d.name),
    sensors: sensors?.map(s => s.name),
    interval: timeBucket ? timeBucketLabel(timeBucket) : undefined,
    period: start && end
      ? fmt.formatRange(start, end)
      : undefined,
  };
}
