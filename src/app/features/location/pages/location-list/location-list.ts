import { Component, computed, inject, input } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { delay, of, tap } from 'rxjs';
import { ContentLayoutComponent } from '@shared/layouts/content/content';
import { LocationCardComponent } from '../../components/location-card';
import { PaginatorComponent } from '@shared/components/pagination/paginator';
import { FormDialogService } from '@shared/components/form-dialog/form-dialog.service';
import { LocationStore } from '@shared/domain/location/location-store';
import { getChildren } from '@shared/domain/location/location-tree';
import { paginate } from '@shared/utils/paginate';
import { Location } from '@shared/interfaces/location';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';


@Component({
  imports: [ContentLayoutComponent, LocationCardComponent, PaginatorComponent, TranslatePipe],
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

  readonly locations = computed(() => getChildren(null, this.store.items()));
  actionLabel = (loc: Location) => {
    const count = getChildren(loc.id, this.store.items()).length;
    return `${count} locais`;
  };

  pageSize = input(8);
  pagination = paginate(this.locations, this.pageSize);

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
