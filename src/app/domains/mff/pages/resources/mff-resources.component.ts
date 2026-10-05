import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MffService } from '../../services/mff.service';
import { ContentLayout } from '@shared/layouts/content/content';

@Component({
  selector: 'app-mff-resources',
  standalone: true,
  imports: [CommonModule, ContentLayout],
  template: `
  <app-content-layout
    title="Recursos"
  >
  </app-content-layout>
  `,
})
export class MffResources {
  private readonly svc = inject(MffService);
  protected readonly resources = this.svc.resources;
}
