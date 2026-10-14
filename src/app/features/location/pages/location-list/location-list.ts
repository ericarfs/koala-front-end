import { Component, computed, effect, inject, input } from '@angular/core';
import { of, switchMap, throwError } from 'rxjs';
import { LocationCard } from '@features/location/components/location-card';
import { ContentLayout } from '@shared/layouts/content/content';
import { Paginator } from '@shared/components/pagination/paginator';
import { DialogService } from '@shared/components/dialogs/dialogs.service';
import { LocationStore, MutationError } from '@shared/domain/location/location-store';
import { getChildren } from '@shared/domain/location/location-tree';
import { paginate } from '@shared/utils/paginate';
import { Location } from '@shared/interfaces/location';
import { TranslocoPipe } from '@jsverse/transloco';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { getLocationStats, LocationStats } from '@shared/domain/location/location-stats';
import { LocationTreeSelect } from '@shared/domain/location/location-tree-select';
import { DeviceStore } from '@shared/domain/device/stores/device-store';
import { DeviceTypeStore } from '@shared/domain/device-type/stores/device-type';
import { DeviceMappingService } from '@shared/domain/device/services/device-mapping';
import { DeviceMapping } from '@shared/interfaces/device-mapping';


@Component({
  imports: [ReactiveFormsModule, ContentLayout, LocationCard, Paginator, LocationTreeSelect, TranslocoPipe],
  selector: 'app-location-list',
  styleUrl: './location-list.css',
  templateUrl: './location-list.html',
  host: {
    class: 'contents',
  },
})
export class LocationList {
  private readonly deviceStore = inject(DeviceStore);
  private readonly deviceTypeStore = inject(DeviceTypeStore);
  private readonly formDialog = inject(DialogService);
  private readonly mappingService = inject(DeviceMappingService);

  readonly store = inject(LocationStore);

  private readonly mappings = toSignal(
    this.mappingService.getAllMappings(),
    { initialValue: [] as DeviceMapping[] },
  );

  readonly statsById = computed<Map<number, LocationStats>>(() => {
    const locations = this.store.items();
    const devices = this.deviceStore.items();
    const source = {
      devices,
      mappings: this.mappings(),
      types: this.deviceTypeStore.items(),
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
    this.deviceTypeStore.load();

    effect(() => {
      this.filters();
      this.pagination.pageIndex.set(0);
    });
  }

  newLocation(): void {
    this.openDialog();
  }

  private openDialog(): void {
    this.formDialog
      .open<Location>({
        title: 'LOCATIONS.ADD.TITLE',
        subtitle: 'LOCATIONS.ADD.SUBTITLE',
        submitLabel: 'COMMON.ACTIONS.CREATE',
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

        onSubmit: (values) => {
          const v = values as { name: string; description?: string };

          const draft: Omit<Location, 'id'> = {
            name: v.name,
            description: v.description ?? '',
            parentId: null,
          } as Omit<Location, 'id'>;

          return this.store.add(draft).pipe(
            switchMap((res) =>
              res.ok
                ? of(res.data)
                : throwError(() => this.toErrorMessage(res.reason)),
            ),
          );
        },
      })
      .closed.subscribe();
  }

  private toErrorMessage(reason: MutationError): string {
    switch (reason) {
      case 'MAX_DEPTH_EXCEEDED':
        return 'LOCATIONS.ERRORS.MAX_DEPTH';
      case 'INVALID_PARENT':
        return 'LOCATIONS.ERRORS.INVALID_PARENT';
    }
  }
}
