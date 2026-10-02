import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ControlMode, ControlData, ControlResult } from './control-form-dialog.types';
import { finalize } from 'rxjs';


@Component({
  selector: 'app-control-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-container border-2 border-outline rounded-md shadow-xl w-full max-w-md p-6 flex flex-col gap-4">

      <header>
        <h2 class="text-lg font-semibold text-default">Controle de dispositivos</h2>
        @if (data.locationName) {
          <p class="text-sm text-neutral mt-1">Ambiente: {{ data.locationName }}</p>
        }
      </header>

      <form (ngSubmit)="submit()" class="flex flex-col overflow-y-auto gap-4">
        <div class="flex flex-col items-center gap-1">
          <div class="flex items-center gap-4 [&>button]:cursor-pointer">
            <button
              type="button"
              (click)="decrementTemp()"
              class="w-8 h-8 rounded-full border border-outline text-lg hover:bg-neutral/10 transition-colors"
            >−</button>

            <span class="text-3xl font-bold text-default min-w-30 text-center">
              {{ temperature() }}°C
            </span>

            <button
              type="button"
              (click)="incrementTemp()"
              class="w-8 h-8 rounded-full border border-outline text-lg hover:bg-neutral/10 transition-colors"
            >+</button>
          </div>
          <p class="text-xs text-neutral">Temperatura alvo</p>
        </div>

        <div class="flex flex-col flex-wrap justify-between gap-1">
          <span class="text-xs text-neutral font-semibold">Modo</span>
          <div class="flex bg-neutral/10 rounded-sm">
            @for (m of modes; track m.value) {
              <button
                type="button"
                (click)="mode.set(m.value)"
                [class]="
                  mode() === m.value
                    ? 'bg-container text-default font-semibold'
                    : 'text-neutral hover:text-default'
                "
                class="first:rounded-l-sm last:rounded-r-sm flex-1 p-2 text-xs border border-outline transition-colors cursor-pointer"
              >
                {{ m.label }}
              </button>
            }
          </div>
        </div>

        <div class="flex justify-between items-center">
          <span class="text-sm text-neutral font-medium flex items-center gap-2">
            <i class="fa-solid fa-power-off"></i>
            {{ enabled() ? 'Ligado' : 'Desligado' }}
          </span>

          <button
            type="button"
            (click)="enabled.set(!enabled())"
            [class]="enabled() ? 'bg-secondary' : 'bg-neutral/30'"
            class="relative w-11 h-6 rounded-full transition-colors cursor-pointer"
          >
            <span
              [class]="enabled() ? 'translate-x-5' : 'translate-x-0'"
              class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform"
            ></span>
          </button>
        </div>

        <div class="flex justify-end gap-2 mt-2 shrink-0">
          <button
            type="submit"
            [disabled]="loading()"
            class="btn bg-primary text-white hover:bg-primary-details disabled:opacity-50 disabled:cursor-not-allowed
            inline-flex items-center justify-center gap-2"
          >
            @if (loading()) {
              <i class="fa-solid fa-spinner fa-spin"></i>
              <span class="animate-pulse"> Enviando...</span>
            } @else {
              <span>Enviar</span>
            }
          </button>
        </div>
      </form>
    </div>
  `,
})
export class ControlDialogComponent {
  private readonly dialogRef = inject<DialogRef<ControlResult>>(DialogRef);
  protected readonly data = inject<ControlData>(DIALOG_DATA);

  protected readonly temperature = signal(this.data.temperature ?? 22);
  protected readonly mode = signal<ControlMode>(this.data.mode ?? ControlMode.AUTO);
  protected readonly enabled = signal(this.data.enabled ?? false);

  protected readonly loading = signal(false);

  protected readonly modes: { value: ControlMode; label: string }[] = [
    { value: ControlMode.AUTO, label: 'Auto' },
    { value: ControlMode.COOL, label: 'Cool' },
    { value: ControlMode.FAN, label: 'Fan' },
    { value: ControlMode.HEAT,  label: 'Heat' },
  ];

  incrementTemp() { this.temperature.update(t => Math.min(t + 1, 35)); }
  decrementTemp() { this.temperature.update(t => Math.max(t - 1, 10)); }

  submit(): void {
    this.loading.set(true);

    const values: ControlResult = {
      locationName: this.data.locationName,
      temperature: this.temperature(),
      mode: this.mode(),
      enabled: this.enabled(),
    };

    this.data.onSubmit(values)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => this.dialogRef.close(values),
        error: (err) => console.error(err),
      });
  }

  close() { this.dialogRef.close(); }
}
