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
