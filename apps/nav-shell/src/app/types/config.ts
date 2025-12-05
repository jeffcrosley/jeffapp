/**
 * Runtime configuration interface for nav-shell.
 * Loaded from public/config.json via APP_INITIALIZER.
 *
 * @see apps/nav-shell/public/config.json
 * @see .github/adr/001-runtime-configuration.md
 */
export interface NavShellConfig {
	/** URL for the component showcase app (iframe source) */
	showcaseUrl: string

	/** URL for the API gateway backend */
	apiGatewayUrl: string
}

/**
 * Default configuration for local development.
 * Used when config.json cannot be loaded or when running on localhost.
 */
export const DEFAULT_DEV_CONFIG: NavShellConfig = {
	showcaseUrl: 'http://localhost:4201',
	apiGatewayUrl: 'http://localhost:3333'
}

/**
 * Global window augmentation for runtime config storage.
 * Allows optional caching of loaded config on window object.
 */
declare global {
	interface Window {
		/** Cached runtime configuration after APP_INITIALIZER load */
		__navShellConfig?: NavShellConfig
	}
}
