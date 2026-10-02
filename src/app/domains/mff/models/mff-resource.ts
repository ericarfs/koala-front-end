export interface MffResource {
  id: number;
  name: string;
  kind: 'telemetria' | 'evento' | 'exposição';
  status: 'ativo' | 'inativo';
}

export interface MffExhibition {
  id: number;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
}