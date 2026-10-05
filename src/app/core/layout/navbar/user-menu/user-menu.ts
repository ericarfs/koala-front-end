import { AuthService } from '@core/auth/services/auth';
import { Component, ElementRef, HostListener, inject, signal, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-user-menu',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  template: `
    <div class="relative">
      <button
        type="button"
        (click)="open.set(!open())"
        class="flex items-center gap-2 w-full px-2 py-2 rounded-full hover:bg-primary-background transition cursor-pointer"
      >
        <div class="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-semibold shrink-0">
          {{ initial() }}
        </div>
        @if (!compact()) {
          <span class="text-sm font-semibold text-default truncate">{{ auth.user()?.username }}</span>
        }
      </button>

      @if (open()) {
        <div class="absolute z-50 bg-container rounded-md border border-outline p-1 min-w-60"
             [class]="compact() ? 'right-0 top-full mt-2' : 'left-0 bottom-full mb-2'">
          <a routerLink="/account" (click)="open.set(false)"
             class="block px-3 py-2 text-sm text-default hover:bg-neutral/20 rounded-sm">
            {{ 'USER_MENU.ACCOUNT_SETTINGS' | translate }}
          </a>
          <button type="button" (click)="auth.logout()"
                  class="block w-full text-left px-3 py-2 text-sm text-destructive hover:bg-destructive/10 cursor-pointer rounded-sm">
            {{ 'USER_MENU.LOGOUT' | translate }}
          </button>
        </div>
      }
    </div>
  `,
})
export class UserMenu {
  compact = input(false);

  protected readonly auth = inject(AuthService);
  protected readonly open = signal(false);

  private readonly elRef = inject(ElementRef<HTMLElement>);

  protected initial(): string {
    return (this.auth.user()?.username ?? '?').charAt(0).toUpperCase();
  }

  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent): void {
    if (!this.elRef.nativeElement.contains(e.target as Node)) this.open.set(false);
  }
}
