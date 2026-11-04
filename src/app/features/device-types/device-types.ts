import { Component, inject } from '@angular/core';
import { DeviceType } from '../../shared/interfaces/device-type';
import { ActionButtons } from '@shared/components/action-buttons/action-buttons';
import { ContentLayout } from '@shared/layouts/content/content';
import { TranslocoPipe } from '@jsverse/transloco';
import { DeviceTypeStore } from '@shared/domains/device-type/stores/device-type';
import { DeviceTypesActions } from './components/device-type-actions';
import { noop } from 'rxjs';

@Component({
  imports: [ContentLayout, ActionButtons, TranslocoPipe],
  selector: 'app-device-type',
  styleUrl: './device-types.css',
  templateUrl: './device-types.html',
})
export class DeviceTypes {
   private readonly actions = inject(DeviceTypesActions);

  readonly store = inject(DeviceTypeStore);
  readonly deviceTypes = this.store.items;

  constructor() {
    this.store.load();
  }

  newSensor(): void {
    this.actions.openCreate();
  }

  updateSensor(sensor: DeviceType): void {
    this.actions.openEdit(sensor);
  }

  deleteSensor(id: number): void {
    this.actions.remove(id).subscribe({ error: () => noop });
  }
}
