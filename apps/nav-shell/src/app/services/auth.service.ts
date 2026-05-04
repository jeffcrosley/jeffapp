import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
	isLoggedIn = signal(false);

	constructor(private http: HttpClient, private router: Router) {}

	async checkAuth(): Promise<boolean> {
		try {
			await firstValueFrom(this.http.get('/auth/me', { withCredentials: true }));
			this.isLoggedIn.set(true);
			return true;
		} catch {
			this.isLoggedIn.set(false);
			return false;
		}
	}

	async logout(): Promise<void> {
		try {
			await firstValueFrom(this.http.post('/auth/logout', {}, { withCredentials: true }));
		} catch {}
		this.isLoggedIn.set(false);
		this.router.navigateByUrl('/login');
	}
}
