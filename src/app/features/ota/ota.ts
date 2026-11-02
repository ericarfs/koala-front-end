import { ContentLayout } from '@shared/layouts/content/content';
import { Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Input } from '@shared/components/input/input';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { FirmwareService } from '@shared/domain/device/services/firmware';
import { NotificationService } from '@shared/services/notification';
import { EMPTY, catchError, finalize, switchMap, takeWhile, tap } from 'rxjs';

@Component({
  imports: [ContentLayout, ReactiveFormsModule, Input, TranslocoPipe],
  selector: 'app-ota',
  styleUrl: './ota.css',
  templateUrl: './ota.html',
})
export class Ota {
  private readonly firmwareService = inject(FirmwareService);
  private readonly transloco = inject(TranslocoService);
  private readonly notification = inject(NotificationService);

  protected readonly loading = signal(false);
  protected readonly uploading = signal(false);
  protected readonly logText = signal<string>('');
  protected readonly errorKey = signal<string | null>(null);

  private readonly logPre = viewChild<ElementRef<HTMLPreElement>>('logPre');

  otaForm = new FormGroup({
    files: new FormControl<File[] | null>(null, [Validators.required]),
    name: new FormControl<string>('', [Validators.required]),
    compiler: new FormControl<string>('', [Validators.required])
  });

  compilerOptions = [
    { value: 'pio', label: 'Platformio' },
    { value: 'arduino', label: 'Arduino' },
  ];

  readonly otaFormItems = [
    {
      key: 'files',
      labelKey: 'COMMON.FORM.FILE.TITLE',
      placeholderKey: 'ACCOUNT.PROFILE.USERNAME_PLACEHOLDER',
      type: 'file',
      icon: 'file'
    },
    {
      key: 'name',
      labelKey: 'OTA.NAME',
      placeholderKey: 'OTA.NAME_HELPER',
      type: 'text',
      icon: 'cloud'
    },
  ] as const;

  setCompiler(value: string): void {
    this.otaForm.patchValue({ compiler: value });
  }

  uploadOta(): void {
    if (this.uploading() || !this.prepareUpload()) return;

    const { files, name, compiler } = this.otaForm.getRawValue();

    this.uploading.set(true);
    this.logText.set('');
    this.errorKey.set(null);
    this.appendLog(this.transloco.translate('OTA.CONNECTING'));

    this.firmwareService.addUpdateFile(files!, name ?? '', compiler ?? '').pipe(
      switchMap((res) => {
        if (!res || res.status !== 'ok' || !res.sessionId) {
          throw new Error('OTA.ERRORS.UPLOAD_FAILED');
        }
        return this.firmwareService.firmwareCompileLogs(res.sessionId);
      }),
      tap((log) => {
        // Se a API manda __DONE__, traduzimos a mensagem, mas o takeWhile vai encerrar o fluxo
        const text = log === '__DONE__' ? this.transloco.translate('OTA.COMPILATION_COMPLETED') : log;
        this.appendLog(text);
      }),
      // O takeWhile com 'true' inclui o item final (__DONE__) e depois completa o Observable
      takeWhile((log) => log !== '__DONE__', true),
      finalize(() => this.uploading.set(false)),
      catchError((err) => {
        const errorKey = err instanceof Error ? err.message : 'OTA.ERRORS.LOGS_FAILED';
        this.errorKey.set(errorKey);
        this.notification.error(this.transloco.translate('COMMON.TOASTS.SAVE_FAILED'));
        return EMPTY;
      })
    ).subscribe({
      complete: () => {
        this.notification.success(this.transloco.translate('COMMON.TOASTS.UPDATED'));
      }
    });
  }

  private prepareUpload(): boolean {
    if (this.otaForm.invalid) {
      this.errorKey.set('COMMON.FORM.INVALID');
      return false;
    }

    const { files } = this.otaForm.getRawValue();
    if (!files || files.length === 0) {
      this.errorKey.set('COMMON.FORM.FILE.NO_FILE');
      return false;
    }
    return true;
  }

  private appendLog(line: string): void {
    this.logText.update((prev) => (prev ? `${prev}\n${line}` : line));

    queueMicrotask(() => {
      const el = this.logPre()?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }
}
