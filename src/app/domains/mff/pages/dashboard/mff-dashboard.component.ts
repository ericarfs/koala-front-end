import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MffService } from '../../services/mff.service';
import { ContentLayout } from '@shared/layouts/content/content';


@Component({
  selector: 'app-mff-dashboard',
  standalone: true,
  imports: [CommonModule, ContentLayout],
  template: `
  <app-content-layout
    title="Dashboard"
  >

  </app-content-layout>
  `,
})
export class MffDashboard {
  protected readonly service = inject(MffService);
}
