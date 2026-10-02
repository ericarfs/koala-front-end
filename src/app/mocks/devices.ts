import { Device } from "@shared/interfaces/device";

export const DEVICES_MOCK: Device[] = [
  // 1006 (id 4)
  { id: 1,  name: 'ESP32-1006-01', mac: 'AA:BB:CC:11:22:01', description: 'Dispositivo principal do laboratório', id_enviroment: 4, available: true,  firmware_id: 3 },
  { id: 2,  name: 'ESP32-1006-02', mac: 'AA:BB:CC:11:22:02', description: 'Dispositivo secundário',               id_enviroment: 4, available: true,  firmware_id: 3 },
  { id: 3,  name: 'ESP8266-1006',  mac: 'AA:BB:CC:11:22:03', description: 'Sensor de bancada',                    id_enviroment: 4, available: false, firmware_id: 2 },
  { id: 4,  name: 'ESP32-1006-03', mac: 'AA:BB:CC:11:22:04', description: 'Dispositivo principal do laboratório', id_enviroment: 4, available: true,  firmware_id: 3 },
  { id: 5,  name: 'ESP32-1006-04', mac: 'AA:BB:CC:11:22:05', description: 'Dispositivo secundário',               id_enviroment: 4, available: true,  firmware_id: 3 },
  { id: 6,  name: 'ESP8266-1006B', mac: 'AA:BB:CC:11:22:06', description: 'Sensor de bancada',                    id_enviroment: 4, available: false, firmware_id: 2 },
  { id: 7,  name: 'ESP32-1006-05', mac: 'AA:BB:CC:11:22:07', description: 'Dispositivo principal do laboratório', id_enviroment: 4, available: true,  firmware_id: 3 },
  { id: 8,  name: 'ESP32-1006-06', mac: 'AA:BB:CC:11:22:08', description: 'Dispositivo secundário',               id_enviroment: 4, available: true,  firmware_id: 3 },
  { id: 9,  name: 'ESP32-1006-07', mac: 'AA:BB:CC:11:22:09', description: 'Dispositivo secundário',               id_enviroment: 4, available: true,  firmware_id: 3 },

  // 1008 (id 5)
  { id: 10, name: 'ESP32-1008-01', mac: 'AA:BB:CC:22:33:01', description: 'Dispositivo do laboratório 1008', id_enviroment: 5, available: true, firmware_id: 3 },
  { id: 11, name: 'ESP32-1008-02', mac: 'AA:BB:CC:22:33:02', description: 'Gateway de sensores',             id_enviroment: 5, available: true, firmware_id: 3 },

  // Externo (id 7)
  { id: 15, name: 'ESP32-EXT-01', mac: 'AA:BB:CC:44:55:01', description: 'Sensor de solo',  id_enviroment: 7, available: true, firmware_id: 3 },
  { id: 16, name: 'ESP32-EXT-02', mac: 'AA:BB:CC:44:55:02', description: 'Sensor de fluxo', id_enviroment: 7, available: true, firmware_id: 3 },
  { id: 17, name: 'ESP32-EXT-03', mac: 'AA:BB:CC:44:55:03', description: 'Estação externa', id_enviroment: 7, available: true, firmware_id: 3 },
];
