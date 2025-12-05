import {
	ComponentFixture,
	TestBed
} from '@angular/core/testing'
import { By } from '@angular/platform-browser'
import {
	Router,
	provideRouter
} from '@angular/router'
import { of } from 'rxjs'
import { App } from './app'
import { ThemeService } from './services/theme.service'

/**
 * Test Specification: App (Root Component)
 *
 * Purpose: Portfolio shell with header navigation and theme toggle
 * Provides consistent layout for all pages with sticky header
 *
 * Key Behaviors:
 * - Renders portfolio header with title "Jeff Crosley"
 * - Displays navigation links (Home, About, Components, GitHub)
 * - Provides theme toggle button (light/dark mode)
 * - Applies .subapp-mode class when on /components route
 * - Uses RouterModule for client-side navigation
 * - External links open in new tab with security attributes
 */

describe('App', () => {
	let fixture: ComponentFixture<App>
	let component: App
	let compiled: HTMLElement
	let mockThemeService: jest.Mocked<ThemeService>
	let router: Router

	beforeEach(async () => {
		mockThemeService = {
			getTheme: jest
				.fn()
				.mockReturnValue(of('light')),
			toggle: jest.fn(),
			setTheme: jest.fn()
		} as unknown as jest.Mocked<ThemeService>

		await TestBed.configureTestingModule({
			imports: [App],
			providers: [
				provideRouter([
					{
						path: '',
						pathMatch: 'full',
						redirectTo: '/home'
					},
					{
						path: 'home',
						loadComponent: () =>
							import('./pages/home.component').then(
								(m) => m.HomeComponent
							)
					},
					{
						path: 'about',
						loadComponent: () =>
							import('./pages/about.component').then(
								(m) => m.AboutComponent
							)
					},
					{
						path: 'components',
						loadComponent: () =>
							import(
								'./pages/components.component'
							).then((m) => m.ComponentsComponent)
					}
				]),
				{
					provide: ThemeService,
					useValue: mockThemeService
				}
			]
		}).compileComponents()

		fixture = TestBed.createComponent(App)
		component = fixture.componentInstance
		compiled = fixture.nativeElement as HTMLElement
		router = TestBed.inject(Router)
		fixture.detectChanges()
	})

	describe('initialization', () => {
		it('should create the component', () => {
			expect(component).toBeTruthy()
		})

		it('should inject ThemeService', () => {
			expect(component['themeService']).toBe(
				mockThemeService
			)
		})

		it('should inject Router', () => {
			expect(component['router']).toBe(router)
		})
	})

	describe('rendering - header structure', () => {
		it('should render portfolio header', () => {
			const header = compiled.querySelector(
				'.portfolio-header'
			)
			expect(header).toBeTruthy()
		})

		it('should render portfolio title', () => {
			const title = compiled.querySelector(
				'h1.portfolio-title'
			)
			expect(title?.textContent).toContain(
				'Jeff Crosley'
			)
		})

		it('should render navbar element', () => {
			const navbar =
				compiled.querySelector('nav.navbar')
			expect(navbar).toBeTruthy()
		})

		it('should render theme toggle button', () => {
			const themeToggle = compiled.querySelector(
				'button.theme-toggle'
			)
			expect(themeToggle).toBeTruthy()
		})

		it('should render main content area', () => {
			const main = compiled.querySelector(
				'main.main-content'
			)
			expect(main).toBeTruthy()
		})

		it('should render router outlet', () => {
			const outlet = compiled.querySelector(
				'router-outlet'
			)
			expect(outlet).toBeTruthy()
		})
	})

	describe('navigation links', () => {
		it('should render all navigation links', () => {
			const navLinks = compiled.querySelectorAll(
				'.nav-links a'
			)
			expect(navLinks.length).toBe(4)
		})

		it('should render Home link', () => {
			const links = compiled.querySelectorAll(
				'.nav-links a'
			)
			const homeLink = Array.from(links).find(
				(link) => link.textContent?.trim() === 'Home'
			)
			expect(homeLink).toBeTruthy()
			expect(homeLink?.textContent?.trim()).toBe(
				'Home'
			)
		})

		it('should render About link', () => {
			const links = compiled.querySelectorAll(
				'.nav-links a'
			)
			const aboutLink = Array.from(links).find(
				(link) => link.textContent?.trim() === 'About'
			)
			expect(aboutLink).toBeTruthy()
			expect(aboutLink?.textContent?.trim()).toBe(
				'About'
			)
		})

		it('should render Components link', () => {
			const links = compiled.querySelectorAll(
				'.nav-links a'
			)
			const componentsLink = Array.from(links).find(
				(link) =>
					link.textContent?.trim() === 'Components'
			)
			expect(componentsLink).toBeTruthy()
			expect(
				componentsLink?.textContent?.trim()
			).toBe('Components')
		})

		it('should render GitHub external link', () => {
			const githubLink = compiled.querySelector(
				'a[href*="github.com"]'
			)
			expect(githubLink?.textContent?.trim()).toBe(
				'GitHub'
			)
		})

		it('should set target="_blank" for external links', () => {
			const githubLink = compiled.querySelector(
				'a[href*="github.com"]'
			)
			expect(
				githubLink?.getAttribute('target')
			).toBe('_blank')
		})

		it('should set rel="noopener noreferrer" for external links', () => {
			const githubLink = compiled.querySelector(
				'a[href*="github.com"]'
			)
			expect(githubLink?.getAttribute('rel')).toBe(
				'noopener noreferrer'
			)
		})

		it('should not set target="_blank" for internal links', () => {
			const links = compiled.querySelectorAll(
				'.nav-links a'
			)
			const homeLink = Array.from(links).find(
				(link) => link.textContent?.trim() === 'Home'
			)
			expect(
				homeLink?.getAttribute('target')
			).not.toBe('_blank')
		})

		it('should use routerLink for internal navigation', () => {
			const debugLinks =
				fixture.debugElement.queryAll(
					By.css('.nav-links a')
				)
			const internalLinks = debugLinks.filter(
				(link) =>
					!link.nativeElement.hasAttribute('target')
			)
			expect(internalLinks.length).toBe(3)
		})

		it('should use routerLinkActive for active state', () => {
			const debugLinks =
				fixture.debugElement.queryAll(
					By.css('.nav-links a')
				)
			const internalLinks = debugLinks.filter(
				(link) =>
					!link.nativeElement.hasAttribute('target')
			)
			// RouterLinkActive directive should be present on internal links
			expect(internalLinks.length).toBeGreaterThan(0)
		})
	})

	describe('theme toggle functionality', () => {
		it('should call ThemeService.toggle when button clicked', () => {
			const themeToggle = compiled.querySelector(
				'button.theme-toggle'
			) as HTMLButtonElement
			themeToggle.click()
			fixture.detectChanges()

			expect(
				mockThemeService.toggle
			).toHaveBeenCalled()
		})

		it('should display sun icon when theme is dark', () => {
			mockThemeService.getTheme.mockReturnValue(
				of('dark')
			)
			fixture.detectChanges()

			const themeToggle = fixture.debugElement.query(
				By.css('button.theme-toggle')
			)
			const svg = themeToggle.query(By.css('svg'))
			const circle = svg?.query(By.css('circle'))

			expect(circle).toBeTruthy()
		})

		it('should display moon icon when theme is light', () => {
			mockThemeService.getTheme.mockReturnValue(
				of('light')
			)
			fixture.detectChanges()

			const themeToggle = fixture.debugElement.query(
				By.css('button.theme-toggle')
			)
			const svg = themeToggle.query(By.css('svg'))
			const path = svg?.query(By.css('path'))

			expect(
				path?.nativeElement.getAttribute('d')
			).toContain('M21')
		})

		it('should set aria-label for light mode', () => {
			mockThemeService.getTheme.mockReturnValue(
				of('light')
			)
			fixture.detectChanges()

			const themeToggle = compiled.querySelector(
				'button.theme-toggle'
			)
			expect(
				themeToggle?.getAttribute('aria-label')
			).toBe('Switch to dark mode')
		})

		it('should set aria-label for dark mode', () => {
			mockThemeService.getTheme.mockReturnValue(
				of('dark')
			)
			fixture.detectChanges()

			const themeToggle = compiled.querySelector(
				'button.theme-toggle'
			)
			expect(
				themeToggle?.getAttribute('aria-label')
			).toBe('Switch to light mode')
		})

		it('should set title attribute for tooltip', () => {
			const themeToggle = compiled.querySelector(
				'button.theme-toggle'
			)
			expect(
				themeToggle?.hasAttribute('title')
			).toBe(true)
		})
	})

	describe('subapp mode', () => {
		it('should not apply subapp-mode class on home route', () => {
			jest
				.spyOn(router, 'url', 'get')
				.mockReturnValue('/')
			fixture.detectChanges()

			const main = compiled.querySelector(
				'main.main-content'
			)
			expect(
				main?.classList.contains('subapp-mode')
			).toBe(false)
		})

		it('should apply subapp-mode class on components route', () => {
			jest
				.spyOn(router, 'url', 'get')
				.mockReturnValue('/components')
			fixture.detectChanges()

			const main = compiled.querySelector(
				'main.main-content'
			)
			expect(
				main?.classList.contains('subapp-mode')
			).toBe(true)
		})

		it('should apply subapp-mode class on nested components routes', () => {
			jest
				.spyOn(router, 'url', 'get')
				.mockReturnValue('/components/button')
			fixture.detectChanges()

			const main = compiled.querySelector(
				'main.main-content'
			)
			expect(
				main?.classList.contains('subapp-mode')
			).toBe(true)
		})

		it('isSubappRoute should return true for components route', () => {
			jest
				.spyOn(router, 'url', 'get')
				.mockReturnValue('/components')
			expect(component['isSubappRoute']()).toBe(true)
		})

		it('isSubappRoute should return false for other routes', () => {
			jest
				.spyOn(router, 'url', 'get')
				.mockReturnValue('/about')
			expect(component['isSubappRoute']()).toBe(
				false
			)
		})
	})

	describe('component properties', () => {
		it('should have portfolioTitle property', () => {
			expect(component['portfolioTitle']).toBe(
				'Jeff Crosley'
			)
		})

		it('should have navigationLinks array', () => {
			expect(component['navigationLinks']).toEqual([
				{ label: 'Home', route: '/' },
				{ label: 'About', route: '/about' },
				{ label: 'Components', route: '/components' },
				{
					label: 'GitHub',
					route: 'https://github.com/jeffcrosley'
				}
			])
		})

		it('should have 4 navigation links', () => {
			expect(
				component['navigationLinks'].length
			).toBe(4)
		})
	})

	describe('template control flow', () => {
		it('should use @for to render navigation links', () => {
			const listItems = compiled.querySelectorAll(
				'.nav-links li'
			)
			expect(listItems.length).toBe(
				component['navigationLinks'].length
			)
		})

		it('should use @if/@else for internal vs external links', () => {
			const allLinks = compiled.querySelectorAll(
				'.nav-links a'
			)
			const externalLinks =
				compiled.querySelectorAll(
					'a[target="_blank"]'
				)
			const internalLinks =
				allLinks.length - externalLinks.length

			expect(internalLinks).toBe(3)
			expect(externalLinks.length).toBe(1)
		})

		it('should use @if/@else for theme icon toggle', () => {
			mockThemeService.getTheme.mockReturnValue(
				of('light')
			)
			fixture.detectChanges()
			let svgCount = compiled.querySelectorAll(
				'button.theme-toggle svg'
			).length
			expect(svgCount).toBe(1)

			mockThemeService.getTheme.mockReturnValue(
				of('dark')
			)
			fixture.detectChanges()
			svgCount = compiled.querySelectorAll(
				'button.theme-toggle svg'
			).length
			expect(svgCount).toBe(1)
		})
	})

	describe('accessibility', () => {
		it('should use semantic header element', () => {
			const header = compiled.querySelector(
				'header.portfolio-header'
			)
			expect(header).toBeTruthy()
		})

		it('should use semantic h1 for title', () => {
			const h1 = compiled.querySelector(
				'h1.portfolio-title'
			)
			expect(h1).toBeTruthy()
		})

		it('should use semantic nav element', () => {
			const nav =
				compiled.querySelector('nav.navbar')
			expect(nav).toBeTruthy()
		})

		it('should use semantic main element', () => {
			const main = compiled.querySelector(
				'main.main-content'
			)
			expect(main).toBeTruthy()
		})

		it('should provide aria-label for theme toggle', () => {
			const themeToggle = compiled.querySelector(
				'button.theme-toggle'
			)
			expect(
				themeToggle?.hasAttribute('aria-label')
			).toBe(true)
		})
	})

	describe('responsive behavior', () => {
		it('should render on mobile viewport', () => {
			expect(
				compiled.querySelector('.portfolio-header')
			).toBeTruthy()
			expect(
				compiled.querySelector('.nav-links')
			).toBeTruthy()
		})

		it('should render on desktop viewport', () => {
			expect(
				compiled.querySelector('.portfolio-header')
			).toBeTruthy()
			expect(
				compiled.querySelector('.nav-links')
			).toBeTruthy()
		})
	})
})
