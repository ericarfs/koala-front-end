import { Component, inject } from '@angular/core';
import { of, switchMap, throwError } from 'rxjs';
import { DeviceType } from '../../shared/interfaces/device-type';
import { ActionButtons } from '@shared/components/action-buttons/action-buttons';
import { DialogService } from '@shared/components/dialogs/dialogs.service';
import { ContentLayout } from '@shared/layouts/content/content';
import { TranslocoPipe } from '@jsverse/transloco';
import { DeviceTypeStore } from '@shared/domain/device-type/stores/device-type';

@Component({
  imports: [ContentLayout, ActionButtons, TranslocoPipe],
  selector: 'app-device-type',
  styleUrl: './device-types.css',
  templateUrl: './device-types.html',
})
export class DeviceTypes {
  private readonly formDialog = inject(DialogService);
  private readonly store = inject(DeviceTypeStore);

  readonly deviceTypes = this.store.items;

  constructor() {
    this.store.load();
  }

  private openSensorDialog(sensor?: DeviceType): void {
    const editingId = sensor?.id ?? null;
    const isEdit = editingId != null;

    this.formDialog
      .open<DeviceType>({
        title: isEdit ? 'SENSORS.EDIT.TITLE' : 'SENSORS.ADD.TITLE',
        subtitle: isEdit ? 'SENSORS.EDIT.SUBTITLE' : 'SENSORS.ADD.SUBTITLE',
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
        initialValues: sensor
          ? { name: sensor.name, description: sensor.description }
          : undefined,

        onSubmit: (values) => {
          const v = values as { name: string; description?: string };
          const patch = {
            name: v.name,
            description: v.description ?? '',
          };

          const op$ = editingId != null
            ? this.store.update(editingId, patch)
            : this.store.add(patch);

          return op$.pipe(
            switchMap((res) =>
              res.ok
                ? of(res.data)
                : throwError(() => 'COMMON.ERRORS.NOT_FOUND'),
            ),
          );
        },
      })
      .closed.subscribe();
  }

  newSensor(): void {
    this.openSensorDialog();
  }

  updateSensor(sensor: DeviceType) {
    this.openSensorDialog(sensor);
  }

  deleteSensor(sensor: DeviceType): void {
    this.store.remove(sensor.id).subscribe({
      next: (res) => {
        if (!res.ok) {
          // TODO: toast de erro
        }
      },
      error: (err) => console.error('[DeviceTypes] delete failed', err),
    });
  }
}
