/**
 * Icon resolver utility for app-icon component.
 * Provides CDN URL resolution with override capability.
 */

type IconResolver = (name: string) => string

let customResolver: IconResolver | null = null

/**
 * Default resolver: Simple Icons CDN
 */
const defaultResolver: IconResolver = (
	name: string
) => {
	return `https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/${name}.svg`
}

/**
 * Resolve icon name to CDN URL
 */
export function resolveIconUrl(
	name: string
): string {
	const resolver =
		customResolver || defaultResolver
	return resolver(name)
}

/**
 * Override the default icon resolver
 */
export function setIconResolver(
	resolver: IconResolver
): void {
	customResolver = resolver
}

/**
 * Reset to default resolver
 */
export function resetIconResolver(): void {
	customResolver = null
}
