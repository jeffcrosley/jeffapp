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
			if (!base) {
				this.isLoggedIn.set(false);
				return false;
			}
			await firstValueFrom(this.http.get(`${base}/auth/me`, { withCredentials: true }));
			this.isLoggedIn.set(true);
			return true;
		} catch {
			this.isLoggedIn.set(false);
			return false;
		}
	}

	async logout(): Promise<void> {
		try {
			await firstValueFrom(this.http.post(`${this.env.getApiGatewayUrl()}/auth/logout`, {}, { withCredentials: true }));
		} catch {
			// swallow logout errors — session cleanup proceeds regardless
		}
		this.isLoggedIn.set(false);
		this.router.navigateByUrl('/login');
	}
}
