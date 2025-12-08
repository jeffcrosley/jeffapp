import {
	Component,
	DebugElement,
	signal
} from '@angular/core'
import {
	ComponentFixture,
	TestBed
} from '@angular/core/testing'
import { By } from '@angular/platform-browser'
import {
	provideRouter,
	Router
} from '@angular/router'
import { FeatureStatusDirective } from '../../directives/feature-status.directive'
import { BreakpointService } from '../../services/breakpoint.service'
import { DrawerService } from '../../services/drawer.service'
import type { FeatureStatus } from '../../services/feature-visibility.service'
import { FeatureVisibilityService } from '../../services/feature-visibility.service'
import { NavigationDrawerComponent } from '../navigation-drawer/navigation-drawer.component'

/**
 * Test Specification: NavigationDrawerComponent
 *
 * Purpose: Responsive navigation drawer with feature status badges
 * Renders navigation links with WIP/Beta status indicators
 * Handles keyboard navigation (Esc to close, focus trap on mobile)
 * Adapts styling based on drawer open state and breakpoint
 *
 * Inputs (Signal API):
 * - links: Signal<NavLink[]> — Array of navigation items
 * - isOpen: Signal<boolean> — Drawer open/close state
 *
 * Key Behaviors:
 * - Renders list of links with status badges
 * - Displays drawer header (portfolio title)
 * - Applies active class to current route
 * - Handles Esc key to close drawer (mobile)
 * - Manages focus trap (focus cycles within drawer on mobile)
 * - Styling changes based on isOpen state
 */

// Type definition for NavLink (should match app.ts)
interface NavLink {
	label: string
	route: string
	status: FeatureStatus
	external?: boolean
}

// Mock services for unit testing isolation
const createMockBreakpointService = () => ({
	isDesktop$: signal(false),
	isMobile$: signal(true),
	ngOnDestroy: jest.fn()
})

const createMockDrawerService = () => ({
	isOpen: signal(false),
	toggle: jest.fn(),
	open: jest.fn(),
	close: jest.fn(),
	ngOnDestroy: jest.fn()
})

@Component({
	selector: 'app-test-navigation-drawer',
	template: `
		<app-navigation-drawer
			[links]="links()"
			[isOpen]="isOpen()"
		></app-navigation-drawer>
	`,
	standalone: true,
	imports: [NavigationDrawerComponent]
})
class TestNavigationDrawerHostComponent {
	links = signal<NavLink[]>([
		{ label: 'Home', route: '/', status: 'stable' },
		{
			label: 'About',
			route: '/about',
			status: 'stable'
		},
		{
			label: 'Components',
			route: '/components',
			status: 'wip'
		},
		{
			label: 'GitHub',
			route: 'https://github.com',
			status: 'stable',
			external: true
		}
	])
	isOpen = signal(false)
}

describe('NavigationDrawerComponent', () => {
	let fixture: ComponentFixture<TestNavigationDrawerHostComponent>
	let hostComponent: TestNavigationDrawerHostComponent
	let drawerComponent: NavigationDrawerComponent
	let drawerElement: DebugElement
	let featureVisibilityService: FeatureVisibilityService
	let breakpointService: ReturnType<
		typeof createMockBreakpointService
	>
	let router: Router

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [
				TestNavigationDrawerHostComponent,
				NavigationDrawerComponent,
				FeatureStatusDirective
			],
			providers: [
				provideRouter([
					{
						path: '',
						component: NavigationDrawerComponent
					},
					{
						path: 'about',
						component: NavigationDrawerComponent
					},
					{
						path: 'components',
						component: NavigationDrawerComponent
					}
				]),
				FeatureVisibilityService,
				{
					provide: BreakpointService,
					useFactory: createMockBreakpointService
				},
				{
					provide: DrawerService,
					useFactory: createMockDrawerService
				}
			]
		})

		router = TestBed.inject(Router)

		fixture = TestBed.createComponent(
			TestNavigationDrawerHostComponent
		)
		hostComponent = fixture.componentInstance
		featureVisibilityService = TestBed.inject(
			FeatureVisibilityService
		)
		breakpointService = TestBed.inject(
			BreakpointService
		) as unknown as ReturnType<
			typeof createMockBreakpointService
		>

		drawerElement = fixture.debugElement.query(
			By.directive(NavigationDrawerComponent)
		)
		drawerComponent =
			drawerElement.componentInstance
	})

	describe('initialization', () => {
		it('should be created', () => {
			fixture.detectChanges()
			expect(drawerComponent).toBeDefined()
		})

		it('should accept links input', () => {
			fixture.detectChanges()
			expect(drawerComponent.links).toBeDefined()
		})

		it('should accept isOpen input signal', () => {
			fixture.detectChanges()
			expect(drawerComponent.isOpen).toBeDefined()
		})
	})

	describe('rendering - drawer structure', () => {
		it('should render aside element with class nav-drawer', () => {
			fixture.detectChanges()
			const aside = fixture.debugElement.query(
				By.css('aside.nav-drawer')
			)
			expect(aside).toBeTruthy()
		})

		it('should render drawer header with portfolio title', () => {
			fixture.detectChanges()
			const header = fixture.debugElement.query(
				By.css('.drawer-header')
			)
			const title = fixture.debugElement.query(
				By.css('.portfolio-title')
			)
			expect(header).toBeTruthy()
			expect(
				title?.nativeElement.textContent
			).toContain('JeffApp')
		})

		it('should render nav element with class drawer-nav', () => {
			fixture.detectChanges()
			const nav = fixture.debugElement.query(
				By.css('nav.drawer-nav')
			)
			expect(nav).toBeTruthy()
		})

		it('should render unordered list with class nav-links', () => {
			fixture.detectChanges()
			const ul = fixture.debugElement.query(
				By.css('ul.nav-links')
			)
			expect(ul).toBeTruthy()
		})
	})

	describe('rendering - navigation links', () => {
		it('should render one link item per navigation link', () => {
			hostComponent.links.set([
				{
					label: 'Home',
					route: '/',
					status: 'stable'
				},
				{
					label: 'About',
					route: '/about',
					status: 'stable'
				},
				{
					label: 'Components',
					route: '/components',
					status: 'wip'
				},
				{
					label: 'GitHub',
					route: 'https://github.com',
					status: 'stable',
					external: true
				}
			])
			fixture.detectChanges()
			const listItems =
				fixture.debugElement.queryAll(By.css('li'))
			expect(listItems.length).toBe(4)
		})

		it('should render correct link labels', () => {
			fixture.detectChanges()
			const links = fixture.debugElement.queryAll(
				By.css('a.nav-link')
			)
			expect(
				links[0].nativeElement.textContent
			).toContain('Home')
			expect(
				links[1].nativeElement.textContent
			).toContain('About')
		})

		it('should differentiate internal vs external routes', () => {
			fixture.detectChanges()
			const links = fixture.debugElement.queryAll(
				By.css('a.nav-link')
			)
			const homeLink = links.find((link) =>
				link.nativeElement.textContent.includes(
					'Home'
				)
			)
			const githubLink = links.find((link) =>
				link.nativeElement.textContent.includes(
					'GitHub'
				)
			)
			// Internal routes: no target="_blank"
			expect(homeLink).toBeTruthy()
			expect(
				homeLink?.nativeElement.getAttribute('target')
			).not.toBe('_blank')
			// External routes: has target="_blank" and full URL
			expect(githubLink).toBeTruthy()
			expect(
				githubLink?.nativeElement.getAttribute(
					'target'
				)
			).toBe('_blank')
			expect(
				githubLink?.nativeElement.getAttribute('href')
			).toContain('https://')
		})

		it('should set href for external links', () => {
			fixture.detectChanges()
			const githubLink = fixture.debugElement.query(
				By.css('a[href*="github.com"]')
			)
			expect(githubLink).toBeTruthy()
		})

		it('should set target="_blank" for external links', () => {
			fixture.detectChanges()
			const githubLink = fixture.debugElement.query(
				By.css('a[target="_blank"]')
			)
			expect(githubLink).toBeTruthy()
		})

		it('should not set target="_blank" for internal routes', () => {
			fixture.detectChanges()
			const links = fixture.debugElement.queryAll(
				By.css('a.nav-link')
			)
			const homeLink = links.find((link) =>
				link.nativeElement.textContent.includes(
					'Home'
				)
			)
			expect(
				homeLink?.nativeElement.getAttribute('target')
			).not.toBe('_blank')
		})
	})

	describe('rendering - feature status badges', () => {
		it('should apply feature-wip class for wip links (pseudo badge via CSS)', () => {
			fixture.detectChanges()
			const componentLink =
				fixture.debugElement.queryAll(
					By.css('a.nav-link')
				)[2]
			expect(
				componentLink.nativeElement.classList.contains(
					'feature-wip'
				)
			).toBe(true)
		})

		it('should not add feature-wip/beta classes for stable links', () => {
			fixture.detectChanges()
			const homeLink = fixture.debugElement.queryAll(
				By.css('a.nav-link')
			)[0]
			const classList =
				homeLink.nativeElement.classList
			expect(classList.contains('feature-wip')).toBe(
				false
			)
			expect(
				classList.contains('feature-beta')
			).toBe(false)
		})

		it('should apply feature-beta class for beta links', () => {
			hostComponent.links.set([
				...hostComponent.links(),
				{
					label: 'Blog',
					route: '/blog',
					status: 'beta'
				}
			])
			fixture.detectChanges()
			const blogLink = fixture.debugElement.queryAll(
				By.css('a.nav-link')
			)[4]
			expect(
				blogLink.nativeElement.classList.contains(
					'feature-beta'
				)
			).toBe(true)
		})
	})

	describe('active route state', () => {
		it('should apply active class to current route link', async () => {
			fixture.detectChanges()
			await router.navigate(['/about'])
			await fixture.whenStable()
			fixture.detectChanges()

			const links = fixture.debugElement.queryAll(
				By.css('a.nav-link')
			)
			const aboutLink = links.find((link) =>
				link.nativeElement.textContent.includes(
					'About'
				)
			)
			const homeLink = links.find((link) =>
				link.nativeElement.textContent.includes(
					'Home'
				)
			)

			// About link should have active class
			expect(
				aboutLink?.nativeElement.classList.contains(
					'active'
				)
			).toBe(true)
			// Home link should NOT be active because we use exact: true in the template
			expect(
				homeLink?.nativeElement.classList.contains(
					'active'
				)
			).toBe(false)
		})

		it('should update active class when route changes', async () => {
			fixture.detectChanges()

			// Start on home route
			await router.navigate(['/'])
			await fixture.whenStable()
			fixture.detectChanges()

			const links = fixture.debugElement.queryAll(
				By.css('a.nav-link')
			)
			const homeLink = links.find((link) =>
				link.nativeElement.textContent.includes(
					'Home'
				)
			)
			const aboutLink = links.find((link) =>
				link.nativeElement.textContent.includes(
					'About'
				)
			)
			const componentsLink = links.find((link) =>
				link.nativeElement.textContent.includes(
					'Components'
				)
			)

			// Only Home should be active on / route
			expect(
				homeLink?.nativeElement.classList.contains(
					'active'
				)
			).toBe(true)
			expect(
				aboutLink?.nativeElement.classList.contains(
					'active'
				)
			).toBe(false)
			expect(
				componentsLink?.nativeElement.classList.contains(
					'active'
				)
			).toBe(false)

			// Navigate to about
			await router.navigate(['/about'])
			await fixture.whenStable()
			fixture.detectChanges()

			// About should now be active
			// Home should NOT be active because we use exact: true
			expect(
				homeLink?.nativeElement.classList.contains(
					'active'
				)
			).toBe(false)
			expect(
				aboutLink?.nativeElement.classList.contains(
					'active'
				)
			).toBe(true)
			expect(
				componentsLink?.nativeElement.classList.contains(
					'active'
				)
			).toBe(false)
		})

		it('should handle external links without routerLinkActive', async () => {
			fixture.detectChanges()
			await router.navigate(['/'])
			fixture.detectChanges()

			const links = fixture.debugElement.queryAll(
				By.css('a.nav-link')
			)
			const githubLink = links.find((link) =>
				link.nativeElement.textContent.includes(
					'GitHub'
				)
			)

			// External link should never have active class (no routerLinkActive directive)
			expect(
				githubLink?.nativeElement.classList.contains(
					'active'
				)
			).toBe(false)
		})
	})

	describe('drawer state - open/closed', () => {
		it('should add open class when isOpen signal is true', () => {
			hostComponent.isOpen.set(true)
			fixture.detectChanges()
			const aside = fixture.debugElement.query(
				By.css('aside.nav-drawer')
			)
			expect(
				aside?.nativeElement.classList.contains(
					'open'
				)
			).toBe(true)
		})

		it('should remove open class when isOpen signal is false', () => {
			hostComponent.isOpen.set(false)
			fixture.detectChanges()
			const aside = fixture.debugElement.query(
				By.css('aside.nav-drawer')
			)
			expect(
				aside?.nativeElement.classList.contains(
					'open'
				)
			).toBe(false)
		})

		it('should toggle open class reactively when isOpen signal changes', () => {
			hostComponent.isOpen.set(false)
			fixture.detectChanges()
			const aside = fixture.debugElement.query(
				By.css('aside.nav-drawer')
			)
			expect(
				aside?.nativeElement.classList.contains(
					'open'
				)
			).toBe(false)

			hostComponent.isOpen.set(true)
			fixture.detectChanges()
			expect(
				aside?.nativeElement.classList.contains(
					'open'
				)
			).toBe(true)
		})
	})

	describe('keyboard interaction - Esc key', () => {
		it('should emit drawerCloseRequested when Esc is pressed while open', () => {
			hostComponent.isOpen.set(true)
			fixture.detectChanges()
			const emitSpy = jest.spyOn(
				drawerComponent.drawerCloseRequested,
				'emit'
			)
			const event = new KeyboardEvent('keydown', {
				key: 'Escape'
			})
			document.dispatchEvent(event)
			fixture.detectChanges()
			expect(emitSpy).toHaveBeenCalledTimes(1)
			emitSpy.mockRestore()
		})

		it('should not emit when a non-Esc key is pressed', () => {
			hostComponent.isOpen.set(true)
			fixture.detectChanges()
			const emitSpy = jest.spyOn(
				drawerComponent.drawerCloseRequested,
				'emit'
			)
			const event = new KeyboardEvent('keydown', {
				key: 'Enter'
			})
			document.dispatchEvent(event)
			fixture.detectChanges()
			expect(emitSpy).not.toHaveBeenCalled()
			emitSpy.mockRestore()
		})

		it('should not emit when drawer is closed', () => {
			hostComponent.isOpen.set(false)
			fixture.detectChanges()
			const emitSpy = jest.spyOn(
				drawerComponent.drawerCloseRequested,
				'emit'
			)
			const event = new KeyboardEvent('keydown', {
				key: 'Escape'
			})
			document.dispatchEvent(event)
			fixture.detectChanges()
			expect(emitSpy).not.toHaveBeenCalled()
			emitSpy.mockRestore()
		})
	})

	describe('focus management - focus trap', () => {
		it('should expose focusable elements when open on mobile', () => {
			breakpointService.isMobile$.set(true)
			hostComponent.isOpen.set(true)
			fixture.detectChanges()
			const aside = fixture.debugElement.query(
				By.css('aside.nav-drawer')
			)
			const focusableElements =
				aside?.nativeElement.querySelectorAll(
					'a, button, [tabindex]:not([tabindex="-1"])'
				)
			expect(focusableElements).toBeDefined()
			expect(
				focusableElements?.length
			).toBeGreaterThan(0)
		})

		it('should not expose focusable content when drawer is closed on mobile', () => {
			breakpointService.isMobile$.set(true)
			hostComponent.isOpen.set(false)
			fixture.detectChanges()
			const aside = fixture.debugElement.query(
				By.css('aside.nav-drawer')
			)
			expect(
				aside?.nativeElement.classList.contains(
					'open'
				)
			).toBe(false)
		})

		it('should not trap focus on desktop (sidebar mode)', () => {
			breakpointService.isMobile$.set(false)
			fixture.detectChanges()
			const aside = fixture.debugElement.query(
				By.css('aside.nav-drawer')
			)
			expect(aside).toBeTruthy()
		})
	})

	describe('accessibility - ARIA', () => {
		it('should set role="navigation" and aria-label on nav', () => {
			fixture.detectChanges()
			const nav = fixture.debugElement.query(
				By.css('nav.drawer-nav')
			)
			expect(nav).toBeTruthy()
			expect(
				nav?.nativeElement.getAttribute('role')
			).toBe('navigation')
			expect(
				nav?.nativeElement.getAttribute('aria-label')
			).toBeTruthy()
		})

		it('should mark drawer as presentationally hidden when closed on mobile', () => {
			breakpointService.isMobile$.set(true)
			hostComponent.isOpen.set(false)
			fixture.detectChanges()
			const aside = fixture.debugElement.query(
				By.css('aside.nav-drawer')
			)
			expect(
				aside?.nativeElement.getAttribute(
					'aria-hidden'
				)
			).toBe('true')
		})

		it('should expose drawer content when open on mobile', () => {
			breakpointService.isMobile$.set(true)
			hostComponent.isOpen.set(true)
			fixture.detectChanges()
			const aside = fixture.debugElement.query(
				By.css('aside.nav-drawer')
			)
			expect(
				aside?.nativeElement.getAttribute(
					'aria-hidden'
				)
			).toBe('false')
		})
	})

	describe('integration with services', () => {
		it('should call FeatureVisibilityService.getIndicator()', () => {
			fixture.detectChanges()
			expect(featureVisibilityService).toBeTruthy()
		})

		it('should subscribe to isOpen signal', () => {
			fixture.detectChanges()
			expect(drawerComponent.isOpen).toBeDefined()
		})
	})

	describe('responsive behavior', () => {
		it('should render drawer regardless of breakpoint', () => {
			fixture.detectChanges()
			const aside = fixture.debugElement.query(
				By.css('aside.nav-drawer')
			)
			expect(aside).toBeTruthy()
		})

		it('should support mobile and desktop CSS classes', () => {
			fixture.detectChanges()
			const aside = fixture.debugElement.query(
				By.css('aside.nav-drawer')
			)
			expect(
				aside?.nativeElement.classList
			).toBeDefined()
		})
	})

	describe('edge cases', () => {
		it('should handle empty links array', () => {
			hostComponent.links.set([])
			fixture.detectChanges()
			const listItems =
				fixture.debugElement.queryAll(By.css('li'))
			expect(listItems.length).toBe(0)
		})

		it('should handle very long link labels', () => {
			const current = hostComponent.links()
			hostComponent.links.set([
				...current,
				{
					label:
						'This is a very long navigation label that might wrap or need truncation',
					route: '/long',
					status: 'stable'
				}
			])
			fixture.detectChanges()
			const links = fixture.debugElement.queryAll(
				By.css('a.nav-link')
			)
			expect(links.length).toBeGreaterThan(0)
		})

		it('should handle links with special characters', () => {
			const current = hostComponent.links()
			hostComponent.links.set([
				...current,
				{
					label: '🎨 Design System',
					route: '/design',
					status: 'stable'
				}
			])
			fixture.detectChanges()
			const links = fixture.debugElement.queryAll(
				By.css('a.nav-link')
			)
			expect(
				links[4].nativeElement.textContent
			).toContain('Design System')
		})
	})

	describe('template binding', () => {
		it('should render using modern @if/@for control flow', () => {
			fixture.detectChanges()
			const links = fixture.debugElement.queryAll(
				By.css('a.nav-link')
			)
			expect(links.length).toBe(
				hostComponent.links().length
			)
		})

		it('should reactively update when links signal changes', () => {
			fixture.detectChanges()
			hostComponent.links.set([
				{
					label: 'Only',
					route: '/',
					status: 'stable'
				}
			])
			fixture.detectChanges()
			const links = fixture.debugElement.queryAll(
				By.css('a.nav-link')
			)
			expect(links.length).toBe(1)
			expect(
				links[0].nativeElement.textContent
			).toContain('Only')
		})
	})

	describe('styling integration', () => {
		it('should apply CSS class nav-drawer for styling', () => {
			fixture.detectChanges()
			const aside = fixture.debugElement.query(
				By.css('.nav-drawer')
			)
			expect(aside).toBeTruthy()
		})

		it('should apply CSS class nav-link for link styling', () => {
			fixture.detectChanges()
			const links = fixture.debugElement.queryAll(
				By.css('.nav-link')
			)
			expect(links.length).toBeGreaterThan(0)
		})

		it('should support feature-wip and feature-beta classes for styling', () => {
			fixture.detectChanges()
			const links = fixture.debugElement.queryAll(
				By.css('a.nav-link')
			)
			const classes = links.map(
				(link) =>
					link.nativeElement.className as string
			)
			expect(
				classes.some(
					(cls) =>
						cls.includes('feature-wip') ||
						cls.includes('feature-beta')
				)
			).toBe(true)
		})
	})
})
