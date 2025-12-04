import { expect, test } from '@playwright/test';

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
 */

test.describe.skip('Navigation Shell E2E Tests', () => {
  const baseUrl = 'http://localhost:4200';

  test.beforeEach(async ({ page }) => {
    // TODO: Navigate to app
    // Wait for app to load
    // Take screenshot for debugging if needed
    await page.goto(baseUrl);
    await page.waitForLoadState('networkidle');
  });

  test.describe('Mobile Drawer Interaction', () => {
    test('should display hamburger menu on mobile viewport', async ({
      page,
    }) => {
      // TODO: Set viewport to mobile (375px wide)
      // Verify hamburger button is visible
      // Verify theme toggle button is visible
      // Verify drawer is hidden (off-screen)
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(300); // Wait for responsive adjustments

      const hamburger = page.locator('button.hamburger');
      const themeToggle = page.locator('button.theme-toggle');
      const drawer = page.locator('aside.nav-drawer');

      await expect(hamburger).toBeVisible();
      await expect(themeToggle).toBeVisible();
      // Drawer should exist but be off-screen
      await expect(drawer).toBeInViewport({ ratio: 0 });
    });

    test('should open drawer when hamburger clicked', async ({ page }) => {
      // TODO: Set viewport to mobile
      // Click hamburger button
      // Wait for slide animation (300ms)
      // Verify drawer slides into view
      // Verify backdrop appears
      // Verify drawer contains nav links
      await page.setViewportSize({ width: 375, height: 667 });
      const hamburger = page.locator('button.hamburger');
      const drawer = page.locator('aside.nav-drawer');
      const backdrop = page.locator('.backdrop');

      await hamburger.click();
      await page.waitForTimeout(350); // Wait for animation

      await expect(drawer).toHaveClass(/open/);
      await expect(backdrop).toBeVisible();
    });

    test('should close drawer when backdrop clicked', async ({ page }) => {
      // TODO: Set viewport to mobile
      // Open drawer (click hamburger)
      // Click backdrop (semi-transparent area)
      // Verify drawer slides off-screen
      // Verify backdrop disappears
      await page.setViewportSize({ width: 375, height: 667 });
      const hamburger = page.locator('button.hamburger');
      const backdrop = page.locator('.backdrop');
      const drawer = page.locator('aside.nav-drawer');

      await hamburger.click();
      await page.waitForTimeout(350);

      await backdrop.click();
      await page.waitForTimeout(250);

      await expect(drawer).not.toHaveClass(/open/);
      await expect(backdrop).not.toBeVisible();
    });

    test('should close drawer when Esc key pressed', async ({ page }) => {
      // TODO: Set viewport to mobile
      // Open drawer
      // Press Escape key
      // Verify drawer closes
      await page.setViewportSize({ width: 375, height: 667 });
      const hamburger = page.locator('button.hamburger');
      const drawer = page.locator('aside.nav-drawer');

      await hamburger.click();
      await page.waitForTimeout(350);

      await page.keyboard.press('Escape');
      await page.waitForTimeout(250);

      await expect(drawer).not.toHaveClass(/open/);
    });

    test('should close drawer when nav link clicked', async ({ page }) => {
      // TODO: Set viewport to mobile
      // Open drawer
      // Click a navigation link
      // Verify drawer closes
      // Verify page navigates to new route
      await page.setViewportSize({ width: 375, height: 667 });
      const hamburger = page.locator('button.hamburger');
      const drawer = page.locator('aside.nav-drawer');
      const aboutLink = page.locator('a:has-text("About")');

      await hamburger.click();
      await page.waitForTimeout(350);

      await aboutLink.click();
      await page.waitForTimeout(350);

      await expect(drawer).not.toHaveClass(/open/);
    });

    test('should smooth slide animation (300ms)', async ({ page }) => {
      // TODO: Set viewport to mobile
      // Click hamburger
      // Measure animation time (should be ~300ms)
      // Verify not instant, not sluggish
      await page.setViewportSize({ width: 375, height: 667 });
      const hamburger = page.locator('button.hamburger');

      const startTime = Date.now();
      await hamburger.click();
      await page.locator('aside.nav-drawer.open').waitFor({ state: 'visible' });
      const duration = Date.now() - startTime;

      // Animation should be ~300ms (allow 250-350ms range)
      expect(duration).toBeGreaterThanOrEqual(250);
      expect(duration).toBeLessThanOrEqual(350);
    });
  });

  test.describe('Desktop Navigation', () => {
    test('should hide hamburger menu on desktop viewport', async ({ page }) => {
      // TODO: Set viewport to desktop (1440px)
      // Verify hamburger button is hidden
      // Verify theme toggle is visible
      // Verify drawer is visible and persistent
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.waitForTimeout(350); // Wait for responsive adjustments

      const hamburger = page.locator('button.hamburger');
      const themeToggle = page.locator('button.theme-toggle');
      const drawer = page.locator('aside.nav-drawer');

      await expect(hamburger).not.toBeVisible();
      await expect(themeToggle).toBeVisible();
      await expect(drawer).toBeVisible();
    });

    test('should keep drawer visible on desktop (no animation needed)', async ({
      page,
    }) => {
      // TODO: Set viewport to desktop
      // Verify drawer is already open (no click needed)
      // Verify drawer displays all nav links
      // Verify drawer is part of main layout (not overlay)
      await page.setViewportSize({ width: 1440, height: 900 });

      const drawer = page.locator('aside.nav-drawer');
      const navLinks = page.locator('a.nav-link');

      await expect(drawer).toBeVisible();
      const linkCount = await navLinks.count();
      expect(linkCount).toBeGreaterThan(0);
    });

    test('should auto-close drawer when transitioning from mobile to desktop', async ({
      page,
    }) => {
      // TODO: Start at mobile (375px)
      // Open drawer
      // Resize to desktop (1440px)
      // Verify drawer closes (non-overlay state)
      // Verify hamburger disappears
      // Verify drawer is visible as sidebar
      await page.setViewportSize({ width: 375, height: 667 });
      const hamburger = page.locator('button.hamburger');
      await hamburger.click();
      await page.waitForTimeout(350);

      await page.setViewportSize({ width: 1440, height: 900 });
      await page.waitForTimeout(350);

      const drawerOpen = page.locator('aside.nav-drawer.open');
      await expect(drawerOpen).not.toBeVisible();
      await expect(hamburger).not.toBeVisible();
    });
  });

  test.describe('Feature Status Badges', () => {
    test('should display WIP badge on wip feature link', async ({ page }) => {
      // TODO: Find link marked as 'wip' (e.g., Components)
      // Verify badge displays "🚧 WIP"
      // Verify badge styling is visible (orange color or similar)
      const wipLink = page.locator('a:has-text("Components")');
      const wipBadge = wipLink.locator('.feature-badge');

      await expect(wipBadge).toBeVisible();
      await expect(wipBadge).toContainText('🚧 WIP');
    });

    test('should display Beta badge on beta feature link', async ({ page }) => {
      // TODO: If there's a 'beta' link, verify badge displays "🧪 Beta"
      // Verify badge styling
      const betaLink = page.locator('a.feature-beta');
      if ((await betaLink.count()) > 0) {
        const badge = betaLink.locator('.feature-badge');
        await expect(badge).toContainText('🧪 Beta');
      }
    });

    test('should not display badge on stable features', async ({ page }) => {
      // TODO: Find link marked as 'stable' (e.g., Home, About)
      // Verify no .feature-badge element
      const homeLink = page.locator('a:has-text("Home")');
      const badge = homeLink.locator('.feature-badge');

      await expect(badge).not.toBeVisible();
    });

    test('should apply feature-wip class to wip links', async ({ page }) => {
      // TODO: Find Components link
      // Verify it has class 'feature-wip' (for CSS styling)
      const wipLink = page.locator('a:has-text("Components")');
      await expect(wipLink).toHaveClass(/feature-wip/);
    });
  });

  test.describe('Theme Switching', () => {
    test('should toggle theme when theme button clicked', async ({ page }) => {
      // TODO: Get initial theme (light or dark)
      // Click theme toggle button
      // Wait for theme transition (200ms)
      // Verify theme changed (check computed style or data-theme attribute)
      const themeToggle = page.locator('button.theme-toggle');
      const rootElement = page.locator('html');

      const initialTheme = await rootElement.getAttribute('data-theme');
      await themeToggle.click();
      await page.waitForTimeout(250);

      const newTheme = await rootElement.getAttribute('data-theme');
      expect(newTheme).not.toBe(initialTheme);
    });

    test('should update colors when theme changes', async ({ page }) => {
      // TODO: Get initial background color
      // Click theme toggle
      // Wait for transition
      // Get new background color
      // Verify they are different
      const themeToggle = page.locator('button.theme-toggle');
      const drawer = page.locator('aside.nav-drawer');

      const initialBgColor = await drawer.evaluate(
        (el) => window.getComputedStyle(el).backgroundColor
      );

      await themeToggle.click();
      await page.waitForTimeout(250);

      const newBgColor = await drawer.evaluate(
        (el) => window.getComputedStyle(el).backgroundColor
      );

      expect(newBgColor).not.toBe(initialBgColor);
    });

    test('should persist theme preference to localStorage', async ({
      page,
    }) => {
      // TODO: Click theme toggle
      // Verify localStorage has 'jeffapp-theme' key set
      // Reload page
      // Verify theme remains same as set
      const themeToggle = page.locator('button.theme-toggle');

      await themeToggle.click();
      await page.waitForTimeout(250);

      const storageTheme = await page.evaluate(() =>
        localStorage.getItem('jeffapp-theme')
      );
      expect(storageTheme).not.toBeNull();

      await page.reload();
      const themeAfterReload = await page.evaluate(() =>
        localStorage.getItem('jeffapp-theme')
      );
      expect(themeAfterReload).toBe(storageTheme);
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('should tab through header and drawer elements', async ({ page }) => {
      // TODO: Set viewport to mobile
      // Open drawer
      // Tab through all focusable elements:
      // 1. Theme toggle
      // 2. Hamburger (when visible)
      // 3. Nav links (in order)
      // Verify no focus escapes to main content
      await page.setViewportSize({ width: 375, height: 667 });
      const hamburger = page.locator('button.hamburger');
      await hamburger.click();
      await page.waitForTimeout(350);

      const themeToggle = page.locator('button.theme-toggle');
      const navLinks = page.locator('a.nav-link');

      await themeToggle.focus();
      await expect(themeToggle).toBeFocused();

      await page.keyboard.press('Tab');
      await expect(hamburger).toBeFocused();

      await page.keyboard.press('Tab');
      const firstLink = navLinks.first();
      await expect(firstLink).toBeFocused();
    });

    test('should activate link on Enter key', async ({ page }) => {
      // TODO: Set focus to a nav link
      // Press Enter
      // Verify navigation occurs (URL changes)
      const aboutLink = page.locator('a:has-text("About")');
      const currentUrl = page.url();

      await aboutLink.focus();
      await page.keyboard.press('Enter');
      await page.waitForLoadState('networkidle');

      const newUrl = page.url();
      expect(newUrl).not.toBe(currentUrl);
    });

    test('should close drawer on Escape key when drawer is open', async ({
      page,
    }) => {
      // TODO: Set viewport to mobile
      // Open drawer
      // Press Escape
      // Verify drawer closes
      await page.setViewportSize({ width: 375, height: 667 });
      const hamburger = page.locator('button.hamburger');
      const drawer = page.locator('aside.nav-drawer');

      await hamburger.click();
      await page.waitForTimeout(350);
      await expect(drawer).toHaveClass(/open/);

      await page.keyboard.press('Escape');
      await page.waitForTimeout(250);
      await expect(drawer).not.toHaveClass(/open/);
    });

    test('should show focus indicator on keyboard navigation', async ({
      page,
    }) => {
      // TODO: Use keyboard to navigate (Tab)
      // Verify focused element has visible focus ring
      // Check for outline or focus style
      const themeToggle = page.locator('button.theme-toggle');
      await themeToggle.focus();

      const outlineStyle = await themeToggle.evaluate(
        (el) => window.getComputedStyle(el).outline
      );

      // Focus indicator should have outline (not 'none')
      expect(outlineStyle).not.toContain('none');
    });
  });

  test.describe('Responsive Breakpoint', () => {
    test('should adapt layout at 1024px breakpoint', async ({ page }) => {
      // TODO: Start at 1023px (mobile)
      // Verify hamburger visible, drawer is overlay
      // Resize to 1024px (desktop)
      // Verify hamburger hidden, drawer is sidebar
      // Resize back to 1023px
      // Verify hamburger visible again
      await page.setViewportSize({ width: 1023, height: 667 });
      await page.waitForTimeout(350);
      let hamburger = page.locator('button.hamburger');
      await expect(hamburger).toBeVisible();

      await page.setViewportSize({ width: 1024, height: 667 });
      await page.waitForTimeout(350);
      hamburger = page.locator('button.hamburger');
      await expect(hamburger).not.toBeVisible();

      await page.setViewportSize({ width: 1023, height: 667 });
      await page.waitForTimeout(350);
      hamburger = page.locator('button.hamburger');
      await expect(hamburger).toBeVisible();
    });

    test('should maintain nav functionality across breakpoint transitions', async ({
      page,
    }) => {
      // TODO: At mobile, open drawer
      // Click a nav link
      // Verify navigation works
      // Resize to desktop
      // Verify nav links still work
      await page.setViewportSize({ width: 375, height: 667 });
      const hamburger = page.locator('button.hamburger');
      const homeLink = page.locator('a:has-text("Home")');

      await hamburger.click();
      await page.waitForTimeout(350);
      const initialUrl = page.url();

      await page.setViewportSize({ width: 1440, height: 900 });
      await page.waitForTimeout(350);

      const aboutLink = page.locator('a:has-text("About")');
      await aboutLink.click();
      await page.waitForLoadState('networkidle');

      const newUrl = page.url();
      expect(newUrl).not.toBe(initialUrl);
    });
  });

  test.describe('Active Route Highlighting', () => {
    test('should highlight current route link', async ({ page }) => {
      // TODO: Navigate to /about
      // Verify About link has 'active' class
      // Verify other links do not have 'active' class
      await page.goto(`${baseUrl}/about`);
      await page.waitForLoadState('networkidle');

      const aboutLink = page.locator('a:has-text("About")');
      await expect(aboutLink).toHaveClass(/active/);

      const homeLink = page.locator('a:has-text("Home")');
      await expect(homeLink).not.toHaveClass(/active/);
    });

    test('should update active highlighting on navigation', async ({
      page,
    }) => {
      // TODO: Start at /
      // Verify Home is active
      // Click About
      // Verify About is now active (and Home is not)
      await page.goto(baseUrl);
      let homeLink = page.locator('a:has-text("Home")');
      await expect(homeLink).toHaveClass(/active/);

      const aboutLink = page.locator('a:has-text("About")');
      await aboutLink.click();
      await page.waitForLoadState('networkidle');

      homeLink = page.locator('a:has-text("Home")');
      await expect(homeLink).not.toHaveClass(/active/);
      await expect(aboutLink).toHaveClass(/active/);
    });
  });

  test.describe('External Links', () => {
    test('should open external links in new tab', async ({ page, context }) => {
      // TODO: Find external link (e.g., GitHub)
      // Verify target="_blank" attribute
      // Verify href is full URL (not relative)
      const githubLink = page.locator('a[href*="github.com"]');
      await expect(githubLink).toHaveAttribute('target', '_blank');
    });
  });

  test.describe('Accessibility', () => {
    test('should have accessible heading hierarchy', async ({ page }) => {
      // TODO: Portfolio title should be <h1>
      // Other sections should follow proper hierarchy
      const h1 = page.locator('h1.portfolio-title');
      await expect(h1).toBeVisible();
      await expect(h1).toContainText('Jeff Crosley');
    });

    test('should have sufficient color contrast', async ({ page }) => {
      // TODO: Use axe-core or similar to verify WCAG AA contrast
      // Links, text, badges should have 4.5:1 contrast (WCAG AA)
      // This is a basic smoke test
      const drawer = page.locator('aside.nav-drawer');
      const textColor = await drawer.evaluate(
        (el) => window.getComputedStyle(el).color
      );
      expect(textColor).not.toBeNull();
    });

    test('should announce drawer state to screen readers', async ({ page }) => {
      // TODO: Mobile: hamburger should have aria-expanded
      // When open: aria-expanded="true"
      // When closed: aria-expanded="false"
      await page.setViewportSize({ width: 375, height: 667 });
      const hamburger = page.locator('button.hamburger');

      const initialExpanded = await hamburger.getAttribute('aria-expanded');
      expect(['false', 'null']).toContain(initialExpanded || 'null');

      await hamburger.click();
      await page.waitForTimeout(350);

      const openExpanded = await hamburger.getAttribute('aria-expanded');
      expect(openExpanded).toBe('true');
    });
  });
});
