import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { routes } from './app.routes';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './account/services/auth/auth-service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideAppInitializer(() => {
      const authService = inject(AuthService);
      return firstValueFrom(authService.refresh());
    })
  ]
};
