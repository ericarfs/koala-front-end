import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { PermissionsProvider } from '@shared/tokens/permissions';
import { environment } from './../../../../environments/environment';

interface LoginResponse {
  access: string;
}

interface CurrentUser {
  username: string;
  role: 'admin' | 'user';
}

const TOKEN_KEY = 'accessToken';
const USER_KEY = 'currentUser';

@Injectable({ providedIn: 'root' })
export class AuthService implements PermissionsProvider{
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly baseUrl = `${environment.apiUrl}auth`;

  private readonly _user = signal<CurrentUser | null>(this.readUserFromStorage());

  readonly user = this._user.asReadonly();
  readonly isLoggedIn = computed(() => this._user() !== null);

  readonly isAdmin = computed(() => {
    const token = this.accessToken;
    if (!token) return false;
    return this.roleFromJwt(token) === 'admin';
  });


  get accessToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.baseUrl}/auth/token`, { username, password })
      .pipe(
        tap((res) => {
          localStorage.setItem(TOKEN_KEY, res.access);

          const user: CurrentUser = {
            username: this.subjectFromJwt(res.access) ?? username,
            role: this.roleFromJwt(res.access) ?? 'user',
          };

          localStorage.setItem(USER_KEY, JSON.stringify(user));
          this._user.set(user);
        })
      );
  }

  logout(redirect = true): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this._user.set(null);
    if (redirect) this.router.navigate(['/login']);
  }

  private readUserFromStorage(): CurrentUser | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;

    if (!raw.startsWith('{')) {
      return { username: raw, role: 'user' };
    }

    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  private roleFromJwt(token: string): 'admin' | 'user' | null {
    const payload = this.decodePayload(token);
    if (!payload) return null;

    const raw = String(payload['role'] ?? '')
      .replace(/^ROLE_/i, '')
      .toLowerCase();

    return raw === 'admin' ? 'admin' : raw === 'user' ? 'user' : null;
  }

  private subjectFromJwt(token: string): string | null {
    const payload = this.decodePayload(token);
    return payload ? String(payload['sub'] ?? '') : null;
  }

  private decodePayload(token: string): Record<string, unknown> | null {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const pad = base64.length % 4 ? '='.repeat(4 - (base64.length % 4)) : '';
      const json = decodeURIComponent(
        atob(base64 + pad)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(json);
    } catch {
      return null;
    }
  }
}
