import { TimeSeries } from "./time-series";

export interface ChartData {
  timestamps: Date[];
  primary: TimeSeries;
  secondary: TimeSeries;
  extraSeries: TimeSeries[];
}

const EMPTY_SERIES: TimeSeries = { title: '', values: [] };

export const EMPTY_CHART_DATA: ChartData = {
  timestamps: [],
  primary: EMPTY_SERIES,
  secondary: EMPTY_SERIES,
  extraSeries: [],
};
