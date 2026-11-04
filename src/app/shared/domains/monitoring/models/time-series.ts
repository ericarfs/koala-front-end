export interface TimeSeries {
  title: string;
  values: (number | null)[];
  dashed?: boolean;
}
