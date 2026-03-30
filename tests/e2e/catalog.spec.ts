// Basic E2E tests using Playwright
// Note: These tests require both frontend and backend running
// They should be skipped in CI unless servers are available

import { test, expect } from '@playwright/test';

test.describe('Template Catalog', () => {
  test('home page loads and shows templates', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Internal Developer Platform')).toBeVisible();
    // Expect template cards to appear (wait for loading to complete)
    await expect(page.locator('.template-card').first()).toBeVisible({ timeout: 10000 });
  });

  test('can navigate to template detail', async ({ page }) => {
    await page.goto('/');
    // Wait for cards to load
    await expect(page.locator('.template-card').first()).toBeVisible({ timeout: 10000 });
    // Click first template card link
    await page.locator('.template-card .card-link').first().click();
    // Verify detail page loads with template content
    await expect(page.locator('.detail-page')).toBeVisible();
    await expect(page.getByText('Deploy to Azure')).toBeVisible();
  });

  test('can filter templates by category', async ({ page }) => {
    await page.goto('/');
    // Wait for cards to load
    await expect(page.locator('.template-card').first()).toBeVisible({ timeout: 10000 });
    const initialCount = await page.locator('.template-card').count();
    // Click a category chip (not "All")
    const chips = page.locator('.chip:not(.chip-active)');
    const chipCount = await chips.count();
    if (chipCount > 0) {
      await chips.first().click();
      // Verify filtered results — count may be different
      const filteredCount = await page.locator('.template-card').count();
      expect(filteredCount).toBeLessThanOrEqual(initialCount);
    }
  });

  test('search filters templates', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.template-card').first()).toBeVisible({ timeout: 10000 });
    // Type in search
    await page.getByPlaceholder('Search templates…').fill('zzz-no-match');
    // Should show empty state or fewer results
    await expect(page.getByText('No templates found')).toBeVisible({ timeout: 5000 });
  });

  test('deployments page loads', async ({ page }) => {
    await page.goto('/deployments');
    await expect(page.getByText('Deployments')).toBeVisible();
  });
});
