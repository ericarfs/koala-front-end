import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { delay, of, tap } from 'rxjs';
import { DeviceType } from '../../shared/interfaces/device-type';
import { DEVICE_TYPES_MOCK } from '../../mocks/device-types';
import { ActionButtonsComponent } from '@shared/components/action-buttons/action-buttons';
import { FormDialogService } from '@shared/components/form-dialog/form-dialog.service';
import { ContentLayoutComponent } from '@shared/layouts/content/content';

@Component({
  imports: [ContentLayoutComponent, ActionButtonsComponent],
  selector: 'app-device-type',
  styleUrl: './device-types.css',
  templateUrl: './device-types.html',
})
export class DeviceTypes {
  private readonly http = inject(HttpClient);
  private readonly formDialog = inject(FormDialogService);

  readonly deviceTypes = signal<DeviceType[]>(DEVICE_TYPES_MOCK);;

  private openSensorDialog(sensor?: DeviceType): void {
    const editingId = sensor?.id ?? null;
    const isEdit = editingId != null;

    this.formDialog
      .open<DeviceType>({
        title: isEdit ? 'Editar sensor' : 'Novo sensor',
        subtitle: isEdit
          ? 'Altere os dados do sensor'
          : 'Preencha os dados do sensor',
        submitLabel: isEdit ? 'Salvar' : 'Criar',

        fields: [
          { key: 'name',        label: 'Nome',      placeholder: 'Ex: Temperature', required: true },
          { key: 'description', label: 'Descrição', placeholder: 'Opcional', type: 'textarea', rows: 3 },
        ],

        initialValues: sensor
          ? { name: sensor.name, description: sensor.description }
          : undefined,

        onSubmit: (values) => {
          const v = values as { name: string; description?: string };

          if (editingId != null) {
            const updated: DeviceType = {
              ...sensor!,
              id: editingId,
              name: v.name,
              description: v.description ?? '',
            };

            return of(updated).pipe(
              delay(3000),
              tap((s) => this.deviceTypes.update((list) =>
                list.map((item) => (item.id === s.id ? s : item))
              )),
            );
          }

          const created: DeviceType = {
            id: this.nextSensorId(),
            name: v.name,
            description: v.description ?? '',
          };

          return of(created).pipe(
            delay(3000),
            tap((s) => this.deviceTypes.update((list) => [...list, s])),
          );
        },
      })
      .closed.subscribe();
  }

  private nextSensorId(): number {
    const ids = this.deviceTypes().map((s) => s.id ?? 0);
    return ids.length ? Math.max(...ids) + 1 : 1;
  }

  newSensor(): void {
    this.openSensorDialog();
  }

  updateSensor(sensor: DeviceType) {
    this.openSensorDialog(sensor);
  }

  deleteSensor(id: any) {
    if (!confirm('Tem certeza que deseja excluir este sensor?')) return;
    this.deviceTypes.update(sensors => sensors.filter(s => s.id !== id));
  }
}
