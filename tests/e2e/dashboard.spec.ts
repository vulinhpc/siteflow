import { expect, test } from '@playwright/test';

test.describe('Dashboard E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set E2E bypass headers
    await page.setExtraHTTPHeaders({
      'x-e2e-bypass': '1',
      'x-e2e-user': 'owner',
      'x-e2e-org': 'org_e2e_default',
    });

    // Navigate to dashboard
    await page.goto('/dashboard');
  });

  test('should load dashboard with all components', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check if sidebar is visible
    await expect(page.locator('[data-testid="sidebar"]')).toBeVisible();

    // Check if header is visible
    await expect(page.locator('[data-testid="header"]')).toBeVisible();

    // Check if KPI cards are present
    await expect(page.locator('[data-testid="kpi-cards"]')).toBeVisible();

    // Check if project table is present
    await expect(page.locator('[data-testid="project-table"]')).toBeVisible();

    // Check if create project button is present
    await expect(page.locator('[data-testid="create-project-button"]')).toBeVisible();
  });

  test('should open and close create project modal', async ({ page }) => {
    // Click create project button
    await page.click('[data-testid="create-project-button"]');

    // Check if modal is open
    await expect(page.locator('[data-testid="create-project-modal"]')).toBeVisible();

    // Check if form fields are present
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('select[name="status"]')).toBeVisible();
    await expect(page.locator('input[name="budget"]')).toBeVisible();

    // Close modal by clicking cancel button
    await page.click('[data-testid="cancel-button"]');

    // Check if modal is closed
    await expect(page.locator('[data-testid="create-project-modal"]')).toBeHidden();
  });

  test('should validate form fields', async ({ page }) => {
    // Open create project modal
    await page.click('[data-testid="create-project-button"]');

    // Try to submit empty form
    await page.click('[data-testid="submit-button"]');

    // Check if validation errors are shown
    await expect(page.locator('text=Project name required')).toBeVisible();

    // Fill in project name
    await page.fill('input[name="name"]', 'Test Project');

    // Try to submit again
    await page.click('[data-testid="submit-button"]');

    // Check if form submits successfully (no validation errors)
    await expect(page.locator('text=Project name required')).toBeHidden();
  });

  test('should create project successfully', async ({ page }) => {
    // Open create project modal
    await page.click('[data-testid="create-project-button"]');

    // Fill in form
    await page.fill('input[name="name"]', 'E2E Test Project');
    await page.selectOption('select[name="status"]', 'PLANNING');
    await page.fill('input[name="budget"]', '1000000');
    await page.fill('textarea[name="description"]', 'Test project created by E2E test');

    // Submit form
    await page.click('[data-testid="submit-button"]');

    // Wait for API call to complete
    await page.waitForResponse(response =>
      response.url().includes('/api/v1/projects') && response.status() === 201,
    );

    // Check if success message is shown
    await expect(page.locator('text=Project created successfully')).toBeVisible();

    // Check if modal is closed
    await expect(page.locator('[data-testid="create-project-modal"]')).toBeHidden();

    // Check if new project appears in table
    await expect(page.locator('text=E2E Test Project')).toBeVisible();
  });

  test('should display project table with pagination', async ({ page }) => {
    // Check if project table is visible
    await expect(page.locator('[data-testid="project-table"]')).toBeVisible();

    // Check if table headers are present
    await expect(page.locator('th:has-text("Name")')).toBeVisible();
    await expect(page.locator('th:has-text("Status")')).toBeVisible();
    await expect(page.locator('th:has-text("Budget")')).toBeVisible();
    await expect(page.locator('th:has-text("Created")')).toBeVisible();

    // Check if pagination controls are present
    await expect(page.locator('[data-testid="pagination"]')).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Check if sidebar is hidden on mobile
    await expect(page.locator('[data-testid="sidebar"]')).toBeHidden();

    // Check if mobile menu button is present
    await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible();

    // Click mobile menu button
    await page.click('[data-testid="mobile-menu-button"]');

    // Check if sidebar is now visible
    await expect(page.locator('[data-testid="sidebar"]')).toBeVisible();
  });

  test('should have clean console', async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.waitForLoadState('networkidle');

    // Check that there are no console errors
    expect(consoleErrors).toHaveLength(0);
  });
});
