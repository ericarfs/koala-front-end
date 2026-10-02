import { DeviceMapping } from "@shared/interfaces/device-mapping";

export const DEVICE_MAPPINGS_MOCK: DeviceMapping[] = [
  // ESP32-Sala (id 1): Temperature + Humidity
  { device_id: 1, type_id: 1 },
  { device_id: 1, type_id: 2 },

  // ESP32-Cozinha (id 2): Temperature
  { device_id: 2, type_id: 1 },

  // ESP32-Garagem (id 3): Presence + Brightness
  { device_id: 3, type_id: 5 },
  { device_id: 3, type_id: 3 },

  // ESP32-Energia (id 4): Energy
  { device_id: 4, type_id: 4 },

  // ESP32-Horta (id 5): Umidade de Solo + Temperatura de Solo
  { device_id: 5, type_id: 6 },
  { device_id: 5, type_id: 7 },

  // ESP32-Reservatorio (id 6): Sensor de Fluxo
  { device_id: 6, type_id: 8 },

  // ESP32-Lab (id 7): Temperature + Humidity + Brightness
  { device_id: 7, type_id: 1 },
  { device_id: 7, type_id: 2 },
  { device_id: 7, type_id: 3 },

  // ESP32-Externo (id 8): Temperature
  { device_id: 8, type_id: 1 },
];
