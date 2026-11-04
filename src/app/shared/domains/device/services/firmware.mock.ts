import { Injectable } from '@angular/core';
import { delay, interval, map, Observable, of, take } from 'rxjs';
import { FirmwareService } from './firmware';
import { Firmware, FirmwareUpdate, FirmwareUpdateProgress } from '@shared/interfaces/firmware';

const FAKE_LATENCY_MS = 300;

@Injectable()
export class MockFirmwareService extends FirmwareService {
  private readonly firmwares: Firmware[] = [
    { id: 1, name: 'esp-core', version: '1.0.0', uploadedAt: Date.now() - 86_400_000 * 30 },
    { id: 2, name: 'esp-core', version: '1.1.0', uploadedAt: Date.now() - 86_400_000 * 10 },
    { id: 3, name: 'esp-core', version: '2.0.0', uploadedAt: Date.now() - 86_400_000 * 2 },
    { id: 4, name: 'esp-sensor', version: '0.9.0', uploadedAt: Date.now() - 86_400_000 * 15 },
    { id: 5, name: 'esp-sensor', version: '1.0.0', uploadedAt: Date.now() - 86_400_000 * 3 },
  ];

  override findAll(): Observable<Firmware[]> {
    return of([...this.firmwares]).pipe(delay(FAKE_LATENCY_MS));
  }

  override updateDeviceFirmware(deviceId: number, firmwareId: number): Observable<FirmwareUpdate> {
    return of<FirmwareUpdate>({
      status: 'ok',
      message: 'Update started',
      sessionId: `mock-session-${deviceId}-${firmwareId}`,
    }).pipe(delay(FAKE_LATENCY_MS));
  }

  override addUpdateFile(_files: File[], _name: string, _compiler: string): Observable<FirmwareUpdate> {
    return of<FirmwareUpdate>({
      status: 'ok',
      message: 'Compilation started',
      sessionId: `mock-compile-${Date.now()}`,
    }).pipe(delay(FAKE_LATENCY_MS));
  }

  override firmwareCompileLogs(_sessionId: string): Observable<string> {
    const lines = [
      'Compiling...',
      'Building target esp32',
      'Linking objects',
      'Generating binary',
      'Compilation finished',
    ];
    return interval(400).pipe(
      take(lines.length),
      map((i) => lines[i]),
    );
  }

  override deviceUpdateProgress(_sessionId: string): Observable<FirmwareUpdateProgress> {
    const total = 20;
    return interval(300).pipe(
      take(total + 1),
      map((i) =>
        i < total
          ? { status: 'progress', message: String(Math.round((i / total) * 100)) }
          : { status: 'success', message: '100' },
      ),
    );
  }
}
