import { expect, test } from '@playwright/test'

/**
 * Navigation Shell E2E
 * Focused on the current UI: drawer, theme toggle, responsive behavior, accessibility, and feature statuses.
 */

test.describe('Navigation Shell', () => {
	const baseUrl = 'http://localhost:4200'
	const MOBILE_WIDTH = 375
	const MOBILE_HEIGHT = 667
	const DESKTOP_WIDTH = 1440
	const DESKTOP_HEIGHT = 900
	const THEME_KEY = 'jeffapp-theme'

	const setMobile = async (page) => {
		await page.setViewportSize({
			width: MOBILE_WIDTH,
			height: MOBILE_HEIGHT
		})
	}

	const setDesktop = async (page) => {
		await page.setViewportSize({
			width: DESKTOP_WIDTH,
			height: DESKTOP_HEIGHT
		})
	}

	test.beforeEach(async ({ page }) => {
		await page.goto(baseUrl)
		await page.waitForLoadState('networkidle')
	})

	test.describe('Page Navigation', () => {
		test('redirects root to /home', async ({
			page
		}) => {
			await page.goto(baseUrl)
			await expect(page).toHaveURL(`${baseUrl}/home`)
		})

		test('handles unknown routes by redirecting to /home', async ({
			page
		}) => {
			await page.goto(`${baseUrl}/unknown-route`)
			await expect(page).toHaveURL(`${baseUrl}/home`)
		})

		test('navigates to home/about/contact/components', async ({
			page
		}) => {
			for (const path of [
				'home',
				'about',
				'contact',
				'components'
			]) {
				await page.goto(`${baseUrl}/${path}`)
				await expect(page).toHaveURL(
					`${baseUrl}/${path}`
				)
			}
		})
	})

	test.describe('Navigation Drawer', () => {
		test('shows hamburger on mobile', async ({
			page
		}) => {
			await setMobile(page)
			await expect(
				page.locator('button.hamburger')
			).toBeVisible()
		})

		test('opens drawer on hamburger click (mobile)', async ({
			page
		}) => {
			await setMobile(page)
			const hamburger = page.locator(
				'button.hamburger'
			)
			const drawer = page.locator('aside.nav-drawer')

			await hamburger.click()
			await expect(drawer).toHaveClass(/open/)
		})

		test('closes drawer on backdrop click (mobile)', async ({
			page
		}) => {
			await setMobile(page)
			const hamburger = page.locator(
				'button.hamburger'
			)
			const backdrop = page.locator('.backdrop')
			const drawer = page.locator('aside.nav-drawer')

			await hamburger.click()
			await expect(drawer).toHaveClass(/open/)

			// Click on the far right of the backdrop so the drawer does not intercept
			await backdrop.click({
				position: { x: MOBILE_WIDTH - 10, y: 50 }
			})
			await expect(drawer).not.toHaveClass(/open/)
		})

		test('closes drawer on Escape (mobile)', async ({
			page
		}) => {
			await setMobile(page)
			const hamburger = page.locator(
				'button.hamburger'
			)
			const drawer = page.locator('aside.nav-drawer')

			await hamburger.click()
			await expect(drawer).toHaveClass(/open/)
			await page.keyboard.press('Escape')
			await expect(drawer).not.toHaveClass(/open/)
		})

		test('navigates via drawer link on mobile', async ({
			page
		}) => {
			await setMobile(page)
			const hamburger = page.locator(
				'button.hamburger'
			)
			const aboutLink = page.locator(
				'a.nav-link[href="/about"]'
			)

			await hamburger.click()
			await aboutLink.click()
			await expect(page).toHaveURL(
				`${baseUrl}/about`
			)
		})

		test('hides hamburger and keeps drawer visible on desktop', async ({
			page
		}) => {
			await setDesktop(page)
			await expect(
				page.locator('button.hamburger')
			).not.toBeVisible()
			await expect(
				page.locator('aside.nav-drawer')
			).toBeVisible()
		})
	})

	test.describe('Theme Switching', () => {
		test('toggles theme on click', async ({
			page
		}) => {
			const themeToggle = page.locator(
				'button.theme-toggle'
			)
			const html = page.locator('html')

			const initial = await html.evaluate(
				(el) =>
					el.getAttribute('data-theme') || 'light'
			)
			await themeToggle.click()
			const after = await html.evaluate(
				(el) =>
					el.getAttribute('data-theme') || 'light'
			)
			expect(after).not.toBe(initial)
		})

		test('persists theme in localStorage', async ({
			page
		}) => {
			const themeToggle = page.locator(
				'button.theme-toggle'
			)
			await themeToggle.click()
			const stored = await page.evaluate(
				(key) => localStorage.getItem(key),
				THEME_KEY
			)
			expect(stored).toBeTruthy()
		})

		test('applies persisted theme on reload', async ({
			page
		}) => {
			const themeToggle = page.locator(
				'button.theme-toggle'
			)
			const html = page.locator('html')

			await themeToggle.click()
			const setTheme = await html.evaluate(
				(el) =>
					el.getAttribute('data-theme') || 'light'
			)

			await page.reload()
			const reloadedTheme = await html.evaluate(
				(el) =>
					el.getAttribute('data-theme') || 'light'
			)
			expect(reloadedTheme).toBe(setTheme)
		})
	})

	test.describe('Responsive Behavior', () => {
		test('mobile to desktop hides hamburger and keeps drawer visible', async ({
			page
		}) => {
			await setMobile(page)
			await expect(
				page.locator('button.hamburger')
			).toBeVisible()
			await setDesktop(page)
			await expect(
				page.locator('button.hamburger')
			).not.toBeVisible()
			await expect(
				page.locator('aside.nav-drawer')
			).toBeVisible()
		})

		test('desktop to mobile shows hamburger', async ({
			page
		}) => {
			await setDesktop(page)
			await expect(
				page.locator('button.hamburger')
			).not.toBeVisible()
			await setMobile(page)
			await expect(
				page.locator('button.hamburger')
			).toBeVisible()
		})
	})

	test.describe('Accessibility', () => {
		test('hamburger has aria attributes', async ({
			page
		}) => {
			await setMobile(page)
			const hamburger = page.locator(
				'button.hamburger'
			)
			await expect(hamburger).toHaveAttribute(
				'aria-label',
				/toggle/i
			)
			await expect(hamburger).toHaveAttribute(
				'aria-expanded',
				/true|false/i
			)
		})

		test('theme toggle is labeled', async ({
			page
		}) => {
			const toggle = page.locator(
				'button.theme-toggle'
			)
			const label =
				await toggle.getAttribute('aria-label')
			expect(
				label || (await toggle.textContent())
			).toBeTruthy()
		})

		test('drawer links are focusable', async ({
			page
		}) => {
			await setMobile(page)
			const hamburger = page.locator(
				'button.hamburger'
			)
			await hamburger.click()
			const firstLink = page
				.locator('aside.nav-drawer a.nav-link')
				.first()
			await firstLink.focus()
			await expect(firstLink).toBeFocused()
		})
	})

	test.describe('Feature Status', () => {
		test('applies feature-wip to About link and feature-beta to Components link', async ({
			page
		}) => {
			const aboutLink = page.locator(
				'a.nav-link[href="/about"]'
			)
			const componentsLink = page.locator(
				'a.nav-link[href="/components"]'
			)

			expect(
				await aboutLink.getAttribute('class')
			).toContain('feature-wip')
			expect(
				await componentsLink.getAttribute('class')
			).toContain('feature-beta')
		})
	})

	test.describe('External Links', () => {
		test('GitHub link opens in new tab', async ({
			context,
			page
		}) => {
			const [newPage] = await Promise.all([
				context.waitForEvent('page'),
				page
					.locator('a.nav-link[target="_blank"]')
					.click()
			])
			await expect(newPage).toHaveURL(/github\.com/)
			await newPage.close()
		})
	})

	test.describe('Backdrop Visibility', () => {
		test('shows backdrop when drawer open on mobile', async ({
			page
		}) => {
			await setMobile(page)
			const hamburger = page.locator(
				'button.hamburger'
			)
			const backdrop = page.locator('.backdrop')

			await hamburger.click()
			await expect(backdrop).toBeVisible()
		})
	})
})
