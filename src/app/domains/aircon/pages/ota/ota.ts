import { ContentLayout } from '@shared/layouts/content/content';
import { Component, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Input } from '@shared/components/input/input';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  imports: [ContentLayout, ReactiveFormsModule, Input, TranslatePipe],
  selector: 'app-ota',
  styleUrl: './ota.css',
  templateUrl: './ota.html',
})
export class Ota {
  protected readonly loading = signal(false);
  protected readonly uploading = signal(false);
  protected readonly logText = signal<string | null>(null);

  otaForm = new FormGroup({
    files: new FormControl<File[] | null>(null, [Validators.required]),
    name: new FormControl<string>('', [Validators.required]),
    compiler: new FormControl<string>('', [Validators.required])
  });

  compilerOptions = [
    { value: '1',  label: 'Platformio'    },
    { value: '2',  label: 'Arduino'  },

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

  uploadOta() {
    console.log("Entrei" + this.logText())
    this.logText.set(null);
    if (this.otaForm.valid) {
      if (this.otaForm.value.files?.length === 0) {
        this.logText.set('COMMON.FORM.FILE.NO_FILE');
        console.log(this.logText())
        return;
      }
      this.uploading.set(true);
      /*const logSubscription = this.firmwareService.addUpdateFile(
        this.otaForm.value.files || [],
        this.otaForm.value.name || '',
        this.otaForm.value.compiler || ''
      ).subscribe({
        next: response => {
          const result = response.body;
          if (!result || result.status !== 'ok' || !result.sessionId) {
            this.logText = 'Erro ao enviar o arquivo.';
            return;
          }
          this.logText += `Conectando...`;
          this.firmwareService.firmwareCompileLogs(result.sessionId).subscribe({
            next: log => {
              if (log === '__DONE__') {
                this.logText += 'Compilação concluída com sucesso!';
                logSubscription.unsubscribe();
                this.uploading.set(false);
                return;
              }
              this.logText += log + '\n';
              if (this.logPre) {
                setTimeout(() => {
                  this.logPre.nativeElement.scrollTop = this.logPre.nativeElement.scrollHeight;
                }, 1);
              }
            },
            error: err => {
              if (!this.logText.endsWith('Compilação concluída com sucesso!')) {
                this.logText += `Erro ao receber logs: ${err.message}`;
              }
              this.isUploading = false;
            }
          });
        },
        error: error => {
          this.logText = `Erro ao enviar o arquivo: ${error.message}`;
          this.uploading.set(false);
        }
      });*/
    } else {
      this.logText.set('COMMON.FORM.INVALID');
      console.log(this.logText())
    }
  }

}
