import { computed, inject, Injectable } from '@angular/core';
import { DeviceMappingService } from '../services/device-mapping';
import { rxResource } from '@angular/core/rxjs-interop';

@Injectable({ providedIn: 'root' })
export class DeviceMappingStore {
  private readonly service = inject(DeviceMappingService);

  private readonly mappings = rxResource({
    stream: () => this.service.getAllMappings(),
  });

  readonly items = computed(() => this.mappings.value() ?? []);
  readonly loading = this.mappings.isLoading;
  readonly error = this.mappings.error;
  readonly loaded = computed(() => this.mappings.hasValue());

  refresh(): void {
    this.mappings.reload();
  }
}
