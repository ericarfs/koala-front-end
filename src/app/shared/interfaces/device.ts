import { DeviceType } from "./device-type";

export interface Device {
  id?: number;
  name: string;
  mac: string;
  description?: string;
  id_enviroment?: number;
  available?: boolean;
  firmware_id?: number;
}

/** Device enriquecido com os tipos de sensor resolvidos */
export interface DeviceWithTypes extends Device {
  types: DeviceType[];
}
