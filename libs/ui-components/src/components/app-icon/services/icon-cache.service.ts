/**
 * Global singleton cache for icon SVG content.
 * Deduplicates concurrent requests for the same icon.
 */

import { sanitizeSVG } from '../utils/sanitize-svg'

class IconCacheService {
	private cache = new Map<
		string,
		Promise<string>
	>()
	/**
	 * Get cached icon or initiate fetch
	 */
	async get(url: string): Promise<string> {


		const cached = this.cache.get(url)
		console.log('Cached value:', url, cached)
		if (cached) return cached

		const fetchPromise = fetch(url)
			.then((resp) => {
				if (!resp.ok)
					throw new Error(
						`Failed to fetch icon: ${resp.status} ${resp.statusText}`
					)
				return resp.text()
			})
			.then((svgText) => sanitizeSVG(svgText))
			.catch((error) => {
				this.cache.delete(url)
				throw error
			})

		this.cache.set(url, fetchPromise)

		return fetchPromise
	}

	/**
	 * Clear cache entry
	 */
	clear(name: string): void {
		this.cache.delete(name)
	}

	/**
	 * Clear all cache entries
	 */
	clearAll(): void {
		this.cache.clear()
	}
}

// Export singleton instance
export const iconCache = new IconCacheService()
