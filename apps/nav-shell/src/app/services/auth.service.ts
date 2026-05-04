import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { EnvironmentService } from './environment.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
	isLoggedIn = signal(false);

	constructor(private http: HttpClient, private router: Router, private env: EnvironmentService) {}

	async checkAuth(): Promise<boolean> {
		try {
			await firstValueFrom(this.http.get(`${this.env.getApiGatewayUrl()}/auth/me`, { withCredentials: true }));
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
		} catch {}
		this.isLoggedIn.set(false);
		this.router.navigateByUrl('/login');
	}
}
