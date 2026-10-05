import { Component, inject, Input } from '@angular/core';
import { PERMISSIONS } from '@shared/tokens/permissions';

@Component({
  imports: [],
  selector: 'app-content-layout',
  template: `
  <div class="flex flex-col gap-6 max-w-full mb-6 h-full">
    <header class="flex flex-col gap-1 pb-4 border-b border-outline">
      <div class="flex flex-wrap items-center md:justify-between gap-3">
        <h1 class="text-3xl md:text-4xl font-bold text-default truncate min-w-0">
              {{ title }}
        </h1>

        @if (permissions.isAdmin()) {
          <div class="shrink-0 w-full md:w-auto flex justify-end break-all">
            <ng-content select="[actions]"></ng-content>
          </div>
        }
      </div>

      @if (subtitle) {
        <p class="text-neutral break-all">
          {{ subtitle }}
        </p>
      }
    </header>

    <ng-content></ng-content>
  </div>`,
  host: {
    class: 'block h-full',
  },
})
export class ContentLayout {
  @Input() title!: string;
  @Input() subtitle?: string;

  protected readonly permissions = inject(PERMISSIONS);
}
