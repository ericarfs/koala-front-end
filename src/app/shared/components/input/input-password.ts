import { InputComponent } from './input';
import { Component, input, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-input-password',
  standalone: true,
  imports: [ReactiveFormsModule, InputComponent],
  template: `
    <app-input
      [formControl]="control()"
      [type]="inputType"
      [label]="label()"
      [placeholder]="placeholder()"
      [errorMessage]="errorMessage()"
    >
      <button
        type="button"
        (click)="toggleVisibility()"
        [attr.aria-label]="visible() ? 'Ocultar senha' : 'Mostrar senha'"
        class="absolute right-1.5 top-1.5 w-7 h-7 rounded-md bg-gray-100 flex items-center justify-center text-gray-500 cursor-pointer border-0"
      >
        <i
          class="fa fa-sm"
          [class.fa-eye]="!visible()"
          [class.fa-eye-slash]="visible()"
          aria-hidden="true"
        ></i>
      </button>
    </app-input>
  `,
})
export class InputPasswordComponent {
  // 👇 Recebe o FormControl direto
  control = input.required<FormControl>();
  label = input.required<string>();
  placeholder = input.required<string>();
  errorMessage = input<string>('');

  visible = signal(false);

  toggleVisibility() {
    this.visible.update(v => !v);
  }

  get inputType(): 'text' | 'password' {
    return this.visible() ? 'text' : 'password';
  }
}
