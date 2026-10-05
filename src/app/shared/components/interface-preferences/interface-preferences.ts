import { Component } from '@angular/core';
import { FontSizeToggle } from './font-size-toggle/font-size-toggle';
import { LanguageSelector } from './language-selector/language-selector';
import { ThemeToggle } from './theme-toggle/theme-toggle';


@Component({
  imports: [FontSizeToggle, LanguageSelector, ThemeToggle],
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
