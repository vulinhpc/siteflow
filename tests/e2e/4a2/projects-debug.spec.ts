// tests/e2e/4a2/projects-debug.spec.ts
import { expect, test } from '@playwright/test';

test.describe('Projects Page Debug', () => {
  test('should load basic page structure', async ({ page }) => {
    // Navigate to projects page
    await page.goto('/en/projects', {
      headers: {
        'x-e2e-bypass': '1',
        'x-e2e-user': 'owner',
        'x-e2e-org': 'test-org',
      },
    });

    // Wait for basic page load
    await page.waitForLoadState('networkidle');
    
    // Take screenshot for debugging
    await page.screenshot({ path: 'test-results/projects-debug.png', fullPage: true });
    
    // Check basic page elements
    console.log('Page title:', await page.title());
    console.log('Page URL:', page.url());
    
    // Check if page has basic structure
    const bodyContent = await page.locator('body').textContent();
    console.log('Body contains "Projects":', bodyContent?.includes('Projects'));
    console.log('Body contains "Create":', bodyContent?.includes('Create'));
    
    // Check for React hydration
    const hasReactRoot = await page.locator('#__next').count();
    console.log('Has React root:', hasReactRoot > 0);
    
    // Check for any visible errors
    const errorElements = await page.locator('text=/error|Error|ERROR/i').count();
    console.log('Error elements found:', errorElements);
    
    // Log all visible text for debugging
    const allText = await page.locator('body').allTextContents();
    console.log('All visible text (first 500 chars):', allText[0]?.substring(0, 500));
    
    // Basic assertion - page should load
    await expect(page.locator('body')).toBeVisible();
  });

  test('should have working API endpoint', async ({ page }) => {
    // Test API directly
    const response = await page.request.get('/api/v1/projects?limit=1', {
      headers: {
        'x-e2e-bypass': '1',
        'x-org-id': 'test-org',
      },
    });
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    console.log('API response:', JSON.stringify(data, null, 2));
    
    expect(data).toHaveProperty('items');
    expect(Array.isArray(data.items)).toBe(true);
  });
});
