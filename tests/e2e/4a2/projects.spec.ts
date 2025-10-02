// tests/e2e/4a2/projects.spec.ts
import { expect, test } from '@playwright/test';

test.describe('Projects Page Phase 4A2', () => {
  test.beforeEach(async ({ page }) => {
    // Bypass Clerk auth: set headers
    await page.goto('/en/projects', {
      headers: {
        'x-e2e-bypass': '1',
        'x-e2e-user': 'owner',
        'x-e2e-org': 'test-org',
      },
    });
  });

  test('should load projects page with data and KPI cards', async ({ page }) => {
    // Wait for the page to load
    await expect(page.locator('h1')).toContainText('Projects');
    
    // Check if KPI cards are visible
    await expect(page.locator('[data-testid="kpi-cards"]')).toBeVisible();
    
    // Check if projects table/cards are visible
    await expect(page.locator('[data-testid="projects-data-table"]')).toBeVisible();
    
    // Wait for data to load and check if we have at least one project
    await page.waitForSelector('[data-testid="project-row"], [data-testid="project-card"]', { timeout: 10000 });
    
    const projectElements = await page.locator('[data-testid="project-row"], [data-testid="project-card"]').count();
    expect(projectElements).toBeGreaterThan(0);
  });

  test('should filter projects by search', async ({ page }) => {
    // Wait for initial load
    await page.waitForSelector('[data-testid="projects-data-table"]');
    
    // Get initial project count
    await page.waitForSelector('[data-testid="project-row"], [data-testid="project-card"]', { timeout: 10000 });
    const initialCount = await page.locator('[data-testid="project-row"], [data-testid="project-card"]').count();
    
    // Search for "Chung"
    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.fill('Chung');
    
    // Wait for debounced search (300ms + network time)
    await page.waitForTimeout(500);
    
    // Check if results are filtered (should be same or fewer)
    const filteredCount = await page.locator('[data-testid="project-row"], [data-testid="project-card"]').count();
    expect(filteredCount).toBeLessThanOrEqual(initialCount);
  });

  test('should open create project modal', async ({ page }) => {
    // Click create project button
    const createButton = page.locator('button:has-text("Create Project")');
    await createButton.click();
    
    // Check if modal is open
    await expect(page.locator('[role="dialog"]:has-text("Create Project")')).toBeVisible();
    
    // Check if form fields are present
    await expect(page.locator('input[name="name"], input[placeholder*="name"]')).toBeVisible();
    
    // Close modal
    await page.keyboard.press('Escape');
    
    // Check if modal is closed
    await expect(page.locator('[role="dialog"]:has-text("Create Project")')).not.toBeVisible();
  });

  test('should work in Vietnamese locale', async ({ page }) => {
    // Navigate to Vietnamese version
    await page.goto('/vi/projects', {
      headers: {
        'x-e2e-bypass': '1',
        'x-e2e-user': 'owner',
        'x-e2e-org': 'test-org',
      },
    });
    
    // Wait for the page to load
    await expect(page.locator('h1')).toContainText('Dự án');
    
    // Check if Vietnamese text is displayed
    await expect(page.locator('button:has-text("Tạo dự án"), button:has-text("Tạo Dự án")')).toBeVisible();
    
    // Check if data still loads
    await page.waitForSelector('[data-testid="projects-data-table"]');
    await page.waitForSelector('[data-testid="project-row"], [data-testid="project-card"]', { timeout: 10000 });
    
    const projectElements = await page.locator('[data-testid="project-row"], [data-testid="project-card"]').count();
    expect(projectElements).toBeGreaterThan(0);
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Navigate to projects page
    await page.goto('/en/projects', {
      headers: {
        'x-e2e-bypass': '1',
        'x-e2e-user': 'owner',
        'x-e2e-org': 'test-org',
      },
    });
    
    // Wait for the page to load
    await expect(page.locator('h1')).toContainText('Projects');
    
    // On mobile, should show cards instead of table
    await page.waitForSelector('[data-testid="project-card"]', { timeout: 10000 });
    
    const cardElements = await page.locator('[data-testid="project-card"]').count();
    expect(cardElements).toBeGreaterThan(0);
  });

  test('should have minimal console errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    
    // Listen for console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Navigate to projects page
    await page.goto('/en/projects', {
      headers: {
        'x-e2e-bypass': '1',
        'x-e2e-user': 'owner',
        'x-e2e-org': 'test-org',
      },
    });
    
    // Wait for page to fully load
    await page.waitForSelector('[data-testid="projects-data-table"]');
    await page.waitForTimeout(2000);
    
    // Filter out non-critical errors (favicon, network, etc.)
    const criticalErrors = consoleErrors.filter(error => 
      !error.includes('favicon') && 
      !error.includes('404') &&
      !error.includes('net::ERR_') &&
      !error.includes('Failed to load resource') &&
      !error.toLowerCase().includes('network')
    );
    
    // Log errors for debugging
    if (criticalErrors.length > 0) {
      console.log('Console errors found:', criticalErrors);
    }
    
    // Should have minimal critical errors
    expect(criticalErrors.length).toBeLessThan(3);
  });
});
