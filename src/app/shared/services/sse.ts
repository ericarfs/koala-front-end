import { Injectable, inject, NgZone } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SseService {
  private readonly ngZone = inject(NgZone);

  connect<T>(url: string, parse: (data: string) => T, options?: EventSourceInit): Observable<T> {
    return new Observable<T>((observer) => {
      const source = new EventSource(url, options);

      source.onmessage = (event) => {
        this.ngZone.run(() => observer.next(parse(event.data)));
      };

      source.onerror = (error) => {
        this.ngZone.run(() => observer.error(error));
        source.close();
      };

      return () => source.close();
    });
  }
}
