import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, delay, of, tap } from 'rxjs';
import { PermissionsProvider } from '@shared/tokens/permissions';

interface LoginResponse {
  token: string;
}

type Role = 'admin' | 'regular' | 'guest';

interface CurrentUser {
  id: number | null;
  username: string;
  role: Role;
}

const TOKEN_KEY = 'accessToken';
const USER_KEY = 'currentUser';

@Injectable({ providedIn: 'root' })
export class MockAuthService implements PermissionsProvider {
  private readonly router = inject(Router);

  private readonly _user = signal<CurrentUser | null>(this.readUserFromStorage());

  readonly user = this._user.asReadonly();

  readonly isGuest = computed(() => this._user()?.role === 'guest');
  readonly isLoggedIn = computed(() => {
    const user = this._user();
    return user !== null && user.role !== 'guest';
  });
  readonly isAdmin = computed(() => this._user()?.role === 'admin');

  readonly dataScope = computed(() => {
    const user = this._user();
    return user && user.role !== 'guest' ? `${user.role}:${user.id}` : null;
  });

  readonly displayName = computed(() => {
    const user = this._user();
    return user && user.role !== 'guest' ? user.username || null : null;
  });

  get accessToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  // Login falso para teste. Use "admin" como username para entrar como admin.
  login(username: string, _password = ''): Observable<LoginResponse> {
    const role: Role = username.toLowerCase() === 'admin' ? 'admin' : 'regular';
    return this.fakeSession(username, role);
  }

  guestLogin(): Observable<LoginResponse> {
    return this.fakeSession('guest', 'guest', 120); // guest dura 2 min, como no backend
  }

  logout(redirect = true): void {
    this.clearStorage();
    this._user.set(null);
    if (redirect) this.router.navigate(['/login']);
  }

  // ---------- Mock ----------

  private fakeSession(
    username: string,
    role: Role,
    ttlSeconds = 3600,
  ): Observable<LoginResponse> {
    const response: LoginResponse = {
      token: this.buildFakeJwt(username, role, ttlSeconds),
    };

    return of(response).pipe(
      delay(300), // simula latência da rede
      tap((res) => this.startSession(res.token, username)),
    );
  }

  private buildFakeJwt(username: string, role: Role, ttlSeconds: number): string {
    const now = Math.floor(Date.now() / 1000);

    const header = { alg: 'HS256', typ: 'JWT' };
    const payload = {
      sub: String(role === 'guest' ? now : 1),
      username,
      userType: role,
      iat: now,
      exp: now + ttlSeconds,
    };

    // base64url, igual ao formato real de um JWT
    const b64 = (obj: object) =>
      btoa(JSON.stringify(obj))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

    return `${b64(header)}.${b64(payload)}.fake-signature`;
  }

  // ---------- Sessão / storage (mesma lógica do AuthService real) ----------

  private startSession(token: string, fallbackUsername = ''): void {
    const user = this.userFromToken(token, fallbackUsername);
    if (!user) throw new Error('Token com userType inválido');

    localStorage.setItem(TOKEN_KEY, token);
    this._user.set(user);
  }

  private readUserFromStorage(): CurrentUser | null {
    const token = localStorage.getItem(TOKEN_KEY);

    if (!token || this.isExpired(token)) {
      this.clearStorage();
      return null;
    }

    const user = this.userFromToken(token);
    if (!user) this.clearStorage();
    return user;
  }

  private userFromToken(token: string, fallbackUsername = ''): CurrentUser | null {
    const role = this.roleFromJwt(token);
    if (!role) return null;

    return {
      id: this.idFromJwt(token),
      username: this.usernameFromJwt(token) ?? fallbackUsername,
      role,
    };
  }

  private clearStorage(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  // ---------- JWT ----------

  private idFromJwt(token: string): number | null {
    const raw = this.decodePayload(token)?.['sub'];
    const id = Number(raw);
    return raw != null && raw !== '' && Number.isFinite(id) ? id : null;
  }

  private usernameFromJwt(token: string): string | null {
    const raw = this.decodePayload(token)?.['username'];
    return typeof raw === 'string' && raw ? raw : null;
  }

  private roleFromJwt(token: string): Role | null {
    const payload = this.decodePayload(token);
    if (!payload) return null;

    const raw = String(payload['userType'] ?? '').toLowerCase();
    return raw === 'admin' || raw === 'regular' || raw === 'guest' ? raw : null;
  }

  private isExpired(token: string): boolean {
    const exp = Number(this.decodePayload(token)?.['exp']);
    return !Number.isFinite(exp) || exp * 1000 <= Date.now();
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
          .join(''),
      );
      return JSON.parse(json);
    } catch {
      return null;
    }
  }
}
