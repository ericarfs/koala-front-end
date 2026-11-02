import { computed, inject, Injectable } from '@angular/core';
import { canAddChild, canReparent, getAncestors, getChildren } from '../components/location-tree';
import { Location } from '@shared/interfaces/location';
import { Observable, of } from 'rxjs';
import { LocationService } from '../services/location';
import { reloadOnScope } from '@shared/utils/reload-on-scope';
import { DATA_SCOPE } from '@shared/tokens/data-scope';
import { CrudStore } from '@shared/domain/crud/crud.store';
import { MutationError, MutationResult } from '@shared/domain/crud/crud.types';

@Injectable({ providedIn: 'root' })
export class LocationStore extends CrudStore<Location> {
  protected readonly service = inject(LocationService);
  protected readonly logTag = 'LocationStore';
  protected override readonly notFoundReason: MutationError = 'INVALID_PARENT';

  readonly roots = computed(() => getChildren(null, this.items()));
  childrenOf(parentId: number | null) {
    return computed(() => getChildren(parentId, this.items()));
  }
  ancestorsOf(id: number) {
    return computed(() => getAncestors(id, this.items()));
  }

  constructor() {
    super();
    reloadOnScope(inject(DATA_SCOPE), {
      load: () => this.load(),
      reset: () => this.reset(),
    });
  }

  override add(draft: Omit<Location, 'id'>): Observable<MutationResult<Location>> {
    if (draft.parentId != null && !canAddChild(draft.parentId, this.currentItems)) {
      return of({ ok: false, reason: 'MAX_DEPTH_EXCEEDED' });
    }
    return super.add(draft);
  }

  override update(id: number, patch: Partial<Location>): Observable<MutationResult<Location>> {
    const list = this.currentItems;
    if (!list.find((l) => l.id === id)) {
      return of({ ok: false, reason: 'INVALID_PARENT' });
    }
    if (patch.parentId !== undefined && !canReparent(id, patch.parentId ?? null, list)) {
      return of({ ok: false, reason: 'INVALID_PARENT' });
    }
    return super.update(id, patch);
  }
}
