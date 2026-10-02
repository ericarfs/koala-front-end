import { Observable } from "rxjs";

export enum ControlMode {
  AUTO = 0,
  COOL,
  FAN,
  HEAT,
}

export interface ControlData {
  locationName: string;
  temperature: number;
  mode: ControlMode;
  enabled: boolean;
  onSubmit: (values: ControlResult) => Observable<unknown>;
}

// O que o dialog devolve no submit
export interface ControlResult {
  locationName: string;
  temperature: number;
  mode: ControlMode;
  enabled: boolean;
}
