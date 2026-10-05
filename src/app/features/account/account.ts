import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { ContentLayout } from '@shared/layouts/content/content';
import { Input } from '@shared/components/input/input';
import { InputPassword } from '@shared/components/input/input-password';
import { TranslatePipe } from '@ngx-translate/core';


interface UserForm {
  username: FormControl,
  email: FormControl
}

interface PasswordForm {
  oldPassword: FormControl,
  newPassword: FormControl,
  passwordConfirmation: FormControl
}

@Component({
  imports: [ReactiveFormsModule, ContentLayout, Input, InputPassword, TranslatePipe],
  selector: 'app-account',
  styleUrl: './account.css',
  templateUrl: './account.html',
})
export class Account {
  userForm!: FormGroup<UserForm>;
  passwordForm!: FormGroup<PasswordForm>;
  private readonly router = inject(Router);
  private readonly location = inject(Location);

  protected username = '';
  protected email = '';
  protected readonly showOldPassword = signal(false);
  protected readonly showNewPassword = signal(false);
  protected readonly showPassConfirm = signal(false);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  readonly userFormItems = [
    {
      key: 'username',
      labelKey: 'ACCOUNT.PROFILE.USERNAME',
      placeholderKey: 'ACCOUNT.PROFILE.USERNAME_PLACEHOLDER',
      type: 'text',
      icon: 'user'
    },
    {
      key: 'email',
      labelKey: 'ACCOUNT.PROFILE.EMAIL',
      placeholderKey: 'ACCOUNT.PROFILE.EMAIL_PLACEHOLDER',
      type: 'email',
      icon: 'envelope'
    },
  ] as const;

  constructor(
  ){
    this.userForm = new FormGroup({
      username: new FormControl('', [Validators.required, Validators.minLength(4)]),
      email: new FormControl('', [Validators.required, Validators.email])
    })

    this.passwordForm = new FormGroup({
      oldPassword: new FormControl('', [Validators.required, Validators.minLength(5)]),
      newPassword: new FormControl('', [Validators.required, Validators.minLength(5)]),
      passwordConfirmation: new FormControl('', [Validators.required, Validators.minLength(5)])
    })
  }

  get oldPassword() { return this.passwordForm.get('oldPassword') as FormControl; }
  get newPassword() { return this.passwordForm.get('newPassword') as FormControl; }
  get passwordConfirmation() { return this.passwordForm.get('passwordConfirmation') as FormControl; }

  async onSubmit() {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      this.error.set('Preencha usuário e senha.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);
  }

  goBack(): void {
    this.location.back();
  }

}
