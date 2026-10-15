import { Component } from '@angular/core';
import { LocationStatsSkeleton } from './location-stats-skeleton';

@Component({
  selector: 'app-location-card-skeleton',
  imports:[LocationStatsSkeleton],
  template: `
    <div class="flex flex-col justify-start gap-3 w-full min-h-120 p-4 bg-container rounded-sm outline outline-outline animate-pulse">
      <div class="flex justify-between items-center">
        <div class="bg-neutral/10 h-6 w-6 rounded-sm"></div>
        <div class="bg-neutral/10 h-5 w-10 rounded-sm"></div>
      </div>

      <div class="bg-neutral/10 h-7 w-3/4 rounded"></div>

      <div class="bg-neutral/10 h-4 w-full rounded"></div>

      <app-location-stats-skeleton/>

      <div class="bg-neutral/10 h-4 w-32 rounded self-end"></div>
    </div>
  `,
  host: { class: 'contents' },
})
export class LocationCardSkeleton {}
