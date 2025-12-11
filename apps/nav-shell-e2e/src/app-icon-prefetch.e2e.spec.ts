import { expect, test } from '@playwright/test'

// E2E test for app-icon prefetch functionality

test.describe('app-icon prefetch', () => {
	test('prefetches icons using requestIdleCallback', async ({
		page
	}) => {
		// Intercept network requests to icons
		const requestedIcons: string[] = []
		await page.route(
			/simple-icons.*\.svg/,
			(route) => {
				requestedIcons.push(route.request().url())
				route.continue()
			}
		)

		// Simulate app bootstrap and prefetch
		await page.goto('http://localhost:4200/home')
		// Wait for idle callbacks and network
		await page.waitForTimeout(1000)

		// Assert that prefetch attempted to load expected icons
		expect(
			requestedIcons.some((url) =>
				url.includes('angular.svg')
			)
		).toBeTruthy()
		expect(
			requestedIcons.some((url) =>
				url.includes('react.svg')
			)
		).toBeTruthy()
		expect(
			requestedIcons.some((url) =>
				url.includes('vue.svg')
			)
		).toBeTruthy()
		expect(
			requestedIcons.some((url) =>
				url.includes('svelte.svg')
			)
		).toBeTruthy()
		expect(
			requestedIcons.some((url) =>
				url.includes('typescript.svg')
			)
		).toBeTruthy()
		expect(
			requestedIcons.some((url) =>
				url.includes('javascript.svg')
			)
		).toBeTruthy()
	})
})
