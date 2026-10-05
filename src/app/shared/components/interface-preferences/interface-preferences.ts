import { Component } from '@angular/core';
import { FontSizeToggleComponent } from './font-size-toggle/font-size-toggle';
import { LanguageSelectorComponent } from './language-selector/language-selector';
import { ThemeToggleComponent } from './theme-toggle/theme-toggle';

@Component({
  imports: [FontSizeToggleComponent, LanguageSelectorComponent, ThemeToggleComponent],
  selector: 'app-interface-preferences',
  template:`
    <div class="px-2 flex flex-wrap justify-start items-center gap-2">
      <app-font-size-toggle/>
      <app-theme-toggle/>
      <app-language-selector/>
    </div>
  `,
})
export class InterfacePreferences {}
