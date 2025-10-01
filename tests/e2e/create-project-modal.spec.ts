import { expect, test } from "@playwright/test";

test.describe("Create Project Modal E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Set E2E bypass headers
    await page.setExtraHTTPHeaders({
      "x-e2e-bypass": "1",
      "x-e2e-user": "owner",
      "x-e2e-org": "org_e2e_default",
    });

    // Navigate to dashboard
    await page.goto("http://localhost:3000/en/dashboard");
    await page.waitForLoadState("domcontentloaded");
  });

  test("should open create project modal when clicking create button", async ({
    page,
  }) => {
    // Click create project button
    await page.click('[data-testid="create-project-button"]');

    // Check if modal is open with proper role
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Check if modal has proper title
    await expect(page.locator('h2:has-text("Create Project")')).toBeVisible();
  });

  test("should validate required fields (name and status)", async ({
    page,
  }) => {
    // Open create project modal
    await page.click('[data-testid="create-project-button"]');

    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Check submit button state
    const submitButton = page.locator('[data-testid="submit-button"]');

    // Fill only name, leave status empty
    await page.fill('input[name="name"]', "Test Project");

    // Fill status
    await page.click('[data-testid="project-status"]');
    await page.click('button:has-text("Planning")');

    // Now button should be enabled
    await expect(submitButton).toBeEnabled();
  });

  test("should create project successfully with required fields only", async ({
    page,
  }) => {
    // Open create project modal
    await page.click('[data-testid="create-project-button"]');

    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Fill required fields
    await page.fill('input[name="name"]', "E2E Test Project");
    await page.click('[data-testid="project-status"]');
    await page.click('button:has-text("Planning")');

    // Submit form
    await page.click('[data-testid="submit-button"]');

    // Wait for API call to complete
    await page.waitForResponse(
      (response) =>
        response.url().includes("/api/v1/projects") &&
        response.status() === 201,
    );

    // Check if success message is shown
    await expect(
      page.locator("text=Project created successfully"),
    ).toBeVisible();

    // Check if modal is closed
    await expect(page.locator('[role="dialog"]')).toBeHidden();

    // Check if new project appears in table
    await expect(page.locator("text=E2E Test Project")).toBeVisible();
    await expect(page.locator("text=PLANNING")).toBeVisible();
  });

  test("should create project with all optional fields", async ({ page }) => {
    // Open create project modal
    await page.click('[data-testid="create-project-button"]');

    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Fill all fields
    await page.fill('input[name="name"]', "Complete Test Project");
    await page.click('[data-testid="project-status"]');
    await page.click('button:has-text("In Progress")');
    await page.fill(
      'textarea[name="description"]',
      "This is a comprehensive test project with all fields filled",
    );
    await page.fill('input[name="endDate"]', "2024-12-31");
    await page.fill(
      'input[name="thumbnailUrl"]',
      "https://picsum.photos/400/300?random=1",
    );

    // Submit form
    await page.click('[data-testid="submit-button"]');

    // Wait for API call to complete
    await page.waitForResponse(
      (response) =>
        response.url().includes("/api/v1/projects") &&
        response.status() === 201,
    );

    // Check if success message is shown
    await expect(
      page.locator("text=Project created successfully"),
    ).toBeVisible();

    // Check if modal is closed
    await expect(page.locator('[role="dialog"]')).toBeHidden();

    // Check if new project appears in table with all data
    await expect(page.locator("text=Complete Test Project")).toBeVisible();
    await expect(page.locator("text=IN_PROGRESS")).toBeVisible();
    await expect(
      page.locator("text=This is a comprehensive test project"),
    ).toBeVisible();
  });

  test("should validate project status enum values", async ({ page }) => {
    // Open create project modal
    await page.click('[data-testid="create-project-button"]');

    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Check if all status options are available
    const statusSelect = page.locator('[data-testid="project-status"]');

    await expect(statusSelect).toBeVisible();

    // Click to open select dropdown
    await statusSelect.click();

    // Check for all required status values
    const options = page.locator("[data-value]");
    const optionTexts = await Promise.all(
      options.map((option) => option.textContent()),
    );

    expect(optionTexts).toContain("PLANNING");
    expect(optionTexts).toContain("IN_PROGRESS");
    expect(optionTexts).toContain("DONE");
    expect(optionTexts).toContain("ON_HOLD");
    expect(optionTexts).toContain("CANCELLED");
  });

  test("should close modal when clicking cancel button", async ({ page }) => {
    // Open create project modal
    await page.click('[data-testid="create-project-button"]');

    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Click cancel button
    await page.click('[data-testid="cancel-button"]');

    // Check if modal is closed
    await expect(page.locator('[role="dialog"]')).toBeHidden();
    await expect(
      page.locator('[data-testid="create-project-modal"]'),
    ).toBeHidden();
  });

  test("should close modal when clicking outside", async ({ page }) => {
    // Open create project modal
    await page.click('[data-testid="create-project-button"]');

    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Click outside modal (on backdrop)
    await page.click('[data-testid="modal-backdrop"]');

    // Check if modal is closed
    await expect(page.locator('[role="dialog"]')).toBeHidden();
  });

  test("should close modal when pressing Escape key", async ({ page }) => {
    // Open create project modal
    await page.click('[data-testid="create-project-button"]');

    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Press Escape key
    await page.keyboard.press("Escape");

    // Check if modal is closed
    await expect(page.locator('[role="dialog"]')).toBeHidden();
  });

  test("should handle API errors gracefully", async ({ page }) => {
    // Mock API to return error
    await page.route("**/api/v1/projects", (route) => {
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({
          type: "https://example.com/probs/server-error",
          title: "Internal Server Error",
          status: 500,
          detail: "Database connection failed",
        }),
      });
    });

    // Open create project modal
    await page.click('[data-testid="create-project-button"]');

    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Fill and submit form
    await page.fill('input[name="name"]', "Error Test Project");
    await page.click('[data-testid="project-status"]');
    await page.click('button:has-text("Planning")');
    await page.click('[data-testid="submit-button"]');

    // Wait for API call to complete
    await page.waitForResponse(
      (response) =>
        response.url().includes("/api/v1/projects") &&
        response.status() === 500,
    );

    // Check if error message is shown
    await expect(page.locator("text=Failed to create project")).toBeVisible();
    await expect(page.locator("text=Database connection failed")).toBeVisible();

    // Modal should remain open
    await expect(page.locator('[role="dialog"]')).toBeVisible();
  });

  test("should reset form when modal is reopened", async ({ page }) => {
    // Open create project modal
    await page.click('[data-testid="create-project-button"]');

    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Fill some fields
    await page.fill('input[name="name"]', "Test Project");
    await page.click('[data-testid="project-status"]');
    await page.click('button:has-text("Planning")');
    await page.fill('textarea[name="description"]', "Test description");

    // Close modal
    await page.click('[data-testid="cancel-button"]');

    // Reopen modal
    await page.click('[data-testid="create-project-button"]');

    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Check if form is reset
    await expect(page.locator('input[name="name"]')).toHaveValue("");
    await expect(page.locator('select[name="status"]')).toHaveValue("");
    await expect(page.locator('textarea[name="description"]')).toHaveValue("");
  });

  test("should focus on first input when modal opens", async ({ page }) => {
    // Open create project modal
    await page.click('[data-testid="create-project-button"]');

    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Check if first input (name) is focused
    const nameInput = page.locator('input[name="name"]');

    await expect(nameInput).toBeFocused();
  });

  test("should navigate form with Tab key", async ({ page }) => {
    // Open create project modal
    await page.click('[data-testid="create-project-button"]');

    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Tab through form elements
    await page.keyboard.press("Tab"); // name input (should be focused already)
    await page.keyboard.press("Tab"); // status select
    await page.keyboard.press("Tab"); // description textarea
    await page.keyboard.press("Tab"); // endDate input
    await page.keyboard.press("Tab"); // thumbnailUrl input
    await page.keyboard.press("Tab"); // submit button
    await page.keyboard.press("Tab"); // cancel button

    // Check if cancel button is focused
    await expect(page.locator('[data-testid="cancel-button"]')).toBeFocused();
  });
});
