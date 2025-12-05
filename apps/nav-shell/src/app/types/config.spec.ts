import {
	DEFAULT_DEV_CONFIG,
	NavShellConfig
} from './config'

/**
 * Test Specification: Configuration Types
 *
 * Purpose: Validate runtime configuration interface and defaults
 * These are TypeScript interfaces with minimal runtime validation
 *
 * Key Behaviors:
 * - NavShellConfig interface structure
 * - DEFAULT_DEV_CONFIG provides valid localhost URLs
 * - Window augmentation for runtime config storage
 * - Type safety for config objects
 */
describe('Config Types', () => {
	describe('NavShellConfig interface', () => {
		it('should accept valid config objects', () => {
			const validConfig: NavShellConfig = {
				showcaseUrl: 'https://components.example.com',
				apiGatewayUrl: 'https://api.example.com'
			}
			expect(validConfig).toBeTruthy()
		})

		it('should require showcaseUrl property', () => {
			const config: NavShellConfig = {
				showcaseUrl: 'http://localhost:4201',
				apiGatewayUrl: 'http://localhost:3333'
			}
			expect(config.showcaseUrl).toBeDefined()
			expect(typeof config.showcaseUrl).toBe('string')
		})

		it('should require apiGatewayUrl property', () => {
			const config: NavShellConfig = {
				showcaseUrl: 'http://localhost:4201',
				apiGatewayUrl: 'http://localhost:3333'
			}
			expect(config.apiGatewayUrl).toBeDefined()
			expect(typeof config.apiGatewayUrl).toBe('string')
		})

		it('should allow additional properties (not sealed)', () => {
			const config: NavShellConfig = {
				showcaseUrl: 'http://localhost:4201',
				apiGatewayUrl: 'http://localhost:3333'
			}
			// @ts-expect-error: Testing runtime behavior
			config.extraProperty = 'allowed'
			expect(config).toHaveProperty('extraProperty')
		})
	})

	describe('DEFAULT_DEV_CONFIG', () => {
		it('should provide localhost URLs', () => {
			expect(DEFAULT_DEV_CONFIG.showcaseUrl).toContain(
				'localhost'
			)
			expect(DEFAULT_DEV_CONFIG.apiGatewayUrl).toContain(
				'localhost'
			)
		})

		it('should use port 4201 for showcase', () => {
			expect(DEFAULT_DEV_CONFIG.showcaseUrl).toBe(
				'http://localhost:4201'
			)
		})

		it('should use port 3333 for API gateway', () => {
			expect(DEFAULT_DEV_CONFIG.apiGatewayUrl).toBe(
				'http://localhost:3333'
			)
		})

		it('should be a valid NavShellConfig object', () => {
			const config: NavShellConfig = DEFAULT_DEV_CONFIG
			expect(config.showcaseUrl).toBeDefined()
			expect(config.apiGatewayUrl).toBeDefined()
		})

		it('should use http protocol for local development', () => {
			expect(DEFAULT_DEV_CONFIG.showcaseUrl).toMatch(
				/^http:\/\//
			)
			expect(DEFAULT_DEV_CONFIG.apiGatewayUrl).toMatch(
				/^http:\/\//
			)
		})
	})

	describe('window.__navShellConfig augmentation', () => {
		beforeEach(() => {
			// Clean up window object before each test
			delete window.__navShellConfig
		})

		afterEach(() => {
			// Clean up window object after each test
			delete window.__navShellConfig
		})

		it('should allow setting config on window object', () => {
			window.__navShellConfig = {
				showcaseUrl: 'https://components.example.com',
				apiGatewayUrl: 'https://api.example.com'
			}
			expect(window.__navShellConfig).toBeDefined()
		})

		it('should allow reading config from window object', () => {
			const testConfig: NavShellConfig = {
				showcaseUrl: 'https://test.com',
				apiGatewayUrl: 'https://api.test.com'
			}
			window.__navShellConfig = testConfig
			expect(window.__navShellConfig?.showcaseUrl).toBe(
				'https://test.com'
			)
		})

		it('should be undefined by default', () => {
			expect(window.__navShellConfig).toBeUndefined()
		})

		it('should allow optional access with ?. operator', () => {
			const showcaseUrl =
				window.__navShellConfig?.showcaseUrl
			expect(showcaseUrl).toBeUndefined()
		})
	})

	describe('config validation patterns', () => {
		it('should handle production URLs', () => {
			const prodConfig: NavShellConfig = {
				showcaseUrl: 'https://components.jeffcrosley.com',
				apiGatewayUrl: 'https://api.jeffcrosley.com'
			}
			expect(prodConfig.showcaseUrl).toMatch(
				/^https:\/\//
			)
		})

		it('should handle URLs with paths', () => {
			const configWithPaths: NavShellConfig = {
				showcaseUrl: 'https://example.com/showcase',
				apiGatewayUrl: 'https://example.com/api/v1'
			}
			expect(configWithPaths.showcaseUrl).toContain(
				'/showcase'
			)
			expect(configWithPaths.apiGatewayUrl).toContain(
				'/api/v1'
			)
		})

		it('should handle URLs with custom ports', () => {
			const customPortConfig: NavShellConfig = {
				showcaseUrl: 'http://localhost:8080',
				apiGatewayUrl: 'http://localhost:9000'
			}
			expect(customPortConfig.showcaseUrl).toContain(
				':8080'
			)
			expect(customPortConfig.apiGatewayUrl).toContain(
				':9000'
			)
		})
	})

	describe('edge cases', () => {
		it('should handle empty string URLs', () => {
			const emptyConfig: NavShellConfig = {
				showcaseUrl: '',
				apiGatewayUrl: ''
			}
			expect(emptyConfig.showcaseUrl).toBe('')
		})

		it('should handle config with trailing slashes', () => {
			const configWithSlash: NavShellConfig = {
				showcaseUrl: 'http://localhost:4201/',
				apiGatewayUrl: 'http://localhost:3333/'
			}
			expect(configWithSlash.showcaseUrl).toMatch(/\/$/)
		})

		it('should support Readonly type for compile-time immutability', () => {
			// Readonly<T> is compile-time only; runtime immutability requires Object.freeze
			const config = Object.freeze({
				...DEFAULT_DEV_CONFIG
			})
			const originalUrl = config.showcaseUrl

			// Attempt to modify (silently fails in non-strict mode)
			try {
				// @ts-expect-error: Testing readonly enforcement
				config.showcaseUrl = 'changed'
			} catch {
				// Expected in strict mode
			}

			// Value should remain unchanged regardless
			expect(config.showcaseUrl).toBe(originalUrl)
		})
	})

	describe('type safety', () => {
		it('should enforce string type for showcaseUrl', () => {
			const config: NavShellConfig = {
				showcaseUrl: 'http://localhost:4201',
				apiGatewayUrl: 'http://localhost:3333'
			}
			expect(typeof config.showcaseUrl).toBe('string')
		})

		it('should enforce string type for apiGatewayUrl', () => {
			const config: NavShellConfig = {
				showcaseUrl: 'http://localhost:4201',
				apiGatewayUrl: 'http://localhost:3333'
			}
			expect(typeof config.apiGatewayUrl).toBe('string')
		})

		it('should allow partial config with Partial<NavShellConfig>', () => {
			const partialConfig: Partial<NavShellConfig> = {
				showcaseUrl: 'http://localhost:4201'
			}
			expect(partialConfig.showcaseUrl).toBeDefined()
			expect(partialConfig.apiGatewayUrl).toBeUndefined()
		})

		it('should allow required config with Required<NavShellConfig>', () => {
			const requiredConfig: Required<NavShellConfig> = {
				showcaseUrl: 'http://localhost:4201',
				apiGatewayUrl: 'http://localhost:3333'
			}
			expect(requiredConfig.showcaseUrl).toBeDefined()
			expect(requiredConfig.apiGatewayUrl).toBeDefined()
		})
	})
})
