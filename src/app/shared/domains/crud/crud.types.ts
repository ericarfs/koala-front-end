import { Observable } from "rxjs";

export type MutationError =
  | 'NOT_FOUND'
  | 'INVALID_PARENT'
  | 'MAX_DEPTH_EXCEEDED';

export type MutationResult<T> =
  | { ok: true; data: T }
  | { ok: false; reason: MutationError };

export interface CrudService<T extends { id: number }> {
  findAll(): Observable<T[]>;
  save(draft: Omit<T, 'id'>): Observable<T>;
  update(id: number, patch: Partial<T>): Observable<T>;
  remove(id: number): Observable<void>;
}
