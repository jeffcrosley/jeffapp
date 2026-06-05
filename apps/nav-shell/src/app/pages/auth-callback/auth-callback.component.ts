import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { OidcAuthService } from '../../services/oidc-auth.service';
import { EnvironmentService } from '../../services/environment.service';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  template: `<p class="callback-loading">Signing in...</p>`,
  styles: `.callback-loading { text-align: center; padding: 4rem 1rem; color: var(--color-text-secondary); }`,
})
export class AuthCallbackComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private oidc = inject(OidcAuthService);
  private env = inject(EnvironmentService);

  async ngOnInit(): Promise<void> {
    const params = this.route.snapshot.queryParamMap;
    const code = params.get('code');
    const state = params.get('state');

    if (!code || !state) {
      this.router.navigateByUrl('/home');
      return;
    }

    // BFF flow: PKCE is stored server-side, no sessionStorage entry
    // Forward the code+state to the BFF callback handler which handles exchange
    if (!sessionStorage.getItem('oidc_code_verifier')) {
      const bffCallback = `${this.env.getApiGatewayUrl()}/auth/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`;
      window.location.href = bffCallback;
      return;
    }

    // Legacy OidcAuthService flow (traffic-light direct OIDC — transitional only)
    const ok = await this.oidc.handleCallback(code, state);
    if (!ok) {
      this.router.navigateByUrl('/home');
    }
  }
}
