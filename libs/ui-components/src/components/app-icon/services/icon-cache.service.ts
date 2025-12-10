/**
 * Global singleton cache for icon SVG content.
 * Deduplicates concurrent requests for the same icon.
 */

interface CacheEntry {
  promise: Promise<string>
  resolved: boolean
  content: string | null
}

class IconCacheService {
  private cache = new Map<string, CacheEntry>()

  /**
   * Get cached icon or initiate fetch
   */
  async get(name: string, fetcher: () => Promise<string>): Promise<string> {
    const existing = this.cache.get(name)

    // Return existing promise if in-flight
    if (existing && !existing.resolved) {
      return existing.promise
    }

    // Return cached content if available
    if (existing && existing.resolved && existing.content) {
      return existing.content
    }

    // Create new fetch promise
    const promise = fetcher().then((content) => {
      const entry = this.cache.get(name)
      if (entry) {
        entry.resolved = true
        entry.content = content
      }
      return content
    })

    this.cache.set(name, { promise, resolved: false, content: null })
    return promise
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
