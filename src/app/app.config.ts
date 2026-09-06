import { APP_INITIALIZER, ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { credentialsInterceptor } from './auth/interceptors/credentials-interceptor';
import { Auth } from './auth/service/auth';

import { ThemeService } from './shared/services/theme.service';

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
    provideHttpClient(withInterceptors([credentialsInterceptor])),
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
    }
  ]
};
