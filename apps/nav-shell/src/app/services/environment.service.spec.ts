import { TestBed } from '@angular/core/testing'
import { DEFAULT_DEV_CONFIG } from '../types/config'
import { EnvironmentService } from './environment.service'

/**
 * Test Specification: EnvironmentService
 *
 * Purpose: Runtime environment configuration service
 * Loads config.json via APP_INITIALIZER and provides environment-specific URLs
 *
 * Key Behaviors:
 * - loadConfig(): Fetches /config.json, falls back to defaults on error
 * - getShowcaseUrl(): Returns showcase URL (dev defaults vs production config)
 * - getApiGatewayUrl(): Returns API gateway URL (dev defaults vs production config)
 * - isLocalDevelopment(): Detects localhost, 127.0.0.1, or .local domains
 * - isProduction(): Inverse of isLocalDevelopment()
 */
describe('EnvironmentService', () => {
	let service: EnvironmentService
	let originalFetch: typeof global.fetch
	let originalLocation: Location

	beforeEach(() => {
		// Store originals for restoration
		originalFetch = global.fetch
		originalLocation = window.location

		TestBed.configureTestingModule({})
		service = TestBed.inject(EnvironmentService)
	})

	afterEach(() => {
		// Restore originals
		global.fetch = originalFetch
		Object.defineProperty(window, 'location', {
			value: originalLocation,
			writable: true
		})
		// Clean up window config cache
		delete window.__navShellConfig
	})

	describe('initialization', () => {
		it('should be created', () => {
			expect(service).toBeTruthy()
		})

		it('should start with null config before loadConfig is called', () => {
			// Config is private, but we can verify behavior via getters
			// Before loadConfig, should use dev defaults if on localhost
			expect(service.getShowcaseUrl()).toBeTruthy()
		})
	})

	describe.skip('loadConfig()', () => {
		it('should fetch config.json from root path', async () => {
			// TODO: Mock fetch, verify it's called with '/config.json'
			const mockFetch = jest.fn().mockResolvedValue({
				json: () =>
					Promise.resolve({
						showcaseUrl: 'https://showcase.example.com',
						apiGatewayUrl: 'https://api.example.com'
					})
			})
			global.fetch = mockFetch

			await service.loadConfig()

			expect(mockFetch).toHaveBeenCalledWith(
				'/config.json'
			)
		})

		it('should parse JSON response and store config', async () => {
			// TODO: Mock fetch with valid config, verify config is stored
			const mockConfig = {
				showcaseUrl: 'https://showcase.example.com',
				apiGatewayUrl: 'https://api.example.com'
			}
			global.fetch = jest.fn().mockResolvedValue({
				json: () => Promise.resolve(mockConfig)
			})

			// Mock production environment
			Object.defineProperty(window, 'location', {
				value: { hostname: 'jeffcrosley.com' },
				writable: true
			})

			await service.loadConfig()

			expect(service.getShowcaseUrl()).toBe(
				'https://showcase.example.com'
			)
			expect(service.getApiGatewayUrl()).toBe(
				'https://api.example.com'
			)
		})

		it('should cache config on window.__navShellConfig for debugging', async () => {
			// TODO: Verify window.__navShellConfig is set after loadConfig
			const mockConfig = {
				showcaseUrl: 'https://showcase.example.com',
				apiGatewayUrl: 'https://api.example.com'
			}
			global.fetch = jest.fn().mockResolvedValue({
				json: () => Promise.resolve(mockConfig)
			})

			await service.loadConfig()

			expect(window.__navShellConfig).toEqual(mockConfig)
		})

		it('should fall back to DEFAULT_DEV_CONFIG on fetch error', async () => {
			// TODO: Mock fetch to throw, verify defaults are used
			global.fetch = jest
				.fn()
				.mockRejectedValue(new Error('Network error'))

			// Spy on console.warn
			const warnSpy = jest
				.spyOn(console, 'warn')
				.mockImplementation()

			await service.loadConfig()

			expect(warnSpy).toHaveBeenCalledWith(
				'Could not load config.json, using defaults:',
				expect.any(Error)
			)
			warnSpy.mockRestore()
		})

		it('should fall back to DEFAULT_DEV_CONFIG on JSON parse error', async () => {
			// TODO: Mock fetch with invalid JSON response
			global.fetch = jest.fn().mockResolvedValue({
				json: () =>
					Promise.reject(new Error('Invalid JSON'))
			})

			const warnSpy = jest
				.spyOn(console, 'warn')
				.mockImplementation()

			await service.loadConfig()

			expect(warnSpy).toHaveBeenCalled()
			warnSpy.mockRestore()
		})

		it('should be idempotent - calling twice should not cause issues', async () => {
			// TODO: Call loadConfig twice, verify no errors
			const mockConfig = {
				showcaseUrl: 'https://showcase.example.com',
				apiGatewayUrl: 'https://api.example.com'
			}
			global.fetch = jest.fn().mockResolvedValue({
				json: () => Promise.resolve(mockConfig)
			})

			await service.loadConfig()
			await service.loadConfig()

			expect(global.fetch).toHaveBeenCalledTimes(2)
		})
	})

	describe.skip('getShowcaseUrl()', () => {
		it('should return DEFAULT_DEV_CONFIG.showcaseUrl in local development', () => {
			// TODO: Mock localhost, verify dev URL is returned
			Object.defineProperty(window, 'location', {
				value: { hostname: 'localhost' },
				writable: true
			})

			expect(service.getShowcaseUrl()).toBe(
				DEFAULT_DEV_CONFIG.showcaseUrl
			)
		})

		it('should return config value in production after loadConfig', async () => {
			// TODO: Mock production hostname, load config, verify production URL
			Object.defineProperty(window, 'location', {
				value: { hostname: 'jeffcrosley.com' },
				writable: true
			})

			const mockConfig = {
				showcaseUrl: 'https://components.jeffcrosley.com',
				apiGatewayUrl: 'https://api.jeffcrosley.com'
			}
			global.fetch = jest.fn().mockResolvedValue({
				json: () => Promise.resolve(mockConfig)
			})

			await service.loadConfig()

			expect(service.getShowcaseUrl()).toBe(
				'https://components.jeffcrosley.com'
			)
		})

		it('should return default if config not loaded in production', () => {
			// TODO: Production environment but loadConfig not called
			Object.defineProperty(window, 'location', {
				value: { hostname: 'jeffcrosley.com' },
				writable: true
			})

			// Config not loaded, should fall back to default
			expect(service.getShowcaseUrl()).toBe(
				DEFAULT_DEV_CONFIG.showcaseUrl
			)
		})

		it('should always return dev URL on localhost regardless of config', async () => {
			// TODO: Load production config but run on localhost
			Object.defineProperty(window, 'location', {
				value: { hostname: 'localhost' },
				writable: true
			})

			const mockConfig = {
				showcaseUrl: 'https://components.jeffcrosley.com',
				apiGatewayUrl: 'https://api.jeffcrosley.com'
			}
			global.fetch = jest.fn().mockResolvedValue({
				json: () => Promise.resolve(mockConfig)
			})

			await service.loadConfig()

			// Should still return dev URL because we're on localhost
			expect(service.getShowcaseUrl()).toBe(
				DEFAULT_DEV_CONFIG.showcaseUrl
			)
		})
	})

	describe.skip('getApiGatewayUrl()', () => {
		it('should return DEFAULT_DEV_CONFIG.apiGatewayUrl in local development', () => {
			// TODO: Mock localhost, verify dev URL is returned
			Object.defineProperty(window, 'location', {
				value: { hostname: 'localhost' },
				writable: true
			})

			expect(service.getApiGatewayUrl()).toBe(
				DEFAULT_DEV_CONFIG.apiGatewayUrl
			)
		})

		it('should return config value in production after loadConfig', async () => {
			// TODO: Mock production hostname, load config, verify production URL
			Object.defineProperty(window, 'location', {
				value: { hostname: 'jeffcrosley.com' },
				writable: true
			})

			const mockConfig = {
				showcaseUrl: 'https://components.jeffcrosley.com',
				apiGatewayUrl: 'https://api.jeffcrosley.com'
			}
			global.fetch = jest.fn().mockResolvedValue({
				json: () => Promise.resolve(mockConfig)
			})

			await service.loadConfig()

			expect(service.getApiGatewayUrl()).toBe(
				'https://api.jeffcrosley.com'
			)
		})

		it('should return default if config not loaded in production', () => {
			// TODO: Production environment but loadConfig not called
			Object.defineProperty(window, 'location', {
				value: { hostname: 'jeffcrosley.com' },
				writable: true
			})

			expect(service.getApiGatewayUrl()).toBe(
				DEFAULT_DEV_CONFIG.apiGatewayUrl
			)
		})

		it('should always return dev URL on 127.0.0.1 regardless of config', async () => {
			// TODO: Load production config but run on 127.0.0.1
			Object.defineProperty(window, 'location', {
				value: { hostname: '127.0.0.1' },
				writable: true
			})

			const mockConfig = {
				showcaseUrl: 'https://components.jeffcrosley.com',
				apiGatewayUrl: 'https://api.jeffcrosley.com'
			}
			global.fetch = jest.fn().mockResolvedValue({
				json: () => Promise.resolve(mockConfig)
			})

			await service.loadConfig()

			expect(service.getApiGatewayUrl()).toBe(
				DEFAULT_DEV_CONFIG.apiGatewayUrl
			)
		})
	})

	describe('isLocalDevelopment()', () => {
		it('should return true for localhost', () => {
			Object.defineProperty(window, 'location', {
				value: { hostname: 'localhost' },
				writable: true
			})

			expect(service.isLocalDevelopment()).toBe(true)
		})

		it('should return true for 127.0.0.1', () => {
			Object.defineProperty(window, 'location', {
				value: { hostname: '127.0.0.1' },
				writable: true
			})

			expect(service.isLocalDevelopment()).toBe(true)
		})

		it('should return true for .local domains', () => {
			Object.defineProperty(window, 'location', {
				value: { hostname: 'myapp.local' },
				writable: true
			})

			expect(service.isLocalDevelopment()).toBe(true)
		})

		it('should return true for nested .local domains', () => {
			Object.defineProperty(window, 'location', {
				value: { hostname: 'dev.myapp.local' },
				writable: true
			})

			expect(service.isLocalDevelopment()).toBe(true)
		})

		it('should return false for production domains', () => {
			Object.defineProperty(window, 'location', {
				value: { hostname: 'jeffcrosley.com' },
				writable: true
			})

			expect(service.isLocalDevelopment()).toBe(false)
		})

		it('should return false for subdomains of production domains', () => {
			Object.defineProperty(window, 'location', {
				value: { hostname: 'components.jeffcrosley.com' },
				writable: true
			})

			expect(service.isLocalDevelopment()).toBe(false)
		})

		it('should return false for Render preview URLs', () => {
			Object.defineProperty(window, 'location', {
				value: {
					hostname: 'nav-shell-abc123.onrender.com'
				},
				writable: true
			})

			expect(service.isLocalDevelopment()).toBe(false)
		})
	})

	describe('isProduction()', () => {
		it('should return false for localhost', () => {
			Object.defineProperty(window, 'location', {
				value: { hostname: 'localhost' },
				writable: true
			})

			expect(service.isProduction()).toBe(false)
		})

		it('should return false for 127.0.0.1', () => {
			Object.defineProperty(window, 'location', {
				value: { hostname: '127.0.0.1' },
				writable: true
			})

			expect(service.isProduction()).toBe(false)
		})

		it('should return true for production domains', () => {
			Object.defineProperty(window, 'location', {
				value: { hostname: 'jeffcrosley.com' },
				writable: true
			})

			expect(service.isProduction()).toBe(true)
		})

		it('should return true for Render URLs', () => {
			Object.defineProperty(window, 'location', {
				value: { hostname: 'nav-shell.onrender.com' },
				writable: true
			})

			expect(service.isProduction()).toBe(true)
		})

		it('should be inverse of isLocalDevelopment()', () => {
			Object.defineProperty(window, 'location', {
				value: { hostname: 'localhost' },
				writable: true
			})

			expect(service.isProduction()).toBe(
				!service.isLocalDevelopment()
			)

			Object.defineProperty(window, 'location', {
				value: { hostname: 'jeffcrosley.com' },
				writable: true
			})

			expect(service.isProduction()).toBe(
				!service.isLocalDevelopment()
			)
		})
	})

	describe.skip('SSR safety', () => {
		it('should handle undefined window gracefully in isLocalDevelopment', () => {
			// TODO: This is tricky to test in Jest/JSDOM, but document the behavior
			// When window is undefined (SSR), should return false
			// Implementation checks: if (typeof window === 'undefined') return false
			expect(true).toBe(true) // Placeholder - SSR testing requires special setup
		})

		it('should handle undefined window gracefully in loadConfig', () => {
			// TODO: Verify loadConfig doesn't crash when window is undefined
			// Should skip window.__navShellConfig assignment
			expect(true).toBe(true) // Placeholder
		})
	})

	describe.skip('edge cases', () => {
		it('should handle empty config.json gracefully', async () => {
			// TODO: Mock fetch with empty object response
			global.fetch = jest.fn().mockResolvedValue({
				json: () => Promise.resolve({})
			})

			Object.defineProperty(window, 'location', {
				value: { hostname: 'jeffcrosley.com' },
				writable: true
			})

			await service.loadConfig()

			// Should fall back to defaults for missing properties
			expect(service.getShowcaseUrl()).toBe(
				DEFAULT_DEV_CONFIG.showcaseUrl
			)
		})

		it('should handle partial config.json gracefully', async () => {
			// TODO: Mock fetch with only showcaseUrl
			global.fetch = jest.fn().mockResolvedValue({
				json: () =>
					Promise.resolve({
						showcaseUrl: 'https://showcase.example.com'
					})
			})

			Object.defineProperty(window, 'location', {
				value: { hostname: 'jeffcrosley.com' },
				writable: true
			})

			await service.loadConfig()

			expect(service.getShowcaseUrl()).toBe(
				'https://showcase.example.com'
			)
			// apiGatewayUrl should fall back to default
			expect(service.getApiGatewayUrl()).toBe(
				DEFAULT_DEV_CONFIG.apiGatewayUrl
			)
		})

		it('should handle network timeout gracefully', async () => {
			// TODO: Mock fetch that never resolves or takes too long
			global.fetch = jest
				.fn()
				.mockImplementation(
					() =>
						new Promise((_, reject) =>
							setTimeout(
								() => reject(new Error('Timeout')),
								100
							)
						)
				)

			const warnSpy = jest
				.spyOn(console, 'warn')
				.mockImplementation()

			await service.loadConfig()

			expect(warnSpy).toHaveBeenCalled()
			warnSpy.mockRestore()
		})
	})

	describe.skip('type safety', () => {
		it('should type config as NavShellConfig', async () => {
			// TODO: This is compile-time only, document expected behavior
			// TypeScript should enforce NavShellConfig shape
			const mockConfig = {
				showcaseUrl: 'https://showcase.example.com',
				apiGatewayUrl: 'https://api.example.com'
			}
			global.fetch = jest.fn().mockResolvedValue({
				json: () => Promise.resolve(mockConfig)
			})

			await service.loadConfig()

			expect(window.__navShellConfig).toEqual(mockConfig)
		})
	})
})
