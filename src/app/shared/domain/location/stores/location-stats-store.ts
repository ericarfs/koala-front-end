import { computed, inject, Injectable, signal } from '@angular/core';
import {tap } from 'rxjs';
import { LocationStore } from './location-store';
import { DeviceStore } from '@shared/domain/device/stores/device-store';
import { DeviceTypeStore } from '@shared/domain/device-type/stores/device-type';
import { DeviceMappingService } from '@shared/domain/device/services/device-mapping';
import { toSignal } from '@angular/core/rxjs-interop';
import { DeviceMapping } from '@shared/interfaces/device-mapping';
import { getLocationStats, LocationStats } from '../location-stats';

@Injectable({ providedIn: 'root' })
export class LocationStatsStore {
  private readonly locationStore = inject(LocationStore);
  private readonly deviceStore = inject(DeviceStore);
  private readonly deviceTypeStore = inject(DeviceTypeStore);
  private readonly mappingService = inject(DeviceMappingService);

  private readonly _mappingsLoaded = signal(false);

  private readonly mappings = toSignal(
    this.mappingService.getAllMappings().pipe(
      tap(() => this._mappingsLoaded.set(true)),
    ),
    { initialValue: [] as DeviceMapping[] },
  );

  readonly loading = computed(() =>
    this.locationStore.loading() ||
    this.deviceStore.loading() ||
    this.deviceTypeStore.loading() ||
    !this._mappingsLoaded(),
  );

  readonly statsById = computed<Map<number, LocationStats>>(() => {
    const locations = this.locationStore.items();
    const source = {
      devices: this.deviceStore.items(),
      mappings: this.mappings(),
      types: this.deviceTypeStore.items(),
    };

    const map = new Map<number, LocationStats>();
    for (const loc of locations) {
      map.set(loc.id, getLocationStats(loc.id, locations, source));
    }
    return map;
  });

  statsFor(id: number): LocationStats | null {
    return this.statsById().get(id) ?? null;
  }
}
