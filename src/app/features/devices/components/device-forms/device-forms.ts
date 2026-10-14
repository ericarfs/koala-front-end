import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { ContentLayout } from '@shared/layouts/content/content';
import { DEVICE_TYPES_MOCK } from '../../../../mocks/device-types';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LocationTreeSelect } from '@shared/domain/location/location-tree-select';
import { ChipSelect } from '@shared/domain/monitoring/components/chip-select';
import { Input } from '@shared/components/input/input';

@Component({
  imports: [ReactiveFormsModule, ContentLayout, TranslocoPipe, LocationTreeSelect, ChipSelect, Input],
  selector: 'app-device-forms',
  styleUrl: './device-forms.css',
  templateUrl: './device-forms.html',
})
export class DeviceForms implements OnInit {
  private route = inject(ActivatedRoute);
  title = "Adicionar dispositivo";

  deviceId: number | null = null;
  editing = false;
  loading = false;

  readonly deviceTypeOptions = DEVICE_TYPES_MOCK;

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

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      this.title = "Editar dispositivo"
      this.editing = true;
      this.deviceId = Number(id);
    }
  }
}
