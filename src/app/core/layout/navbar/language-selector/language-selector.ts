import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-language-selector',
  standalone: true,
  template: `
  <div
    class="inline-flex items-center justify-center rounded-xl border border-outline
          bg-container text-default hover:bg-input transition-colors duration-200
          h-full overflow-hidden"
    [class.md:justify-center]="collapsed"
  >
    <label for="lang-select" class="sr-only">Idioma</label>

    <select
      id="lang-select"
      #langSelect
      (change)="translate.use(langSelect.value)"
      class="appearance-none bg-transparent text-neutral cursor-pointer
            focus:outline-none focus-visible:ring-2 focus-visible:ring-primary
            rounded w-full h-full text-center text-base leading-none
            border-0 p-2 m-0"
      [attr.aria-label]="currentLangName()"
      [attr.title]="currentLangName()"
    >
      @for (lang of availableLangs; track lang) {
        <option
          [value]="lang"
          [selected]="lang === translate.currentLang()"
          [attr.aria-label]="langName(lang)"
          [attr.title]="langName(lang)"
        >
          {{ flag(lang) }}
        </option>
      }
    </select>
  </div>
  `
})
export class LanguageSelectorComponent {
  collapsed = localStorage.getItem('sidebar-collapsed') === 'true';

  public readonly availableLangs = ['en', 'pt'];
  constructor(public translate: TranslateService) {
    const savedLang = localStorage.getItem('lang') ?? 'pt';
    this.translate.use(savedLang);
  }

  langName(lang: string): string {
    return new Intl.DisplayNames([lang], { type: 'language' }).of(lang) ?? lang;
  }

  currentLangName(): string {
    const lang = this.translate.currentLang();
    return lang ? this.langName(lang) : '';
  }

  flag(lang: string): string {
    return lang === 'pt' ? '🇧🇷' : '🇺🇸';
  }
}
