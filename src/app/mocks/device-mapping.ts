import { DeviceMapping } from "@shared/interfaces/device-mapping";

export const DEVICE_MAPPINGS_MOCK: DeviceMapping[] = [
  // id 1: ESP32-1006-01
  { device_id: 1, type_id: 1 }, // Temperature
  { device_id: 1, type_id: 2 }, // Humidity

  // id 2: ESP32-1006-02
  { device_id: 2, type_id: 1 }, // Temperature

  // id 3: ESP8266-1006
  { device_id: 3, type_id: 5 }, // Presence
  { device_id: 3, type_id: 3 }, // Brightness

  // id 4: ESP32-1006-03
  { device_id: 4, type_id: 4 }, // Energy

  // id 5: ESP32-1006-04
  { device_id: 5, type_id: 6 }, // Umidade de Solo
  { device_id: 5, type_id: 7 }, // Temperatura de Solo

  // id 6: ESP8266-1006B
  { device_id: 6, type_id: 8 }, // Sensor de Fluxo

  // id 7: ESP32-1006-05
  { device_id: 7, type_id: 1 }, // Temperature
  { device_id: 7, type_id: 2 }, // Humidity
  { device_id: 7, type_id: 3 }, // Brightness

  // id 8: ESP32-1006-06
  { device_id: 8, type_id: 1 }, // Temperature

  // id 9: ESP32-1006-07 (faltava mapeamento)
  { device_id: 9, type_id: 1 }, // Temperature
  { device_id: 9, type_id: 2 }, // Humidity

  // id 10: ESP32-1008-01 (faltava mapeamento)
  { device_id: 10, type_id: 1 }, // Temperature
  { device_id: 10, type_id: 2 }, // Humidity

  // id 11: ESP32-1008-02 (faltava mapeamento)
  // Gateway de sensores — assumindo que também exponha leitura de temperatura
  { device_id: 11, type_id: 1 }, // Temperature

  // id 15: ESP32-EXT-01 — Sensor de solo
  { device_id: 15, type_id: 6 }, // Umidade de Solo
  { device_id: 15, type_id: 7 }, // Temperatura de Solo

  // id 16: ESP32-EXT-02 — Sensor de fluxo
  { device_id: 16, type_id: 8 }, // Sensor de Fluxo

  // id 17: ESP32-EXT-03 — Estação externa
  { device_id: 17, type_id: 1 }, // Temperature
  { device_id: 17, type_id: 2 }, // Humidity
  { device_id: 17, type_id: 3 }, // Brightness
];
