import { CommonModule } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { getActionLabel, getAncestors, getChildren } from '../../../../shared/domains/location/components/location-tree';
import { ContentLayout } from '@shared/layouts/content/content';
import { DeviceList } from '@shared/domains/device/components/device-list';
import { LocationCard } from '@features/locations/components/location-card';
import { LocationStore } from '@shared/domains/location/stores/location-store';
import { Location } from '@shared/interfaces/location';
import { TranslocoPipe } from '@jsverse/transloco';
import { Paginator} from '@shared/components/pagination/paginator';
import { paginate } from '@shared/utils/paginate';
import { mediaQuery } from '@shared/utils/media-query';
import { DeviceStore } from '@shared/domains/device/stores/device-store';
import { DeviceTypeStore } from '@shared/domains/device-type/stores/device-type';
import { LocationStatsStore } from '@shared/domains/location/stores/location-stats-store';
import { LocationCardSkeleton } from '@features/locations/components/location-card-skeleton';
import { LocationActions } from '@features/locations/components/location-actions';


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
  private readonly deviceTypeStore = inject(DeviceTypeStore);
  private readonly actions = inject(LocationActions);

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

  constructor() {
    this.deviceTypeStore.load();
  }

   newLocation(): void {
    this.actions.openCreate(this.id());
  }
}
