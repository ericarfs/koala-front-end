import { TimeBucket } from "./time-bucket";

export interface MetricsQuery {
  idEnviroment: number;
  idDeviceType: number;
  idDevice?: number | null;
  startDate?: Date | null;
  endDate?: Date | null;
  timeBucket?: TimeBucket;
}

export interface MetricBucket {
  time_interval: Date;
  avg_value: number;
  min_value: number;
  max_value: number;
}

