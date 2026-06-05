import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { EnvironmentService } from './environment.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
	isLoggedIn = signal(false);
	private http = inject(HttpClient);
	private router = inject(Router);
	private env = inject(EnvironmentService);

	async checkAuth(): Promise<boolean> {
		try {
			const base = this.env.getApiGatewayUrl();
			if (!base) { this.isLoggedIn.set(false); return false; }
			const resp = await fetch(`${base}/auth/me`, {
				credentials: 'include',
				cache: 'no-store',
			});
			this.isLoggedIn.set(resp.ok);
			return resp.ok;
		} catch {
			this.isLoggedIn.set(false);
			return false;
		}
	}

	async logout(): Promise<void> {
		let endSessionUrl: string | null = null;
		try {
			const resp = await firstValueFrom(
				this.http.post<{ ok: boolean; endSessionUrl?: string }>(
					`${this.env.getApiGatewayUrl()}/auth/logout`,
					{},
					{ withCredentials: true }
				)
			);
			endSessionUrl = resp.endSessionUrl ?? null;
		} catch {
			// swallow logout errors — session cleanup proceeds regardless
		}
		this.isLoggedIn.set(false);
		if (endSessionUrl) {
			// OIDC session: redirect through Authentik end-session to clear SSO session
			window.location.href = endSessionUrl;
		} else {
			this.router.navigateByUrl('/');
		}
	}
}
