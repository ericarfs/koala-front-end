import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MffService } from '../../services/mff.service';
import { ContentLayoutComponent } from '@shared/layouts/content/content';

@Component({
  selector: 'koala-mff-resources',
  standalone: true,
  imports: [CommonModule, ContentLayoutComponent],
  template: `
  <app-content-layout
    title="Recursos"
  >
  </app-content-layout>
  `,
})
export class MffResourcesComponent {
  private readonly svc = inject(MffService);
  protected readonly resources = this.svc.resources;
}
