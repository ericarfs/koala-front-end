import { inject, Injectable } from '@angular/core';
import { Device } from '@shared/interfaces/device';
import { DeviceService, DeviceUpdate } from '../services/device';
import { CrudStore } from '@shared/domain/crud/crud.store';

export type DeviceMutationError = 'NOT_FOUND';
export type DeviceMutationResult<T> =
  | { ok: true; data: T }
  | { ok: false; reason: DeviceMutationError };

@Injectable({ providedIn: 'root' })
export class DeviceStore extends CrudStore<Device> {
  protected readonly service = inject(DeviceService);
  protected readonly logTag = 'DeviceStore';

  constructor() {
    super();
    this.load();
    this.subscribeToUpdates();
  }


  private subscribeToUpdates(): void {
    this.service.getDeviceUpdates().subscribe({
      next: (update) => this.applyUpdate(update),
      error: (err) => console.error('[DeviceStore] SSE error', err),
    });
  }

  private applyUpdate(update: DeviceUpdate): void {
    this.mergeItem(update.id, update);
  }
}
