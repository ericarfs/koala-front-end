import { DeviceType } from "@shared/interfaces/device-type";

export const DEVICE_TYPES_MOCK: DeviceType[] = [
  { id: 1, name: 'Temperature', description: 'Sensor realiza leitura da temperatura do ambiente', icon: 'fa-temperature-half' },
  { id: 2, name: 'Humidity', description: 'Sensor realiza leitura de umidade do ambiente', icon: 'fa-droplet' },
  { id: 3, name: 'Brightness', description: 'Sensor realiza leitura da luminosidade do ambiente', icon: 'fa-sun' },
  { id: 4, name: 'Energy', description: 'Sensor realiza leitura da corrente consumida', icon: 'fa-bolt' },
  { id: 5, name: 'Presence', description: 'Verifica se há pessoas no ambiente', icon: 'fa-user-check' },
  { id: 6, name: 'Umidade de Solo', description: 'Sensor Capacitivo V2', icon: 'fa-seedling' },
  { id: 7, name: 'Temperatura de Solo', description: 'Solo', icon: 'fa-temperature-arrow-up' },
  { id: 8, name: 'Sensor de Fluxo', description: 'Sensor de fluxo', icon: 'fa-water' }
]
