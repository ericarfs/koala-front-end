import { NotificationService } from './../../../../shared/services/notification';
import { Component, inject, signal } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { ContentLayout } from '@shared/layouts/content/content';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AirconMode, AirconParameters } from './control-form-dialog.types';
import { finalize } from 'rxjs';
import { ActuatorService } from '@shared/domain/actuator/services/actuator';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LocationTreeSelect } from '@shared/domain/location/location-tree-select';

const MIN_TEMP = 16;
const MAX_TEMP = 27;

@Component({
  imports: [ContentLayout, ReactiveFormsModule, LocationTreeSelect, TranslocoPipe],
  selector: 'app-device-control',
  styleUrl: './device-control.css',
  templateUrl: './device-control.html',
})
export class DeviceControl {
  private readonly actuatorService = inject(ActuatorService);
  private readonly notification = inject(NotificationService);

  protected readonly temperature = signal(22);
  protected readonly mode = signal<AirconMode>(AirconMode.AUTO);
  protected readonly enabled = signal(false);

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  private lastSentAt: Date | null = null;

  protected readonly modes: { value: AirconMode; label: string }[] = [
    { value: AirconMode.AUTO, label: 'Auto' },
    { value: AirconMode.COOL, label: 'Cool' },
    { value: AirconMode.FAN, label: 'Fan' },
    { value: AirconMode.HEAT,  label: 'Heat' },
  ];

  readonly controlForm = new FormGroup({
    location: new FormControl<string | null>(null, Validators.required),
  });

  constructor() {
    this.actuatorService
      .getActuatorUpdates()
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (update) => {
          const diffMs = this.lastSentAt ? Date.now() - this.lastSentAt.getTime() : null;
          console.log(`[ControlDialog] update (${diffMs ?? '-'} ms após envio)`, update);
        },
        error: (err) => console.error('[ControlDialog] stream failed', err),
      });
  }

  incrementTemp() { this.temperature.update(t => Math.min(t + 1, MAX_TEMP)); }
  decrementTemp() { this.temperature.update(t => Math.max(t - 1, MIN_TEMP)); }

  submit(): void {
    if (this.loading()) return;
    const location_id = this.controlForm.controls.location.value;
    if (!location_id) {
      this.error.set('Ambiente não informado.');
      return;
    }

    const command: AirconParameters = {
      enviromentId: location_id,
      deviceId: null,
      mode: this.mode(),
      temperature: this.temperature(),
      power: this.enabled(),
    };

    this.error.set(null);
    this.loading.set(true);
    this.lastSentAt = new Date();

    this.actuatorService
      .sendAirconCommand(location_id, command)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => this.notification.success('Updated successfully.'),
        error: (err) => {
          console.error('[ControlDialog] send failed', err);
          this.error.set('Não foi possível enviar o comando.');
          this.notification.error('Failed to save. Try again later.');
        },
      });
  }
}
