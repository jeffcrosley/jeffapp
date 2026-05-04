import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
	selector: 'app-login',
	standalone: true,
	imports: [FormsModule],
	template: `
		<main class="login-shell">
			<h1>Sign in</h1>
			@if (error()) {
				<div class="error" role="alert">{{ error() }}</div>
			}
			<label>
				<span>Password</span>
				<input
					type="password"
					[(ngModel)]="password"
					autocomplete="current-password"
					required
				/>
			</label>
			<button type="button" (click)="submit()" [disabled]="submitting()">
				{{ submitting() ? 'Signing in…' : 'Sign in' }}
			</button>
		</main>
	`,
	styles: [`
		.login-shell {
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			min-height: 100vh;
			gap: 1rem;
			padding: 2rem;
		}

		label {
			display: flex;
			flex-direction: column;
			gap: 0.5rem;
			width: 100%;
			max-width: 320px;
		}

		input {
			width: 100%;
		}

		button {
			min-height: 44px;
			width: 100%;
			max-width: 320px;
		}

		.error {
			color: var(--color-error, #c0392b);
			font-size: 0.9rem;
		}
	`],
})
export class LoginPage {
	password = '';
	error = signal('');
	submitting = signal(false);

	constructor(private router: Router, private route: ActivatedRoute) {}

	async submit() {
		if (!this.password || this.submitting()) return;
		this.submitting.set(true);
		this.error.set('');
		try {
			const resp = await fetch('/auth/login', {
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
