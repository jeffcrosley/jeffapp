import {
	APP_INITIALIZER,
	ApplicationConfig,
	provideBrowserGlobalErrorListeners,
	provideZoneChangeDetection
} from '@angular/core'
import { provideHttpClient } from '@angular/common/http'
import { provideRouter } from '@angular/router'
import { appRoutes } from './app.routes'
import { EnvironmentService } from './services/environment.service'
import { AuthService } from './services/auth.service'

function initEnv(env: EnvironmentService) {
	return () => env.loadConfig()
}

function initAuth(auth: AuthService) {
	return () => auth.checkAuth()
}

export const appConfig: ApplicationConfig = {
	providers: [
		provideBrowserGlobalErrorListeners(),
		provideZoneChangeDetection({
			eventCoalescing: true
		}),
		provideHttpClient(),
		provideRouter(appRoutes),
		{
			provide: APP_INITIALIZER,
			multi: true,
			deps: [EnvironmentService],
			useFactory: initEnv
		},
		{
			provide: APP_INITIALIZER,
			multi: true,
			deps: [AuthService],
			useFactory: initAuth
		}
	]
}
