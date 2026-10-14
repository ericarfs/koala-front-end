import { Component, inject, input } from '@angular/core';
import { ActionButtons } from '@shared/components/action-buttons/action-buttons';
import { DialogService } from '@shared/components/dialogs/dialogs.service';
import { Paginator } from '@shared/components/pagination/paginator';
import { UserBasic } from '@shared/interfaces/user';
import { ContentLayout } from '@shared/layouts/content/content';
import { paginate } from '@shared/utils/paginate';
import { of, switchMap, throwError } from 'rxjs';
import { TranslocoPipe } from '@jsverse/transloco';
import { UserStore } from '@shared/domain/user/stores/user';


@Component({
  imports: [ContentLayout, ActionButtons, Paginator, TranslocoPipe],
  selector: 'app-users',
  styleUrl: './users.css',
  templateUrl: './users.html',
  host: {
    class: 'contents',
  },
})
export class Users {
  private readonly formDialog = inject(DialogService);
  private readonly store = inject(UserStore);

  readonly allUsers = this.store.items;

  pageSize = input(8);
  pagination = paginate(this.allUsers, this.pageSize);

  constructor() {
    this.store.load();
  }

  private openUserDialog(user?: UserBasic): void {
    const editingId = user?.id ?? null;
    const isEdit = editingId != null;

    this.formDialog
      .open<UserBasic>({
        title: isEdit ? 'USERS.EDIT.TITLE' : 'USERS.ADD.TITLE',
        subtitle: isEdit ? 'USERS.EDIT.SUBTITLE' : 'USERS.ADD.SUBTITLE',
        submitLabel: isEdit ? 'COMMON.ACTIONS.SAVE' : 'COMMON.ACTIONS.CREATE',

        fields: [
          { key: 'username', label: 'Username', placeholder: 'Username', required: true },
          { key: 'email',    label: 'Email',    placeholder: 'user@email.com', type: 'email', required: true },
        ],

        initialValues: user
          ? { username: user.username, email: user.email }
          : undefined,

        onSubmit: (values) => {
          const v = values as { username: string; email: string };
          const patch = { username: v.username, email: v.email };

          const op$ = editingId != null
            ? this.store.update(editingId, patch)
            : this.store.add(patch);

          return op$.pipe(
            switchMap((res) =>
              res.ok
                ? of(res.data)
                : throwError(() => 'COMMON.ERRORS.NOT_FOUND'),
            ),
          );
        },
      })
      .closed.subscribe();
  }

  newUser(): void {
    this.openUserDialog();
  }

  updateUser(user: UserBasic) {
    this.openUserDialog(user);
  }

  deleteUser(id: number): void {
    this.store.remove(id).subscribe({
      next: (res) => {
        if (!res.ok) {
          // TODO: toast de erro
        }
      },
      error: (err) => console.error('[Users] delete failed', err),
    });
  }

}
