export interface ChartType {
  id: number;
  name: string;
}

export function parseDateRange(
  fromDate: string | null,
  toDate: string | null,
): { start: Date | null; end: Date } {
  const start = fromDate ? new Date(fromDate) : null;
  const end = toDate ? new Date(toDate) : new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export function buildChartSubtitle(types: ChartType[], devices: { name: string }[] = []): string {
  if (types.length > 1) return types.map((t) => t.name).join(' × ');
  if (devices.length > 0) {
    return `${types[0]?.name ?? ''} — ${devices.length} dispositivo${devices.length > 1 ? 's' : ''}`;
  }
  return types[0]?.name ?? '';
}
