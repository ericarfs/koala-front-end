import { CommonModule } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map, of, switchMap, throwError } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { getActionLabel, getAncestors, getChildren } from '../../../../shared/domain/location/location-tree';
import { ContentLayout } from '@shared/layouts/content/content';
import { DeviceList } from '@shared/domain/device/components/device-list';
import { LocationCard } from '@features/location/components/location-card';
import { LocationStore, MutationError } from '@shared/domain/location/stores/location-store';
import { DialogService } from '@shared/components/dialogs/dialogs.service';
import { Location } from '@shared/interfaces/location';
import { TranslocoPipe } from '@jsverse/transloco';
import { Paginator} from '@shared/components/pagination/paginator';
import { paginate } from '@shared/utils/paginate';
import { mediaQuery } from '@shared/utils/media-query';
import { DeviceStore } from '@shared/domain/device/stores/device-store';
import { DeviceTypeStore } from '@shared/domain/device-type/stores/device-type';
import { LocationStatsStore } from '@shared/domain/location/stores/location-stats-store';
import { LocationCardSkeleton } from '@features/location/components/location-card-skeleton';


@Component({
  selector: 'app-location-details',
  standalone: true,
  imports: [CommonModule, RouterLink, ContentLayout, DeviceList, LocationCard, LocationCardSkeleton, Paginator, TranslocoPipe],
  templateUrl: './location-details.html',
  host: {
    class: 'block flex-1',
  },
})
export class LocationDetails {
  private readonly route = inject(ActivatedRoute);
  private readonly formDialog = inject(DialogService);
  private readonly deviceTypeStore = inject(DeviceTypeStore);

  readonly deviceStore = inject(DeviceStore);
  readonly statsStore = inject(LocationStatsStore);
  readonly store = inject(LocationStore);

  private readonly id = toSignal(
    this.route.paramMap.pipe(map((p) => Number(p.get('id')))),
    { initialValue: NaN }
  );

  readonly location   = computed(() => this.store.items().find((l) => l.id === this.id()) ?? null);
  readonly breadcrumb = computed(() => getAncestors(this.id(), this.store.items()));
  readonly children   = computed(() => getChildren(this.id(), this.store.items()));
  readonly devices = computed(() => this.deviceStore.items().filter((d) => d.id_enviroment === this.id()));
  readonly showDevices = computed(() => this.children().length === 0 || this.devices().length > 0 || this.deviceStore.loading());

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

  constructor() {
    this.deviceTypeStore.load();
  }

  newLocation(): void {
    this.openDialog(this.id());
  }

  private openDialog(parentId: number | null = null): void {
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
            parentId,
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
