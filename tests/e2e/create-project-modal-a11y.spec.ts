import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('Create Project Modal Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set E2E bypass headers
    await page.setExtraHTTPHeaders({
      'x-e2e-bypass': '1',
      'x-e2e-user': 'owner',
      'x-e2e-org': 'org_e2e_default',
    });

    // Navigate to dashboard
    await page.goto('http://localhost:3000/en/dashboard');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should not have any serious or critical accessibility violations on create project modal', async ({
    page,
  }) => {
    // Open create project modal
    await page.click('[data-testid="create-project-button"]');

    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Run axe accessibility tests on modal
    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('[role="dialog"]')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    // Check for serious and critical violations
    const seriousViolations = accessibilityScanResults.violations.filter(
      violation =>
        violation.impact === 'serious' || violation.impact === 'critical',
    );

    expect(seriousViolations).toHaveLength(0);

    // Log all violations for debugging
    if (accessibilityScanResults.violations.length > 0) {
      // Log violations for debugging (commented out for production)
      // console.log('Modal accessibility violations found:', accessibilityScanResults.violations);
    }
  });

  test('should have proper form labels and associations', async ({ page }) => {
    // Open create project modal
    await page.click('[data-testid="create-project-button"]');

    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Check for proper form labels
    const labels = await page.locator('label[for]').count();

    expect(labels).toBeGreaterThan(0);

    // Check for proper input associations
    const inputs = await page.locator('input, select, textarea').all();
    for (const input of inputs) {
      const id = await input.getAttribute('id');
      if (id) {
        const labelCount = await page.locator(`label[for="${id}"]`).count();

        expect(labelCount).toBeGreaterThan(0);
      }
    }

    // Check specific required fields have labels
    const nameLabels = await page.locator('label[for*="name"]').count();
    const statusLabels = await page.locator('label[for*="status"]').count();

    expect(nameLabels).toBeGreaterThan(0);
    expect(statusLabels).toBeGreaterThan(0);
  });

  test('should have proper ARIA labels and roles', async ({ page }) => {
    // Open create project modal
    await page.click('[data-testid="create-project-button"]');

    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Check for proper dialog role
    const dialogs = await page.locator('[role="dialog"]').count();

    expect(dialogs).toBeGreaterThan(0);

    // Check for proper button roles
    const buttons = await page.locator('[role="button"]').count();

    expect(buttons).toBeGreaterThanOrEqual(2); // Submit and Cancel buttons

    // Check for proper form role
    const forms = await page.locator('form').count();

    expect(forms).toBeGreaterThan(0);

    // Check for proper fieldset if used
    const fieldsets = await page.locator('fieldset').count();
    if (fieldsets > 0) {
      const legends = await page.locator('fieldset legend').count();

      expect(legends).toBeGreaterThan(0);
    }
  });

  test('should have proper keyboard navigation', async ({ page }) => {
    // Open create project modal
    await page.click('[data-testid="create-project-button"]');

    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Test tab navigation through form
    await page.keyboard.press('Tab'); // name input (should be focused already)
    await page.keyboard.press('Tab'); // status select
    await page.keyboard.press('Tab'); // description textarea
    await page.keyboard.press('Tab'); // endDate input
    await page.keyboard.press('Tab'); // thumbnailUrl input
    await page.keyboard.press('Tab'); // submit button
    await page.keyboard.press('Tab'); // cancel button

    // Check if cancel button is focused
    await expect(page.locator('[data-testid="cancel-button"]')).toBeFocused();

    // Test Shift+Tab to go backwards
    await page.keyboard.press('Shift+Tab');

    await expect(page.locator('[data-testid="submit-button"]')).toBeFocused();
  });

  test('should have proper focus management', async ({ page }) => {
    // Open create project modal
    await page.click('[data-testid="create-project-button"]');

    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Check if first input is focused when modal opens
    const nameInput = page.locator('input[name="name"]');

    await expect(nameInput).toBeFocused();

    // Test that focus is trapped within modal
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab'); // Should cycle back to first element

    // Focus should be back on first input
    await expect(nameInput).toBeFocused();
  });

  test('should have proper error message associations', async ({ page }) => {
    // Open create project modal
    await page.click('[data-testid="create-project-button"]');

    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Try to submit empty form to trigger validation errors
    await page.click('[data-testid="submit-button"]');

    // Check if error messages are properly associated with inputs
    const nameInput = page.locator('input[name="name"]');
    const nameError = page.locator('text=Project name is required');

    // Check if error message is visible
    await expect(nameError).toBeVisible();

    // Check if error message is associated with input via aria-describedby
    const ariaDescribedBy = await nameInput.getAttribute('aria-describedby');
    if (ariaDescribedBy) {
      await expect(page.locator(`#${ariaDescribedBy}`)).toBeVisible();
    }
  });

  test('should have proper color contrast', async ({ page }) => {
    // Open create project modal
    await page.click('[data-testid="create-project-button"]');

    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Run axe color contrast tests on modal
    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('[role="dialog"]')
      .withTags(['color-contrast'])
      .analyze();

    // Check for color contrast violations
    const colorContrastViolations = accessibilityScanResults.violations.filter(
      violation => violation.ruleId === 'color-contrast',
    );

    expect(colorContrastViolations).toHaveLength(0);
  });

  test('should have proper heading structure', async ({ page }) => {
    // Open create project modal
    await page.click('[data-testid="create-project-button"]');

    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Check for proper heading structure
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();

    expect(headings.length).toBeGreaterThan(0);

    // Check if modal has a proper heading
    await expect(page.locator('h2:has-text("Create Project")')).toBeVisible();

    // Check heading hierarchy (no skipped levels)
    const headingLevels = await Promise.all(
      headings.map(async (heading) => {
        const tagName = await heading.evaluate(el => el.tagName);
        return Number.parseInt(tagName.replace('H', ''));
      }),
    );

    // Should not have skipped heading levels
    const sortedLevels = headingLevels.sort((a, b) => a - b);
    for (let i = 1; i < sortedLevels.length; i++) {
      expect(sortedLevels[i] - sortedLevels[i - 1]).toBeLessThanOrEqual(1);
    }
  });

  test('should have proper button accessibility', async ({ page }) => {
    // Open create project modal
    await page.click('[data-testid="create-project-button"]');

    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Check submit button accessibility
    const submitButton = page.locator('[data-testid="submit-button"]');

    await expect(submitButton).toBeVisible();
    await expect(submitButton).toHaveAttribute('type', 'submit');

    // Check if button has accessible name
    const submitText = submitButton;

    await expect(submitText).toHaveText();
    expect(submitText?.trim().length).toBeGreaterThan(0);

    // Check cancel button accessibility
    const cancelButton = page.locator('[data-testid="cancel-button"]');

    await expect(cancelButton).toBeVisible();
    await expect(cancelButton).toHaveAttribute('type', 'button');

    // Check if button has accessible name
    const cancelText = cancelButton;

    await expect(cancelText).toHaveText();
    expect(cancelText?.trim().length).toBeGreaterThan(0);
  });

  test('should have proper select accessibility', async ({ page }) => {
    // Open create project modal
    await page.click('[data-testid="create-project-button"]');

    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Check status select accessibility
    const statusSelect = page.locator('[data-testid="project-status"]');

    await expect(statusSelect).toBeVisible();

    // Check if select has proper label
    const statusLabel = page.locator('label[for*="status"]');

    await expect(statusLabel).toBeVisible();

    // Check if select has proper options
    const options = await statusSelect.locator('option').all();

    expect(options.length).toBeGreaterThan(0);

    // Check if options have proper values and text
    for (const option of options) {
      const value = option;
      const text = await option.textContent();

      await expect(value).toHaveAttribute('value');
      expect(text?.trim().length).toBeGreaterThan(0);
    }
  });

  test('should be accessible on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Open create project modal
    await page.click('[data-testid="create-project-button"]');

    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Run axe accessibility tests on mobile
    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('[role="dialog"]')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    // Check for serious and critical violations
    const seriousViolations = accessibilityScanResults.violations.filter(
      violation =>
        violation.impact === 'serious' || violation.impact === 'critical',
    );

    expect(seriousViolations).toHaveLength(0);
  });

  test('should have proper screen reader support', async ({ page }) => {
    // Open create project modal
    await page.click('[data-testid="create-project-button"]');

    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Check for proper ARIA attributes
    const modal = page.locator('[role="dialog"]');

    await expect(modal).toHaveAttribute('aria-modal', 'true');

    // Check if modal has proper aria-labelledby
    const ariaLabelledBy = await modal.getAttribute('aria-labelledby');
    if (ariaLabelledBy) {
      await expect(page.locator(`#${ariaLabelledBy}`)).toBeVisible();
    }

    // Check if form has proper aria-describedby for instructions
    const form = page.locator('form');
    const ariaDescribedBy = await form.getAttribute('aria-describedby');
    if (ariaDescribedBy) {
      await expect(page.locator(`#${ariaDescribedBy}`)).toBeVisible();
    }
  });
});
