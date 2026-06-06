import { inject } from '@angular/core';
import { CanActivateFn, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { EnvironmentService } from '../services/environment.service';

export const authGuard: CanActivateFn = async (_route, state: RouterStateSnapshot) => {
	const auth = inject(AuthService);
	const env = inject(EnvironmentService);
	// APP_INITIALIZER already called checkAuth(); use the cached signal value.
	// Re-check only if signal says not logged in (covers direct navigation after expiry).
	const ok = auth.isLoggedIn() || await auth.checkAuth();
	if (!ok) {
		sessionStorage.setItem('auth_return_url', state.url);
		window.location.href = `${env.getApiGatewayUrl()}/auth/login`;
		return false;
	}
	return true;
};
