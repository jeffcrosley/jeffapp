/**
 * Icon prefetch utility.
 * Uses requestIdleCallback to prefetch icons during browser idle time.
 */

import { resolveIconUrl } from './icon-resolver'
import { iconCache } from '../services/icon-cache.service'

/**
 * Prefetch icons during browser idle time
 */
export function prefetchIcons(names: string[]): void {
  if (typeof requestIdleCallback === 'undefined') {
    // Fallback for browsers without requestIdleCallback
    names.forEach((name) => prefetchIcon(name))
    return
  }

  requestIdleCallback(() => {
    names.forEach((name) => prefetchIcon(name))
  })
}

/**
 * Prefetch a single icon
 */
async function prefetchIcon(name: string): Promise<void> {
  try {
    const url = resolveIconUrl(name)
    await iconCache.get(name, async () => {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Failed to fetch icon: ${name}`)
      }
      return response.text()
    })
  } catch (error) {
    console.warn(`Failed to prefetch icon: ${name}`, error)
  }
}
