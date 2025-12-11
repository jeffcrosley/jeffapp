import { expect, test } from '@playwright/test'

// E2E tests for <app-icon> component

test.describe('<app-icon> E2E', () => {
	test('renders with correct size classes for sm|md|lg', async ({
		page
	}) => {
		await page.setContent(`
      <app-icon name="aws" size="sm"></app-icon>
      <app-icon name="aws" size="md"></app-icon>
      <app-icon name="aws" size="lg"></app-icon>
    `)
		const icons = await page.locator('app-icon')
		await expect(
			icons.nth(0).locator('.icon-wrapper')
		).toHaveClass(/icon-sm/)
		await expect(
			icons.nth(1).locator('.icon-wrapper')
		).toHaveClass(/icon-md/)
		await expect(
			icons.nth(2).locator('.icon-wrapper')
		).toHaveClass(/icon-lg/)
	})

	test('inherits currentColor from parent', async ({
		page
	}) => {
		await page.setContent(`
      <div style="color: rgb(10, 20, 30)">
        <app-icon name="jest"></app-icon>
      </div>
    `)
		const icon = await page.locator('app-icon')
		// Check computed color of the SVG element
		const svg = await icon.locator('.icon-svg svg')
		const color = await svg.evaluate(
			(el) => getComputedStyle(el).fill
		)
		expect(color).toBe('rgb(10, 20, 30)')
	})

	// Add more E2E tests as needed for palette color, aria-label, etc.
})
