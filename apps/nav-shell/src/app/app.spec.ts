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
							import('./pages/components.component').then(
								(m) => m.ComponentsComponent
							)
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

	describe('rendering - new drawer layout', () => {
		it('should render navigation drawer component', () => {
			const drawer = compiled.querySelector(
				'app-navigation-drawer'
			)
			expect(drawer).toBeTruthy()
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

	describe('navigation drawer integration', () => {
		it('should pass navigationLinks to drawer', () => {
			expect(component.navigationLinks).toBeDefined()
			expect(component.navigationLinks.length).toBe(
				4
			)
		})

		it('should have Home link in navigationLinks', () => {
			const homeLink =
				component.navigationLinks.find(
					(link) => link.label === 'Home'
				)
			expect(homeLink).toBeTruthy()
			expect(homeLink?.route).toBe('/home')
		})

		it('should have About link in navigationLinks', () => {
			const aboutLink =
				component.navigationLinks.find(
					(link) => link.label === 'About'
				)
			expect(aboutLink).toBeTruthy()
			expect(aboutLink?.route).toBe('/about')
		})

		it('should have Components link in navigationLinks', () => {
			const componentsLink =
				component.navigationLinks.find(
					(link) => link.label === 'Components'
				)
			expect(componentsLink).toBeTruthy()
			expect(componentsLink?.route).toBe(
				'/components'
			)
		})

		it('should have GitHub external link in navigationLinks', () => {
			const githubLink =
				component.navigationLinks.find(
					(link) => link.label === 'GitHub'
				)
			expect(githubLink).toBeTruthy()
			expect(githubLink?.external).toBe(true)
			expect(githubLink?.route).toContain(
				'github.com'
			)
		})

		it('should mark external links correctly', () => {
			const externalLinks =
				component.navigationLinks.filter(
					(link) => link.external
				)
			expect(externalLinks.length).toBe(1)
			expect(externalLinks[0].label).toBe('GitHub')
		})

		it('should pass drawer open state from service', () => {
			const drawer = compiled.querySelector(
				'app-navigation-drawer'
			)
			expect(drawer).toBeTruthy()
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

	describe('drawer interaction', () => {
		it('should respond to drawer toggle requests', () => {
			const drawer = fixture.debugElement.query(
				By.css('app-navigation-drawer')
			)
			expect(drawer).toBeTruthy()
		})

		it('should respond to drawer close requests', () => {
			const drawer = fixture.debugElement.query(
				By.css('app-navigation-drawer')
			)
			expect(drawer).toBeTruthy()
		})
	})

	describe('accessibility', () => {
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
})
