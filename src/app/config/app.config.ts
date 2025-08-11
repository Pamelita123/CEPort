import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from '@routes/app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { loaderInterceptor } from '../services/loader/loader.interceptor';
import { authInterceptor } from '../services/auth/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(),
    provideHttpClient(withInterceptors([authInterceptor, loaderInterceptor])),
    provideClientHydration(withEventReplay())
  ]
};
