import { Injectable, inject } from '@angular/core';
import { DialogService } from '@shared/components/dialogs/dialogs.service';
import { DeviceTypeStore } from '@shared/domain/device-type/stores/device-type';
import { CrudActions } from '@shared/domain/crud/crud-actions';
import { DeviceType } from '@shared/interfaces/device-type';
import { DEVICE_TYPE_ADD_DIALOG, DEVICE_TYPE_EDIT_DIALOG } from './device-type-form';

@Injectable({ providedIn: 'root' })
export class DeviceTypesActions extends CrudActions<DeviceType> {
  private readonly dialog = inject(DialogService);
  protected override readonly store = inject(DeviceTypeStore);

  openCreate(): void {
    this.dialog
      .open<DeviceType>({
        ...DEVICE_TYPE_ADD_DIALOG,
        onSubmit: (values) => {
          const v = values as { name: string; icon: string; description?: string };
          return this.unwrap(
            this.store.add({
              name: v.name,
              icon: v.icon,
              description: v.description ?? '',
            }),
            'COMMON.TOASTS.CREATED',
          );
        },
      })
      .closed.subscribe();
  }

  openEdit(sensor: DeviceType): void {
    this.dialog
      .open<DeviceType>({
        ...DEVICE_TYPE_EDIT_DIALOG,
        initialValues: {
          name: sensor.name,
          icon: sensor.icon,
          description: sensor.description,
        },
        onSubmit: (values) => {
          const v = values as { name: string; icon: string; description?: string };
          return this.unwrap(
            this.store.update(sensor.id, {
              name: v.name,
              icon: v.icon,
              description: v.description ?? '',
            }),
            'COMMON.TOASTS.UPDATED',
          );
        },
      })
      .closed.subscribe();
  }
}
