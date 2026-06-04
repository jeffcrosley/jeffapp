import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { OidcAuthService } from '../services/oidc-auth.service';

export const oidcAuthGuard: CanActivateFn = async (route) => {
  const oidc = inject(OidcAuthService);

  if (oidc.isAuthenticated()) return true;

  const fullPath = route.url.map((s) => s.path).join('/') || 'traffic-light';
  await oidc.login(`/${fullPath}`);
  return false;
};
