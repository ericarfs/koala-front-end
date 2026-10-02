import {
  DestroyRef,
  Injectable,
  WritableSignal,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { fromEventPattern } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SidebarStateService {
  private readonly STORAGE_KEY = 'koala-sidebar-collapsed';
  private readonly destroyRef = inject(DestroyRef);

  private readonly userCollapsed = signal<boolean>(
    localStorage.getItem(this.STORAGE_KEY) === 'true'
  );

  readonly isMobile = signal(false);
  readonly isTablet = signal(false);
  readonly mobileOpen = signal(false);

  private readonly peek = signal(false);

  readonly collapsed = computed(() => {
    if (this.peek()) return false;
    if (this.isMobile()) return false;
    if (this.isTablet()) return true;
    return this.userCollapsed();
  });

  constructor() {
    this.watchMedia('(max-width: 767px)', this.isMobile);
    this.watchMedia('(min-width: 768px) and (max-width: 1023px)', this.isTablet);

    effect(() => {
      localStorage.setItem(this.STORAGE_KEY, String(this.userCollapsed()));
    });

    effect(() => {
      if (!this.isMobile()) this.mobileOpen.set(false);
    });
  }

  toggle(): void {
    if (this.isMobile()) {
      this.mobileOpen.update((v) => !v);
      return;
    }

    if (this.peek()) {
      this.peek.set(false);
      return;
    }

    this.userCollapsed.update((v) => !v);
  }

  closeMobile(): void {
    this.mobileOpen.set(false);
  }

  peekOpen(): void {
    if (this.collapsed()) this.peek.set(true);
  }

  peekClose(): void {
    this.peek.set(false);
  }

  private watchMedia(query: string, target: WritableSignal<boolean>): void {
    const mql = window.matchMedia(query);
    target.set(mql.matches);

    fromEventPattern<MediaQueryListEvent>(
      (handler) => mql.addEventListener('change', handler),
      (handler) => mql.removeEventListener('change', handler)
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((e) => target.set(e.matches));
  }
}
