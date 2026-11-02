export type RGB = [number, number, number];

export interface ChartExportInfo {
  location?: string;
  devices?: string[];
  period?: string;
  interval?: string;
  sensors?: string[];
}

export interface SensorStats {
  name: string;
  unit?: string;
  min: number;
  max: number;
  avg: number;
}

export interface ChartExportItem {
  title: string;
  subtitle?: string;
  imageDataUrl: string;
  info?: ChartExportInfo;
  stats?: SensorStats[];
}

export interface PdfExportLabels {
  generatedAt: string;
  generatedBy: string;
  page: string;
  of: string;
  location: string;
  devices: string;
  period: string;
  interval: string;
  sensors: string;
  stats: string;
  sensor: string;
  min: string;
  max: string;
  avg: string;
}

export interface PdfExportOptions {
  fileName?: string;
  appName?: string;
  reportTitle?: string;
  generatedBy?: string;
  locale?: string;
  logoDataUrl?: string;
  labels?: Partial<PdfExportLabels>;
}

export interface InfoItem {
  label: string;
  value: string;
  full: boolean;
}

export interface LogoInfo {
  dataUrl: string;
  format: 'PNG' | 'JPEG' | 'WEBP';
  w: number;
  h: number;
}

export interface HeaderContext {
  pageWidth: number;
  margin: number;
  headerHeight: number;
  appName: string;
  reportTitle: string;
  generatedAt: string;
  generatedBy?: string;
  labels: PdfExportLabels;
  logo: LogoInfo | null;
}

export interface PdfExportContext {
  pdf: import('jspdf').jsPDF;
  pageWidth: number;
  pageHeight: number;
  margin: number;
  contentWidth: number;
  headerHeight: number;
  footerHeight: number;
  labels: PdfExportLabels;
  locale: string;
  header: HeaderContext;
  appName: string;
  reportTitle: string;
}
