import { CommonModule } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { delay, map, of } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { getActionLabel, getAncestors, getChildren } from '../../../../shared/domain/location/location-tree';
import { ContentLayout } from '@shared/layouts/content/content';
import { DeviceList } from '@shared/domain/device/components/device-list';
import { LocationCard } from '@features/location/components/location-card';
import { LocationStore } from '@shared/domain/location/location-store';
import { FormDialogService } from '@shared/components/form-dialog/form-dialog.service';
import { DEVICES_MOCK } from '../../../../mocks/devices';
import { Location } from '@shared/interfaces/location';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Paginator} from '@shared/components/pagination/paginator';
import { paginate } from '@shared/utils/paginate';
import { getLocationStats, LocationStats } from '@shared/domain/location/location-stats';
import { DEVICE_MAPPINGS_MOCK } from '../../../../mocks/device-mapping';
import { DEVICE_TYPES_MOCK } from '../../../../mocks/device-types';
import { mediaQuery } from '@shared/utils/media-query';



@Component({
  selector: 'app-location-details',
  standalone: true,
  imports: [CommonModule, RouterLink, ContentLayout, DeviceList, LocationCard, Paginator, TranslatePipe],
  templateUrl: './location-details.html',
  host: {
    class: 'block flex-1',
  },
})
export class LocationDetails {
  private readonly route = inject(ActivatedRoute);
  private readonly store = inject(LocationStore);
  private readonly formDialog = inject(FormDialogService);
  private readonly translate = inject(TranslateService);

  private readonly id = toSignal(
    this.route.paramMap.pipe(map((p) => Number(p.get('id')))),
    { initialValue: NaN }
  );

  readonly statsById = computed<Map<number, LocationStats>>(() => {
    const locations = this.store.items();
    const source = {
      devices: DEVICES_MOCK,
      mappings: DEVICE_MAPPINGS_MOCK,
      types: DEVICE_TYPES_MOCK,
    };

    const ids = new Set<number>();
    const current = this.id();
    if (!Number.isNaN(current)) ids.add(current);
    for (const c of this.children()) ids.add(c.id);

    const map = new Map<number, LocationStats>();
    for (const id of ids) {
      map.set(id, getLocationStats(id, locations, source));
    }
    return map;
  });

  statsFor = (loc: Location): LocationStats | null =>
    this.statsById().get(loc.id) ?? null;

  readonly location   = computed(() => this.store.items().find((l) => l.id === this.id()) ?? null);
  readonly breadcrumb = computed(() => getAncestors(this.id(), this.store.items()));
  readonly children   = computed(() => getChildren(this.id(), this.store.items()));
  readonly devices    = computed(() => DEVICES_MOCK.filter((d) => d.id_enviroment === this.id()));
  readonly showDevices = computed(() => this.children().length === 0 || this.devices().length > 0);

  pageSize = input(3);
  private isSmall = mediaQuery('(max-width: 767px)');
  private isMid     = mediaQuery('(max-width: 1279px)');

  effectivePageSize = computed(() => {
    if (this.isSmall()) return 1;
    if (this.isMid()) return Math.min(2, this.pageSize());
    return this.pageSize();
  });

  pagination = paginate(this.children, this.effectivePageSize);

  actionLabel = (loc: Location) => getActionLabel(loc.id, this.store.items());

  newLocation(): void {
    this.openDialog(null, this.id());
  }

  updateLocation(location: Location): void {
    this.openDialog(location);
  }

  deleteLocation(location: Location): void {
    const message = this.translate.instant('LOCATIONS.DELETE.CONFIRM');
    if (!confirm(message)) return;
    this.store.remove(location.id!);
  }

  private openDialog(location: Location | null, parentId: number | null = null): void {
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
            this.store.update(editingId, patch);
            return of({ ...location!, ...patch, id: editingId }).pipe(delay(3000));
          }

          const created: Location = {
            id: this.store.nextId(),
            name: v.name,
            description: v.description ?? '',
            parentId,
          };
          this.store.add(created);
          return of(created).pipe(delay(3000));
        },
      })
      .closed.subscribe();
  }
}
