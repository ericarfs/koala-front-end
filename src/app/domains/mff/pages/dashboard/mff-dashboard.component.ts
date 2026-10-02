import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MffService } from '../../services/mff.service';
import { ContentLayoutComponent } from '@shared/layouts/content/content';


@Component({
  selector: 'koala-mff-dashboard',
  standalone: true,
  imports: [CommonModule, ContentLayoutComponent],
  template: `
  <app-content-layout
    title="Dashboard"
  >

  </app-content-layout>
  `,
})
export class MffDashboardComponent {
  protected readonly service = inject(MffService);
}
