import { InputComponent } from '../../input/input';
import { FormDialogData } from './entity-form-dialog.types';
// form-dialog.component.ts
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Observable, finalize } from 'rxjs';


@Component({
  selector: 'app-form-dialog',
  standalone: true,
  imports: [FormsModule, InputComponent],
  template: `
  <div class="bg-container border-2 border-outline rounded-md shadow-xl w-full max-w-md
              max-h-[90vh] gap-4 flex flex-col overflow-hidden">

    <header class="p-6 pb-0">
      <h2 class="text-lg font-semibold text-default">{{ data.title }}</h2>
      @if (data.subtitle) {
        <p class="text-sm text-neutral mt-1">{{ data.subtitle }}</p>
      }
    </header>

    <form (ngSubmit)="submit()" class="flex flex-col overflow-y-auto p-6 pt-0">
      @for (field of data.fields; track field.key) {
        <app-input
          [(ngModel)]="values[field.key]"
          [name]="field.key"
          [label]="field.label"
          [placeholder]="field.placeholder ?? ''"
          [type]="field.type ?? 'text'"
          [rows]="field.rows ?? 3"
          class="mb-4"
        />
      }

      <div class="flex justify-end gap-2 mt-2 shrink-0">
        <button
          type="submit"
          [disabled]="loading()"
          class="btn bg-primary text-white hover:bg-primary-details disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
        >
          @if (loading()) {
            <i class="fa-solid fa-spinner fa-spin"></i>
            <span class="animate-pulse"> Enviando...</span>
          } @else {
            <span>{{ (data.submitLabel ?? 'Salvar') }}</span>
          }
        </button>

        <button
          type="button"
          (click)="close()"
          class="btn border border-outline text-sm font-medium hover:bg-neutral/20"
        >
          {{ data.cancelLabel ?? 'Cancelar' }}
        </button>
      </div>
    </form>
  </div>
`,
})
export class FormDialogComponent {
  private readonly dialogRef = inject<DialogRef<void>>(DialogRef);
  protected readonly data = inject<FormDialogData>(DIALOG_DATA);

  protected readonly loading = signal(false);

  protected values: Record<string, unknown> = {
    ...(this.data.initialValues ?? {}),
  };

  submit(): void {
    this.loading.set(true);

    this.data.onSubmit(this.values)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => this.dialogRef.close(),
        error: (err) => {
          console.error(err);
        },
      });
  }

  close(): void {
    this.dialogRef.close();
  }
}
