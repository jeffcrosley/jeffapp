import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
  APP_INITIALIZER,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { appRoutes } from './app.routes';
import { EnvironmentService } from './services/environment.service';

function initEnv(env: EnvironmentService) {
  return () => env.loadConfig();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(appRoutes),
    {
      provide: APP_INITIALIZER,
      multi: true,
      deps: [EnvironmentService],
      useFactory: initEnv,
    },
  ],
};
