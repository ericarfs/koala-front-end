import { Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { Location } from '@angular/common';
import { ContentLayout } from '@shared/layouts/content/content';
import { Input } from '@shared/components/input/input';
import { InputPassword } from '@shared/components/input/input-password';
import { TranslocoPipe } from '@jsverse/transloco';
import { AuthService } from '@core/auth/services/auth';
import { UserService } from '@shared/domain/user/services/user';
import { of, switchMap } from 'rxjs';
import { NotificationService } from '@shared/services/notification';

const passwordsMatch: ValidatorFn = (group) => {
  const a = group.get('newPassword')?.value;
  const b = group.get('newPasswordConfirmation')?.value;
  return a === b ? null : { passwordMismatch: true };
};

const hasUppercase: ValidatorFn = (c) => (/[A-Z]/.test(c.value ?? '') ? null : { uppercase: true });
const hasNumber: ValidatorFn = (c) => (/\d/.test(c.value ?? '') ? null : { number: true });
const hasSpecialChar: ValidatorFn = (c) =>
  /[^A-Za-z0-9]/.test(c.value ?? '') ? null : { specialChar: true };

@Component({
  imports: [ReactiveFormsModule, ContentLayout, Input, InputPassword, TranslocoPipe],
  selector: 'app-account',
  styleUrl: './account.css',
  templateUrl: './account.html',
})
export class Account implements OnInit {
  private readonly location = inject(Location);
  private readonly auth = inject(AuthService);
  private readonly userService = inject(UserService);

  private readonly userId = this.auth.user()?.id ?? null;

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  private readonly notification = inject(NotificationService);


  readonly userForm = new FormGroup({
    username: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(4)],
    }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
  });

  readonly passwordForm = new FormGroup(
    {
      oldPassword: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(5)],
      }),
      newPassword: new FormControl('', {
        nonNullable: true,
        validators: [
          Validators.required,
          Validators.minLength(8),
          hasUppercase,
          hasNumber,
          hasSpecialChar,
        ],
      }),
      newPasswordConfirmation: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
    },
    { validators: passwordsMatch },
  );

  readonly userFormItems = [
    {
      key: 'username',
      labelKey: 'ACCOUNT.PROFILE.USERNAME',
      placeholderKey: 'ACCOUNT.PROFILE.USERNAME_PLACEHOLDER',
      type: 'text',
      icon: 'user',
    },
    {
      key: 'email',
      labelKey: 'ACCOUNT.PROFILE.EMAIL',
      placeholderKey: 'ACCOUNT.PROFILE.EMAIL_PLACEHOLDER',
      type: 'email',
      icon: 'envelope',
    },
  ] as const;

  readonly passwordRules = [
    { error: 'minlength', key: 'ACCOUNT.CHANGE_PASSWORD.RULES.MIN_LENGTH' },
    { error: 'uppercase', key: 'ACCOUNT.CHANGE_PASSWORD.RULES.UPPERCASE' },
    { error: 'number', key: 'ACCOUNT.CHANGE_PASSWORD.RULES.NUMBER' },
    { error: 'specialChar', key: 'ACCOUNT.CHANGE_PASSWORD.RULES.SPECIAL_CHAR' },
  ] as const;

  get canSave(): boolean {
    return !this.loading()
      && this.userForm.valid
      && (!this.passwordForm.dirty || this.passwordForm.valid);
  }

  get oldPassword() { return this.passwordForm.controls.oldPassword; }
  get newPassword() { return this.passwordForm.controls.newPassword; }
  get newPasswordConfirmation() { return this.passwordForm.controls.newPasswordConfirmation; }

  ngOnInit(): void {
    if (this.userId === null) {
      this.error.set('ACCOUNT.ERRORS.INVALID_SESSION');
      return;
    }

    this.loading.set(true);
    this.userService.findById(this.userId).subscribe({
      next: (user) => {
        this.userForm.patchValue({ username: user.username, email: user.email });
        this.loading.set(false);
      },
      error: () => {
        this.error.set('ACCOUNT.ERRORS.LOAD_FAILED');
        this.loading.set(false);
      },
    });
  }

  onSubmit(): void {
    const id = this.userId;
    if (id === null) return;

    const changingPassword = this.passwordForm.dirty;

    if (this.userForm.invalid || (changingPassword && this.passwordForm.invalid)) {
      this.userForm.markAllAsTouched();
      if (changingPassword) this.passwordForm.markAllAsTouched();
      this.error.set('ACCOUNT.ERRORS.INVALID_FORM');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const { username, email } = this.userForm.getRawValue();

    this.userService
      .update(id, { username, email })
      .pipe(
        switchMap(() => {
          if (!changingPassword) return of(void 0);

          const { oldPassword, newPassword, newPasswordConfirmation } =
            this.passwordForm.getRawValue();

          return this.userService.changePassword(id, {
            id,
            username,
            email,
            oldPassword,
            newPassword,
            newPasswordConfirmation,
          });
        }),
      )
      .subscribe({
        next: () => {
          this.notification.success('Updated successfully.');
          this.loading.set(false);
          this.location.back();
        },
        error: () => {
          this.notification.error('Failed to save. Try again later.');
          this.error.set('ACCOUNT.ERRORS.SAVE_FAILED');
          this.loading.set(false);
        },
      });
  }

  goBack(): void {
    this.location.back();
  }
}
