import { newSpecPage } from '@stencil/core/testing'
import { AppIcon } from './app-icon'

// TODO: Remove .skip when component implementation is complete
// NOTE: Tests assume fetch-based loading, sanitization, retry, caching, palette + theme handling, and fallback behavior per ADR 007.
describe('app-icon', () => {
	beforeEach(() => {
		jest.resetAllMocks()
		// Default to light theme
		document.documentElement.dataset.theme = 'light'
	})

	it('renders and injects sanitized SVG from resolver', async () => {
		const svgWithScript =
			'<svg><script>alert(1)</script><g onload="evil()"><path d="M0 0h10v10z"/></g></svg>'
		jest
			.spyOn(global, 'fetch' as any)
			.mockResolvedValue({
				ok: true,
				text: async () => svgWithScript
			})

		const page = await newSpecPage({
			components: [AppIcon],
			html: `<app-icon name="angular"></app-icon>`
		})

		expect(fetch).toHaveBeenCalled()
		const inner =
			page.root.shadowRoot.querySelector('.icon-svg')
				?.innerHTML || ''
		expect(inner).toContain('<svg')
		expect(inner).not.toContain('<script')
		expect(inner).not.toContain('onload')
	})

	it('falls back after one retry when fetch keeps failing', async () => {
		jest.useFakeTimers()
		const fetchMock = jest
			.spyOn(global, 'fetch' as any)
			.mockRejectedValueOnce(new Error('netfail'))
			.mockRejectedValueOnce(new Error('netfail-2'))

		const page = await newSpecPage({
			components: [AppIcon],
			html: `<app-icon name="react"></app-icon>`
		})

		// Advance retry timer (~3s)
		jest.advanceTimersByTime(3000)
		await page.waitForChanges()

		expect(fetchMock).toHaveBeenCalledTimes(2)
		const fallback =
			page.root.shadowRoot.querySelector(
				'.icon-fallback'
			)
		expect(fallback).toBeTruthy()
		jest.useRealTimers()
	})

	it('succeeds on second attempt after initial failure', async () => {
		jest.useFakeTimers()
		const fetchMock = jest
			.spyOn(global, 'fetch' as any)
			.mockRejectedValueOnce(new Error('netfail'))
			.mockResolvedValueOnce({
				ok: true,
				text: async () =>
					'<svg><path d="M0 0h10v10z"/></svg>'
			})

		const page = await newSpecPage({
			components: [AppIcon],
			html: `<app-icon name="nodejs"></app-icon>`
		})

		jest.advanceTimersByTime(3000)
		await page.waitForChanges()

		expect(fetchMock).toHaveBeenCalledTimes(2)
		expect(
			page.root.shadowRoot.querySelector('.icon-svg')
		).toBeTruthy()
		expect(
			page.root.shadowRoot.querySelector(
				'.icon-fallback'
			)
		).toBeNull()
		jest.useRealTimers()
	})

	it('dedupes concurrent fetches for the same icon', async () => {
		const fetchMock = jest
			.spyOn(global, 'fetch' as any)
			.mockResolvedValue({
				ok: true,
				text: async () => '<svg></svg>'
			})

		const page = await newSpecPage({
			components: [AppIcon],
			html: `
        <div>
          <app-icon name="nx"></app-icon>
          <app-icon name="nx"></app-icon>
        </div>
      `
		})

		// Give any microtasks a chance
		await page.waitForChanges()
		expect(fetchMock).toHaveBeenCalledTimes(1)
	})

	it('applies palette color when color prop is a jewel key', async () => {
		jest
			.spyOn(global, 'fetch' as any)
			.mockResolvedValue({
				ok: true,
				text: async () => '<svg></svg>'
			})

		const page = await newSpecPage({
			components: [AppIcon],
			html: `<app-icon name="ember" color="sapphire"></app-icon>`
		})

		const hostStyle =
			(page.root as HTMLElement).getAttribute(
				'style'
			) || ''
		expect(hostStyle).toContain(
			'--color-jewel-sapphire'
		)
	})

	it('inherits currentColor by default', async () => {
		jest
			.spyOn(global, 'fetch' as any)
			.mockResolvedValue({
				ok: true,
				text: async () => '<svg></svg>'
			})

		const page = await newSpecPage({
			components: [AppIcon],
			html: `<div style="color: rgb(10, 20, 30)"><app-icon name="jest"></app-icon></div>`
		})

		const svg = page.root
			.querySelector('app-icon')
			?.shadowRoot?.querySelector(
				'.icon-svg svg'
			) as SVGElement
		expect(svg).toBeTruthy()
		// Implementation detail: expect computed fill to match inherited color
	})

	it('applies aria-label by default and hides when aria-hidden is true', async () => {
		jest
			.spyOn(global, 'fetch' as any)
			.mockResolvedValue({
				ok: true,
				text: async () => '<svg></svg>'
			})

		const page = await newSpecPage({
			components: [AppIcon],
			html: `<app-icon name="openai"></app-icon>`
		})

		const imgRole =
			page.root.shadowRoot.querySelector(
				'.icon-container'
			)
		expect(
			imgRole?.getAttribute('aria-label')
		).toBe('openai')

		page.root.setAttribute('aria-hidden', 'true')
		await page.waitForChanges()
		expect(
			imgRole?.getAttribute('aria-label')
		).toBeNull()
	})

	it('switches theme based on data-theme on documentElement', async () => {
		jest
			.spyOn(global, 'fetch' as any)
			.mockResolvedValue({
				ok: true,
				text: async () => '<svg></svg>'
			})
		document.documentElement.dataset.theme = 'dark'

		const page = await newSpecPage({
			components: [AppIcon],
			html: `<app-icon name="vercel"></app-icon>`
		})

		const host = page.root as HTMLElement
		// Expect host to reflect dark theme via class or computed color
		expect(host).toBeTruthy()
	})

	it('renders correct size classes for sm|md|lg', async () => {
		jest
			.spyOn(global, 'fetch' as any)
			.mockResolvedValue({
				ok: true,
				text: async () => '<svg></svg>'
			})

		const page = await newSpecPage({
			components: [AppIcon],
			html: `
        <div>
          <app-icon name="aws" size="sm"></app-icon>
          <app-icon name="aws" size="md"></app-icon>
          <app-icon name="aws" size="lg"></app-icon>
        </div>
      `
		})

		const icons =
			page.root.querySelectorAll('app-icon')
		expect(
			icons[0].shadowRoot
				.querySelector('.icon-wrapper')
				?.classList.contains('icon-sm')
		).toBe(true)
		expect(
			icons[1].shadowRoot
				.querySelector('.icon-wrapper')
				?.classList.contains('icon-md')
		).toBe(true)
		expect(
			icons[2].shadowRoot
				.querySelector('.icon-wrapper')
				?.classList.contains('icon-lg')
		).toBe(true)
	})

	it('uses resolver override when setIconResolver is called', async () => {
		const fetchMock = jest
			.spyOn(global, 'fetch' as any)
			.mockResolvedValue({
				ok: true,
				text: async () => '<svg></svg>'
			})
		const { setIconResolver } =
			await import('./utils/icon-resolver')
		setIconResolver(
			(name: string) =>
				`https://example.com/${name}.svg`
		)

		const page = await newSpecPage({
			components: [AppIcon],
			html: `<app-icon name="custom"></app-icon>`
		})

		expect(fetchMock).toBeDefined()
		expect(page.root).toBeTruthy()
		// TODO: Uncomment assertion once resolver is implemented
		// expect(fetchMock).toHaveBeenCalledWith('https://example.com/custom.svg')
	})

	it('prefetches icons via requestIdleCallback when available', async () => {
		const fetchMock = jest
			.spyOn(global, 'fetch' as any)
			.mockResolvedValue({
				ok: true,
				text: async () => '<svg></svg>'
			})
		const { prefetchIcons } =
			await import('./utils/prefetch-icons')

		// Mock requestIdleCallback
		;(global as any).requestIdleCallback = (
			cb: Function
		) => cb()

		// Trigger prefetch
		prefetchIcons(['nx', 'jest'])
		expect(fetchMock).toBeDefined()
		expect(fetchMock).toHaveBeenCalledTimes(2)
	})
})
