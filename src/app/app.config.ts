import { APP_INITIALIZER, ApplicationConfig, provideBrowserGlobalErrorListeners, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { credentialsInterceptor } from './auth/interceptors/credentials-interceptor';
import { authExpiredInterceptor } from './auth/interceptors/auth-expired-interceptor';
import { Auth } from './auth/service/auth';

import { ThemeService } from './shared/services/theme.service';
import { provideServiceWorker } from '@angular/service-worker';

export function initializeApp(auth: Auth) {
  return () => auth.checkSession();
}

export function initializeTheme(themeService: ThemeService) {
  return () => Promise.resolve(); // Theme is set in constructor
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([credentialsInterceptor, authExpiredInterceptor])),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      deps: [Auth],
      multi: true
    },
    {
      provide: APP_INITIALIZER,
      useFactory: initializeTheme,
      deps: [ThemeService],
      multi: true
    }, provideServiceWorker('ngsw-worker.js', {
            enabled: !isDevMode(),
            registrationStrategy: 'registerWhenStable:30000'
          })
  ]
};
