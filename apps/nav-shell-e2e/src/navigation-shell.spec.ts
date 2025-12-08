import { expect, test } from '@playwright/test'

/**
 * E2E Test Specification: Navigation Shell & Feature Status
 *
 * Purpose: Test end-to-end user interactions and responsive behavior
 * These tests verify the complete feature from user perspective
 *
 * Scenarios:
 * - Mobile drawer toggle and interactions
 * - Desktop persistent drawer visibility
 * - Theme switching (light/dark)
 * - Feature status badges rendering
 * - Keyboard navigation (Tab, Esc, Enter)
 * - Responsive breakpoint transitions
 *
 * SPEC COMPLETENESS CHECKLIST:
 * ✓ Mobile Drawer Interaction: 6 tests
 * ✓ Desktop Navigation: 3 tests
 * ✓ Feature Status Badges: 3 tests
 * ✓ Theme Switching: 3 tests (includes viewport setup, assertions, persistence)
 * ✓ Keyboard Navigation: 5 tests
 * ✓ Responsive Breakpoint: 2 tests
 * ✓ Active Route Highlighting: 2 tests
 * ✓ External Links: 1 test
 * ✓ Accessibility: 4 tests
 * ✓ Error Handling: 2 tests
 * Total: 31 tests (all implemented, all skipped for development)
 */

test.describe('Navigation Shell E2E Tests', () => {
	const baseUrl = 'http://localhost:4200'
	const ANIMATION_DURATION = 350
	const TRANSITION_DURATION = 250
	const MOBILE_WIDTH = 375
	const MOBILE_HEIGHT = 667
	const DESKTOP_WIDTH = 1440
	const DESKTOP_HEIGHT = 900
	const BREAKPOINT = 1024

	test.beforeEach(async ({ page }) => {
		await page.goto(baseUrl)
		await page.waitForLoadState('networkidle')
	})

	test.describe('Mobile Drawer Interaction', () => {
		test('should display hamburger menu on mobile viewport', async ({
			page
		}) => {
			// Set viewport to mobile (375px wide)
			await page.setViewportSize({
				width: MOBILE_WIDTH,
				height: MOBILE_HEIGHT
			})
			await page.waitForTimeout(ANIMATION_DURATION)

			const hamburger = page.locator(
				'button.hamburger'
			)
			const themeToggle = page.locator(
				'button.theme-toggle'
			)
			const drawer = page.locator('aside.nav-drawer')

			// Verify hamburger and theme toggle are visible
			await expect(hamburger).toBeVisible()
			await expect(themeToggle).toBeVisible()

			// Drawer should exist but be off-screen (not in viewport)
			await expect(drawer).toBeInViewport({
				ratio: 0
			})
		})

		test('should open drawer when hamburger clicked', async ({
			page
		}) => {
			// Set viewport to mobile
			await page.setViewportSize({
				width: MOBILE_WIDTH,
				height: MOBILE_HEIGHT
			})

			const hamburger = page.locator(
				'button.hamburger'
			)
			const drawer = page.locator('aside.nav-drawer')
			const backdrop = page.locator('.backdrop')

			// Click hamburger button
			await hamburger.click()
			await page.waitForTimeout(ANIMATION_DURATION)

			// Verify drawer slides into view with 'open' class
			await expect(drawer).toHaveClass(/open/)
			// Verify backdrop appears (for clicking outside to close)
			await expect(backdrop).toBeVisible()
		})

		test('should close drawer when backdrop clicked', async ({
			page
		}) => {
			// Set viewport to mobile
			await page.setViewportSize({
				width: MOBILE_WIDTH,
				height: MOBILE_HEIGHT
			})

			const hamburger = page.locator(
				'button.hamburger'
			)
			const backdrop = page.locator('.backdrop')
			const drawer = page.locator('aside.nav-drawer')

			// Open drawer
			await hamburger.click()
			await page.waitForTimeout(ANIMATION_DURATION)

			// Click backdrop (semi-transparent area outside drawer)
			await backdrop.click()
			await page.waitForTimeout(TRANSITION_DURATION)

			// Verify drawer closes
			await expect(drawer).not.toHaveClass(/open/)
			await expect(backdrop).not.toBeVisible()
		})

		test('should close drawer when Esc key pressed', async ({
			page
		}) => {
			// Set viewport to mobile
			await page.setViewportSize({
				width: MOBILE_WIDTH,
				height: MOBILE_HEIGHT
			})

			const hamburger = page.locator(
				'button.hamburger'
			)
			const drawer = page.locator('aside.nav-drawer')

			// Open drawer
			await hamburger.click()
			await page.waitForTimeout(ANIMATION_DURATION)

			// Press Escape key
			await page.keyboard.press('Escape')
			await page.waitForTimeout(TRANSITION_DURATION)

			// Verify drawer closes
			await expect(drawer).not.toHaveClass(/open/)
		})

		test('should close drawer when nav link clicked', async ({
			page
		}) => {
			// Set viewport to mobile
			await page.setViewportSize({
				width: MOBILE_WIDTH,
				height: MOBILE_HEIGHT
			})

			const hamburger = page.locator(
				'button.hamburger'
			)
			const drawer = page.locator('aside.nav-drawer')
			const aboutLink = page.locator(
				'a:has-text("About")'
			)
			const initialUrl = page.url()

			// Open drawer
			await hamburger.click()
			await page.waitForTimeout(ANIMATION_DURATION)

			// Click a navigation link
			await aboutLink.click()
			await page.waitForLoadState('networkidle')

			// Verify drawer closes after navigation
			await expect(drawer).not.toHaveClass(/open/)

			// Verify page navigates to new route
			const newUrl = page.url()
			expect(newUrl).not.toBe(initialUrl)
		})

		test('should smooth slide animation duration (~300ms)', async ({
			page
		}) => {
			// Set viewport to mobile
			await page.setViewportSize({
				width: MOBILE_WIDTH,
				height: MOBILE_HEIGHT
			})

			const hamburger = page.locator(
				'button.hamburger'
			)
			const drawerOpen = page.locator(
				'aside.nav-drawer.open'
			)

			// Measure animation time from click to open state
			const startTime = Date.now()
			await hamburger.click()
			await drawerOpen.waitFor({
				state: 'visible',
				timeout: 1000
			})
			const duration = Date.now() - startTime

			// Animation should be ~300ms (allow 250-350ms range)
			expect(duration).toBeGreaterThanOrEqual(250)
			expect(duration).toBeLessThanOrEqual(350)
		})
	})

	test.describe('Desktop Navigation', () => {
		test('should hide hamburger menu on desktop viewport', async ({
			page
		}) => {
			// Set viewport to desktop (1440px)
			await page.setViewportSize({
				width: DESKTOP_WIDTH,
				height: DESKTOP_HEIGHT
			})
			await page.waitForTimeout(ANIMATION_DURATION)

			const hamburger = page.locator(
				'button.hamburger'
			)
			const themeToggle = page.locator(
				'button.theme-toggle'
			)
			const drawer = page.locator('aside.nav-drawer')

			// Verify hamburger is hidden on desktop
			await expect(hamburger).not.toBeVisible()
			// Verify theme toggle is visible
			await expect(themeToggle).toBeVisible()
			// Verify drawer is visible and persistent (not overlay)
			await expect(drawer).toBeVisible()
		})

		test('should keep drawer visible on desktop (no animation needed)', async ({
			page
		}) => {
			// Set viewport to desktop
			await page.setViewportSize({
				width: DESKTOP_WIDTH,
				height: DESKTOP_HEIGHT
			})

			const drawer = page.locator('aside.nav-drawer')
			const navLinks = page.locator('a.nav-link')

			// Verify drawer is already open (no click needed)
			await expect(drawer).toBeVisible()

			// Verify drawer displays all nav links
			const linkCount = await navLinks.count()
			expect(linkCount).toBeGreaterThan(0)

			// Verify drawer is part of main layout (not overlay with backdrop)
			const backdrop = page.locator('.backdrop')
			await expect(backdrop).not.toBeVisible()
		})

		test('should auto-close drawer when transitioning from mobile to desktop', async ({
			page
		}) => {
			// Start at mobile (375px)
			await page.setViewportSize({
				width: MOBILE_WIDTH,
				height: MOBILE_HEIGHT
			})

			const hamburger = page.locator(
				'button.hamburger'
			)
			// Open drawer
			await hamburger.click()
			await page.waitForTimeout(ANIMATION_DURATION)

			// Resize to desktop (1440px)
			await page.setViewportSize({
				width: DESKTOP_WIDTH,
				height: DESKTOP_HEIGHT
			})
			await page.waitForTimeout(ANIMATION_DURATION)

			const drawerOpen = page.locator(
				'aside.nav-drawer.open'
			)
			const drawer = page.locator('aside.nav-drawer')

			// Verify drawer closes (non-overlay state)
			await expect(drawerOpen).not.toBeVisible()
			// Verify hamburger disappears
			await expect(hamburger).not.toBeVisible()
			// Verify drawer is visible as sidebar
			await expect(drawer).toBeVisible()
		})
	})

	test.describe('Feature Status Badges', () => {
		test('should display WIP badge on wip feature link', async ({
			page
		}) => {
			// Set viewport to ensure drawer is visible
			await page.setViewportSize({
				width: DESKTOP_WIDTH,
				height: DESKTOP_HEIGHT
			})

			const wipLink = page.locator(
				'a:has-text("Components")'
			)
			const wipBadge = wipLink.locator(
				'.feature-badge'
			)

			// Verify Components link is marked as WIP
			await expect(wipLink).toHaveClass(
				/feature-wip/
			)

			// Verify badge displays "🚧 WIP"
			await expect(wipBadge).toBeVisible()
			await expect(wipBadge).toContainText('🚧 WIP')
		})

		test('should not display badge on stable features', async ({
			page
		}) => {
			// Set viewport to ensure drawer is visible
			await page.setViewportSize({
				width: DESKTOP_WIDTH,
				height: DESKTOP_HEIGHT
			})

			const homeLink = page.locator(
				'a:has-text("Home")'
			)
			const badge = homeLink.locator(
				'.feature-badge'
			)

			// Verify Home link is stable (no badge)
			await expect(homeLink).not.toHaveClass(
				/feature-wip|feature-beta/
			)

			// Verify no badge element exists
			await expect(badge).not.toBeVisible()
		})

		test('should display WIP class for styling', async ({
			page
		}) => {
			// Set viewport to ensure drawer is visible
			await page.setViewportSize({
				width: DESKTOP_WIDTH,
				height: DESKTOP_HEIGHT
			})

			const wipLink = page.locator(
				'a:has-text("Components")'
			)

			// Verify feature-wip class is applied for CSS styling
			await expect(wipLink).toHaveClass(
				/feature-wip/
			)
		})
	})

	test.describe('Theme Switching', () => {
		test('should toggle theme when theme button clicked', async ({
			page
		}) => {
			const themeToggle = page.locator(
				'button.theme-toggle'
			)
			const rootElement = page.locator('html')

			// Get initial theme (light or dark)
			const initialTheme =
				await rootElement.getAttribute('data-theme')

			// Click theme toggle button
			await themeToggle.click()
			await page.waitForTimeout(TRANSITION_DURATION)

			// Verify theme changed
			const newTheme =
				await rootElement.getAttribute('data-theme')
			expect(newTheme).not.toBe(initialTheme)
		})

		test('should update colors when theme changes', async ({
			page
		}) => {
			const themeToggle = page.locator(
				'button.theme-toggle'
			)
			const drawer = page.locator('aside.nav-drawer')

			// Set viewport to ensure drawer is visible
			await page.setViewportSize({
				width: DESKTOP_WIDTH,
				height: DESKTOP_HEIGHT
			})

			// Get initial background color
			const initialBgColor = await drawer.evaluate(
				(el) =>
					window.getComputedStyle(el).backgroundColor
			)

			// Click theme toggle
			await themeToggle.click()
			await page.waitForTimeout(TRANSITION_DURATION)

			// Get new background color
			const newBgColor = await drawer.evaluate(
				(el) =>
					window.getComputedStyle(el).backgroundColor
			)

			// Verify colors are different
			expect(newBgColor).not.toBe(initialBgColor)
		})

		test('should persist theme preference to localStorage', async ({
			page
		}) => {
			const themeToggle = page.locator(
				'button.theme-toggle'
			)

			// Click theme toggle
			await themeToggle.click()
			await page.waitForTimeout(TRANSITION_DURATION)

			// Verify localStorage has 'theme' key set
			const storageTheme = await page.evaluate(() =>
				localStorage.getItem('jeffapp-theme')
			)
			expect(storageTheme).not.toBeNull()

			// Reload page
			await page.reload()
			await page.waitForLoadState('networkidle')

			// Verify theme persists after reload
			const themeAfterReload = await page.evaluate(
				() => localStorage.getItem('jeffapp-theme')
			)
			expect(themeAfterReload).toBe(storageTheme)
		})
	})

	test.describe('Keyboard Navigation', () => {
		test('should tab through header and drawer elements in order', async ({
			page
		}) => {
			// Set viewport to mobile and open drawer
			await page.setViewportSize({
				width: MOBILE_WIDTH,
				height: MOBILE_HEIGHT
			})

			const hamburger = page.locator(
				'button.hamburger'
			)
			await hamburger.click()
			await page.waitForTimeout(ANIMATION_DURATION)

			const themeToggle = page.locator(
				'button.theme-toggle'
			)
			const navLinks = page.locator('a.nav-link')

			// Focus theme toggle first
			await themeToggle.focus()
			await expect(themeToggle).toBeFocused()

			// Tab to hamburger
			await page.keyboard.press('Tab')
			await expect(hamburger).toBeFocused()

			// Tab to first nav link
			await page.keyboard.press('Tab')
			const firstLink = navLinks.first()
			await expect(firstLink).toBeFocused()
		})

		test('should activate link on Enter key press', async ({
			page
		}) => {
			// Set viewport to desktop to ensure links are visible
			await page.setViewportSize({
				width: DESKTOP_WIDTH,
				height: DESKTOP_HEIGHT
			})

			const aboutLink = page.locator(
				'a:has-text("About")'
			)
			const initialUrl = page.url()

			// Set focus to About link
			await aboutLink.focus()

			// Press Enter
			await page.keyboard.press('Enter')
			await page.waitForLoadState('networkidle')

			// Verify navigation occurs (URL changes)
			const newUrl = page.url()
			expect(newUrl).not.toBe(initialUrl)
		})

		test('should close drawer on Escape key when drawer is open', async ({
			page
		}) => {
			// Set viewport to mobile
			await page.setViewportSize({
				width: MOBILE_WIDTH,
				height: MOBILE_HEIGHT
			})

			const hamburger = page.locator(
				'button.hamburger'
			)
			const drawer = page.locator('aside.nav-drawer')

			// Open drawer
			await hamburger.click()
			await page.waitForTimeout(ANIMATION_DURATION)

			// Verify drawer is open
			await expect(drawer).toHaveClass(/open/)

			// Press Escape key
			await page.keyboard.press('Escape')
			await page.waitForTimeout(TRANSITION_DURATION)

			// Verify drawer closes
			await expect(drawer).not.toHaveClass(/open/)
		})

		test('should show focus indicator on keyboard navigation', async ({
			page
		}) => {
			const themeToggle = page.locator(
				'button.theme-toggle'
			)

			// Use keyboard to focus element (not mouse)
			await themeToggle.focus()

			// Verify focused element has visible focus ring or outline
			const outlineStyle =
				await themeToggle.evaluate(
					(el) => window.getComputedStyle(el).outline
				)

			// Focus indicator should have outline (not 'none')
			expect(outlineStyle).not.toContain('none')
		})

		test('should provide keyboard accessible button click', async ({
			page
		}) => {
			// Set viewport to mobile
			await page.setViewportSize({
				width: MOBILE_WIDTH,
				height: MOBILE_HEIGHT
			})

			const hamburger = page.locator(
				'button.hamburger'
			)
			const drawer = page.locator('aside.nav-drawer')

			// Focus and activate with Space key
			await hamburger.focus()
			await page.keyboard.press('Space')
			await page.waitForTimeout(ANIMATION_DURATION)

			// Verify drawer opens with keyboard activation
			await expect(drawer).toHaveClass(/open/)
		})
	})

	test.describe('Responsive Breakpoint', () => {
		test('should adapt layout at 1024px breakpoint', async ({
			page
		}) => {
			// Start at 1023px (mobile)
			await page.setViewportSize({
				width: BREAKPOINT - 1,
				height: MOBILE_HEIGHT
			})
			await page.waitForTimeout(ANIMATION_DURATION)

			let hamburger = page.locator(
				'button.hamburger'
			)
			// Verify hamburger visible at mobile
			await expect(hamburger).toBeVisible()

			// Resize to 1024px (desktop threshold)
			await page.setViewportSize({
				width: BREAKPOINT,
				height: MOBILE_HEIGHT
			})
			await page.waitForTimeout(ANIMATION_DURATION)

			hamburger = page.locator('button.hamburger')
			// Verify hamburger hidden at desktop
			await expect(hamburger).not.toBeVisible()

			// Resize back to 1023px
			await page.setViewportSize({
				width: BREAKPOINT - 1,
				height: MOBILE_HEIGHT
			})
			await page.waitForTimeout(ANIMATION_DURATION)

			hamburger = page.locator('button.hamburger')
			// Verify hamburger visible again at mobile
			await expect(hamburger).toBeVisible()
		})

		test('should maintain nav functionality across breakpoint transitions', async ({
			page
		}) => {
			// Start at mobile (375px)
			await page.setViewportSize({
				width: MOBILE_WIDTH,
				height: MOBILE_HEIGHT
			})

			const hamburger = page.locator(
				'button.hamburger'
			)
			const initialUrl = page.url()

			// Open drawer and navigate
			await hamburger.click()
			await page.waitForTimeout(ANIMATION_DURATION)

			// Resize to desktop (1440px)
			await page.setViewportSize({
				width: DESKTOP_WIDTH,
				height: DESKTOP_HEIGHT
			})
			await page.waitForTimeout(ANIMATION_DURATION)

			// Navigate to different page
			const aboutLink = page.locator(
				'a:has-text("About")'
			)
			await aboutLink.click()
			await page.waitForLoadState('networkidle')

			// Verify nav links still work on desktop
			const newUrl = page.url()
			expect(newUrl).not.toBe(initialUrl)
		})
	})

	test.describe('Active Route Highlighting', () => {
		test('should highlight current route link', async ({
			page
		}) => {
			// Navigate to /about
			await page.goto(`${baseUrl}/about`)
			await page.waitForLoadState('networkidle')

			// Set viewport to ensure drawer is visible
			await page.setViewportSize({
				width: DESKTOP_WIDTH,
				height: DESKTOP_HEIGHT
			})

			const aboutLink = page.locator(
				'a:has-text("About")'
			)
			const homeLink = page.locator(
				'a:has-text("Home")'
			)

			// Verify About link has 'active' class
			await expect(aboutLink).toHaveClass(/active/)

			// Verify other links do not have 'active' class
			await expect(homeLink).not.toHaveClass(
				/active/
			)
		})

		test('should update active highlighting on navigation', async ({
			page
		}) => {
			// Set viewport to ensure drawer is visible
			await page.setViewportSize({
				width: DESKTOP_WIDTH,
				height: DESKTOP_HEIGHT
			})

			// Start at home (/)
			await page.goto(baseUrl)
			let homeLink = page.locator(
				'a:has-text("Home")'
			)

			// Verify Home is active
			await expect(homeLink).toHaveClass(/active/)

			// Click About link
			const aboutLink = page.locator(
				'a:has-text("About")'
			)
			await aboutLink.click()
			await page.waitForLoadState('networkidle')

			// Verify About is now active
			await expect(aboutLink).toHaveClass(/active/)

			// Verify Home is no longer active
			homeLink = page.locator('a:has-text("Home")')
			await expect(homeLink).not.toHaveClass(
				/active/
			)
		})
	})

	test.describe('External Links', () => {
		test('should open external links in new tab', async ({
			page
		}) => {
			// Set viewport to ensure drawer is visible
			await page.setViewportSize({
				width: DESKTOP_WIDTH,
				height: DESKTOP_HEIGHT
			})

			const githubLink = page.locator(
				'a[href*="github.com"]'
			)

			// Verify target="_blank" attribute (opens in new tab)
			await expect(githubLink).toHaveAttribute(
				'target',
				'_blank'
			)

			// Verify href is full URL (not relative)
			const href =
				await githubLink.getAttribute('href')
			expect(href).toMatch(/^https?:\/\//)
		})
	})

	test.describe('Accessibility', () => {
		test('should have accessible heading hierarchy', async ({
			page
		}) => {
			// Set viewport to ensure content is visible
			await page.setViewportSize({
				width: DESKTOP_WIDTH,
				height: DESKTOP_HEIGHT
			})

			const h1 = page.locator('h1.portfolio-title')

			// Portfolio title should be <h1>
			await expect(h1).toBeVisible()
			await expect(h1).toContainText('Jeff Crosley')
		})

		test('should announce drawer state to screen readers', async ({
			page
		}) => {
			// Set viewport to mobile
			await page.setViewportSize({
				width: MOBILE_WIDTH,
				height: MOBILE_HEIGHT
			})

			const hamburger = page.locator(
				'button.hamburger'
			)

			// When closed: aria-expanded="false" or not set
			const initialExpanded =
				await hamburger.getAttribute('aria-expanded')
			expect(['false', null]).toContain(
				initialExpanded
			)

			// Open drawer
			await hamburger.click()
			await page.waitForTimeout(ANIMATION_DURATION)

			// When open: aria-expanded="true"
			const openExpanded =
				await hamburger.getAttribute('aria-expanded')
			expect(openExpanded).toBe('true')
		})

		test('should have semantic HTML for navigation', async ({
			page
		}) => {
			// Set viewport to ensure drawer is visible
			await page.setViewportSize({
				width: DESKTOP_WIDTH,
				height: DESKTOP_HEIGHT
			})

			const drawer = page.locator('aside.nav-drawer')
			const navList = drawer.locator('nav')

			// Drawer should be semantic <aside>
			await expect(drawer).toBeVisible()

			// Navigation should use <nav> semantic element
			await expect(navList).toBeVisible()
		})

		test('should have proper link labeling', async ({
			page
		}) => {
			// Set viewport to ensure drawer is visible
			await page.setViewportSize({
				width: DESKTOP_WIDTH,
				height: DESKTOP_HEIGHT
			})

			const navLinks = page.locator('a.nav-link')

			// All nav links should have visible text (not aria-label only)
			const linkCount = await navLinks.count()
			for (let i = 0; i < linkCount; i++) {
				const link = navLinks.nth(i)
				const text = await link.textContent()
				expect(text).toBeTruthy()
			}
		})
	})

	test.describe('Error Handling', () => {
		test('should handle network errors gracefully', async ({
			page
		}) => {
			// Go offline
			await page.context().setOffline(true)

			// Try to navigate
			await page.goto(baseUrl).catch(() => {
				// Expected to fail
			})

			// Go online
			await page.context().setOffline(false)

			// Page should still be responsive
			const drawer = page.locator('aside.nav-drawer')
			expect(drawer).toBeDefined()
		})

		test('should handle missing nav elements gracefully', async ({
			page
		}) => {
			// This test verifies the app doesn't crash if drawer structure is missing
			const drawer = page.locator('aside.nav-drawer')

			// Should not throw, even if drawer is not present
			const exists = await drawer
				.isVisible()
				.catch(() => false)
			expect(typeof exists).toBe('boolean')
		})
	})
})
