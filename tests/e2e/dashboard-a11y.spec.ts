import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Dashboard Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set E2E bypass headers
    await page.setExtraHTTPHeaders({
      'x-e2e-bypass': '1',
      'x-e2e-user': 'owner',
      'x-e2e-org': 'org_e2e_default',
    });

    // Navigate to dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('should not have any serious or critical accessibility violations on dashboard', async ({ page }) => {
    // Run axe accessibility tests
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    // Check for serious and critical violations
    const seriousViolations = accessibilityScanResults.violations.filter(
      violation => violation.impact === 'serious' || violation.impact === 'critical'
    );

    expect(seriousViolations).toHaveLength(0);

    // Log all violations for debugging
    if (accessibilityScanResults.violations.length > 0) {
      console.log('Accessibility violations found:', accessibilityScanResults.violations);
    }
  });

  test('should not have any serious or critical accessibility violations on create project modal', async ({ page }) => {
    // Open create project modal
    await page.click('[data-testid="create-project-button"]');
    await page.waitForSelector('[data-testid="create-project-modal"]');

    // Run axe accessibility tests on modal
    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('[data-testid="create-project-modal"]')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    // Check for serious and critical violations
    const seriousViolations = accessibilityScanResults.violations.filter(
      violation => violation.impact === 'serious' || violation.impact === 'critical'
    );

    expect(seriousViolations).toHaveLength(0);

    // Log all violations for debugging
    if (accessibilityScanResults.violations.length > 0) {
      console.log('Modal accessibility violations found:', accessibilityScanResults.violations);
    }
  });

  test('should have proper keyboard navigation', async ({ page }) => {
    // Test tab navigation
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Check if focus is visible
    const focusedElement = await page.evaluate(() => document.activeElement);
    expect(focusedElement).not.toBeNull();

    // Test Enter key on create project button
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-testid="create-project-modal"]')).toBeVisible();
  });

  test('should have proper ARIA labels and roles', async ({ page }) => {
    // Check for proper ARIA labels
    await expect(page.locator('[aria-label]')).toHaveCount({ min: 1 });
    
    // Check for proper roles
    await expect(page.locator('[role="button"]')).toHaveCount({ min: 1 });
    await expect(page.locator('[role="dialog"]')).toHaveCount({ min: 0 }); // Modal not open yet

    // Open modal and check dialog role
    await page.click('[data-testid="create-project-button"]');
    await expect(page.locator('[role="dialog"]')).toHaveCount({ min: 1 });
  });

  test('should have proper color contrast', async ({ page }) => {
    // Run axe color contrast tests
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['color-contrast'])
      .analyze();

    // Check for color contrast violations
    const colorContrastViolations = accessibilityScanResults.violations.filter(
      violation => violation.ruleId === 'color-contrast'
    );

    expect(colorContrastViolations).toHaveLength(0);
  });

  test('should be accessible on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Run axe accessibility tests on mobile
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    // Check for serious and critical violations
    const seriousViolations = accessibilityScanResults.violations.filter(
      violation => violation.impact === 'serious' || violation.impact === 'critical'
    );

    expect(seriousViolations).toHaveLength(0);
  });

  test('should have proper form accessibility', async ({ page }) => {
    // Open create project modal
    await page.click('[data-testid="create-project-button"]');
    await page.waitForSelector('[data-testid="create-project-modal"]');

    // Check for proper form labels
    await expect(page.locator('label[for]')).toHaveCount({ min: 1 });
    
    // Check for proper input associations
    const inputs = await page.locator('input, select, textarea').all();
    for (const input of inputs) {
      const id = await input.getAttribute('id');
      if (id) {
        await expect(page.locator(`label[for="${id}"]`)).toHaveCount({ min: 1 });
      }
    }

    // Check for proper error message associations
    const nameInput = page.locator('input[name="name"]');
    await nameInput.fill('A'); // Trigger validation
    await page.click('[data-testid="submit-button"]');
    
    // Check if error message is properly associated
    await expect(page.locator('text=Project name required')).toBeVisible();
  });
});
