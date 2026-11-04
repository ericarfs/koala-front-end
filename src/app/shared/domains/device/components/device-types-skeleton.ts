import { Component } from "@angular/core";

@Component({
  selector: 'app-device-types-skeleton',
  template: `
    <div class="flex flex-wrap gap-1">
      <div class="bg-neutral/10 h-6 w-24 rounded-sm animate-pulse"></div>
      <div class="bg-neutral/10 h-6 w-20 rounded-sm animate-pulse"></div>
      <div class="bg-neutral/10 h-6 w-28 rounded-sm animate-pulse"></div>
    </div>
  `,
  host: { class: 'contents' },
})
export class DeviceTypesSkeleton {}
