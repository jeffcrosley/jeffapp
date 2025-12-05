import { DEFAULT_DEV_CONFIG, NavShellConfig } from './config'

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
describe.skip('Config Types', () => {
	describe('NavShellConfig interface', () => {
		it('should accept valid config objects', () => {
			// TODO: Create valid config object with showcaseUrl and apiGatewayUrl
			// Verify TypeScript accepts it (compilation check)
			const validConfig: NavShellConfig = {
				showcaseUrl: 'https://components.example.com',
				apiGatewayUrl: 'https://api.example.com'
			}
			expect(validConfig).toBeTruthy()
		})

		it('should require showcaseUrl property', () => {
			// TODO: This test verifies type safety at compile time
			// If missing showcaseUrl, TypeScript should error
			// Runtime check: verify property exists on valid config
			const config: NavShellConfig = {
				showcaseUrl: 'http://localhost:4201',
				apiGatewayUrl: 'http://localhost:3333'
			}
			expect(config.showcaseUrl).toBeDefined()
			expect(typeof config.showcaseUrl).toBe('string')
		})

		it('should require apiGatewayUrl property', () => {
			// TODO: Verify apiGatewayUrl property exists and is string
			const config: NavShellConfig = {
				showcaseUrl: 'http://localhost:4201',
				apiGatewayUrl: 'http://localhost:3333'
			}
			expect(config.apiGatewayUrl).toBeDefined()
			expect(typeof config.apiGatewayUrl).toBe('string')
		})

		it('should allow additional properties (not sealed)', () => {
			// TODO: TypeScript interfaces are open by default
			// Verify config can have extra properties at runtime
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
			// TODO: Verify DEFAULT_DEV_CONFIG contains localhost URLs
			// These are used during local development
			expect(DEFAULT_DEV_CONFIG.showcaseUrl).toContain('localhost')
			expect(DEFAULT_DEV_CONFIG.apiGatewayUrl).toContain('localhost')
		})

		it('should use port 4201 for showcase', () => {
			// TODO: Verify showcaseUrl uses expected dev port
			expect(DEFAULT_DEV_CONFIG.showcaseUrl).toBe('http://localhost:4201')
		})

		it('should use port 3333 for API gateway', () => {
			// TODO: Verify apiGatewayUrl uses expected dev port
			expect(DEFAULT_DEV_CONFIG.apiGatewayUrl).toBe('http://localhost:3333')
		})

		it('should be a valid NavShellConfig object', () => {
			// TODO: Verify DEFAULT_DEV_CONFIG conforms to interface
			const config: NavShellConfig = DEFAULT_DEV_CONFIG
			expect(config.showcaseUrl).toBeDefined()
			expect(config.apiGatewayUrl).toBeDefined()
		})

		it('should use http protocol for local development', () => {
			// TODO: Verify URLs use http:// (not https://) for localhost
			expect(DEFAULT_DEV_CONFIG.showcaseUrl).toMatch(/^http:\/\//)
			expect(DEFAULT_DEV_CONFIG.apiGatewayUrl).toMatch(/^http:\/\//)
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
			// TODO: Verify window.__navShellConfig can be assigned
			// TypeScript should allow this due to global augmentation
			window.__navShellConfig = {
				showcaseUrl: 'https://components.example.com',
				apiGatewayUrl: 'https://api.example.com'
			}
			expect(window.__navShellConfig).toBeDefined()
		})

		it('should allow reading config from window object', () => {
			// TODO: Set config on window
			// Read it back and verify values
			const testConfig: NavShellConfig = {
				showcaseUrl: 'https://test.com',
				apiGatewayUrl: 'https://api.test.com'
			}
			window.__navShellConfig = testConfig
			expect(window.__navShellConfig?.showcaseUrl).toBe('https://test.com')
		})

		it('should be undefined by default', () => {
			// TODO: Verify window.__navShellConfig starts undefined
			// Only populated after APP_INITIALIZER runs
			expect(window.__navShellConfig).toBeUndefined()
		})

		it('should allow optional access with ?. operator', () => {
			// TODO: Verify optional chaining works
			// window.__navShellConfig is optional property
			const showcaseUrl = window.__navShellConfig?.showcaseUrl
			expect(showcaseUrl).toBeUndefined()
		})
	})

	describe('config validation patterns', () => {
		it('should handle production URLs', () => {
			// TODO: Verify config accepts HTTPS URLs
			const prodConfig: NavShellConfig = {
				showcaseUrl: 'https://components.jeffcrosley.com',
				apiGatewayUrl: 'https://api.jeffcrosley.com'
			}
			expect(prodConfig.showcaseUrl).toMatch(/^https:\/\//)
		})

		it('should handle URLs with paths', () => {
			// TODO: Verify config accepts URLs with path segments
			const configWithPaths: NavShellConfig = {
				showcaseUrl: 'https://example.com/showcase',
				apiGatewayUrl: 'https://example.com/api/v1'
			}
			expect(configWithPaths.showcaseUrl).toContain('/showcase')
			expect(configWithPaths.apiGatewayUrl).toContain('/api/v1')
		})

		it('should handle URLs with custom ports', () => {
			// TODO: Verify config accepts URLs with non-standard ports
			const customPortConfig: NavShellConfig = {
				showcaseUrl: 'http://localhost:8080',
				apiGatewayUrl: 'http://localhost:9000'
			}
			expect(customPortConfig.showcaseUrl).toContain(':8080')
			expect(customPortConfig.apiGatewayUrl).toContain(':9000')
		})
	})

	describe('edge cases', () => {
		it('should handle empty string URLs', () => {
			// TODO: TypeScript allows empty strings
			// Verify config can be created (even if invalid at runtime)
			const emptyConfig: NavShellConfig = {
				showcaseUrl: '',
				apiGatewayUrl: ''
			}
			expect(emptyConfig.showcaseUrl).toBe('')
		})

		it('should handle config with trailing slashes', () => {
			// TODO: Verify config handles URLs with/without trailing slashes
			const configWithSlash: NavShellConfig = {
				showcaseUrl: 'http://localhost:4201/',
				apiGatewayUrl: 'http://localhost:3333/'
			}
			expect(configWithSlash.showcaseUrl).toMatch(/\/$/)
		})

		it('should allow config immutability checks', () => {
			// TODO: Verify config can be made readonly at runtime
			const config: Readonly<NavShellConfig> = DEFAULT_DEV_CONFIG
			expect(() => {
				// @ts-expect-error: Testing readonly enforcement
				config.showcaseUrl = 'changed'
			}).toThrow()
		})
	})

	describe('type safety', () => {
		it('should enforce string type for showcaseUrl', () => {
			// TODO: TypeScript should reject non-string values
			// Runtime check: verify typeof is string
			const config: NavShellConfig = {
				showcaseUrl: 'http://localhost:4201',
				apiGatewayUrl: 'http://localhost:3333'
			}
			expect(typeof config.showcaseUrl).toBe('string')
		})

		it('should enforce string type for apiGatewayUrl', () => {
			// TODO: Verify apiGatewayUrl is string type
			const config: NavShellConfig = {
				showcaseUrl: 'http://localhost:4201',
				apiGatewayUrl: 'http://localhost:3333'
			}
			expect(typeof config.apiGatewayUrl).toBe('string')
		})

		it('should allow partial config with Partial<NavShellConfig>', () => {
			// TODO: Verify TypeScript Partial utility type works
			const partialConfig: Partial<NavShellConfig> = {
				showcaseUrl: 'http://localhost:4201'
			}
			expect(partialConfig.showcaseUrl).toBeDefined()
			expect(partialConfig.apiGatewayUrl).toBeUndefined()
		})

		it('should allow required config with Required<NavShellConfig>', () => {
			// TODO: Verify TypeScript Required utility type works
			const requiredConfig: Required<NavShellConfig> = {
				showcaseUrl: 'http://localhost:4201',
				apiGatewayUrl: 'http://localhost:3333'
			}
			expect(requiredConfig.showcaseUrl).toBeDefined()
			expect(requiredConfig.apiGatewayUrl).toBeDefined()
		})
	})
})
