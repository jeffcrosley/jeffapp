import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

import { EnvironmentService } from './app/services/environment.service';
// Load runtime config before bootstrapping
const envService = new EnvironmentService();
envService
	.loadConfig()
	.then(() => {
		bootstrapApplication(App, appConfig).catch((err) => console.error(err));
	})
	.catch((err) => {
		console.error('Failed to load config, bootstrapping anyway:', err);
		bootstrapApplication(App, appConfig).catch((err) => console.error(err));
	});
