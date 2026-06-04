import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { EnvironmentService } from './environment.service';

interface OidcTokens {
  accessToken: string;
  idToken: string;
  expiresAt: number;
}

@Injectable({ providedIn: 'root' })
export class OidcAuthService {
  private env = inject(EnvironmentService);
  private router = inject(Router);
  private tokens = signal<OidcTokens | null>(null);

  isAuthenticated = computed(() => {
    const t = this.tokens();
    return !!t && t.expiresAt > Date.now();
  });

  getAccessToken(): string | null {
    const t = this.tokens();
    if (!t || t.expiresAt <= Date.now()) return null;
    return t.accessToken;
  }

  async login(returnUrl = '/traffic-light'): Promise<void> {
    const verifier = this.generateCodeVerifier();
    const challenge = await this.generateCodeChallenge(verifier);
    const state = crypto.randomUUID();

    sessionStorage.setItem('oidc_code_verifier', verifier);
    sessionStorage.setItem('oidc_state', state);
    sessionStorage.setItem('oidc_return_url', returnUrl);

    const issuer = this.env.getAuthentikIssuer();
    const redirectUri = this.getRedirectUri();

    const params = new URLSearchParams({
      client_id: 'jeffapp',
      response_type: 'code',
      redirect_uri: redirectUri,
      scope: 'openid profile email',
      code_challenge: challenge,
      code_challenge_method: 'S256',
      state,
    });

    window.location.href = `${issuer}authorize/?${params.toString()}`;
  }

  async handleCallback(code: string, state: string): Promise<boolean> {
    const savedState = sessionStorage.getItem('oidc_state');
    const verifier = sessionStorage.getItem('oidc_code_verifier');

    if (!savedState || savedState !== state || !verifier) {
      return false;
    }

    sessionStorage.removeItem('oidc_state');
    sessionStorage.removeItem('oidc_code_verifier');

    const issuer = this.env.getAuthentikIssuer();
    const redirectUri = this.getRedirectUri();

    const resp = await fetch(`${issuer}token/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: 'jeffapp',
        code,
        redirect_uri: redirectUri,
        code_verifier: verifier,
      }).toString(),
    });

    if (!resp.ok) return false;

    const data = await resp.json() as {
      access_token: string;
      id_token: string;
      expires_in: number;
    };

    this.tokens.set({
      accessToken: data.access_token,
      idToken: data.id_token,
      expiresAt: Date.now() + data.expires_in * 1000,
    });

    const returnUrl = sessionStorage.getItem('oidc_return_url') ?? '/traffic-light';
    sessionStorage.removeItem('oidc_return_url');
    this.router.navigateByUrl(returnUrl);
    return true;
  }

  logout(): void {
    this.tokens.set(null);
    this.router.navigateByUrl('/home');
  }

  private getRedirectUri(): string {
    return `${window.location.origin}/auth/callback`;
  }

  private generateCodeVerifier(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return this.base64UrlEncode(array);
  }

  private async generateCodeChallenge(verifier: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return this.base64UrlEncode(new Uint8Array(hash));
  }

  private base64UrlEncode(bytes: Uint8Array): string {
    const binString = Array.from(bytes, (b) => String.fromCharCode(b)).join('');
    return btoa(binString).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
}
