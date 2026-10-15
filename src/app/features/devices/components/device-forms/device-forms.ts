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
  private readonly mappingService = inject(DeviceMappingService);

  readonly deviceTypeOptions = this.deviceTypeStore.items;

  title = "Adicionar dispositivo";
  deviceId: number | null = null;
  editing = false;
  loading = false;
  submitting = signal(false);

  readonly deviceForm = new FormGroup({
    location: new FormControl<number | null>(null, Validators.required),
    name: new FormControl<string | null>(null, Validators.required),
    mac: new FormControl<string | null>(null, Validators.required),
    description: new FormControl<string | null>(null, Validators.required),
  });

  readonly selectedTypes = signal<number[]>([]);
  onTypesChange(types: number[]): void {
    this.selectedTypes.set(types);
  }

  readonly locations = this.locationStore.items;

  constructor() {
    this.deviceTypeStore.load();

    effect(() => {
      const id = this.deviceId;
      if (!id) return;

      const device = this.deviceStore.items().find((d) => d.id === id);
      if (!device) return;

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

      this.mappingService.getTypesForDevice(this.deviceId).subscribe((types) => {
        this.selectedTypes.set(types.map(t => t.id));
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

    op$.subscribe({
      next: (res) => {
        this.submitting.set(false);
        if (res.ok) {
          // TODO: salvar mappings de sensor/atuador (DeviceMappingService)
          //       quando essa parte for implementada
          this.routerLocation.back();
        } else {
          // TODO: toast de erro
        }
      },
      error: (err) => {
        console.error('[DeviceForms] save failed', err);
        this.submitting.set(false);
        // TODO: toast de erro
      },
    });
  }

  cancel(): void {
    this.routerLocation.back();
  }
}
