import { Device } from '@shared/interfaces/device';
import { DeviceMapping } from '@shared/interfaces/device-mapping';
import { DeviceType } from '@shared/interfaces/device-type';
import { Location } from '@shared/interfaces/location';
import { getDescendantIds } from './location-tree';

export interface LocationStats {
  devicesTotal: number;
  devicesOnline: number;
  devicesOffline: number;
  byType: { type: DeviceType; count: number }[];

  avgTemperature?: number | null;
  avgHumidity?: number | null;
}

export interface LocationStatsSource {
  devices: Device[];
  mappings: DeviceMapping[];
  types: DeviceType[];
}

export function getLocationStats(
  locationId: number,
  locations: Location[],
  source: LocationStatsSource,
): LocationStats {
  // Pega o próprio local + todos os descendentes
  const ids = getDescendantIds(locationId, locations);

  // Filtra os dispositivos que pertencem a esses locais
  const devices = source.devices.filter(
    (d) => d.id_enviroment != null && ids.has(d.id_enviroment),
  );

  // Delega os cálculos para funções puras e específicas
  const status = calculateDeviceStatus(devices);
  const byType = aggregateDeviceTypes(devices, source.mappings, source.types);

  return {
    devicesTotal: devices.length,
    ...status,
    byType,
  };
}

function calculateDeviceStatus(devices: Device[]): { devicesOnline: number; devicesOffline: number } {
  const devicesOnline = devices.filter((d) => d.available).length;
  return {
    devicesOnline,
    devicesOffline: devices.length - devicesOnline,
  };
}

function aggregateDeviceTypes(
  devices: Device[],
  mappings: LocationStatsSource['mappings'],
  types: DeviceType[],
): LocationStats['byType'] {
  const deviceIds = new Set(devices.map((d) => d.id));
  const countByType = new Map<number, number>();

   // Conta quantas vezes cada tipo de sensor aparece
  for (const m of mappings) {
    if (deviceIds.has(m.device_id)) {
      countByType.set(m.type_id, (countByType.get(m.type_id) ?? 0) + 1);
    }
  }

  const typeById = new Map(types.map((t) => [t.id, t]));

  return Array.from(countByType.entries())
    .map(([typeId, count]) => ({ type: typeById.get(typeId), count }))

    .filter((x): x is { type: DeviceType; count: number } => !!x.type)
    .sort((a, b) => b.count - a.count);
}
