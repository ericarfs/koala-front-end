import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { Firmware, FirmwareUpdate, FirmwareUpdateProgress } from '@shared/interfaces/firmware';
import { SseService } from '@shared/services/sse';

@Injectable({ providedIn: 'root' })
export class FirmwareService {
  protected readonly http = inject(HttpClient);
  private readonly sse = inject(SseService);
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
    return this.sse.connect(
      `${this.url}sse/${sessionId}`,
      (data) => data
    );
  }

  deviceUpdateProgress(sessionId: string): Observable<FirmwareUpdateProgress> {
    return this.sse.connect(
      `${this.url}sse/${sessionId}`,
      (data) => JSON.parse(data) as FirmwareUpdateProgress
    );
  }
}
