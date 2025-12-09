import { test } from '@playwright/test'

test.describe.skip('Home Page E2E', () => {
	test('should load and display hero section', async ({
		page
	}) => {
		// TODO: Visit home, check SVG, overlay, CTA buttons
	})

	test('should display all skill badges', async ({
		page
	}) => {
		// TODO: Check badge count, icons, labels
	})

	test('should display highlight cards', async ({
		page
	}) => {
		// TODO: Check for 3 highlight cards, accent bar
	})

	test('should open external links in new tab', async ({
		page
	}) => {
		// TODO: Click GitHub/LinkedIn, check new tab
	})

	test('should be responsive at 375px, 768px, 1024px', async ({
		page
	}) => {
		// TODO: Set viewport, check layout/hero crop
	})

	test('should pass accessibility audit', async ({
		page
	}) => {
		// TODO: Run axe-core or similar, check WCAG AA
	})
})
