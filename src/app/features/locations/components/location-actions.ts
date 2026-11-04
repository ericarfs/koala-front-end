import { Injectable, inject } from '@angular/core';
import { DialogService } from '@shared/components/dialogs/dialogs.service';
import { LocationStore } from '@shared/domains/location/stores/location-store';
import { Location } from '@shared/interfaces/location';
import { CrudActions } from '@shared/domains/crud/crud-actions';
import { MutationError } from '@shared/domains/crud/crud.types';
import { locationErrorMessage } from './location-errors';
import { LOCATION_ADD_DIALOG, LOCATION_EDIT_DIALOG } from './location-form';

@Injectable({ providedIn: 'root' })
export class LocationActions extends CrudActions<Location> {
  private readonly dialog = inject(DialogService);
  protected override readonly store = inject(LocationStore);

  protected override errorMessage(reason: MutationError): string {
    return locationErrorMessage(reason);
  }

  openCreate(parentId: number | null = null): void {
    this.dialog
      .open<Location>({
        ...LOCATION_ADD_DIALOG,
        onSubmit: (values) => {
          const v = values as { name: string; description?: string };
          const draft = {
            name: v.name,
            description: v.description ?? '',
            parentId,
          } as Omit<Location, 'id'>;
          return this.unwrap(this.store.add(draft), 'COMMON.TOASTS.CREATED');
        },
      })
      .closed.subscribe();
  }

  openEdit(location: Location): void {
    this.dialog
      .open<Location>({
        ...LOCATION_EDIT_DIALOG,
        initialValues: { name: location.name, description: location.description },
        onSubmit: (values) => {
          const v = values as { name: string; description?: string };
          const patch: Partial<Location> = {
            name: v.name,
            description: v.description ?? '',
          };
          return this.unwrap(this.store.update(location.id, patch), 'COMMON.TOASTS.UPDATED');
        },
      })
      .closed.subscribe();
  }
}
