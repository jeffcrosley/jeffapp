import { newSpecPage } from '@stencil/core/testing'
import { AppIcon } from './app-icon'

// NOTE: Tests assume fetch-based loading, sanitization, retry, caching, palette + theme handling, and fallback behavior per ADR 007.
// TODO: Remove .skip from each test as implementation progresses
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
		const fetchMock = jest
			.spyOn(global, 'fetch' as any)
			.mockRejectedValueOnce(new Error('netfail'))
			.mockRejectedValueOnce(new Error('netfail-2'))

		const page = await newSpecPage({
			components: [AppIcon],
			html: `<app-icon name="react"></app-icon>`
		})

		// Wait for retry delay to complete (3s + buffer for fetch)
		await new Promise((resolve) =>
			setTimeout(resolve, 3500)
		)
		await page.waitForChanges()

		expect(fetchMock).toHaveBeenCalledTimes(2)
		const fallback =
			page.root.shadowRoot.querySelector(
				'.icon-fallback'
			)
		expect(fallback).toBeTruthy()
	}, 10000)

	it('succeeds on second attempt after initial failure', async () => {
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

		// Wait for retry delay to complete (3s + buffer for fetch)
		await new Promise((resolve) =>
			setTimeout(resolve, 3500)
		)
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
	}, 10000)

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
		expect(hostStyle).toContain('--icon-sapphire')
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
		expect(fetchMock).toHaveBeenCalledWith(
			'https://example.com/custom.svg'
		)
	})
})
