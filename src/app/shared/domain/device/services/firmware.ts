import { inject, Injectable, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from './../../../../../environments/environment';
import { Firmware, FirmwareUpdate, FirmwareUpdateProgress } from '@shared/interfaces/firmware';

@Injectable({ providedIn: 'root' })
export class FirmwareService {
  protected readonly http = inject(HttpClient);
  protected readonly ngZone = inject(NgZone);
  protected readonly url = `${environment.otaUrl}`;

  findAll(): Observable<Firmware[]> {
    return this.http.get<Firmware[]>(`${this.url}firmwares`);
  }

  updateDeviceFirmware(deviceId: number, firmwareId: number): Observable<FirmwareUpdate> {
    return this.http.post<FirmwareUpdate>(`${this.url}update`, { firmwareId, deviceId });
  }

  addUpdateFile(files: File[], name: string, compiler: string): Observable<FirmwareUpdate> {
    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));
    formData.append('name', name);
    formData.append('platform', compiler);
    return this.http.post<FirmwareUpdate>(`${this.url}insert`, formData);
  }

  firmwareCompileLogs(sessionId: string): Observable<string> {
    return this.openSse<string>(`${this.url}sse/${sessionId}`, (data) => data);
  }

  deviceUpdateProgress(sessionId: string): Observable<FirmwareUpdateProgress> {
    return this.openSse<FirmwareUpdateProgress>(
      `${this.url}sse/${sessionId}`,
      (data) => JSON.parse(data) as FirmwareUpdateProgress,
    );
  }

  private openSse<T>(url: string, parse: (data: string) => T): Observable<T> {
    return new Observable<T>((observer) => {
      const source = new EventSource(url);

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
