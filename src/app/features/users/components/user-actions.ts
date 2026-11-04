import { Injectable, inject } from '@angular/core';
import { DialogService } from '@shared/components/dialogs/dialogs.service';
import { UserStore } from '@shared/domains/user/stores/user';
import { CrudActions } from '@shared/domains/crud/crud-actions';
import { UserBasic } from '@shared/interfaces/user';
import { USER_ADD_DIALOG, USER_EDIT_DIALOG } from './user-form';

@Injectable({ providedIn: 'root' })
export class UsersActions extends CrudActions<UserBasic> {
  private readonly dialog = inject(DialogService);
  protected override readonly store = inject(UserStore);

  openCreate(): void {
    this.dialog
      .open<UserBasic>({
        ...USER_ADD_DIALOG,
        onSubmit: (values) => {
          const v = values as { username: string; email: string };
          return this.unwrap(
            this.store.add({ username: v.username, email: v.email }),
            'COMMON.TOASTS.CREATED',
          );
        },
      })
      .closed.subscribe();
  }

  openEdit(user: UserBasic): void {
    this.dialog
      .open<UserBasic>({
        ...USER_EDIT_DIALOG,
        initialValues: { username: user.username, email: user.email },
        onSubmit: (values) => {
          const v = values as { username: string; email: string };
          return this.unwrap(
            this.store.update(user.id, { username: v.username, email: v.email }),
            'COMMON.TOASTS.UPDATED',
          );
        },
      })
      .closed.subscribe();
  }
}
