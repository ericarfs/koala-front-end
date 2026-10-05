import { Component, computed, effect, inject, input } from '@angular/core';
import { delay, of, tap } from 'rxjs';
import { LocationCard } from '@features/location/components/location-card';
import { ContentLayout } from '@shared/layouts/content/content';
import { Paginator } from '@shared/components/pagination/paginator';
import { FormDialogService } from '@shared/components/form-dialog/form-dialog.service';
import { LocationStore } from '@shared/domain/location/location-store';
import { getChildren } from '@shared/domain/location/location-tree';
import { paginate } from '@shared/utils/paginate';
import { Location } from '@shared/interfaces/location';
import { TranslatePipe } from '@ngx-translate/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { DEVICES_MOCK } from '../../../../mocks/devices';
import { DEVICE_MAPPINGS_MOCK } from '../../../../mocks/device-mapping';
import { DEVICE_TYPES_MOCK } from '../../../../mocks/device-types';
import { getLocationStats, LocationStats } from '@shared/domain/location/location-stats';
import { LocationTreeSelect } from '@shared/domain/location/location-tree-select';


@Component({
  imports: [ReactiveFormsModule, ContentLayout, LocationCard, Paginator, LocationTreeSelect, TranslatePipe],
  selector: 'app-location-list',
  styleUrl: './location-list.css',
  templateUrl: './location-list.html',
  host: {
    class: 'contents',
  },
})
export class LocationList {
  private readonly formDialog = inject(FormDialogService);

  readonly store = inject(LocationStore);

  readonly statsById = computed<Map<number, LocationStats>>(() => {
    const locations = this.store.items();
    const source = {
      devices: DEVICES_MOCK,
      mappings: DEVICE_MAPPINGS_MOCK,
      types: DEVICE_TYPES_MOCK,
    };

    const map = new Map<number, LocationStats>();
    for (const loc of this.locations()) {
      map.set(loc.id, getLocationStats(loc.id, locations, source));
    }
    return map;
  });

  statsFor = (loc: Location): LocationStats | null =>
    this.statsById().get(loc.id) ?? null;

  searchForms = new FormGroup({
    currentLocation: new FormControl<number | null>(null),
  });

  private filters = toSignal(this.searchForms.valueChanges, {
    initialValue: this.searchForms.value,
  });

  readonly locations = computed<Location[]>(() => {
    const all = this.store.items();
    const { currentLocation } = this.filters();

    if (currentLocation == null) return getChildren(null, all);

    const found = all.find((l) => l.id === Number(currentLocation));
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
    effect(() => {
      this.filters();
      this.pagination.pageIndex.set(0);
    });
  }

  openLocationDialog(location?: Location): void {
    const editingId = location?.id ?? null;
    const isEdit = editingId != null;

    this.formDialog
      .open<Location>({
        title: isEdit ? 'LOCATIONS.EDIT.TITLE' : 'LOCATIONS.ADD.TITLE',
        subtitle: isEdit ? 'LOCATIONS.EDIT.SUBTITLE' : 'LOCATIONS.ADD.SUBTITLE',
        submitLabel: isEdit ? 'COMMON.ACTIONS.SAVE' : 'COMMON.ACTIONS.CREATE',
        fields: [
          {
            key: 'name',
            label: 'COMMON.FORM.NAME',
            placeholder: 'COMMON.FORM.NAME_PLACEHOLDER',
            required: true
          },
          {
            key: 'description',
            label: 'COMMON.FORM.DESCRIPTION',
            placeholder: 'COMMON.FORM.DESCRIPTION_PLACEHOLDER',
            type: 'textarea',
            rows: 4
          },
        ],
        initialValues: location
          ? { name: location.name, description: location.description }
          : undefined,
        onSubmit: (values) => {
          const v = values as { name: string; description?: string };

          if (editingId != null) {
            const patch: Partial<Location> = {
              name: v.name,
              description: v.description ?? '',
            };
            const updated: Location = { ...location!, ...patch, id: editingId };

            return of(updated).pipe(
              delay(3000),
              tap(() => this.store.update(editingId, patch)),
            );
          }

          const created: Location = {
            id: this.store.nextId(),
            name: v.name,
            description: v.description ?? '',
            parentId: null,
          };

          return of(created).pipe(
            delay(3000),
            tap((c) => this.store.add(c)),
          );
        },
      })
      .closed.subscribe();
  }

  newLocation(): void {
    this.openLocationDialog();
  }

  updateLocation(location: Location): void {
    this.openLocationDialog(location);
  }

  deleteLocation(location: Location): void {
    this.store.remove(location.id!);
  }
}
