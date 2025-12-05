import { TestBed } from '@angular/core/testing'
import { ThemeService } from './theme.service'

/**
 * Test Specification: ThemeService
 *
 * Purpose: Manage light/dark theme switching with persistence
 * Detects OS preference, persists to localStorage, applies to DOM
 *
 * Key Behaviors:
 * - Initializes from localStorage or OS preference
 * - Toggle between light/dark
 * - Persist theme choice to localStorage
 * - Apply theme via data-theme attribute on document element
 * - SSR-safe (guards against window/document not existing)
 * - Expose observable for reactive theme changes
 */
describe.skip('ThemeService', () => {
	let service: ThemeService
	let localStorageSpy: jest.SpyInstance

	beforeEach(() => {
		// Mock localStorage
		const localStorageMock: Storage = {
			getItem: jest.fn(),
			setItem: jest.fn(),
			removeItem: jest.fn(),
			clear: jest.fn(),
			length: 0,
			key: jest.fn()
		}
		Object.defineProperty(window, 'localStorage', {
			value: localStorageMock,
			writable: true
		})

		TestBed.configureTestingModule({
			providers: [ThemeService]
		})
	})

	afterEach(() => {
		jest.clearAllMocks()
	})

	describe('initialization', () => {
		it('should be created', () => {
			// TODO: Verify service instantiates
			service = TestBed.inject(ThemeService)
			expect(service).toBeTruthy()
		})

		it('should initialize from localStorage if value exists', () => {
			// TODO: Mock localStorage.getItem to return 'dark'
			// Create service
			// Verify currentTheme is 'dark'
			// Verify data-theme attribute is set to 'dark'
			;(
				localStorage.getItem as jest.Mock
			).mockReturnValue('dark')
			service = TestBed.inject(ThemeService)
			expect(service.getCurrentTheme()).toBe('dark')
		})

		it('should initialize from OS preference if localStorage is empty', () => {
			// TODO: Mock localStorage.getItem to return null
			// Mock window.matchMedia to return { matches: true } (dark mode)
			// Create service
			// Verify currentTheme is 'dark'
			;(
				localStorage.getItem as jest.Mock
			).mockReturnValue(null)
			const matchMediaMock = jest
				.fn()
				.mockReturnValue({ matches: true })
			Object.defineProperty(window, 'matchMedia', {
				value: matchMediaMock,
				writable: true
			})
			service = TestBed.inject(ThemeService)
			expect(service.getCurrentTheme()).toBe('dark')
		})

		it('should default to light theme if no preference detected', () => {
			// TODO: Mock localStorage.getItem to return null
			// Mock window.matchMedia to return { matches: false }
			// Create service
			// Verify currentTheme is 'light'
			;(
				localStorage.getItem as jest.Mock
			).mockReturnValue(null)
			const matchMediaMock = jest
				.fn()
				.mockReturnValue({ matches: false })
			Object.defineProperty(window, 'matchMedia', {
				value: matchMediaMock,
				writable: true
			})
			service = TestBed.inject(ThemeService)
			expect(service.getCurrentTheme()).toBe('light')
		})

		it('should apply theme to document element on initialization', () => {
			// TODO: Mock document.documentElement.setAttribute
			// Create service
			// Verify setAttribute was called with 'data-theme', 'light' (or 'dark')
			const setAttributeSpy = jest.spyOn(
				document.documentElement,
				'setAttribute'
			)
			service = TestBed.inject(ThemeService)
			expect(setAttributeSpy).toHaveBeenCalledWith(
				'data-theme',
				expect.any(String)
			)
		})
	})

	describe('toggle()', () => {
		beforeEach(() => {
			service = TestBed.inject(ThemeService)
		})

		it('should toggle from light to dark', () => {
			// TODO: Service starts in light mode
			// Call toggle()
			// Verify currentTheme is now 'dark'
			// Verify localStorage.setItem was called with 'jeffapp-theme', 'dark'
			service.setTheme('light')
			service.toggle()
			expect(service.getCurrentTheme()).toBe('dark')
			expect(localStorage.setItem).toHaveBeenCalledWith(
				'jeffapp-theme',
				'dark'
			)
		})

		it('should toggle from dark to light', () => {
			// TODO: Set theme to dark
			// Call toggle()
			// Verify currentTheme is now 'light'
			// Verify localStorage.setItem was called with 'jeffapp-theme', 'light'
			service.setTheme('dark')
			service.toggle()
			expect(service.getCurrentTheme()).toBe('light')
			expect(localStorage.setItem).toHaveBeenCalledWith(
				'jeffapp-theme',
				'light'
			)
		})

		it('should toggle multiple times correctly', () => {
			// TODO: Start in light mode
			// Toggle 3 times
			// After 1st: dark
			// After 2nd: light
			// After 3rd: dark
			service.setTheme('light')
			service.toggle()
			expect(service.getCurrentTheme()).toBe('dark')
			service.toggle()
			expect(service.getCurrentTheme()).toBe('light')
			service.toggle()
			expect(service.getCurrentTheme()).toBe('dark')
		})

		it('should update data-theme attribute on toggle', () => {
			// TODO: Spy on document.documentElement.setAttribute
			// Call toggle()
			// Verify setAttribute was called with correct theme
			const setAttributeSpy = jest.spyOn(
				document.documentElement,
				'setAttribute'
			)
			service.toggle()
			expect(setAttributeSpy).toHaveBeenCalledWith(
				'data-theme',
				expect.any(String)
			)
		})
	})

	describe('setTheme()', () => {
		beforeEach(() => {
			service = TestBed.inject(ThemeService)
		})

		it('should set theme to light', () => {
			// TODO: Call setTheme('light')
			// Verify currentTheme is 'light'
			// Verify localStorage.setItem was called
			service.setTheme('light')
			expect(service.getCurrentTheme()).toBe('light')
			expect(localStorage.setItem).toHaveBeenCalledWith(
				'jeffapp-theme',
				'light'
			)
		})

		it('should set theme to dark', () => {
			// TODO: Call setTheme('dark')
			// Verify currentTheme is 'dark'
			// Verify localStorage.setItem was called
			service.setTheme('dark')
			expect(service.getCurrentTheme()).toBe('dark')
			expect(localStorage.setItem).toHaveBeenCalledWith(
				'jeffapp-theme',
				'dark'
			)
		})

		it('should be idempotent (setting same theme multiple times)', () => {
			// TODO: Call setTheme('dark') 3 times
			// Verify theme stays 'dark'
			// Verify localStorage.setItem called 3 times (not optimized away)
			service.setTheme('dark')
			service.setTheme('dark')
			service.setTheme('dark')
			expect(service.getCurrentTheme()).toBe('dark')
			expect(localStorage.setItem).toHaveBeenCalledTimes(
				3
			)
		})
	})

	describe('getTheme() observable', () => {
		beforeEach(() => {
			service = TestBed.inject(ThemeService)
		})

		it('should emit current theme', (done) => {
			// TODO: Subscribe to getTheme()
			// Verify it emits current theme value
			service.getTheme().subscribe((theme) => {
				expect(theme).toBe(service.getCurrentTheme())
				done()
			})
		})

		it('should emit new theme when toggled', (done) => {
			// TODO: Subscribe to getTheme()
			// Call toggle()
			// Verify observable emits new theme
			const themes: Array<'light' | 'dark'> = []
			service.getTheme().subscribe((theme) => {
				themes.push(theme)
				if (themes.length === 2) {
					expect(themes[0]).not.toBe(themes[1])
					done()
				}
			})
			service.toggle()
		})

		it('should emit to multiple subscribers', () => {
			// TODO: Create 2 subscriptions to getTheme()
			// Call toggle()
			// Verify both subscribers receive the update
			let subscriber1Value: 'light' | 'dark' | null = null
			let subscriber2Value: 'light' | 'dark' | null = null

			service.getTheme().subscribe((theme) => {
				subscriber1Value = theme
			})

			service.getTheme().subscribe((theme) => {
				subscriber2Value = theme
			})

			service.toggle()
			expect(subscriber1Value).toBe(subscriber2Value)
		})
	})

	describe('getCurrentTheme()', () => {
		beforeEach(() => {
			service = TestBed.inject(ThemeService)
		})

		it('should return current theme synchronously', () => {
			// TODO: Call getCurrentTheme()
			// Verify it returns 'light' or 'dark' (not observable)
			const theme = service.getCurrentTheme()
			expect(['light', 'dark']).toContain(theme)
		})

		it('should match observable value', (done) => {
			// TODO: Get theme via getCurrentTheme() and getTheme()
			// Verify they match
			const syncTheme = service.getCurrentTheme()
			service.getTheme().subscribe((obsTheme) => {
				expect(syncTheme).toBe(obsTheme)
				done()
			})
		})
	})

	describe('isDarkMode()', () => {
		beforeEach(() => {
			service = TestBed.inject(ThemeService)
		})

		it('should return true when theme is dark', () => {
			// TODO: Set theme to dark
			// Call isDarkMode()
			// Verify returns true
			service.setTheme('dark')
			expect(service.isDarkMode()).toBe(true)
		})

		it('should return false when theme is light', () => {
			// TODO: Set theme to light
			// Call isDarkMode()
			// Verify returns false
			service.setTheme('light')
			expect(service.isDarkMode()).toBe(false)
		})

		it('should update after toggle', () => {
			// TODO: Start in light mode (isDarkMode = false)
			// Toggle to dark
			// Verify isDarkMode now returns true
			service.setTheme('light')
			expect(service.isDarkMode()).toBe(false)
			service.toggle()
			expect(service.isDarkMode()).toBe(true)
		})
	})

	describe('localStorage persistence', () => {
		beforeEach(() => {
			service = TestBed.inject(ThemeService)
		})

		it('should use correct storage key', () => {
			// TODO: Call setTheme or toggle
			// Verify localStorage.setItem was called with key 'jeffapp-theme'
			service.toggle()
			expect(localStorage.setItem).toHaveBeenCalledWith(
				'jeffapp-theme',
				expect.any(String)
			)
		})

		it('should persist theme across service re-creation', () => {
			// TODO: Set theme to dark
			// Mock localStorage.getItem to return 'dark'
			// Destroy and recreate service (TestBed.inject again)
			// Verify new service starts with dark theme
			service.setTheme('dark')
			;(
				localStorage.getItem as jest.Mock
			).mockReturnValue('dark')
			const newService = TestBed.inject(ThemeService)
			expect(newService.getCurrentTheme()).toBe('dark')
		})
	})

	describe('SSR safety', () => {
		it('should handle window being undefined', () => {
			// TODO: Mock window as undefined
			// Create service
			// Verify no errors
			// Verify defaults to light theme
			const originalWindow = global.window
			// @ts-expect-error: Testing SSR scenario
			delete global.window
			expect(() =>
				TestBed.inject(ThemeService)
			).not.toThrow()
			global.window = originalWindow
		})

		it('should handle document being undefined', () => {
			// TODO: Mock document as undefined
			// Create service
			// Verify no errors (setAttribute not called)
			const originalDocument = global.document
			// @ts-expect-error: Testing SSR scenario
			delete global.document
			expect(() =>
				TestBed.inject(ThemeService)
			).not.toThrow()
			global.document = originalDocument
		})

		it('should handle matchMedia being undefined', () => {
			// TODO: Mock window.matchMedia as undefined
			// Create service
			// Verify defaults to light theme (doesn't crash)
			Object.defineProperty(window, 'matchMedia', {
				value: undefined,
				writable: true
			})
			service = TestBed.inject(ThemeService)
			expect(service.getCurrentTheme()).toBe('light')
		})
	})

	describe('OS preference detection', () => {
		it('should detect dark mode preference', () => {
			// TODO: Mock localStorage empty
			// Mock matchMedia to return { matches: true }
			// Create service
			// Verify theme is dark
			;(
				localStorage.getItem as jest.Mock
			).mockReturnValue(null)
			const matchMediaMock = jest
				.fn()
				.mockReturnValue({ matches: true })
			Object.defineProperty(window, 'matchMedia', {
				value: matchMediaMock,
				writable: true
			})
			service = TestBed.inject(ThemeService)
			expect(service.getCurrentTheme()).toBe('dark')
		})

		it('should detect light mode preference', () => {
			// TODO: Mock localStorage empty
			// Mock matchMedia to return { matches: false }
			// Create service
			// Verify theme is light
			;(
				localStorage.getItem as jest.Mock
			).mockReturnValue(null)
			const matchMediaMock = jest
				.fn()
				.mockReturnValue({ matches: false })
			Object.defineProperty(window, 'matchMedia', {
				value: matchMediaMock,
				writable: true
			})
			service = TestBed.inject(ThemeService)
			expect(service.getCurrentTheme()).toBe('light')
		})

		it('should prioritize localStorage over OS preference', () => {
			// TODO: Mock localStorage to return 'light'
			// Mock matchMedia to return { matches: true } (OS prefers dark)
			// Create service
			// Verify theme is 'light' (localStorage wins)
			;(
				localStorage.getItem as jest.Mock
			).mockReturnValue('light')
			const matchMediaMock = jest
				.fn()
				.mockReturnValue({ matches: true })
			Object.defineProperty(window, 'matchMedia', {
				value: matchMediaMock,
				writable: true
			})
			service = TestBed.inject(ThemeService)
			expect(service.getCurrentTheme()).toBe('light')
		})
	})

	describe('DOM integration', () => {
		beforeEach(() => {
			service = TestBed.inject(ThemeService)
		})

		it('should set data-theme attribute on document.documentElement', () => {
			// TODO: Spy on setAttribute
			// Call setTheme('dark')
			// Verify setAttribute('data-theme', 'dark') was called
			const setAttributeSpy = jest.spyOn(
				document.documentElement,
				'setAttribute'
			)
			service.setTheme('dark')
			expect(setAttributeSpy).toHaveBeenCalledWith(
				'data-theme',
				'dark'
			)
		})

		it('should update data-theme attribute on every theme change', () => {
			// TODO: Spy on setAttribute
			// Toggle multiple times
			// Verify setAttribute called each time
			const setAttributeSpy = jest.spyOn(
				document.documentElement,
				'setAttribute'
			)
			service.toggle()
			service.toggle()
			expect(setAttributeSpy).toHaveBeenCalledTimes(2)
		})
	})

	describe('edge cases', () => {
		beforeEach(() => {
			service = TestBed.inject(ThemeService)
		})

		it('should handle rapid toggles', () => {
			// TODO: Call toggle 10 times quickly
			// Verify final state is correct
			// Verify no race conditions
			const initialTheme = service.getCurrentTheme()
			for (let i = 0; i < 10; i++) {
				service.toggle()
			}
			// After 10 toggles, should be same as initial (even number)
			expect(service.getCurrentTheme()).toBe(initialTheme)
		})

		it('should handle localStorage errors gracefully', () => {
			// TODO: Mock localStorage.setItem to throw error
			// Call toggle()
			// Verify service doesn't crash
			// Theme still updates (just not persisted)
			;(
				localStorage.setItem as jest.Mock
			).mockImplementation(() => {
				throw new Error('Storage quota exceeded')
			})
			expect(() => service.toggle()).not.toThrow()
		})
	})
})
