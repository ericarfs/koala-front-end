import { Component } from '@angular/core';

@Component({
  selector: 'app-location-stats-skeleton',
  template: `
    <div class="flex-1 mt-4 space-y-4 animate-pulse">
      <div class="space-y-2">
        <div class="flex flex-wrap items-end justify-between">
          <div class="flex items-center gap-2 max-w-full">
            <div class="bg-neutral/10 h-5 w-5 rounded"></div>
            <div class="bg-neutral/10 h-8 w-12 rounded"></div>
            <div class="bg-neutral/10 h-4 w-20 rounded"></div>
          </div>
          <div class="bg-neutral/10 h-5 w-16 rounded"></div>
        </div>
        <div class="bg-neutral/10 h-1.5 w-full rounded-full"></div>
        <div class="flex gap-4">
          <div class="bg-neutral/10 h-4 w-24 rounded"></div>
          <div class="bg-neutral/10 h-4 w-24 rounded"></div>
        </div>
      </div>
      <div class="grid grid-cols-1 min-[340px]:grid-cols-2 gap-0.5 py-2">
         @for (i of [1,2,3,4]; track i) {
          <div class="bg-neutral/10 h-7 rounded-sm"></div>
        }
      </div>
  </div>
  `,
  host: { class: 'contents' },
})
export class LocationStatsSkeleton {}
