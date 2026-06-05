import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { EnvironmentService } from '../services/environment.service';

export const authGuard: CanActivateFn = async () => {
	const auth = inject(AuthService);
	const env = inject(EnvironmentService);
	const ok = await auth.checkAuth();
	if (!ok) {
		window.location.href = `${env.getApiGatewayUrl()}/auth/login`;
		return false;
	}
	return true;
};
