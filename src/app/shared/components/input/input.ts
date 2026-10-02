import { Component, Input, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';

let nextId = 0;

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [TranslatePipe],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true,
    },
  ],
  template: `
    <label [for]="inputId" class="font-medium text-neutral block text-sm mb-1.5">{{ label | translate}}</label>
    <div class="relative">
      @if (type === 'textarea') {
        <textarea
          [id]="inputId"
          [disabled]="disabled"
          [rows]="rows ?? 3"
          class="w-full border border-outline bg-container rounded-md px-3 py-2 text-sm
                 focus:outline-none focus:border-none focus:ring-1 focus:ring-primary
                 resize-none"
          [placeholder]="placeholder | translate"
          [value]="value"
          (input)="onInput($event)"
          (blur)="onBlur()"
        ></textarea>
      } @else {
        <input
          [id]="inputId"
          [type]="type"
          [disabled]="disabled"
          class="w-full h-10 border border-outline bg-container rounded-md px-3 pr-10 text-sm
                 focus:outline-none focus:border-none focus:ring-1 focus:ring-primary"
          [placeholder]="placeholder | translate"
          [value]="value"
          (input)="onInput($event)"
          (blur)="onBlur()"
        />
      }
      <ng-content></ng-content>
    </div>
    @if (errorMessage) {
      <p class="text-xs text-red-500 -mt-3 mb-3">{{ errorMessage | translate }}</p>
    }
  `,
})
export class InputComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() placeholder = '';
  @Input() type: 'text' | 'password' | 'number' | 'email' | 'textarea' = 'text';
  @Input() rows: number | undefined;
  @Input() errorMessage = '';

  protected readonly inputId = `app-input-${nextId++}`;

  value = '';
  disabled = false;

  private onChange = (v: string) => {};
  private onTouched = () => {};

  writeValue(v: string | null) { this.value = v ?? ''; }
  registerOnChange(fn: (v: string) => void) { this.onChange = fn; }
  registerOnTouched(fn: () => void) { this.onTouched = fn; }
  setDisabledState(d: boolean) { this.disabled = d; }

  onInput(e: Event) {
    const v = (e.target as HTMLInputElement | HTMLTextAreaElement).value;
    this.value = v;
    this.onChange(v);
  }

  onBlur() { this.onTouched(); }
}
