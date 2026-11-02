import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { User, UserBasic } from '@shared/interfaces/user';
import { CrudService } from '@shared/domain/crud/crud.service';

@Injectable({ providedIn: 'root' })
export class UserService extends CrudService<UserBasic> {
  protected readonly basePath = 'user';

  changePassword(id: number, body: User): Observable<void> {
    return this.http.put<void>(`${this.url}/${id}/password`, body);
  }
}
