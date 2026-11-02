import { inject, Injectable } from '@angular/core';
import { UserBasic } from '@shared/interfaces/user';
import { UserService } from '../services/user';
import { CrudStore } from '@shared/domain/crud/crud.store';

export type UserMutationError = 'NOT_FOUND';

export type UserMutationResult<T> =
  | { ok: true; data: T }
  | { ok: false; reason: UserMutationError };

@Injectable({ providedIn: 'root' })
export class UserStore extends CrudStore<UserBasic> {
  protected readonly service = inject(UserService);
  protected readonly logTag = 'UserStore';
}
