import { Component, effect, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Location as RouterLocation } from '@angular/common';
import { TranslocoPipe } from '@jsverse/transloco';
import { ContentLayout } from '@shared/layouts/content/content';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LocationTreeSelect } from '@shared/domain/location/location-tree-select';
import { ChipSelect } from '@shared/domain/monitoring/components/chip-select';
import { Input } from '@shared/components/input/input';
import { DeviceStore } from '@shared/domain/device/stores/device-store';
import { LocationStore } from '@shared/domain/location/stores/location-store';
import { DeviceTypeStore } from '@shared/domain/device-type/stores/device-type';
import { DeviceMappingService } from '@shared/domain/device/services/device-mapping';
import { DeviceFirmwareSection } from './device-firmware-section';
import { ActuatorStore } from '@shared/domain/actuator/stores/actuator';
import { ActuatorMappingService } from '@shared/domain/device/services/actuator-mapping';
import { forkJoin, map, Observable, of, switchMap, tap, throwError } from 'rxjs';
import { DeviceMapping } from '@shared/interfaces/device-mapping';
import { ActuatorMapping } from '@shared/interfaces/actuator-mapping';
import { NotificationService } from '@shared/services/notification';

@Component({
  imports: [ReactiveFormsModule, ContentLayout, TranslocoPipe, LocationTreeSelect, ChipSelect, Input, DeviceFirmwareSection],
  selector: 'app-device-forms',
  styleUrl: './device-forms.css',
  templateUrl: './device-forms.html',
})
export class DeviceForms implements OnInit {
  private route = inject(ActivatedRoute);
  private readonly routerLocation = inject(RouterLocation);
  private readonly deviceStore = inject(DeviceStore);
  private readonly locationStore = inject(LocationStore);
  private readonly deviceTypeStore = inject(DeviceTypeStore);
  private readonly actuatorStore = inject(ActuatorStore);
  private readonly deviceMappingService = inject(DeviceMappingService);
  private readonly actuatorMappingService = inject(ActuatorMappingService);
  private readonly notification = inject(NotificationService);

  readonly deviceTypeOptions = this.deviceTypeStore.items;
  readonly actuatorOptions = this.actuatorStore.items;

  title = "Adicionar dispositivo";
  deviceId: number | null = null;
  editing = false;
  loading = false;
  submitting = signal(false);

  readonly deviceForm = new FormGroup({
    location: new FormControl<number | null>(null, Validators.required),
    name: new FormControl<string | null>(null, Validators.required),
    mac: new FormControl<string | null>(null, Validators.required),
    description: new FormControl<string | null>(null, [
      Validators.required,
      Validators.maxLength(200),
      Validators.minLength(5),
    ]),
  });

  readonly selectedTypes = signal<number[]>([]);
  onTypesChange(types: number[]): void {
    this.selectedTypes.set(types);
  }

  readonly selectedActuators = signal<number[]>([]);
  onActuatorsChange(actuators: number[]): void {
    this.selectedActuators.set(actuators);
  }

  readonly locations = this.locationStore.items;

  constructor() {
    this.deviceTypeStore.load();
    this.actuatorStore.load();

    effect(() => {
      const id = this.deviceId;
      if (!id) return;

      const device = this.deviceStore.items().find((d) => d.id === id);
      if (!device) {
        this.routerLocation.back();
        return;
      }

      this.deviceForm.patchValue({
        location: device.id_enviroment ?? null,
        name: device.name ?? null,
        mac: device.mac,
        description: device.description ?? null,
      });
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      this.title = "Editar dispositivo"
      this.editing = true;
      this.deviceId = Number(id);

      this.deviceMappingService.getTypesForDevice(this.deviceId).subscribe((types) => {
        this.selectedTypes.set(types.map(t => t.id));
      });

      this.actuatorMappingService.getActuatorsForDevice(this.deviceId).subscribe((actuators) => {
        this.selectedActuators.set(actuators.map(t => t.id));
      });
    }
  }

  save(): void {
    if (this.deviceForm.invalid || this.submitting()) return;

    const v = this.deviceForm.getRawValue();
    const payload = {
      name: v.name!,
      mac: v.mac!,
      description: v.description!,
      id_enviroment: v.location!,
    };

    this.submitting.set(true);

    const op$ = this.editing && this.deviceId
      ? this.deviceStore.update(this.deviceId, payload)
      : this.deviceStore.add(payload);

    op$
    .pipe(
      switchMap((res) => {
        if (!res.ok) return of(res);

        const id = res.data.id;
        if (!id) {
          return throwError(() => new Error('Device saved without id'));
        }

        return this.saveMappings(id, this.selectedTypes(), this.selectedActuators()).pipe(
          map(() => res),
        );
      }),
      tap({
        next: () => this.notification.success(this.editing ? 'Updated successfully.' : 'Created successfully.'),
        error: () => this.notification.error('Failed to save. Try again later.'),
      }),
    )
    .subscribe({
      next: (res) => {
        this.submitting.set(false);
        if (res.ok) {
          this.routerLocation.back();
        } else {
          this.notification.error('Failed to save. Try again later.');
        }
      },
      error: (err) => {
        console.error('[DeviceForms] save failed', err);
        this.submitting.set(false);
        this.notification.error('Failed to save. Try again later.');
      },
    });
  }

  private saveMappings(deviceId: number, sensorIds: number[], actuatorIds: number[]): Observable<unknown> {
    const sensors: DeviceMapping[] = sensorIds.map((type_id) => ({
      device_id: deviceId,
      type_id,
    }));
    const actuators: ActuatorMapping[] = actuatorIds.map((actuator_id) => ({
      device_id: deviceId,
      actuator_id,
    }));

    return forkJoin([
      this.deviceMappingService.saveAll(deviceId, sensors),
      this.actuatorMappingService.saveAll(deviceId, actuators),
    ]);
  }

  cancel(): void {
    this.routerLocation.back();
  }
}
