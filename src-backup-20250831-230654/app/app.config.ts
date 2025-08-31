import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

// i18n
import { TranslateModule, TranslateService, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { provideServiceWorker } from '@angular/service-worker';

// PrimeNG
import { provideAnimations } from '@angular/platform-browser/animations';

// AG-Grid
import { AgGridModule } from 'ag-grid-angular';

import { routes } from './app.routes';

// Factory function for TranslateHttpLoader
export function HttpLoaderFactory(): TranslateHttpLoader {
  return new TranslateHttpLoader();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()),
    provideAnimationsAsync(),
    
    // PrimeNG Support - правильная настройка анимаций
    provideAnimations(),
    
    // i18n Support (временно отключен для отладки)
    // importProvidersFrom(
    //   TranslateModule.forRoot({
    //     loader: {
    //       provide: TranslateLoader,
    //       useFactory: HttpLoaderFactory
    //     },
    //     defaultLanguage: 'ru'
    //   })
    // ),
    
    // PWA Support
    provideServiceWorker('ngsw-worker.js', {
      enabled: false, // Включим позже
      registrationStrategy: 'registerWhenStable:30000'
    })
  ]
};
