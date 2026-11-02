import { PdfExportLabels, RGB } from "./pdf-expert.types";

export const DEFAULT_LABELS: PdfExportLabels = {
  generatedAt: 'Gerado em',
  generatedBy: 'Por',
  page: 'Página',
  of: 'de',
  location: 'Localização',
  devices: 'Dispositivos',
  period: 'Período',
  interval: 'Intervalo',
  sensors: 'Sensores',
  stats: 'Estatísticas',
  sensor: 'Sensor',
  min: 'Mínimo',
  max: 'Máximo',
  avg: 'Média',
};

export const COLORS = {
  primary: [217, 119, 6] as RGB,
  primaryDark: [146, 64, 14] as RGB,
  secondary: [13, 148, 136] as RGB,
  secondaryDark: [15, 118, 110] as RGB,
  tint: [255, 251, 235] as RGB,
  border: [203, 213, 225] as RGB,
  zebra: [248, 250, 252] as RGB,
  text: [41, 37, 36] as RGB,
  muted: [120, 113, 108] as RGB,
};
