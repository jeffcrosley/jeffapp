import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { OidcAuthService } from '../../services/oidc-auth.service';
import { EnvironmentService } from '../../services/environment.service';

const ERROR_MESSAGES: Record<string, string> = {
  access_denied: 'Access denied. Your account is not authorized to use this app.',
  auth_error: 'Authentication failed. Please try again.',
  missing_params: 'Invalid login response. Please try again.',
  invalid_state: 'Login session expired. Please try again.',
  token_exchange_failed: 'Could not complete sign-in. Please try again.',
  invalid_id_token: 'Identity verification failed. Please try again.',
  session_error: 'Could not create session. Please try again.',
};

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  template: `
    @if (errorMessage()) {
      <div class="callback-error" role="alert">
        <p>{{ errorMessage() }}</p>
        <a class="callback-retry" href="/auth/login">Try signing in again</a>
      </div>
    } @else {
      <p class="callback-loading">Signing in<span class="callback-dots">...</span></p>
    }
  `,
  styles: `
    .callback-loading {
      text-align: center;
      padding: 4rem 1rem;
      color: var(--color-text-secondary);
      font-size: 1.1rem;
    }
    .callback-error {
      text-align: center;
      padding: 4rem 1rem;
      color: var(--color-error, #d32f2f);
    }
    .callback-retry {
      display: inline-block;
      margin-top: 1rem;
      color: var(--color-primary, #1976d2);
    }
  `,
})
export class AuthCallbackComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private oidc = inject(OidcAuthService);
  private env = inject(EnvironmentService);

  errorMessage = signal('');

  async ngOnInit(): Promise<void> {
    const params = this.route.snapshot.queryParamMap;

    // Error returned by Authentik or the BFF callback handler
    const error = params.get('error');
    if (error) {
      this.errorMessage.set(ERROR_MESSAGES[error] ?? 'Sign-in failed. Please try again.');
      return;
    }

    const code = params.get('code');
    const state = params.get('state');

    if (!code || !state) {
      this.router.navigateByUrl('/');
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
      this.errorMessage.set('Sign-in failed. Please try again.');
    }
  }
}
