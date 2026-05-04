import { Component, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { EnvironmentService } from '../../services/environment.service';

@Component({
	selector: 'app-login',
	standalone: true,
	imports: [FormsModule],
	template: `
		<main class="login-shell">
			<h1>Sign in</h1>
			@if (error()) { <div class="error" role="alert">{{ error() }}</div> }
			<label>
				<span>Password</span>
				<input type="password" [(ngModel)]="password" autocomplete="current-password" required />
			</label>
			<button type="button" (click)="submit()" [disabled]="submitting()">
				{{ submitting() ? 'Signing in…' : 'Sign in' }}
			</button>
		</main>
	`,
})
export class LoginPage {
	password = '';
	error = signal('');
	submitting = signal(false);
	private env = inject(EnvironmentService);

	constructor(private router: Router, private route: ActivatedRoute) {}

	async submit() {
		if (!this.password || this.submitting()) return;
		this.submitting.set(true);
		this.error.set('');
		try {
			const resp = await fetch(`${this.env.getApiGatewayUrl()}/auth/login`, {
				method: 'POST',
				credentials: 'include',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ username: 'jeff', password: this.password }),
			});
			if (resp.ok) {
				const next = this.route.snapshot.queryParamMap.get('next') ?? '/dashboard';
				this.router.navigateByUrl(next);
			} else if (resp.status === 429) {
				this.error.set('Too many attempts. Try again in a few minutes.');
			} else {
				this.error.set('Invalid password.');
			}
		} catch {
			this.error.set('Something went wrong. Try again.');
		} finally {
			this.submitting.set(false);
		}
	}
}
