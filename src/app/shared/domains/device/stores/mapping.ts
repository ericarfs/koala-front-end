import { computed, Signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';

export interface MappingService<T> {
  getAllMappings(): Observable<T[]>;
}

export abstract class MappingStore<T> {
  protected abstract readonly service: MappingService<T>;

  private readonly mappings = rxResource({
    stream: () => this.service.getAllMappings(),
  });

  readonly items: Signal<T[]> = computed(() => this.mappings.value() ?? []);
  readonly loading = this.mappings.isLoading;
  readonly error = this.mappings.error;
  readonly loaded: Signal<boolean> = computed(() => this.mappings.hasValue());

  refresh(): void {
    this.mappings.reload();
  }
}
