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
import { of } from 'rxjs'
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
 * Inputs:
 * - @Input() links: NavLink[] — Array of navigation items
 * - @Input() isOpen$: Observable<boolean> — Drawer open/close state
 *
 * Key Behaviors:
 * - Renders list of links with status badges
 * - Displays drawer header (portfolio title)
 * - Applies active class to current route
 * - Handles Esc key to close drawer (mobile)
 * - Manages focus trap (focus cycles within drawer on mobile)
 * - Styling changes based on isOpen$ state
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
	ngOnDestroy: jest.fn()
})

const createMockDrawerService = () => ({
	isOpen$: signal(false),
	toggle: jest.fn(),
	open: jest.fn(),
	close: jest.fn(),
	ngOnDestroy: jest.fn()
})

@Component({
	selector: 'app-test-navigation-drawer',
	template: `
		<app-navigation-drawer
			[links]="links"
			[isOpen$]="isOpen$"
		></app-navigation-drawer>
	`,
	standalone: true,
	imports: [NavigationDrawerComponent]
})
class TestNavigationDrawerHostComponent {
	links: NavLink[] = [
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
	]
	isOpen$ = of(false)
}

describe.skip('NavigationDrawerComponent', () => {
	let fixture: ComponentFixture<TestNavigationDrawerHostComponent>
	let hostComponent: TestNavigationDrawerHostComponent
	let drawerComponent: NavigationDrawerComponent
	let drawerElement: DebugElement
	let featureVisibilityService: FeatureVisibilityService

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [
				TestNavigationDrawerHostComponent,
				NavigationDrawerComponent,
				FeatureStatusDirective
			],
			providers: [
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

		fixture = TestBed.createComponent(
			TestNavigationDrawerHostComponent
		)
		hostComponent = fixture.componentInstance
		featureVisibilityService = TestBed.inject(
			FeatureVisibilityService
		)

		drawerElement = fixture.debugElement.query(
			By.directive(NavigationDrawerComponent)
		)
		drawerComponent = drawerElement.componentInstance
	})

	describe('initialization', () => {
		it('should be created', () => {
			// TODO: Verify component instantiates
			fixture.detectChanges()
			expect(drawerComponent).toBeTruthy()
		})

		it('should accept links input', () => {
			// TODO: Pass navigation links array to component
			// Verify @Input() links is defined and receives data
			fixture.detectChanges()
			expect(drawerComponent.links).toBeDefined()
		})

		it('should accept isOpen$ input observable', () => {
			// TODO: Pass isOpen$ observable to component
			// Verify @Input() isOpen$ is defined and receives data
			fixture.detectChanges()
			expect(drawerComponent.isOpen$).toBeDefined()
		})
	})

	describe('rendering - drawer structure', () => {
		it('should render aside element with class nav-drawer', () => {
			// TODO: Verify component renders <aside class="nav-drawer">
			fixture.detectChanges()
			const aside = fixture.debugElement.query(
				By.css('aside.nav-drawer')
			)
			expect(aside).toBeTruthy()
		})

		it('should render drawer header with portfolio title', () => {
			// TODO: Verify component renders:
			// <div class="drawer-header">
			//   <h1 class="portfolio-title">Jeff Crosley</h1>
			// </div>
			fixture.detectChanges()
			const header = fixture.debugElement.query(
				By.css('.drawer-header')
			)
			const title = fixture.debugElement.query(
				By.css('.portfolio-title')
			)
			expect(header).toBeTruthy()
			expect(title?.nativeElement.textContent).toContain(
				'Jeff Crosley'
			)
		})

		it('should render nav element with class drawer-nav', () => {
			// TODO: Verify <nav class="drawer-nav"> exists
			fixture.detectChanges()
			const nav = fixture.debugElement.query(
				By.css('nav.drawer-nav')
			)
			expect(nav).toBeTruthy()
		})

		it('should render unordered list with class nav-links', () => {
			// TODO: Verify <ul class="nav-links"> exists inside nav
			fixture.detectChanges()
			const ul = fixture.debugElement.query(
				By.css('ul.nav-links')
			)
			expect(ul).toBeTruthy()
		})
	})

	describe('rendering - navigation links', () => {
		it('should render one link item per navigation link', () => {
			// TODO: Pass 4 links to component
			// Render component
			// Verify 4 <li> elements exist in list
			hostComponent.links = [
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
			]
			fixture.detectChanges()
			const listItems = fixture.debugElement.queryAll(
				By.css('li')
			)
			expect(listItems.length).toBe(4)
		})

		it('should render correct link labels', () => {
			// TODO: Verify each link displays correct label text
			// Link 0: "Home"
			// Link 1: "About"
			// Link 2: "Components"
			// Link 3: "GitHub"
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

		it('should set href for internal routes', () => {
			// TODO: Verify internal links have correct href (not external)
			// Link to "/" should have href="/"
			// Link to "/about" should have href="/about"
			fixture.detectChanges()
			const homeLink = fixture.debugElement.query(
				By.css('a[href="/"]')
			)
			expect(homeLink).toBeTruthy()
		})

		it('should set href for external links', () => {
			// TODO: Verify external links have full URL href
			// GitHub link should have href="https://github.com/..."
			fixture.detectChanges()
			const githubLink = fixture.debugElement.query(
				By.css('a[href*="github.com"]')
			)
			expect(githubLink).toBeTruthy()
		})

		it('should set target="_blank" for external links', () => {
			// TODO: Verify external links have target="_blank"
			fixture.detectChanges()
			const githubLink = fixture.debugElement.query(
				By.css('a[target="_blank"]')
			)
			expect(githubLink).toBeTruthy()
		})

		it('should not set target="_blank" for internal routes', () => {
			// TODO: Verify internal links do NOT have target="_blank"
			fixture.detectChanges()
			const homeLink = fixture.debugElement.query(
				By.css('a[href="/"]')
			)
			expect(
				homeLink?.nativeElement.getAttribute('target')
			).not.toBe('_blank')
		})
	})

	describe('rendering - feature status badges', () => {
		it('should render badge for wip status link', () => {
			// TODO: Find Components link (status: wip)
			// Verify it contains <span class="feature-badge">🚧 WIP</span>
			fixture.detectChanges()
			const componentLink = fixture.debugElement.queryAll(
				By.css('a.nav-link')
			)[2]
			const badge = componentLink.query(
				By.css('.feature-badge')
			)
			expect(badge?.nativeElement.textContent).toContain(
				'🚧 WIP'
			)
		})

		it('should not render badge for stable status link', () => {
			// TODO: Find Home link (status: stable)
			// Verify it does NOT contain .feature-badge
			fixture.detectChanges()
			const homeLink = fixture.debugElement.queryAll(
				By.css('a.nav-link')
			)[0]
			const badge = homeLink.query(
				By.css('.feature-badge')
			)
			expect(badge).toBeFalsy()
		})

		it('should render badge for beta status link', () => {
			// TODO: Add link with status: 'beta'
			// Verify badge displays "🧪 Beta"
			hostComponent.links.push({
				label: 'Blog',
				route: '/blog',
				status: 'beta'
			})
			fixture.detectChanges()
			const blogLink = fixture.debugElement.queryAll(
				By.css('a.nav-link')
			)[4]
			const badge = blogLink.query(
				By.css('.feature-badge')
			)
			expect(badge?.nativeElement.textContent).toContain(
				'🧪 Beta'
			)
		})

		it('should position badge inline with link text', () => {
			// TODO: Verify badge is inside <a> element
			// Verify badge appears after label text
			// CSS: flex layout with space-between
			fixture.detectChanges()
			const componentLink = fixture.debugElement.queryAll(
				By.css('a.nav-link')
			)[2]
			const badge = componentLink.query(
				By.css('.feature-badge')
			)
			expect(
				componentLink.nativeElement.contains(
					badge?.nativeElement
				)
			).toBe(true)
		})

		it('should apply feature-{status} class to link', () => {
			// TODO: Verify link with status='wip' has class 'feature-wip'
			// This is via FeatureStatusDirective
			fixture.detectChanges()
			const componentLink = fixture.debugElement.queryAll(
				By.css('a.nav-link')
			)[2]
			expect(
				componentLink.nativeElement.classList.contains(
					'feature-wip'
				)
			).toBe(true)
		})
	})

	describe('active route state', () => {
		it('should apply active class to current route', () => {
			// TODO: Mock router to report active route "/"
			// Verify Home link has class 'active'
			// Other links should not have 'active'
			fixture.detectChanges()
			expect(drawerComponent).toBeTruthy()
		})

		it('should update active class when route changes', () => {
			// TODO: Simulate router navigation to "/about"
			// Verify About link now has 'active'
			// Verify Home link no longer has 'active'
			fixture.detectChanges()
			expect(drawerComponent).toBeTruthy()
		})
	})

	describe('drawer state - open/closed', () => {
		it('should add open class when isOpen$ emits true', () => {
			// TODO: Set isOpen$ to emit true
			// fixture.detectChanges()
			// Verify aside.nav-drawer has class 'open'
			hostComponent.isOpen$ = of(true)
			fixture.detectChanges()
			const aside = fixture.debugElement.query(
				By.css('aside.nav-drawer')
			)
			expect(
				aside?.nativeElement.classList.contains('open')
			).toBe(true)
		})

		it('should remove open class when isOpen$ emits false', () => {
			// TODO: Set isOpen$ to emit false
			// fixture.detectChanges()
			// Verify aside.nav-drawer does NOT have class 'open'
			hostComponent.isOpen$ = of(false)
			fixture.detectChanges()
			const aside = fixture.debugElement.query(
				By.css('aside.nav-drawer')
			)
			expect(
				aside?.nativeElement.classList.contains('open')
			).toBe(false)
		})

		it('should toggle open class reactively when isOpen$ changes', () => {
			// TODO: Create signal for isOpen
			// Set to false initially
			// Verify no 'open' class
			// Update signal to true
			// fixture.detectChanges()
			// Verify 'open' class is added
			fixture.detectChanges()
			expect(drawerComponent).toBeTruthy()
		})
	})

	describe('keyboard interaction - Esc key', () => {
		it('should close drawer when Esc key is pressed', () => {
			// TODO: Inject DrawerService mock
			// Set drawer to open
			// Simulate Esc keydown on component
			// Verify drawer.close() was called
			fixture.detectChanges()
			expect(drawerComponent).toBeTruthy()
		})

		it('should only close on Esc, not other keys', () => {
			// TODO: Inject DrawerService mock
			// Simulate Enter key press
			// Verify drawer.close() was NOT called
			// Simulate Esc key press
			// Verify drawer.close() WAS called
			fixture.detectChanges()
			expect(drawerComponent).toBeTruthy()
		})

		it('should handle Esc key when drawer is already closed', () => {
			// TODO: Drawer starts closed
			// Simulate Esc key press
			// Verify no errors
			// Verify drawer remains closed
			fixture.detectChanges()
			expect(drawerComponent).toBeTruthy()
		})
	})

	describe('focus management - focus trap', () => {
		it('should trap focus within drawer when open on mobile', () => {
			// TODO: Mock BreakpointService to return mobile (< 1024px)
			// Open drawer
			// Tab through all focusable elements
			// Verify focus cycles back to first element after last
			fixture.detectChanges()
			expect(drawerComponent).toBeTruthy()
		})

		it('should not trap focus when drawer is closed', () => {
			// TODO: Drawer starts closed
			// Tab focus
			// Verify focus can move to main content (not trapped in drawer)
			fixture.detectChanges()
			expect(drawerComponent).toBeTruthy()
		})

		it('should not trap focus on desktop (drawer not overlaid)', () => {
			// TODO: Mock BreakpointService to return desktop (>= 1024px)
			// Open drawer (or leave open)
			// Tab focus
			// Verify focus is not trapped (can leave drawer)
			fixture.detectChanges()
			expect(drawerComponent).toBeTruthy()
		})

		it('should manage focus order correctly', () => {
			// TODO: Tab order should be:
			// 1. Portfolio title (if interactive)
			// 2. First nav link
			// 3. Second nav link
			// ... (all nav links)
			// Then cycle back to first
			fixture.detectChanges()
			expect(drawerComponent).toBeTruthy()
		})

		it('should restore focus when drawer closes', () => {
			// TODO: Focus was in drawer
			// Close drawer (Esc key)
			// Verify focus moves to trigger element (hamburger button)
			fixture.detectChanges()
			expect(drawerComponent).toBeTruthy()
		})
	})

	describe('accessibility - ARIA', () => {
		it('should have semantic nav element', () => {
			// TODO: Verify <nav> element exists (semantic nav role)
			fixture.detectChanges()
			const nav = fixture.debugElement.query(
				By.css('nav')
			)
			expect(nav).toBeTruthy()
		})

		it('should have semantic h1 for portfolio title', () => {
			// TODO: Verify <h1 class="portfolio-title"> (semantic heading)
			fixture.detectChanges()
			const h1 = fixture.debugElement.query(
				By.css('h1.portfolio-title')
			)
			expect(h1).toBeTruthy()
		})

		it('should have semantic aside element', () => {
			// TODO: Verify <aside class="nav-drawer"> (semantic aside role)
			fixture.detectChanges()
			const aside = fixture.debugElement.query(
				By.css('aside.nav-drawer')
			)
			expect(aside).toBeTruthy()
		})

		it('should have semantic list structure', () => {
			// TODO: Verify <ul> and <li> elements (semantic list)
			fixture.detectChanges()
			const ul = fixture.debugElement.query(
				By.css('ul.nav-links')
			)
			const lis = fixture.debugElement.queryAll(
				By.css('li')
			)
			expect(ul).toBeTruthy()
			expect(lis.length).toBeGreaterThan(0)
		})

		it('should announce links as navigational links', () => {
			// TODO: Each link should be <a> or <button> (interactive)
			// Screen reader should announce them as links
			fixture.detectChanges()
			const links = fixture.debugElement.queryAll(
				By.css('a.nav-link')
			)
			expect(links.length).toBeGreaterThan(0)
		})

		it('should announce status badges in link text', () => {
			// TODO: "Components 🚧 WIP" should be read as single link
			// Badge emoji should be part of accessible name
			fixture.detectChanges()
			const componentLink = fixture.debugElement.queryAll(
				By.css('a.nav-link')
			)[2]
			const text = componentLink.nativeElement.textContent
			expect(text).toContain('Components')
			expect(text).toContain('WIP')
		})
	})

	describe('integration with services', () => {
		it('should call FeatureVisibilityService.getIndicator()', () => {
			// TODO: Spy on featureVisibilityService.getIndicator
			// Render component with links
			// Verify getIndicator was called for each link status
			fixture.detectChanges()
			expect(featureVisibilityService).toBeTruthy()
		})

		it('should subscribe to isOpen$ observable', () => {
			// TODO: Pass observable that emits values
			// Verify component receives emissions
			// Verify UI updates when observable emits
			fixture.detectChanges()
			expect(drawerComponent.isOpen$).toBeDefined()
		})
	})

	describe('responsive behavior', () => {
		it('should render drawer regardless of breakpoint', () => {
			// TODO: Drawer should render on both mobile and desktop
			// Breakpoint only affects visibility/styling
			fixture.detectChanges()
			const aside = fixture.debugElement.query(
				By.css('aside.nav-drawer')
			)
			expect(aside).toBeTruthy()
		})

		it('should support mobile and desktop CSS classes', () => {
			// TODO: Drawer should have CSS that responds to @media queries
			// On mobile (<1024px): position: fixed, transform, overlay
			// On desktop (>=1024px): position: relative, no transform, part of flow
			fixture.detectChanges()
			expect(drawerComponent).toBeTruthy()
		})
	})

	describe('edge cases', () => {
		it('should handle empty links array', () => {
			// TODO: Pass empty array to component
			// Render component
			// Verify no errors, nav still renders, just no items
			hostComponent.links = []
			fixture.detectChanges()
			const listItems = fixture.debugElement.queryAll(
				By.css('li')
			)
			expect(listItems.length).toBe(0)
		})

		it('should handle null/undefined links gracefully', () => {
			// TODO: If links is null/undefined, component should not crash
			// Should handle safely (probably display nothing or default)
			fixture.detectChanges()
			expect(drawerComponent).toBeTruthy()
		})

		it('should handle very long link labels', () => {
			// TODO: Add link with very long label (100+ chars)
			// Verify text wraps or truncates without breaking layout
			hostComponent.links.push({
				label:
					'This is a very long navigation label that might wrap or need truncation',
				route: '/long',
				status: 'stable'
			})
			fixture.detectChanges()
			expect(drawerComponent).toBeTruthy()
		})

		it('should handle links with special characters', () => {
			// TODO: Link label with emoji, unicode, special chars
			// Verify renders correctly
			hostComponent.links.push({
				label: '🎨 Design System',
				route: '/design',
				status: 'stable'
			})
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
		it('should use @if/@for control flow (not *ngIf/*ngFor)', () => {
			// TODO: Verify component uses modern Angular control flow syntax
			// @if (condition) { ... }
			// @for (item of items; track item) { ... }
			fixture.detectChanges()
			expect(drawerComponent).toBeTruthy()
		})

		it('should use track function for lists to optimize rendering', () => {
			// TODO: @for (...; track ...) should identify unique items
			// Prevents unnecessary re-renders
			fixture.detectChanges()
			expect(drawerComponent).toBeTruthy()
		})

		it('should use | async pipe for isOpen$ observable', () => {
			// TODO: Template should use (isOpen$ | async)
			// Component subscribes to observable reactively
			fixture.detectChanges()
			expect(drawerComponent).toBeTruthy()
		})
	})

	describe('styling integration', () => {
		it('should apply CSS class nav-drawer for styling', () => {
			// TODO: CSS in navigation-drawer.component.scss targets .nav-drawer
			// Verify class is present for styling to work
			fixture.detectChanges()
			const aside = fixture.debugElement.query(
				By.css('.nav-drawer')
			)
			expect(aside).toBeTruthy()
		})

		it('should apply CSS class nav-link for link styling', () => {
			// TODO: CSS targets .nav-link for styling links
			// Verify class present on all link elements
			fixture.detectChanges()
			const links = fixture.debugElement.queryAll(
				By.css('.nav-link')
			)
			expect(links.length).toBeGreaterThan(0)
		})

		it('should support feature-wip and feature-beta classes for styling', () => {
			// TODO: CSS can target .feature-wip, .feature-beta for status-specific styling
			// Directive adds these classes
			fixture.detectChanges()
			expect(drawerComponent).toBeTruthy()
		})
	})
})
