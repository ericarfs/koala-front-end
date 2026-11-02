import { Component, inject, input } from '@angular/core';
import { ActionButtons } from '@shared/components/action-buttons/action-buttons';
import { Paginator } from '@shared/components/pagination/paginator';
import { UserBasic } from '@shared/interfaces/user';
import { ContentLayout } from '@shared/layouts/content/content';
import { paginate } from '@shared/utils/paginate';
import { TranslocoPipe } from '@jsverse/transloco';
import { UserStore } from '@shared/domain/user/stores/user';
import { UsersActions } from './components/user-actions';
import { noop } from 'rxjs';


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
  private readonly actions = inject(UsersActions);

  readonly store = inject(UserStore);

  readonly allUsers = this.store.items;

  pageSize = input(8);
  pagination = paginate(this.allUsers, this.pageSize);

  constructor() {
    this.store.load();
  }

  newUser(): void {
    this.actions.openCreate();
  }

  updateUser(user: UserBasic): void {
    this.actions.openEdit(user);
  }

  deleteUser(id: number): void {
    this.actions.remove(id).subscribe({ error: () => noop });
  }
}
