import { CommonModule } from '@angular/common'
import { Component, inject } from '@angular/core'
import {
	Router,
	RouterModule
} from '@angular/router'
import { FeatureStatus } from './services/feature-visibility.service'
import { ThemeService } from './services/theme.service'

export interface NavLink {
	label: string
	route: string
	status: FeatureStatus
	external?: boolean
}

@Component({
	selector: 'app-root',
	imports: [CommonModule, RouterModule],
	template: `
		<header class="portfolio-header">
			<div class="header-container">
				<h1 class="portfolio-title">
					{{ portfolioTitle }}
				</h1>
				<nav class="navbar">
					<ul class="nav-links">
						@for (link of navigationLinks; track
						link.label) {
						<li>
							@if (link.route.startsWith('/')) {
							<a
								[routerLink]="link.route"
								routerLinkActive="active"
								[routerLinkActiveOptions]="{
									exact: false
								}"
							>
								{{ link.label }}
							</a>
							} @else {
							<a
								[href]="link.route"
								target="_blank"
								rel="noopener noreferrer"
							>
								{{ link.label }}
							</a>
							}
						</li>
						}
					</ul>
				</nav>
				<button
					class="theme-toggle"
					(click)="toggleTheme()"
					[attr.aria-label]="
						(themeService.getTheme() | async) === 'dark'
							? 'Switch to light mode'
							: 'Switch to dark mode'
					"
					[title]="
						(themeService.getTheme() | async) === 'dark'
							? 'Switch to light mode'
							: 'Switch to dark mode'
					"
				>
					@if ((themeService.getTheme() | async) ===
					'dark') {
					<!-- Sun icon for dark mode (click to switch to light) -->
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<circle cx="12" cy="12" r="5"></circle>
						<line x1="12" y1="1" x2="12" y2="3"></line>
						<line
							x1="12"
							y1="21"
							x2="12"
							y2="23"
						></line>
						<line
							x1="4.22"
							y1="4.22"
							x2="5.64"
							y2="5.64"
						></line>
						<line
							x1="18.36"
							y1="18.36"
							x2="19.78"
							y2="19.78"
						></line>
						<line x1="1" y1="12" x2="3" y2="12"></line>
						<line
							x1="21"
							y1="12"
							x2="23"
							y2="12"
						></line>
						<line
							x1="4.22"
							y1="19.78"
							x2="5.64"
							y2="18.36"
						></line>
						<line
							x1="18.36"
							y1="5.64"
							x2="19.78"
							y2="4.22"
						></line>
					</svg>
					} @else {
					<!-- Moon icon for light mode (click to switch to dark) -->
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path
							d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
						></path>
					</svg>
					}
				</button>
			</div>
		</header>

		<main
			class="main-content"
			[class.subapp-mode]="isSubappRoute()"
		>
			<router-outlet></router-outlet>
		</main>
	`,
	styles: [
		`
			:host {
				display: flex;
				flex-direction: column;
				height: 100vh;
			}

			// ============================================================================
			// Portfolio Header & Navigation Styles
			// ============================================================================
			.portfolio-header {
				background-color: var(--color-sapphire-600);
				color: var(--color-slate-50);
				box-shadow: var(--shadow-md);
				position: sticky;
				top: 0;
				z-index: var(--z-sticky);
				transition: background-color
						var(--duration-normal) var(--ease-out),
					box-shadow var(--duration-normal)
						var(--ease-out);
				flex-shrink: 0;

				.header-container {
					max-width: 1200px;
					margin: 0 auto;
					padding: var(--space-4) var(--space-6);
					display: flex;
					justify-content: space-between;
					align-items: center;
					flex-wrap: wrap;
					gap: var(--space-6);

					@media (max-width: 768px) {
						flex-direction: column;
						align-items: flex-start;
						gap: var(--space-4);
						padding: var(--space-3) var(--space-4);
					}
				}

				.portfolio-title {
					color: var(--color-slate-50);
					margin: 0;
					font-size: var(--font-size-3xl);
					font-weight: var(--font-weight-bold);
					letter-spacing: 0.5px;
					flex-shrink: 0;

					@media (max-width: 768px) {
						font-size: var(--font-size-2xl);
					}
				}

				.navbar {
					flex-grow: 1;

					@media (max-width: 768px) {
						width: 100%;
					}
				}

				.nav-links {
					list-style: none;
					display: flex;
					gap: var(--space-6);
					margin: 0;
					padding: 0;

					@media (max-width: 768px) {
						flex-direction: column;
						gap: var(--space-3);
					}

					li {
						a {
							color: var(--color-slate-50);
							text-decoration: none;
							font-weight: var(--font-weight-medium);
							font-size: var(--font-size-base);
							padding: var(--space-2) var(--space-3);
							border-radius: var(--radius-md);
							transition: all var(--duration-fast)
								var(--ease-out);
							display: inline-block;

							&:hover {
								background-color: rgba(
									255,
									255,
									255,
									0.1
								);
								color: #93c5fd;
							}

							&.active {
								background-color: rgba(
									255,
									255,
									255,
									0.2
								);
								color: white;
								font-weight: var(--font-weight-semibold);
							}

							&:focus-visible {
								outline: 2px solid var(--color-focus-ring);
								outline-offset: 2px;
							}
						}
					}
				}

				.theme-toggle {
					background: transparent;
					border: 2px solid var(--color-slate-50);
					color: var(--color-slate-50);
					padding: var(--space-2);
					border-radius: var(--radius-md);
					cursor: pointer;
					display: flex;
					align-items: center;
					justify-content: center;
					transition: all var(--duration-fast)
						var(--ease-out);
					flex-shrink: 0;

					&:hover {
						background-color: rgba(255, 255, 255, 0.1);
						border-color: #93c5fd;
						color: #93c5fd;
						transform: rotate(15deg);
					}

					&:focus-visible {
						outline: 2px solid var(--color-focus-ring);
						outline-offset: 2px;
					}

					svg {
						display: block;
						width: 20px;
						height: 20px;
					}
				}
			}

			// ============================================================================
			// Main Content Area
			// ============================================================================
			.main-content {
				flex: 1;
				max-width: 1200px;
				margin: 0 auto;
				padding: var(--space-10) var(--space-4);
				overflow-y: auto;
				width: 100%;

				@media (max-width: 768px) {
					padding: var(--space-6) var(--space-3);
				}

				// Subapp mode: remove all padding/margin and fill available space
				&.subapp-mode {
					max-width: none;
					margin: 0;
					padding: 0;
					overflow: hidden;
					display: flex;
					flex-direction: column;
				}
			}
		`
	]
})
export class App {
	protected portfolioTitle = 'Jeff Crosley'
	protected router = inject(Router)
	protected themeService = inject(ThemeService)

	protected navigationLinks = [
		{ label: 'Home', route: '/' },
		{ label: 'About', route: '/about' },
		{ label: 'Components', route: '/components' },
		{
			label: 'GitHub',
			route: 'https://github.com/jeffcrosley'
		}
	]

	protected isSubappRoute(): boolean {
		return this.router.url.startsWith('/components')
	}

	protected toggleTheme(): void {
		this.themeService.toggle()
	}
}
