import {
  Component, computed, effect, inject, input, signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TranslocoPipe } from '@jsverse/transloco';
import { rxResource } from '@angular/core/rxjs-interop';
import { FirmwareService } from '@shared/domain/device/services/firmware';
import { DeviceStore } from '@shared/domain/device/stores/device-store';
import { Firmware, FirmwareUpdateProgress } from '@shared/interfaces/firmware';

@Component({
  selector: 'app-device-firmware-section',
  imports: [CommonModule, ReactiveFormsModule, TranslocoPipe],
  template: `
    <div class="flex flex-col gap-4 border-t border-outline pt-4">
      @if (firmwaresResource.isLoading()) {
        <div class="flex flex-col gap-3 animate-pulse">
          <div class="h-10 w-full bg-neutral/10 rounded-md"></div>
          <div class="h-10 w-full bg-neutral/10 rounded-md"></div>
          <div class="h-10 w-40 bg-neutral/10 rounded-md"></div>
        </div>
      } @else {
        <div class="flex flex-wrap gap-3">
          <div class="flex flex-col gap-1 flex-1 min-w-60">
            <label for="firmware-name" class="text-sm text-neutral font-medium">
              {{ 'DEVICES.FIRMWARE.TITLE' | transloco }}
            </label>
            <select
              id="firmware-name"
              [formControl]="firmwareForm.controls.name"
              class="h-10 border border-outline rounded-md px-3 bg-container text-default"
            >
              @for (name of firmwareNames(); track name) {
                <option [value]="name">{{ name }}</option>
              }
            </select>
          </div>

          <div class="flex flex-col gap-1 w-40">
            <label for="firmware-version" class="text-sm text-neutral font-medium">
              {{ 'DEVICES.FIRMWARE.VERSION' | transloco }}
            </label>
            <select
              id="firmware-version"
              [formControl]="firmwareForm.controls.version"
              class="h-10 border border-outline rounded-md px-3 bg-container text-default"
            >
              @for (v of firmwareVersions(); track v) {
                <option [value]="v">{{ v }}</option>
              }
            </select>
          </div>
        </div>

        @if (progress(); as p) {
          <div class="relative w-full h-7 bg-container border border-outline rounded-md overflow-hidden">
            <div
              class="h-full transition-all"
              [class.bg-success]="p.status === 'success'"
              [class.bg-primary]="p.status === 'progress'"
              [style.width.%]="progressValue()"
            ></div>
            <span class="absolute inset-0 flex items-center justify-center text-sm font-medium">
              {{ p.message }}
            </span>
          </div>
        }

        <div class="flex justify-center">
          <button
            type="button"
            (click)="updateFirmware()"
            [disabled]="!canUpdate()"
            class="px-4 py-2 rounded-md bg-primary text-primary-foreground font-medium disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {{ 'DEVICES.FIRMWARE.UPDATE' | transloco }}
          </button>
        </div>
      }
    </div>
  `,
  host: { class: 'contents' },
})
export class DeviceFirmwareSection {
  private readonly firmwareService = inject(FirmwareService);
  private readonly deviceStore = inject(DeviceStore);

  readonly deviceId = input.required<number>();

  readonly firmwareForm = new FormGroup({
    name: new FormControl<string>('', { nonNullable: true }),
    version: new FormControl<string>('', { nonNullable: true }),
  });

  private readonly selectedName = signal<string>('');
  private readonly selectedVersion = signal<string>('');

  readonly progress = signal<FirmwareUpdateProgress | null>(null);

  readonly firmwaresResource = rxResource({
    stream: () => this.firmwareService.findAll(),
  });

  readonly firmwares = computed<Firmware[]>(() => this.firmwaresResource.value() ?? []);

  readonly firmwareNames = computed(() =>
    Array.from(new Set(this.firmwares().map((f) => f.name))),
  );

  readonly firmwareVersions = computed(() => {
    const name = this.selectedName();
    return this.firmwares()
      .filter((f) => f.name === name)
      .map((f) => f.version)
      .reverse();
  });

  readonly progressValue = computed(() => {
    const p = this.progress();
    if (!p) return 0;
    const n = Number(p.message);
    return Number.isFinite(n) ? n : p.status === 'success' ? 100 : 0;
  });

  readonly canUpdate = computed<boolean>(() => {
    if (this.progress()?.status === 'progress') return false;

    const name = this.selectedName();
    const version = this.selectedVersion();
    if (!name || !version) return false;

    const current = this.currentFirmware();
    if (!current) return true;

    return current.name !== name || current.version !== version;
  });

  private readonly currentFirmware = computed<Firmware | null>(() => {
    const id = this.deviceId();
    const device = this.deviceStore.items().find((d) => d.id === id);
    const fwId = device?.firmware_id;
    if (fwId == null) return null;
    return this.firmwares().find((f) => f.id === fwId) ?? null;
  });

  private _initializedForDevice: number | null = null;

  constructor() {
    // Usuário troca o nome → sincroniza signal + reseta versão
    this.firmwareForm.controls.name.valueChanges.subscribe((name) => {
      this.selectedName.set(name);
      const versions = this.firmwares()
        .filter((f) => f.name === name)
        .map((f) => f.version)
        .reverse();
      const nextVersion = versions[0] ?? '';
      this.firmwareForm.controls.version.setValue(nextVersion, { emitEvent: false });
      this.selectedVersion.set(nextVersion);
    });

    // Usuário troca a versão → sincroniza signal
    this.firmwareForm.controls.version.valueChanges.subscribe((version) => {
      this.selectedVersion.set(version);
    });

    // Inicializa o form SÓ uma vez por device
    effect(() => {
      const id = this.deviceId();

      // Já inicializou esse device? Sai.
      if (this._initializedForDevice === id) return;

      const current = this.currentFirmware();
      if (!current) return;

      this._initializedForDevice = id;

      this.selectedName.set(current.name);
      this.selectedVersion.set(current.version);

      this.firmwareForm.patchValue(
        { name: current.name, version: current.version },
        { emitEvent: false },
      );
    });
}

  updateFirmware(): void {
    const deviceId = this.deviceId();
    const name = this.selectedName();
    const version = this.selectedVersion();

    const target = this.firmwares().find((f) => f.name === name && f.version === version);
    if (!target) return;

    this.progress.set({ status: 'progress', message: '0' });

    this.firmwareService.updateDeviceFirmware(deviceId, target.id).subscribe({
      next: (res) => {
        if (res.status !== 'ok' || !res.sessionId) {
          this.progress.set({ status: 'error', message: res.message });
          return;
        }
        this.firmwareService.deviceUpdateProgress(res.sessionId).subscribe({
          next: (p) => this.progress.set(p),
          error: () => this.progress.set({ status: 'error', message: 'SSE failed' }),
        });
      },
      error: () => {
        this.progress.set({ status: 'error', message: 'Update failed' });
      },
    });
  }
}
