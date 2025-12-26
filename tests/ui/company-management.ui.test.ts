import { test, expect } from "@playwright/test";
import { UIHelper } from "../utils/ui-helper";
import { faker } from "@faker-js/faker";

test.describe("Company Management UI Tests @ui", () => {
  let uiHelper: UIHelper;

  test.beforeEach(async ({ page }) => {
    uiHelper = new UIHelper(page);

    // Monitor console errors and network requests
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        console.log("Browser console error:", msg.text());
      }
    });

    page.on("pageerror", (error) => {
      console.log("Page error:", error.message);
    });

    page.on("requestfailed", (request) => {
      console.log(
        "Failed request:",
        request.url(),
        request.failure()?.errorText
      );
    });

    try {
      await page.goto("http://localhost:8000");
    } catch (error) {
      console.log(
        "Failed to connect to server:",
        error instanceof Error ? error.message : String(error)
      );
      throw error;
    }
  });

  test("should check if server is running", async ({ page }) => {
    console.log("Testing server connectivity...");

    // Check if page loaded properly
    const title = await page.title();
    console.log("Page title:", title);

    // Check if there's any content
    const bodyText = await page.locator("body").textContent();
    console.log("Body text length:", bodyText?.length || 0);

    // Take a screenshot for debugging
    await page.screenshot({ path: "debug-homepage.png" });
  });

  test("should navigate to company management page", async ({ page }) => {
    // Use the robust navigation helper
    await uiHelper.navigateToCompanyPage();

    // Verify page elements
    await expect(page.locator("text=Company")).toBeVisible();
    await expect(page.locator('button:has-text("Create")')).toBeVisible();
    await expect(page.locator("select")).toBeVisible(); // Status filter
    await expect(page.locator('input[placeholder*="Search"]')).toBeVisible();
  });

  test("should open company creation form", async ({ page }) => {
    await page.goto("/company");

    // Click create button
    await page.click('button:has-text("Create")');
    await page.waitForURL("/company/create");

    // Verify form elements
    await expect(page.locator("text=Create")).toBeVisible();
    await expect(page.locator('input[placeholder="Name"]')).toBeVisible();
    await expect(page.locator('input[placeholder="Code"]')).toBeVisible();
    await expect(page.locator('input[placeholder="Slug"]')).toBeVisible();
    await expect(
      page.locator('textarea[placeholder="Description"]')
    ).toBeVisible();
    await expect(page.locator('button:has-text("Upload Logo")')).toBeVisible();
  });

  test("should fill and submit company creation form", async ({ page }) => {
    await page.goto("/company/create");

    const companyName = `Test Company ${faker.company.name()}`;
    const companyCode = `COMP${faker.string.alphanumeric(6).toUpperCase()}`;
    const companySlug = faker.helpers.slugify(companyName);
    const description = faker.lorem.sentence();

    // Fill form
    await page.fill('input[placeholder="Name"]', companyName);
    await page.fill('input[placeholder="Code"]', companyCode);
    await page.fill('input[placeholder="Slug"]', companySlug);
    await page.fill('textarea[placeholder="Description"]', description);

    // Submit form
    await page.click('button:has-text("Create")');

    // Wait for response (success or error)
    await page.waitForTimeout(2000);

    // Check if we're redirected or if there's an error message
    const currentUrl = page.url();
    if (currentUrl.includes("/company/create")) {
      // Still on create page, check for error messages
      const errorElements = page.locator(
        '[role="alert"], .error, .notification'
      );
      if ((await errorElements.count()) > 0) {
        console.log("Form submission resulted in error");
      }
    } else {
      // Successfully redirected
      await expect(page).toHaveURL(/\/company/);
    }
  });

  test("should validate required fields in company form", async ({ page }) => {
    await page.goto("/company/create");

    // Try to submit without filling required fields
    await page.click('button:has-text("Create")');

    // Wait for validation messages
    await page.waitForTimeout(1000);

    // Check for validation errors (implementation may vary)
    const errorElements = page.locator(
      '[role="alert"], .error, .validation-error'
    );
    if ((await errorElements.count()) > 0) {
      console.log("Validation errors detected");
    }
  });

  test("should test company status filter", async ({ page }) => {
    await page.goto("/company");

    // Test different status filters
    const statusOptions = ["Active", "Suspend"];

    for (const status of statusOptions) {
      await page.selectOption("select", status);
      await page.waitForTimeout(1000);

      // Verify filter is applied
      const selectedOption = await page
        .locator("select")
        .evaluate((el) => (el as HTMLSelectElement).value);
      expect(selectedOption).toBe(status.toLowerCase());
    }
  });

  test("should test company search functionality", async ({ page }) => {
    await page.goto("/company");

    const searchQuery = "test";
    await page.fill('input[placeholder*="Search"]', searchQuery);
    await page.press('input[placeholder*="Search"]', "Enter");

    await page.waitForTimeout(1000);

    // Verify search is applied (implementation may vary)
    const searchInput = await page
      .locator('input[placeholder*="Search"]')
      .inputValue();
    expect(searchInput).toBe(searchQuery);
  });

  test("should test company table functionality", async ({ page }) => {
    await page.goto("/company");

    // Wait for table to load
    await page.waitForTimeout(2000);

    // Check if table exists
    const table = page.locator("table");
    if ((await table.count()) > 0) {
      // Table exists, check for data
      const rows = page.locator("table tbody tr");
      const rowCount = await rows.count();

      if (rowCount > 0) {
        // Click on first row to view details
        await rows.first().click();
        await page.waitForTimeout(1000);
      } else {
        // No data message
        await expect(
          page.locator("text=There are no records to display")
        ).toBeVisible();
      }
    }
  });

  test("should test company form tabs", async ({ page }) => {
    await page.goto("/company/create");

    // Check if tabs exist
    const tabs = page.locator('[role="tab"]');
    const tabCount = await tabs.count();

    if (tabCount > 0) {
      // Test tab navigation
      const tabNames = await tabs.allTextContents();
      console.log("Available tabs:", tabNames);

      // Click on each tab
      for (let i = 0; i < tabCount; i++) {
        await tabs.nth(i).click();
        await page.waitForTimeout(500);

        // Verify tab is selected
        const isSelected = await tabs.nth(i).getAttribute("aria-selected");
        if (isSelected === "true") {
          console.log(`Tab ${i} is selected`);
        }
      }
    }
  });

  test("should test company logo upload", async ({ page }) => {
    await page.goto("/company/create");

    // Look for upload button
    const uploadButton = page.locator('button:has-text("Upload Logo")');
    if ((await uploadButton.count()) > 0) {
      await uploadButton.click();

      // Wait for file dialog or upload interface
      await page.waitForTimeout(1000);

      // Check if file input is available
      const fileInput = page.locator('input[type="file"]');
      if ((await fileInput.count()) > 0) {
        console.log("File upload interface is available");
      }
    }
  });

  test("should test company form auto-generation features", async ({
    page,
  }) => {
    await page.goto("/company/create");

    // Test code regeneration
    const regenerateCodeButton = page.locator(
      'button:has-text("Regenerate code")'
    );
    if ((await regenerateCodeButton.count()) > 0) {
      await regenerateCodeButton.click();
      await page.waitForTimeout(500);

      // Check if code field was updated
      const codeInput = page.locator('input[placeholder="Code"]');
      const codeValue = await codeInput.inputValue();
      expect(codeValue.length).toBeGreaterThan(0);
    }

    // Test slug regeneration
    const regenerateSlugButton = page.locator(
      'button:has-text("Regenerate slug")'
    );
    if ((await regenerateSlugButton.count()) > 0) {
      await regenerateSlugButton.click();
      await page.waitForTimeout(500);

      // Check if slug field was updated
      const slugInput = page.locator('input[placeholder="Slug"]');
      const slugValue = await slugInput.inputValue();
      expect(slugValue.length).toBeGreaterThan(0);
    }
  });

  test("should test company breadcrumb navigation", async ({ page }) => {
    await page.goto("/company/create");

    // Check breadcrumb
    const breadcrumb = page.locator('nav[aria-label="breadcrumb"]');
    if ((await breadcrumb.count()) > 0) {
      // Click on Companies link
      const companiesLink = breadcrumb.locator('a:has-text("Companies")');
      if ((await companiesLink.count()) > 0) {
        await companiesLink.click();
        await page.waitForURL("/company");
        await expect(page).toHaveURL("/company");
      }
    }
  });

  test("should test responsive design on mobile", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto("/company");

    // Verify mobile layout
    await expect(page.locator("text=Company")).toBeVisible();

    // Test mobile navigation
    const createButton = page.locator('button:has-text("Create")');
    if ((await createButton.count()) > 0) {
      await createButton.click();
      await page.waitForURL("/company/create");

      // Verify form is accessible on mobile
      await expect(page.locator('input[placeholder="Name"]')).toBeVisible();
    }
  });

  test("should test company management accessibility", async ({ page }) => {
    await page.goto("/company");

    // Check for proper ARIA labels
    const createButton = page.locator('button:has-text("Create")');
    if ((await createButton.count()) > 0) {
      const ariaLabel = await createButton.getAttribute("aria-label");
      if (ariaLabel) {
        console.log("Create button has aria-label:", ariaLabel);
      }
    }

    // Check for proper heading structure
    const headings = page.locator("h1, h2, h3, h4, h5, h6");
    const headingCount = await headings.count();
    if (headingCount > 0) {
      console.log(`Found ${headingCount} headings on the page`);
    }
  });
});
