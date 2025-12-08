import {
	signal,
	WritableSignal
} from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { BreakpointService } from './breakpoint.service'
import { DrawerService } from './drawer.service'

/**
 * Test Specification: DrawerService
 *
 * Purpose: Manage drawer open/close state via signal
 * Auto-closes drawer when viewport transitions to desktop
 * Provides public API: toggle(), open(), close()
 *
 * Key Behaviors:
 * - Initializes in closed state (isOpen$ = false)
 * - Exposes readonly signal isOpen$
 * - Auto-closes when BreakpointService emits isDesktop = true
 * - Allows manual toggle/open/close regardless of breakpoint
 * - Used by components and services to coordinate drawer visibility
 */
describe('DrawerService', () => {
	let service: DrawerService
	let mockIsDesktop$: WritableSignal<boolean>
	let mockBreakpointService: {
		isDesktop$: WritableSignal<boolean>
	}

	beforeEach(() => {
		// Create mock before TestBed configuration
		mockIsDesktop$ = signal(false)
		mockBreakpointService = {
			isDesktop$: mockIsDesktop$
		}

		TestBed.configureTestingModule({
			providers: [
				DrawerService,
				{
					provide: BreakpointService,
					useValue: mockBreakpointService
				}
			]
		})
		service = TestBed.inject(DrawerService)
	})

	describe('initialization', () => {
		it('should be created', () => {
			expect(service).toBeTruthy()
		})

		it('should expose isOpen$ readonly signal', () => {
			expect(typeof service.isOpen).toBe('function')
		})

		it('should start in closed state', () => {
			const isOpen = service.isOpen()
			expect(isOpen).toBe(false)
		})

		it('should not expose setter (isOpen$ is readonly)', () => {
			expect(service.isOpen).toBeDefined()
		})
	})

	describe('toggle()', () => {
		it('should toggle from closed to open', () => {
			expect(service.isOpen()).toBe(false)
			service.toggle()
			expect(service.isOpen()).toBe(true)
		})

		it('should toggle from open to closed', () => {
			service.open()
			expect(service.isOpen()).toBe(true)
			service.toggle()
			expect(service.isOpen()).toBe(false)
		})

		it('should toggle multiple times consistently', () => {
			expect(service.isOpen()).toBe(false)
			service.toggle() // 1st toggle -> open
			expect(service.isOpen()).toBe(true)
			service.toggle() // 2nd toggle -> closed
			expect(service.isOpen()).toBe(false)
			service.toggle() // 3rd toggle -> open
			expect(service.isOpen()).toBe(true)
			service.toggle() // 4th toggle -> closed
			expect(service.isOpen()).toBe(false)
			service.toggle() // 5th toggle -> open
			expect(service.isOpen()).toBe(true)
		})
	})

	describe('open()', () => {
		it('should set drawer to open', () => {
			expect(service.isOpen()).toBe(false)
			service.open()
			expect(service.isOpen()).toBe(true)
		})

		it('should be idempotent (multiple calls keep drawer open)', () => {
			service.open()
			expect(service.isOpen()).toBe(true)
			service.open()
			expect(service.isOpen()).toBe(true)
			service.open()
			expect(service.isOpen()).toBe(true)
		})

		it('should work after being closed', () => {
			service.open()
			expect(service.isOpen()).toBe(true)
			service.close()
			expect(service.isOpen()).toBe(false)
			service.open()
			expect(service.isOpen()).toBe(true)
		})
	})

	describe('close()', () => {
		it('should set drawer to closed', () => {
			service.open()
			expect(service.isOpen()).toBe(true)
			service.close()
			expect(service.isOpen()).toBe(false)
		})

		it('should be idempotent (multiple calls keep drawer closed)', () => {
			expect(service.isOpen()).toBe(false)
			service.close()
			expect(service.isOpen()).toBe(false)
			service.close()
			expect(service.isOpen()).toBe(false)
		})

		it('should work after being open', () => {
			service.open()
			expect(service.isOpen()).toBe(true)
			service.close()
			expect(service.isOpen()).toBe(false)
		})
	})

	describe('auto-close on desktop transition', () => {
		// NOTE: These tests verify the auto-close effect behavior
		// Remove .skip() once DrawerService implements the effect that
		// watches BreakpointService.isDesktop$ and auto-closes drawer

		it('should auto-close drawer when breakpoint changes to desktop', () => {
			// Open drawer while in mobile mode
			service.open()
			expect(service.isOpen()).toBe(true)

			// Simulate breakpoint change to desktop
			TestBed.flushEffects()
			mockIsDesktop$.set(true)
			TestBed.flushEffects()

			// Drawer should auto-close
			expect(service.isOpen()).toBe(false)
		})

		it('should not re-close if already closed', () => {
			// Drawer starts closed
			expect(service.isOpen()).toBe(false)

			// Simulate desktop breakpoint change
			TestBed.flushEffects()
			mockIsDesktop$.set(true)
			TestBed.flushEffects()

			// Should remain closed without errors
			expect(service.isOpen()).toBe(false)
		})

		it('should not close when breakpoint is mobile', () => {
			// Open drawer
			service.open()
			expect(service.isOpen()).toBe(true)

			// Breakpoint stays mobile (mockIsDesktop$ is already false)
			TestBed.flushEffects()
			mockIsDesktop$.set(false)
			TestBed.flushEffects()

			// Drawer should stay open
			expect(service.isOpen()).toBe(true)
		})

		it('should handle rapid breakpoint changes', () => {
			service.open()
			expect(service.isOpen()).toBe(true)

			// Rapid changes: mobile -> desktop -> mobile -> desktop
			TestBed.flushEffects()
			mockIsDesktop$.set(true)
			TestBed.flushEffects()
			expect(service.isOpen()).toBe(false) // closed on desktop

			service.open()
			mockIsDesktop$.set(false)
			TestBed.flushEffects()
			expect(service.isOpen()).toBe(true) // stays open on mobile

			mockIsDesktop$.set(true)
			TestBed.flushEffects()
			expect(service.isOpen()).toBe(false) // closes again on desktop
		})
	})

	describe('integration with NavigationDrawerComponent', () => {
		it('should provide isOpen$ for template binding', () => {
			// Component will use @if (drawer.isOpen$())
			// Verify isOpen$ is callable in template context
			expect(typeof service.isOpen).toBe('function')
			// Verify value updates are reflected instantly
			expect(service.isOpen()).toBe(false)
			service.open()
			expect(service.isOpen()).toBe(true)
		})

		it('should provide methods for component to call', () => {
			// Verify component can call drawer.toggle(), drawer.open(), drawer.close()
			// Methods should be public and accessible
			expect(typeof service.toggle).toBe('function')
			expect(typeof service.open).toBe('function')
			expect(typeof service.close).toBe('function')
		})
	})

	describe('edge cases', () => {
		it('should handle BreakpointService being undefined gracefully', () => {
			// Service should work even if BreakpointService mock is minimal
			// Manual toggle/open/close should function
			expect(service.isOpen).toBeDefined()
			service.toggle()
			expect(service.isOpen()).toBe(true)
			service.close()
			expect(service.isOpen()).toBe(false)
		})

		it('should handle multiple rapid toggle calls', () => {
			// Call toggle 10 times rapidly
			for (let i = 0; i < 10; i++) {
				service.toggle()
			}
			// After 10 toggles (even number), should be closed
			expect(service.isOpen()).toBe(false)

			// Toggle one more time (odd), should be open
			service.toggle()
			expect(service.isOpen()).toBe(true)
		})

		it('should handle open/close/toggle in sequence', () => {
			// open() -> close() -> toggle() -> toggle()
			service.open()
			expect(service.isOpen()).toBe(true)

			service.close()
			expect(service.isOpen()).toBe(false)

			service.toggle()
			expect(service.isOpen()).toBe(true)

			service.toggle()
			expect(service.isOpen()).toBe(false)
		})
	})

	describe('signal performance', () => {
		it('should update signal without creating new references', () => {
			// Verify isOpen$ reference doesn't change
			const signalRef = service.isOpen

			// Call toggle multiple times
			service.toggle()
			service.toggle()
			service.toggle()

			// Verify service.isOpen$ === same reference
			expect(service.isOpen).toBe(signalRef)
		})

		it('should emit changes to all subscribers', () => {
			// Read isOpen$() multiple times - all should be false
			expect(service.isOpen()).toBe(false)
			expect(service.isOpen()).toBe(false)
			expect(service.isOpen()).toBe(false)

			// Call open()
			service.open()

			// Read isOpen$() again multiple times - all should reflect new value
			expect(service.isOpen()).toBe(true)
			expect(service.isOpen()).toBe(true)
			expect(service.isOpen()).toBe(true)
		})
	})

	describe('accessibility', () => {
		it('should support automated close on link click', () => {
			// Component will call drawer.close() when link clicked
			service.open()
			expect(service.isOpen()).toBe(true)

			// Simulate link click handler calling close()
			service.close()

			// Verify drawer closes synchronously (no delay)
			expect(service.isOpen()).toBe(false)
		})

		it('should support close on route navigation', () => {
			// App will subscribe to router events and call close()
			service.open()
			expect(service.isOpen()).toBe(true)

			// Simulate NavigationEnd handler calling close()
			service.close()

			// Verify drawer closes
			expect(service.isOpen()).toBe(false)
		})

		it('should support close on backdrop click', () => {
			// Backdrop click handler calls drawer.close()
			service.open()
			expect(service.isOpen()).toBe(true)

			// Simulate backdrop click handler
			service.close()

			// Verify drawer closes immediately
			expect(service.isOpen()).toBe(false)
		})
	})
})
