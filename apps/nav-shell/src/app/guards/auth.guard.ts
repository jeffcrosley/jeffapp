import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = async (route) => {
	const auth = inject(AuthService);
	const router = inject(Router);
	const ok = await auth.checkAuth();
	if (!ok) return router.parseUrl(`/login?next=${route.url}`);
	return true;
};
