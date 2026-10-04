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
  // pega o próprio local + todos os descendentes
  const ids = getDescendantIds(locationId, locations);
  const devices = source.devices.filter(
    (d) => d.id_enviroment != null && ids.has(d.id_enviroment),
  );

  const devicesTotal = devices.length;
  const devicesOnline = devices.filter((d) => d.available).length;
  const devicesOffline = devicesTotal - devicesOnline;

  // agrega tipos de sensor dos dispositivos que estão nesse local
  const deviceIds = new Set(devices.map((d) => d.id));
  const countByType = new Map<number, number>();
  for (const m of source.mappings) {
    if (!deviceIds.has(m.device_id)) continue;
    countByType.set(m.type_id, (countByType.get(m.type_id) ?? 0) + 1);
  }

  const typeById = new Map(source.types.map((t) => [t.id, t]));
  const byType = [...countByType.entries()]
    .map(([typeId, count]) => ({ type: typeById.get(typeId)!, count }))
    .filter((x) => x.type)
    .sort((a, b) => b.count - a.count);

  return { devicesTotal, devicesOnline, devicesOffline, byType };
}
