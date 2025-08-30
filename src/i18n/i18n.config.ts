import { HttpClient } from '@angular/common/http';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

export const I18N_CONFIG = {
  defaultLanguage: 'ru',
  supportedLanguages: ['ru', 'en'],
  fallbackLanguage: 'ru'
};

export const TRANSLATE_CONFIG = {
  defaultLanguage: I18N_CONFIG.defaultLanguage,
  useDefaultLang: true,
  fallbackLanguage: I18N_CONFIG.fallbackLanguage
};
