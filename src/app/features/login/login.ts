import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '@core/auth/services/auth';
import { TranslocoPipe } from '@jsverse/transloco';
import { Input } from '@shared/components/input/input';
import { InputPassword } from '@shared/components/input/input-password';
import { finalize } from 'rxjs';



interface LoginForm {
  username: FormControl,
  password: FormControl
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, Input, InputPassword, TranslocoPipe],
  templateUrl: './login.html',
  host: {
    'class': 'login-host'
  }
})
export class Login {
  loginForm!: FormGroup<LoginForm>;
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly showPassword = signal(false);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  constructor(
  ){
    this.loginForm = new FormGroup({
      username: new FormControl('', [Validators.required, Validators.minLength(4)]),
      password: new FormControl('', [Validators.required, Validators.minLength(5)])
    })
  }

  get password() { return this.loginForm.get('password') as FormControl; }

  onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.error.set('Preencha usuário e senha.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.auth
      .login(
        this.loginForm.value.username,
        this.loginForm.value.password)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => this.router.navigate(["/"]),
        error: () => {
          this.error.set('Usuário ou senha inválidos.');
        }
      })
  }

  onGuestLogin() {
    this.auth.guestLogin().subscribe({
      next: () => this.router.navigateByUrl('/guest'),
      error: (err) => console.error('Erro no login guest', err),
    });
  }
}
