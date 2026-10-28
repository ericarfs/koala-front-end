export enum AirconMode {
  AUTO = 0,
  COOL,
  FAN,
  HEAT,
}

export interface AirconParameters {
  enviromentId: string | number | null;
  deviceId: number | null;
  mode: AirconMode;
  temperature: number;
  power: boolean;
}

export interface ControlData {
  environmentId: string;
  locationName: string;
}

// O que o dialog devolve no submit
export interface ControlResult {
  locationName: string;
  temperature: number;
  mode: AirconMode;
  enabled: boolean;
}
