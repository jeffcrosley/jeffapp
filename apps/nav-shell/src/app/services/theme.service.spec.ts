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
 * - Expose observable for reactive theme changes
 */
describe('ThemeService', () => {
	let service: ThemeService
	let localStorageGetItemSpy: jest.SpyInstance
	let localStorageSetItemSpy: jest.SpyInstance
	let setAttributeSpy: jest.SpyInstance

	// Helper to create service with specific mocked conditions
	const createServiceWithMocks = (options: {
		storedTheme?: string | null
		prefersDark?: boolean
	}) => {
		const {
			storedTheme = null,
			prefersDark = false
		} = options

		localStorageGetItemSpy = jest
			.spyOn(Storage.prototype, 'getItem')
			.mockReturnValue(storedTheme)
		localStorageSetItemSpy = jest
			.spyOn(Storage.prototype, 'setItem')
			.mockImplementation(jest.fn())

		// Update the matchMedia mock (already defined in test-setup.ts)
		window.matchMedia = jest.fn().mockReturnValue({
			matches: prefersDark,
			media: '(prefers-color-scheme: dark)',
			onchange: null,
			addListener: jest.fn(),
			removeListener: jest.fn(),
			addEventListener: jest.fn(),
			removeEventListener: jest.fn(),
			dispatchEvent: jest.fn()
		}) as unknown as typeof window.matchMedia

		setAttributeSpy = jest.spyOn(
			document.documentElement,
			'setAttribute'
		)

		TestBed.configureTestingModule({
			providers: [ThemeService]
		})

		return TestBed.inject(ThemeService)
	}

	afterEach(() => {
		jest.restoreAllMocks()
		TestBed.resetTestingModule()
	})

	describe('initialization', () => {
		it('should be created', () => {
			service = createServiceWithMocks({})
			expect(service).toBeTruthy()
		})

		it('should initialize from localStorage if value exists', () => {
			service = createServiceWithMocks({
				storedTheme: 'dark'
			})
			expect(service.getCurrentTheme()).toBe('dark')
		})

		it('should initialize from OS preference if localStorage is empty', () => {
			service = createServiceWithMocks({
				storedTheme: null,
				prefersDark: true
			})
			expect(service.getCurrentTheme()).toBe('dark')
		})

		it('should default to light theme if no preference detected', () => {
			service = createServiceWithMocks({
				storedTheme: null,
				prefersDark: false
			})
			expect(service.getCurrentTheme()).toBe('light')
		})

		it('should apply theme to document element on initialization', () => {
			service = createServiceWithMocks({
				storedTheme: 'dark'
			})
			expect(setAttributeSpy).toHaveBeenCalledWith(
				'data-theme',
				'dark'
			)
		})

		it('should prioritize localStorage over OS preference', () => {
			service = createServiceWithMocks({
				storedTheme: 'light',
				prefersDark: true
			})
			expect(service.getCurrentTheme()).toBe('light')
		})
	})

	describe('toggle()', () => {
		it('should toggle from light to dark', () => {
			service = createServiceWithMocks({
				storedTheme: 'light'
			})
			service.toggle()
			expect(service.getCurrentTheme()).toBe('dark')
			expect(
				localStorageSetItemSpy
			).toHaveBeenCalledWith('jeffapp-theme', 'dark')
		})

		it('should toggle from dark to light', () => {
			service = createServiceWithMocks({
				storedTheme: 'dark'
			})
			service.toggle()
			expect(service.getCurrentTheme()).toBe('light')
			expect(
				localStorageSetItemSpy
			).toHaveBeenCalledWith(
				'jeffapp-theme',
				'light'
			)
		})

		it('should toggle multiple times correctly', () => {
			service = createServiceWithMocks({
				storedTheme: 'light'
			})
			service.toggle()
			expect(service.getCurrentTheme()).toBe('dark')
			service.toggle()
			expect(service.getCurrentTheme()).toBe('light')
			service.toggle()
			expect(service.getCurrentTheme()).toBe('dark')
		})

		it('should update data-theme attribute on toggle', () => {
			service = createServiceWithMocks({
				storedTheme: 'light'
			})
			setAttributeSpy.mockClear()
			service.toggle()
			expect(setAttributeSpy).toHaveBeenCalledWith(
				'data-theme',
				'dark'
			)
		})
	})

	describe('setTheme()', () => {
		it('should set theme to light', () => {
			service = createServiceWithMocks({
				storedTheme: 'dark'
			})
			service.setTheme('light')
			expect(service.getCurrentTheme()).toBe('light')
			expect(
				localStorageSetItemSpy
			).toHaveBeenCalledWith(
				'jeffapp-theme',
				'light'
			)
		})

		it('should set theme to dark', () => {
			service = createServiceWithMocks({
				storedTheme: 'light'
			})
			service.setTheme('dark')
			expect(service.getCurrentTheme()).toBe('dark')
			expect(
				localStorageSetItemSpy
			).toHaveBeenCalledWith('jeffapp-theme', 'dark')
		})

		it('should be idempotent (setting same theme multiple times)', () => {
			service = createServiceWithMocks({
				storedTheme: 'light'
			})
			service.setTheme('dark')
			service.setTheme('dark')
			service.setTheme('dark')
			expect(service.getCurrentTheme()).toBe('dark')
			expect(
				localStorageSetItemSpy
			).toHaveBeenCalledTimes(3)
		})
	})

	describe('getTheme() observable', () => {
		it('should emit current theme', (done) => {
			service = createServiceWithMocks({
				storedTheme: 'light'
			})
			service.getTheme().subscribe((theme) => {
				expect(theme).toBe('light')
				done()
			})
		})

		it('should emit new theme when toggled', (done) => {
			service = createServiceWithMocks({
				storedTheme: 'light'
			})
			const themes: Array<'light' | 'dark'> = []
			service.getTheme().subscribe((theme) => {
				themes.push(theme)
				if (themes.length === 2) {
					expect(themes[0]).toBe('light')
					expect(themes[1]).toBe('dark')
					done()
				}
			})
			service.toggle()
		})

		it('should emit to multiple subscribers', () => {
			service = createServiceWithMocks({
				storedTheme: 'light'
			})
			let subscriber1Value: 'light' | 'dark' | null =
				null
			let subscriber2Value: 'light' | 'dark' | null =
				null

			service.getTheme().subscribe((theme) => {
				subscriber1Value = theme
			})
			service.getTheme().subscribe((theme) => {
				subscriber2Value = theme
			})

			service.toggle()
			expect(subscriber1Value).toBe('dark')
			expect(subscriber2Value).toBe('dark')
		})
	})

	describe('getCurrentTheme()', () => {
		it('should return current theme synchronously', () => {
			service = createServiceWithMocks({
				storedTheme: 'dark'
			})
			const theme = service.getCurrentTheme()
			expect(theme).toBe('dark')
		})

		it('should match observable value', (done) => {
			service = createServiceWithMocks({
				storedTheme: 'dark'
			})
			const syncTheme = service.getCurrentTheme()
			service.getTheme().subscribe((obsTheme) => {
				expect(syncTheme).toBe(obsTheme)
				done()
			})
		})
	})

	describe('isDarkMode()', () => {
		it('should return true when theme is dark', () => {
			service = createServiceWithMocks({
				storedTheme: 'dark'
			})
			expect(service.isDarkMode()).toBe(true)
		})

		it('should return false when theme is light', () => {
			service = createServiceWithMocks({
				storedTheme: 'light'
			})
			expect(service.isDarkMode()).toBe(false)
		})

		it('should update after toggle', () => {
			service = createServiceWithMocks({
				storedTheme: 'light'
			})
			expect(service.isDarkMode()).toBe(false)
			service.toggle()
			expect(service.isDarkMode()).toBe(true)
		})
	})

	describe('localStorage persistence', () => {
		it('should use correct storage key', () => {
			service = createServiceWithMocks({
				storedTheme: 'light'
			})
			service.toggle()
			expect(
				localStorageSetItemSpy
			).toHaveBeenCalledWith('jeffapp-theme', 'dark')
		})

		it('should read from localStorage on initialization', () => {
			service = createServiceWithMocks({
				storedTheme: 'dark'
			})
			expect(
				localStorageGetItemSpy
			).toHaveBeenCalledWith('jeffapp-theme')
			expect(service.getCurrentTheme()).toBe('dark')
		})
	})

	describe('OS preference detection', () => {
		it('should detect dark mode preference', () => {
			service = createServiceWithMocks({
				storedTheme: null,
				prefersDark: true
			})
			expect(window.matchMedia).toHaveBeenCalledWith(
				'(prefers-color-scheme: dark)'
			)
			expect(service.getCurrentTheme()).toBe('dark')
		})

		it('should detect light mode preference', () => {
			service = createServiceWithMocks({
				storedTheme: null,
				prefersDark: false
			})
			expect(service.getCurrentTheme()).toBe('light')
		})
	})

	describe('DOM integration', () => {
		it('should set data-theme attribute on document.documentElement', () => {
			service = createServiceWithMocks({
				storedTheme: 'light'
			})
			setAttributeSpy.mockClear()
			service.setTheme('dark')
			expect(setAttributeSpy).toHaveBeenCalledWith(
				'data-theme',
				'dark'
			)
		})

		it('should update data-theme attribute on every theme change', () => {
			service = createServiceWithMocks({
				storedTheme: 'light'
			})
			setAttributeSpy.mockClear()
			service.toggle()
			service.toggle()
			expect(setAttributeSpy).toHaveBeenCalledTimes(
				2
			)
		})
	})

	describe('edge cases', () => {
		it('should handle rapid toggles', () => {
			service = createServiceWithMocks({
				storedTheme: 'light'
			})
			const initialTheme = service.getCurrentTheme()
			for (let i = 0; i < 10; i++) {
				service.toggle()
			}
			// After 10 toggles (even number), should be same as initial
			expect(service.getCurrentTheme()).toBe(
				initialTheme
			)
		})

		it('should handle matchMedia being undefined', () => {
			jest
				.spyOn(Storage.prototype, 'getItem')
				.mockReturnValue(null)
			jest
				.spyOn(Storage.prototype, 'setItem')
				.mockImplementation(jest.fn())

			// Set matchMedia to undefined to simulate SSR or old browser
			window.matchMedia =
				undefined as unknown as typeof window.matchMedia

			jest.spyOn(
				document.documentElement,
				'setAttribute'
			)

			TestBed.configureTestingModule({
				providers: [ThemeService]
			})

			// Service should handle this gracefully and default to light
			expect(() =>
				TestBed.inject(ThemeService)
			).not.toThrow()
		})
	})
})
