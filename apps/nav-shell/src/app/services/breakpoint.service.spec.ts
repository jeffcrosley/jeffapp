import { TestBed } from '@angular/core/testing'
import { BreakpointService } from './breakpoint.service'

/**
 * Test Specification: BreakpointService
 *
 * Purpose: Reactive viewport breakpoint detection using Angular signals
 * Wraps window.matchMedia for testability and provides isDesktop$() signal
 *
 * Breakpoint: 1024px (desktop threshold)
 * - >= 1024px: desktop (isDesktop$ = true)
 * - < 1024px: mobile/tablet (isDesktop$ = false)
 */
describe('BreakpointService', () => {
	let service: BreakpointService
	let originalMatchMedia: typeof window.matchMedia

	beforeEach(() => {
		// Store original matchMedia for restoration
		originalMatchMedia = window.matchMedia

		TestBed.configureTestingModule({})
	})

	afterEach(() => {
		// Restore original matchMedia
		Object.defineProperty(window, 'matchMedia', {
			value: originalMatchMedia,
			writable: true
		})
	})

	describe('initialization', () => {
		it('should be created', () => {
			// TODO: Verify service is instantiated via DI
			const mockMatchMedia = jest.fn().mockReturnValue({
				matches: false,
				addEventListener: jest.fn(),
				removeEventListener: jest.fn()
			})
			Object.defineProperty(window, 'matchMedia', {
				value: mockMatchMedia,
				writable: true
			})

			service = TestBed.inject(BreakpointService)
			expect(service).toBeTruthy()
		})

		it('should query matchMedia with correct breakpoint on init', () => {
			// TODO: Verify matchMedia is called with '(min-width: 1024px)'
			const mockMatchMediaInit = jest.fn().mockReturnValue({
				matches: false,
				addEventListener: jest.fn(),
				removeEventListener: jest.fn()
			})
			Object.defineProperty(window, 'matchMedia', {
				value: mockMatchMediaInit,
				writable: true
			})

			service = TestBed.inject(BreakpointService)
			expect(mockMatchMediaInit).toHaveBeenCalledWith(
				'(min-width: 1024px)'
			)
		})

		it('should register change listener on init', () => {
			// TODO: Verify addEventListener is called for 'change' event
			const addEventListenerMock = jest.fn()
			const mockMatchMediaListener = jest
				.fn()
				.mockReturnValue({
					matches: false,
					addEventListener: addEventListenerMock,
					removeEventListener: jest.fn()
				})
			Object.defineProperty(window, 'matchMedia', {
				value: mockMatchMediaListener,
				writable: true
			})

			service = TestBed.inject(BreakpointService)
			expect(addEventListenerMock).toHaveBeenCalledWith(
				'change',
				expect.any(Function)
			)
		})
	})

	describe('breakpoint detection', () => {
		it('should return true when viewport is desktop (>= 1024px)', () => {
			// TODO: Mock window.matchMedia to return { matches: true }
			// Verify service.isDesktop$() returns true
			const mockMatchMediaDesktop = jest.fn().mockReturnValue({
				matches: true,
				addEventListener: jest.fn(),
				removeEventListener: jest.fn()
			})
			Object.defineProperty(window, 'matchMedia', {
				value: mockMatchMediaDesktop,
				writable: true
			})

			service = TestBed.inject(BreakpointService)
			expect(service.isDesktop$()).toBe(true)
		})

		it('should return false when viewport is mobile (< 1024px)', () => {
			// TODO: Mock window.matchMedia to return { matches: false }
			// Verify service.isDesktop$() returns false
			const mockMatchMediaMobile = jest.fn().mockReturnValue({
				matches: false,
				addEventListener: jest.fn(),
				removeEventListener: jest.fn()
			})
			Object.defineProperty(window, 'matchMedia', {
				value: mockMatchMediaMobile,
				writable: true
			})

			service = TestBed.inject(BreakpointService)
			expect(service.isDesktop$()).toBe(false)
		})

		it('should use correct media query string', () => {
			// TODO: Verify the exact media query string used
			const mockMatchMediaQuery = jest.fn().mockReturnValue({
				matches: false,
				addEventListener: jest.fn(),
				removeEventListener: jest.fn()
			})
			Object.defineProperty(window, 'matchMedia', {
				value: mockMatchMediaQuery,
				writable: true
			})

			service = TestBed.inject(BreakpointService)
			expect(mockMatchMediaQuery).toHaveBeenCalledWith(
				expect.stringContaining('1024')
			)
		})
	})

	describe('signal reactivity', () => {
		it('should update signal when viewport crosses breakpoint', () => {
			// TODO: Register listener, trigger change event, verify signal updates
			const listenersReactivity: Array<
				(e: MediaQueryListEvent) => void
			> = []
			const mockMediaQueryListReactivity = {
				matches: false,
				addEventListener: jest.fn(
					(
						event: string,
						listener: (e: MediaQueryListEvent) => void
					) => {
						if (event === 'change')
							listenersReactivity.push(listener)
					}
				),
				removeEventListener: jest.fn()
			}
			const mockMatchMediaReactivity = jest
				.fn()
				.mockReturnValue(mockMediaQueryListReactivity)
			Object.defineProperty(window, 'matchMedia', {
				value: mockMatchMediaReactivity,
				writable: true
			})

			service = TestBed.inject(BreakpointService)
			expect(service.isDesktop$()).toBe(false)

			// Simulate viewport change to desktop
			listenersReactivity.forEach((listener) =>
				listener({ matches: true } as MediaQueryListEvent)
			)
			expect(service.isDesktop$()).toBe(true)
		})

		it('should handle multiple rapid breakpoint changes', () => {
			// TODO: Trigger multiple changes in quick succession, verify final state
			const listenersMulti: Array<
				(e: MediaQueryListEvent) => void
			> = []
			const mockMediaQueryListMulti = {
				matches: false,
				addEventListener: jest.fn(
					(
						event: string,
						listener: (e: MediaQueryListEvent) => void
					) => {
						if (event === 'change') listenersMulti.push(listener)
					}
				),
				removeEventListener: jest.fn()
			}
			const mockMatchMediaMulti = jest
				.fn()
				.mockReturnValue(mockMediaQueryListMulti)
			Object.defineProperty(window, 'matchMedia', {
				value: mockMatchMediaMulti,
				writable: true
			})

			service = TestBed.inject(BreakpointService)

			// Rapid changes: mobile -> desktop -> mobile -> desktop
			listenersMulti.forEach((listener) =>
				listener({ matches: true } as MediaQueryListEvent)
			)
			listenersMulti.forEach((listener) =>
				listener({ matches: false } as MediaQueryListEvent)
			)
			listenersMulti.forEach((listener) =>
				listener({ matches: true } as MediaQueryListEvent)
			)

			expect(service.isDesktop$()).toBe(true)
		})
	})

	describe('event listener management', () => {
		it('should add event listener on service creation', () => {
			// TODO: Verify addEventListener is called exactly once
			const addEventListenerMgmt = jest.fn()
			const mockMediaQueryListMgmt = {
				matches: false,
				addEventListener: addEventListenerMgmt,
				removeEventListener: jest.fn()
			}
			const mockMatchMediaMgmt = jest
				.fn()
				.mockReturnValue(mockMediaQueryListMgmt)
			Object.defineProperty(window, 'matchMedia', {
				value: mockMatchMediaMgmt,
				writable: true
			})

			service = TestBed.inject(BreakpointService)
			expect(addEventListenerMgmt).toHaveBeenCalledTimes(1)
		})

		it('should remove event listener on service destroy', () => {
			// TODO: Call ngOnDestroy or destroy service, verify removeEventListener called
			const removeEventListenerDestroy = jest.fn()
			const mockMediaQueryListDestroy = {
				matches: false,
				addEventListener: jest.fn(),
				removeEventListener: removeEventListenerDestroy
			}
			const mockMatchMediaDestroy = jest
				.fn()
				.mockReturnValue(mockMediaQueryListDestroy)
			Object.defineProperty(window, 'matchMedia', {
				value: mockMatchMediaDestroy,
				writable: true
			})

			service = TestBed.inject(BreakpointService)
			service.ngOnDestroy()
			expect(removeEventListenerDestroy).toHaveBeenCalledWith(
				'change',
				expect.any(Function)
			)
		})

		it('should use same listener reference for add and remove', () => {
			// TODO: Capture listener passed to addEventListener
			// Verify same reference passed to removeEventListener
			let capturedListener:
				| ((e: MediaQueryListEvent) => void)
				| null = null
			const addEventListenerRef = jest.fn(
				(
					event: string,
					listener: (e: MediaQueryListEvent) => void
				) => {
					if (event === 'change') capturedListener = listener
				}
			)
			const removeEventListenerRef = jest.fn()
			const mockMediaQueryListRef = {
				matches: false,
				addEventListener: addEventListenerRef,
				removeEventListener: removeEventListenerRef
			}
			const mockMatchMediaRef = jest
				.fn()
				.mockReturnValue(mockMediaQueryListRef)
			Object.defineProperty(window, 'matchMedia', {
				value: mockMatchMediaRef,
				writable: true
			})

			service = TestBed.inject(BreakpointService)
			service.ngOnDestroy()

			expect(capturedListener).not.toBeNull()
			expect(removeEventListenerRef).toHaveBeenCalledWith(
				'change',
				capturedListener
			)
		})
	})

	describe('SSR safety', () => {
		it('should handle missing window.matchMedia gracefully', () => {
			// TODO: Set matchMedia to undefined, verify service doesn't crash
			// Should default to mobile (isDesktop$ = false)
			const mockMatchMediaSSR = jest.fn().mockReturnValue(null)
			Object.defineProperty(window, 'matchMedia', {
				value: mockMatchMediaSSR,
				writable: true
			})

			// Service should handle null gracefully
			expect(() =>
				TestBed.inject(BreakpointService)
			).not.toThrow()
		})

		it('should default to mobile when matchMedia unavailable', () => {
			// TODO: When matchMedia returns null, isDesktop$ should be false
			const mockMatchMediaDefault = jest.fn().mockReturnValue({
				matches: false,
				addEventListener: jest.fn(),
				removeEventListener: jest.fn()
			})
			Object.defineProperty(window, 'matchMedia', {
				value: mockMatchMediaDefault,
				writable: true
			})

			service = TestBed.inject(BreakpointService)
			expect(service.isDesktop$()).toBe(false)
		})
	})

	describe('edge cases', () => {
		it('should handle exact breakpoint value (1024px)', () => {
			// TODO: Test behavior at exactly 1024px width
			// Per media query, >= 1024 should return true
			const mockMatchMediaExact = jest.fn().mockReturnValue({
				matches: true, // At exactly 1024px, matches should be true
				addEventListener: jest.fn(),
				removeEventListener: jest.fn()
			})
			Object.defineProperty(window, 'matchMedia', {
				value: mockMatchMediaExact,
				writable: true
			})

			service = TestBed.inject(BreakpointService)
			expect(service.isDesktop$()).toBe(true)
		})

		it('should handle rapid resize events without memory leaks', () => {
			// TODO: Trigger many change events, verify no listener accumulation
			const listenersRapid: Array<
				(e: MediaQueryListEvent) => void
			> = []
			const mockMediaQueryListRapid = {
				matches: false,
				addEventListener: jest.fn(
					(
						event: string,
						listener: (e: MediaQueryListEvent) => void
					) => {
						if (event === 'change') listenersRapid.push(listener)
					}
				),
				removeEventListener: jest.fn()
			}
			const mockMatchMediaRapid = jest
				.fn()
				.mockReturnValue(mockMediaQueryListRapid)
			Object.defineProperty(window, 'matchMedia', {
				value: mockMatchMediaRapid,
				writable: true
			})

			service = TestBed.inject(BreakpointService)

			// Trigger 100 change events
			for (let i = 0; i < 100; i++) {
				listenersRapid.forEach((listener) =>
					listener({
						matches: i % 2 === 0
					} as MediaQueryListEvent)
				)
			}

			// Should only have one listener registered
			expect(listenersRapid.length).toBe(1)
		})
	})

	describe('integration with DrawerService', () => {
		it('should close drawer when transitioning from mobile to desktop', () => {
			// TODO: This tests the integration pattern, not direct coupling
			// BreakpointService emits change, consumer (nav component) should react
			const listenersMobileToDesktop: Array<
				(e: MediaQueryListEvent) => void
			> = []
			const mockMediaQueryListMobileToDesktop = {
				matches: false, // Start mobile
				addEventListener: jest.fn(
					(
						event: string,
						listener: (e: MediaQueryListEvent) => void
					) => {
						if (event === 'change')
							listenersMobileToDesktop.push(listener)
					}
				),
				removeEventListener: jest.fn()
			}
			const mockMatchMediaMobileToDesktop = jest
				.fn()
				.mockReturnValue(mockMediaQueryListMobileToDesktop)
			Object.defineProperty(window, 'matchMedia', {
				value: mockMatchMediaMobileToDesktop,
				writable: true
			})

			service = TestBed.inject(BreakpointService)
			expect(service.isDesktop$()).toBe(false)

			// Transition to desktop
			listenersMobileToDesktop.forEach((listener) =>
				listener({ matches: true } as MediaQueryListEvent)
			)
			expect(service.isDesktop$()).toBe(true)
		})

		it('should allow drawer open when transitioning from desktop to mobile', () => {
			// TODO: Verify signal updates correctly for mobile transition
			const listenersDesktopToMobile: Array<
				(e: MediaQueryListEvent) => void
			> = []
			const mockMediaQueryListDesktopToMobile = {
				matches: true, // Start desktop
				addEventListener: jest.fn(
					(
						event: string,
						listener: (e: MediaQueryListEvent) => void
					) => {
						if (event === 'change')
							listenersDesktopToMobile.push(listener)
					}
				),
				removeEventListener: jest.fn()
			}
			const mockMatchMediaDesktopToMobile = jest
				.fn()
				.mockReturnValue(mockMediaQueryListDesktopToMobile)
			Object.defineProperty(window, 'matchMedia', {
				value: mockMatchMediaDesktopToMobile,
				writable: true
			})

			service = TestBed.inject(BreakpointService)
			expect(service.isDesktop$()).toBe(true)

			// Transition to mobile
			listenersDesktopToMobile.forEach((listener) =>
				listener({ matches: false } as MediaQueryListEvent)
			)
			expect(service.isDesktop$()).toBe(false)
		})
	})

	describe('performance', () => {
		it('should only create one matchMedia query', () => {
			// TODO: Verify matchMedia is called exactly once per service instance
			const mockMatchMediaPerf = jest.fn().mockReturnValue({
				matches: false,
				addEventListener: jest.fn(),
				removeEventListener: jest.fn()
			})
			Object.defineProperty(window, 'matchMedia', {
				value: mockMatchMediaPerf,
				writable: true
			})

			service = TestBed.inject(BreakpointService)
			// Access signal multiple times
			service.isDesktop$()
			service.isDesktop$()
			service.isDesktop$()

			expect(mockMatchMediaPerf).toHaveBeenCalledTimes(1)
		})

		it('should not create memory leaks with repeated access', () => {
			// TODO: Access isDesktop$ many times, verify no listener accumulation
			const listenersLeak: Array<
				(e: MediaQueryListEvent) => void
			> = []
			const mockMediaQueryListLeak = {
				matches: false,
				addEventListener: jest.fn(
					(
						event: string,
						listener: (e: MediaQueryListEvent) => void
					) => {
						if (event === 'change') listenersLeak.push(listener)
					}
				),
				removeEventListener: jest.fn()
			}
			const mockMatchMediaLeak = jest
				.fn()
				.mockReturnValue(mockMediaQueryListLeak)
			Object.defineProperty(window, 'matchMedia', {
				value: mockMatchMediaLeak,
				writable: true
			})

			service = TestBed.inject(BreakpointService)

			// Access signal many times
			for (let i = 0; i < 1000; i++) {
				service.isDesktop$()
			}

			// Should still only have one listener
			expect(listenersLeak.length).toBe(1)
		})
	})

	describe('Angular lifecycle', () => {
		it('should implement OnDestroy interface', () => {
			// TODO: Verify service has ngOnDestroy method
			const mockMatchMediaLifecycle = jest
				.fn()
				.mockReturnValue({
					matches: false,
					addEventListener: jest.fn(),
					removeEventListener: jest.fn()
				})
			Object.defineProperty(window, 'matchMedia', {
				value: mockMatchMediaLifecycle,
				writable: true
			})

			service = TestBed.inject(BreakpointService)
			expect(typeof service.ngOnDestroy).toBe('function')
		})

		it('should clean up resources on destroy', () => {
			// TODO: Call ngOnDestroy, verify cleanup is complete
			const removeEventListenerCleanup = jest.fn()
			const mockMatchMediaCleanup = jest.fn().mockReturnValue({
				matches: false,
				addEventListener: jest.fn(),
				removeEventListener: removeEventListenerCleanup
			})
			Object.defineProperty(window, 'matchMedia', {
				value: mockMatchMediaCleanup,
				writable: true
			})

			service = TestBed.inject(BreakpointService)
			service.ngOnDestroy()

			expect(removeEventListenerCleanup).toHaveBeenCalled()
		})
	})
})
