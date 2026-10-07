import { Component, ElementRef, forwardRef, input, viewChild } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { noop } from 'rxjs';

let nextId = 0;

type InputValue = string | File | null;

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [TranslatePipe],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => Input),
      multi: true,
    },
  ],
  template: `
    <label [for]="inputId" class="font-medium text-neutral block text-sm mb-1.5">{{ label() | translate }}</label>

    @if (type() === 'file') {
      <input
        #fileInput
        [id]="inputId"
        type="file"
        class="peer sr-only"
        [attr.accept]="accept()"
        [disabled]="disabled"
        (change)="onFileChange($event)"
      />
      <label
        [for]="inputId"
        class="flex flex-col items-center justify-center gap-3 w-full rounded-lg px-6 py-10 text-center
               border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-primary"
        [class]="dragging
          ? 'border-dashed border-primary bg-primary/10'
          : 'border-outline bg-container'"
        [class.cursor-pointer]="!disabled"
        [class.opacity-60]="disabled"
        [class.cursor-not-allowed]="disabled"
        (dragover)="onDragOver($event)"
        (dragleave)="dragging = false"
        (drop)="onDrop($event)"
      >
        <span class="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary border">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24"
               stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round"
                  d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8l-5-5z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M14 3v5h5" />
          </svg>
        </span>

        @if (fileName) {
          <span class="text-sm font-semibold text-neutral break-all">{{ fileName }}</span>
          <span class="text-xs text-neutral/70">{{ 'COMMON.FORM.FILE.HELPER' | translate }}</span>
        } @else {
          <span class="text-sm font-semibold text-neutral">
            {{ 'COMMON.FORM.FILE.DRAG_FILE' | translate }}
          </span>
          <span class="text-xs text-neutral/70">
            {{ 'COMMON.FORM.FILE.OR' | translate }}
            <span class="text-primary underline">{{ 'COMMON.FORM.FILE.CHOOSE_FILE' | translate }}</span>
          </span>
        }
      </label>
    } @else {
      <div class="relative">
        @if (type() === 'textarea') {
          <textarea
            [id]="inputId"
            [disabled]="disabled"
            [rows]="rows() ?? 3"
            class="w-full border border-outline bg-container rounded-md px-3 py-2 text-sm
                   focus:outline-none focus:border-none focus:ring-1 focus:ring-primary
                   resize-none"
            [placeholder]="placeholder() | translate"
            [value]="textValue"
            (input)="onInput($event)"
            (blur)="onBlur()"
          ></textarea>
        } @else {
          <input
            [id]="inputId"
            [type]="type()"
            [disabled]="disabled"
            class="w-full h-10 border border-outline bg-container rounded-md px-3 pr-10 text-sm
                   focus:outline-none focus:border-none focus:ring-1 focus:ring-primary"
            [placeholder]="placeholder() | translate"
            [value]="textValue"
            (input)="onInput($event)"
            (blur)="onBlur()"
          />
        }
        <ng-content></ng-content>
      </div>
    }

    @if (errorMessage() || fileError) {
      <p class="text-xs text-red-500 mb-3" [class]="type() === 'file' ? 'mt-1.5' : '-mt-3'">
        {{ errorMessage() || fileError | translate }}
      </p>
    }
  `,
})
export class Input implements ControlValueAccessor {

  label = input('');
  placeholder = input('');
  type = input<'text' | 'password' | 'number' | 'email' | 'textarea' | 'file'>('text');
  rows = input<number | undefined>(undefined);
  errorMessage = input('');
  accept = input<string | undefined>(undefined); // ex.: '.bin'

  private fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');

  protected readonly inputId = `app-input-${nextId++}`;

  textValue = '';
  fileName = '';
  fileError = '';
  dragging = false;
  disabled = false;

  private onChange: (v: InputValue) => void = noop;
  private onTouched: () => void = noop;

  writeValue(v: InputValue) {
    if (v instanceof File) {
      this.fileName = v.name;
      return;
    }
    this.textValue = v ?? '';
    if (!v) this.clearFile(); // reset do form limpa o arquivo
  }

  registerOnChange(fn: (v: InputValue) => void) { this.onChange = fn; }
  registerOnTouched(fn: () => void) { this.onTouched = fn; }
  setDisabledState(d: boolean) { this.disabled = d; }

  // ---------- texto ----------
  onInput(e: Event) {
    const v = (e.target as HTMLInputElement | HTMLTextAreaElement).value;
    this.textValue = v;
    this.onChange(v);
  }

  onBlur() { this.onTouched(); }

  // ---------- arquivo ----------
  onDragOver(e: DragEvent) {
    e.preventDefault(); // necessário para o drop funcionar
    if (!this.disabled) this.dragging = true;
  }

  onDrop(e: DragEvent) {
    e.preventDefault();
    this.dragging = false;
    if (this.disabled) return;
    const file = e.dataTransfer?.files?.[0];
    if (file) this.setFile(file);
  }

  onFileChange(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) this.setFile(file);
  }

  private setFile(file: File) {
    this.fileError = '';

    if (!this.isAccepted(file)) {
      this.clearFile();
      this.fileError = 'Tipo de arquivo inválido';
      this.onChange(null);
      this.onTouched();
      return;
    }

    this.fileName = file.name;
    this.onChange(file);
    this.onTouched();
  }

  private clearFile() {
    this.fileName = '';
    this.fileError = '';
    const el = this.fileInput()?.nativeElement;
    if (el) el.value = ''; // permite selecionar o mesmo arquivo de novo
  }

  private isAccepted(file: File): boolean {
    const accept = this.accept();
    if (!accept) return true;

    const name = file.name.toLowerCase();
    return accept
      .split(',')
      .map(r => r.trim().toLowerCase())
      .filter(Boolean)
      .some(rule =>
        rule.startsWith('.')
          ? name.endsWith(rule)
          : rule.endsWith('/*')
            ? file.type.startsWith(rule.slice(0, -1))
            : file.type === rule
      );
  }
}
