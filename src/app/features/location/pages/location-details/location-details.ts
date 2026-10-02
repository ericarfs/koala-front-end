import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { delay, map, of } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { getActionLabel, getAncestors, getChildren } from '../../../../shared/domain/location/location-tree';
import { ContentLayoutComponent } from '@shared/layouts/content/content';
import { DeviceListComponent } from '@shared/domain/device/components/device-list';
import { LocationCardComponent } from '../../components/location-card';
import { LocationStore } from '@shared/domain/location/location-store';
import { FormDialogService } from '@shared/components/form-dialog/form-dialog.service';
import { DEVICES_MOCK } from '../../../../mocks/devices';
import { Location } from '@shared/interfaces/location';



@Component({
  selector: 'app-location-details',
  standalone: true,
  imports: [CommonModule, RouterLink, ContentLayoutComponent, DeviceListComponent, LocationCardComponent],
  templateUrl: './location-details.html',
  host: {
    class: 'block flex-1',
  },
})
export class LocationDetails {
  private readonly route = inject(ActivatedRoute);
  private readonly store = inject(LocationStore);
  private readonly formDialog = inject(FormDialogService);

  private readonly id = toSignal(
    this.route.paramMap.pipe(map((p) => Number(p.get('id')))),
    { initialValue: NaN }
  );

  readonly location   = computed(() => this.store.items().find((l) => l.id === this.id()) ?? null);
  readonly breadcrumb = computed(() => getAncestors(this.id(), this.store.items()));
  readonly children   = computed(() => getChildren(this.id(), this.store.items()));
  readonly devices    = computed(() => DEVICES_MOCK.filter((d) => d.id_enviroment === this.id()));
  readonly showDevices = computed(() => this.children().length === 0 || this.devices().length > 0);

  actionLabel = (loc: Location) => getActionLabel(loc.id, this.store.items());

  newLocation(): void {
    this.openDialog(null, this.id());
  }

  updateLocation(location: Location): void {
    this.openDialog(location);
  }

  deleteLocation(location: Location): void {
    if (!confirm(`Excluir "${location.name}"?`)) return;
    this.store.remove(location.id!);
  }

  private openDialog(location: Location | null, parentId: number | null = null): void {
    const editingId = location?.id ?? null;
    const isEdit = editingId != null;

    this.formDialog
      .open<Location>({
        title: isEdit ? 'Editar ambiente' : 'Novo ambiente',
        subtitle: isEdit ? 'Altere os dados do ambiente' : 'Preencha os dados do ambiente',
        submitLabel: isEdit ? 'Salvar' : 'Criar',
        fields: [
          { key: 'name',        label: 'Nome',      placeholder: 'Ex: Laboratorio 1006', required: true },
          { key: 'description', label: 'Descrição', placeholder: 'Opcional', type: 'textarea', rows: 4 },
        ],
        initialValues: location
          ? { name: location.name, description: location.description }
          : undefined,
        onSubmit: (values) => {
          const v = values as { name: string; description?: string };

          if (editingId != null) {
            const patch: Partial<Location> = {
              name: v.name,
              description: v.description ?? '',
            };
            this.store.update(editingId, patch);
            return of({ ...location!, ...patch, id: editingId }).pipe(delay(3000));
          }

          const created: Location = {
            id: this.store.nextId(),
            name: v.name,
            description: v.description ?? '',
            parentId,
          };
          this.store.add(created);
          return of(created).pipe(delay(3000));
        },
      })
      .closed.subscribe();
  }
}
