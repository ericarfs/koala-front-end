import { Component, inject, input, signal } from '@angular/core';
import { ActionButtonsComponent } from '@shared/components/action-buttons/action-buttons';
import { FormDialogService } from '@shared/components/form-dialog/form-dialog.service';
import { PaginatorComponent } from '@shared/components/pagination/paginator';
import { UserBasic } from '@shared/interfaces/user';
import { ContentLayoutComponent } from '@shared/layouts/content/content';
import { USERS_MOCK } from '../../mocks/users';
import { paginate } from '@shared/utils/paginate';
import { delay, of, tap } from 'rxjs';
import { TranslatePipe } from '@ngx-translate/core';


@Component({
  imports: [ContentLayoutComponent, ActionButtonsComponent, PaginatorComponent, TranslatePipe],
  selector: 'app-users',
  styleUrl: './users.css',
  templateUrl: './users.html',
  host: {
    class: 'contents',
  },
})
export class Users {
  private readonly formDialog = inject(FormDialogService);
  readonly allUsers = signal<UserBasic[]>(USERS_MOCK);

  pageSize = input(8);
  pagination = paginate(this.allUsers, this.pageSize);

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

          if (editingId != null) {
            const updated: UserBasic = { id: editingId, username: v.username, email: v.email };

            return of(updated).pipe(
              delay(3000),
              tap((u) => this.allUsers.update((list) =>
                list.map((item) => (item.id === u.id ? u : item))
              )),
            );
          }

          const created: UserBasic = {
            id: this.nextUserId(),
            username: v.username,
            email: v.email,
          };

          return of(created).pipe(
            delay(3000),
            tap((u) => this.allUsers.update((list) => [...list, u])),
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

  deleteUser(id: number){
    this.allUsers.update(users => users.filter(u => u.id !== id));
  }

  private nextUserId(): number {
    const ids = this.allUsers().map((u) => u.id ?? 0);
    return ids.length ? Math.max(...ids) + 1 : 1;
  }

}
