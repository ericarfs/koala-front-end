import { Component, computed, effect, inject, input, untracked } from '@angular/core';
import { LocationCard } from '@features/locations/components/location-card';
import { ContentLayout } from '@shared/layouts/content/content';
import { Paginator } from '@shared/components/pagination/paginator';
import { LocationStore } from '@shared/domains/location/stores/location-store';
import { getChildren } from '@shared/domains/location/components/location-tree';
import { paginate } from '@shared/utils/paginate';
import { Location } from '@shared/interfaces/location';
import { TranslocoPipe } from '@jsverse/transloco';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { LocationTreeSelect } from '@shared/domains/location/components/location-tree-select';
import { DeviceTypeStore } from '@shared/domains/device-type/stores/device-type';
import { LocationStatsStore } from '@shared/domains/location/stores/location-stats-store';
import { LocationCardSkeleton } from '@features/locations/components/location-card-skeleton';
import { LocationActions } from '@features/locations/components/location-actions';


@Component({
  imports: [ReactiveFormsModule, ContentLayout, LocationCard, LocationCardSkeleton, Paginator, LocationTreeSelect, TranslocoPipe],
  selector: 'app-location-list',
  styleUrl: './location-list.css',
  templateUrl: './location-list.html',
  host: {
    class: 'contents',
  },
})
export class LocationList {
  private readonly deviceTypeStore = inject(DeviceTypeStore);
  private readonly actions = inject(LocationActions);

  readonly statsStore = inject(LocationStatsStore);
  readonly store = inject(LocationStore);

  searchForms = new FormGroup({
    currentLocation: new FormControl<number | null>(null),
  });

  private filters = toSignal(this.searchForms.valueChanges, {
    initialValue: this.searchForms.value,
  });

  readonly locations = computed<Location[]>(() => {
    const all = this.store.items();
    const raw = this.filters().currentLocation as unknown;

    const selected = raw === null || raw === undefined || raw === '' ? null : Number(raw);
    if (selected === null || Number.isNaN(selected)) return getChildren(null, all);

    const found = all.find((l) => l.id === selected);
    return found ? [found] : [];
  });

  actionLabel = (loc: Location) => {
    const count = getChildren(loc.id, this.store.items()).length;
    if (count === 0) return 'Ver dispositivos';
    return count === 1 ? '1 local' : `${count} locais`;
  };

  pageSize = input(1);
  pagination = paginate(this.locations, this.pageSize);

  constructor() {
    this.deviceTypeStore.load();

    effect(() => {
      this.filters();
      this.pagination.pageIndex.set(0);
    });

    effect(() => {
      const all = this.store.items();
      if (this.store.loading()) return;

      const control = this.searchForms.controls.currentLocation;
      const selected = control.value;

      if (selected != null && !all.some((l) => l.id === Number(selected))) {
        untracked(() => control.setValue(null));
      }
    });
  }

  newLocation(): void {
    this.actions.openCreate();
  }
}
