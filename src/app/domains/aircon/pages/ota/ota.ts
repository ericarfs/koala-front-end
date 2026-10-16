import { ContentLayout } from '@shared/layouts/content/content';
import { Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Input } from '@shared/components/input/input';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { FirmwareService } from '@shared/domain/device/services/firmware';

@Component({
  imports: [ContentLayout, ReactiveFormsModule, Input, TranslocoPipe],
  selector: 'app-ota',
  styleUrl: './ota.css',
  templateUrl: './ota.html',
})
export class Ota {
  private readonly firmwareService = inject(FirmwareService);
  private readonly transloco = inject(TranslocoService);

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
    { value: 'pio',  label: 'Platformio'    },
    { value: 'arduino',  label: 'Arduino'  },

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
    if (this.uploading()) return;

    this.logText.set('');
    this.errorKey.set(null);

    if (this.otaForm.invalid) {
      this.errorKey.set('COMMON.FORM.INVALID');
      return;
    }

    const { files, name, compiler } = this.otaForm.getRawValue();
    if (!files || files.length === 0) {
      this.errorKey.set('COMMON.FORM.FILE.NO_FILE');
      return;
    }

    this.uploading.set(true);

    this.firmwareService.addUpdateFile(files, name ?? '', compiler ?? '').subscribe({
      next: (res) => {
        if (!res || res.status !== 'ok' || !res.sessionId) {
          this.errorKey.set('OTA.ERRORS.UPLOAD_FAILED');
          this.uploading.set(false);
          return;
        }

        this.appendLog('Conecting...');

        this.firmwareService.firmwareCompileLogs(res.sessionId).subscribe({
          next: (log) => {
            if (log === '__DONE__') {
              this.appendLog(this.transloco.translate('OTA.COMPILATION_COMPLETED'));
              this.uploading.set(false);
              return;
            }
            this.appendLog(log);
          },
          complete: () => {
            if (this.uploading()) {
              this.appendLog(this.transloco.translate('OTA.COMPILATION_COMPLETED'));
              this.uploading.set(false);
            }
          },
          error: () => {
            this.errorKey.set('OTA.ERRORS.LOGS_FAILED');
            this.uploading.set(false);
          },
        });
      },
      error: () => {
        this.errorKey.set('OTA.ERRORS.UPLOAD_FAILED');
        this.uploading.set(false);
      },
    });
  }

  private appendLog(line: string): void {
    this.logText.update((prev) => (prev ? `${prev}\n${line}` : line));

    // auto-scroll depois que o DOM atualizar
    queueMicrotask(() => {
      const el = this.logPre()?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }

}
